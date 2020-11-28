const { Plugin } = require('powercord/entities');
const { inject, uninject } = require('powercord/injector');
const { getModule, React } = require('powercord/webpack');
const { getReactInstance } = require('powercord/util');
const Renderer = require('./components/Renderer');

const Quote = require('./components/Quote');

const Avatar = require('./components/child/Avatar');

const Settings = require('./components/Settings');

const parseRaw = require('./utils/parseRaw.js');

const settings = require('./utils/settings.js');

module.exports = class RichQuotes extends Plugin {
  getSettings () {
    const resolved = {};

    Object.entries(settings.list).forEach(([ key, setting ]) => {
      resolved[key] = this.settings.get(key, setting.fallback);
    });

    return resolved;
  }

  async startPlugin () {
    powercord.api.settings.registerSettings('rich-quotes', {
      label: 'Rich Quotes',
      category: this.entityID,
      render: Settings
    });

    this.loadStylesheet('./style.scss');

    const cacheSearch = this.settings.get('cacheSearch', true);

    if (!cacheSearch && window.localStorage.richQuoteCache) 
      window.localStorage.removeItem('richQuoteCache');

    const Style = await getModule([ 'mentioned' ]);

    const currentUser = (await getModule(['getCurrentUser'])).getCurrentUser();

    const ChannelMessage = (await getModule([ 'MESSAGE_ID_PREFIX' ])).default;
    const ListMessage = (await getModule(m => m.type?.displayName === 'ChannelMessage')); // discord moment :keuch:
    const cmType = ChannelMessage.type;
    const lmType = ListMessage.type;

    inject('Rich-Quotes-Channel-Message', ChannelMessage, 'type', (args, res) => this.injectMessage(args[0], res, currentUser, Style));
    Object.assign(ChannelMessage.type, cmType);

    // For search, pinned, inbox, threads, etc
    inject('Rich-Quotes-List-Message', ListMessage, 'type', (args, res) => this.injectMessage(args[0], res, currentUser, Style, true));
    Object.assign(ListMessage.type, lmType);
  }

  injectMessage (args, res, currentUser, Style, list = false) {
    if (res) {
      const resContent = res.props.childrenMessageContent;

      let parsed;

      const settings = this.getSettings();

      if (resContent) {
        parsed = parseRaw((` ${args.message.content}`).slice(1).split('\n'), currentUser);

        if (!parsed.isCommand) {
          if (parsed.quotes || parsed.hasLink) {
            if (parsed.quotes && !parsed.broadMention) {
              res.props.className = res.props.className.replace(Style.mentioned, '');
            }

            resContent.props.content = React.createElement(Renderer, {
              content: resContent.props.content, message: args.message,
              quotes: parsed.quotes,
              broadMention: (list ? false : parsed.broadMention),
              level: 0,
              currentUser, settings
            });

            if (args.message.author.bot && settings.cullBotQuotes) {
              args.message.embeds = [];
            }
          }
        } else if (!list && settings.cullQuoteCommands) {
          res = null;
        }
      }

      if (res && settings.replyReplace && !res.props.className.includes('rq-message-reply')) {
        const resReply = res.props.childrenRepliedMessage;

        let reply = resReply?.props?.children?.props?.referencedMessage?.message;

        if (!reply) reply = resReply?.props?.referencedMessage?.message;

        if (reply) {
          const repliedAuthor = res.props.childrenHeader.props.referencedMessage?.message?.author;
          let mentionType = 0;

          // @todo Make mentions less gae
          if (parsed.broadMention) mentionType = 3;

          /*else if (args.message.mentions?.length !== 0) {
            let mentions = {};
            let mentionSelf = false;

            if (parsed.mentions) for (let mention of parsed.mentions) {
              mentions[mention.id] = true;
              if (mention.self) mentionSelf = true;
            }
            
            for (let mention of args.message.mentions) {
              if (!mentions[mention]) {
                mentionType = 1;
                if (mention == currentUser.id) mentionType = 2;
              }
            }
          }*/

          if (settings.replyMode == 0) res.props.childrenRepliedMessage = React.createElement('div', {
            ref: (e) => {
              if (!e) return;

              const target = getReactInstance(e)?.sibling?.child?.child?.child?.sibling?.child?.child?.sibling?.sibling?.sibling.sibling.child.child.child.child.stateNode;
              // return
              if (!target) return;
              if (target.props.children instanceof Array) return


              const avatarImage = React.createElement('div', {
                className: 'rq-avatar-wrapper'
              },
              React.createElement(Avatar, {
                user: repliedAuthor
              }));
              target.props.children = [
                avatarImage,
                target.props.children
              ]
              target.forceUpdate()
            }
          }); else res.props.className = `${res.props.className} rq-hide-reply-header`;

          const location = args.message.messageReference;

          const parentLocation = document.location.href.split('/');

          if (res.props.className.includes(Style.mentioned)) {
            if (parsed && !parsed.broadMention) {
              mentionType = 2;
              res.props.className = res.props.className.replace(Style.mentioned, '');
            }
            else mentionType = 3;
          }

          const renderedQuote = React.createElement(Quote, {
            link: [ location.guild_id, location.channel_id, location.message_id ],
            parent: [ parentLocation[4], parentLocation[5], args.message.id ],
            mentionType, level: 0, isReply: true,
            currentUser, settings
          });

          if (Array.isArray(resContent.props.content))
            resContent.props.content.unshift(renderedQuote);
          else
            resContent.props.content.props.content.unshift(renderedQuote);

          res.props.rq_setReply = true;
        }
      }
    }

    return res;
  }

  pluginWillUnload () {
    powercord.api.settings.unregisterSettings('rich-quotes');
    uninject('Rich-Quotes-Channel-Message');
    uninject('Rich-Quotes-List-Message');
  }
};

const { Plugin } = require('powercord/entities');
const { inject, uninject } = require('powercord/injector');
const { getModule, React } = require('powercord/webpack');

const Renderer = require('./components/Renderer');

const Quote = require('./components/Quote');

const Settings = require('./components/Settings');

const parseRaw = require('./utils/parseRaw.js');

const { settings, linkSelector } = require('./utils/vars.js');

module.exports = class RichQuotes extends Plugin {
  getSettings() {
    let resolved = {};
  
    Object.entries(settings.list).forEach(([ key, setting ]) => { resolved[key] = this.settings.get(key, setting.fallback) })
  
    return resolved;
  };

  async startPlugin () {
    powercord.api.settings.registerSettings("rich-quotes", {
      label: 'Rich Quotes',
      category: this.entityID,
      render: Settings
    });

    this.loadStylesheet('./style.scss');

    const cacheSearch = this.settings.get('cacheSearch', true);

    if (!cacheSearch && window.localStorage.richQuoteCache) window.localStorage.removeItem('richQuoteCache');

    const Style = await getModule([ 'mentioned' ]);

    const ChannelMessage = (await getModule([ 'MESSAGE_ID_PREFIX' ])).default;
    const ListMessage = (await getModule(m => m.type?.displayName === 'ChannelMessage')); // discord moment :keuch:
    const cmType = ChannelMessage.type;
    const lmType = ListMessage.type;

    inject('Rich-Quotes-Channel-Message', ChannelMessage, 'type', (args, res) => this.injectMessage(args[0], res, Style));
    Object.assign(ChannelMessage.type, cmType);

    // For search, pinned, inbox, threads, etc
    inject('Rich-Quotes-List-Message', ListMessage, 'type', (args, res) => this.injectMessage(args[0], res, Style, true));
    Object.assign(ListMessage.type, lmType);
  }

  injectMessage(args, res, Style, list = false) {
    let resContent = res.props.childrenMessageContent;

    let parsed;

    if (resContent) {
      parsed = parseRaw((' ' + args.message.content).slice(1).split('\n'));

      if (parsed.quotes || linkSelector.test(args.message.content)) {
        if (parsed.quotes && !parsed.broadMention)
          res.props.className = res.props.className.replace(Style.mentioned, '');

        resContent.props.content = React.createElement(Renderer, { 
          content: resContent.props.content, message: args.message, 
          quotes: parsed.quotes, broadMention: list ? !list : parsed.broadMention,
          settings: this.getSettings()
        });

        console.log(resContent.props.content);
      }
    }

    if (!res.props.rq_setReply) {
      let resReply = res.props.childrenRepliedMessage;

      let reply = resReply?.props?.children?.props?.referencedMessage?.message;

      if (!reply) reply = resReply?.props?.referencedMessage?.message;

      if (reply) {
        res.props.childrenRepliedMessage = null;

        res.props.className = `${res.props.className} rq-hide-reply-header`

        const location = args.message.messageReference;

        const parentLocation = document.location.href.split('/');

        let mentionType = 1;

        if (res.props.className.includes(Style.mentioned)) {
          if (parsed && !parsed.broadMention) {
            mentionType = 2;
            res.props.className = res.props.className.replace(Style.mentioned, '');
          } else mentionType = 3;
        }

        resContent.props.content.unshift(React.createElement(Quote, {
          link: [ location.guild_id, location.channel_id, location.message_id ],
          parent: [ parentLocation[0], parentLocation[1], args.message.id ],
          mentionType: mentionType, isReply: true, settings: this.getSettings()
        }));

        res.props.rq_setReply = true;
      }
    }

    return res;
  }

  pluginWillUnload () {
    powercord.api.settings.unregisterSettings("rich-quotes");
    uninject('Rich-Quotes-Channel-Message');
    uninject('Rich-Quotes-List-Message');
  }
};

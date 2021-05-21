const { Plugin } = require('powercord/entities');
const { inject, uninject } = require('powercord/injector');
const { getModule, React, ReactDOM } = require('powercord/webpack');
const { getReactInstance } = require('powercord/util');
const Renderer = require('./components/Renderer');

const Quote = require('./components/Quote');

const ReplyHeader = require('./components/child/ReplyHeader');

const Settings = require('./components/Settings');

const parseRaw = require('./utils/rawParser.js');
const traverseTree = require('./utils/treeTraverser.js');

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

    const ConnectionStore = await getModule(['isTryingToConnect', 'isConnected'])
    const listener = () => {
      if (!ConnectionStore.isConnected()) return;

      ConnectionStore.removeChangeListener(listener)
      this.startObserver();
      this.runInjections();
    }

    if (ConnectionStore.isConnected()) listener()
    else ConnectionStore.addChangeListener(listener)
  }

  async runInjections () {
    const Style = await getModule([ 'mentioned' ]);

    const currentUser = (await getModule(['getCurrentUser'])).getCurrentUser();

    const ChannelMessage = await getModule(m => m.type && (m.__powercordOriginal_type || m.type).toString().indexOf('useContextMenuMessage') !== -1, true);
    const ListMessage = (await getModule(m => m.type?.displayName === 'ChannelMessage')); // discord moment :keuch:

    const cmType = ChannelMessage.type;
    const lmType = ListMessage.type;

    inject('Rich-Quotes-Channel-Message', ChannelMessage, 'type', (args, res) => this.injectMessage(args[0], res, currentUser, Style));
    Object.assign(ChannelMessage.type, cmType);
    ChannelMessage.type.toString = () => cmType.toString();

    // For search, pinned, inbox, threads, etc
    inject('Rich-Quotes-List-Message', ListMessage, 'type', (args, res) => this.injectMessage(args[0], res, currentUser, Style, true));
    Object.assign(ListMessage.type, lmType);
  }

  injectMessage (args, _res, currentUser, Style, list = false) {
  
    const res = _res?.type?.displayName === 'BackgroundFlash' ? _res?.props?.children : _res;

    if (res) {
      const resContent = res.props.childrenMessageContent;

      let parsed;

      const settings = this.getSettings();

      if (resContent) {
        parsed = parseRaw((` ${args.message.content}`).slice(1).split('\n'), currentUser);

        if (!parsed.isCommand) {
          if (parsed.quotes || parsed.hasLink) {
            if (parsed.quotes && !parsed.broadMention)
              res.props.className = res.props.className.replace(Style.mentioned, '');

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
        } else if (!list && settings.cullQuoteCommands) _res = null;
      }

      if (settings.replyReplace && !res.props.rq_setReply) {
        const resReply = res.props.childrenRepliedMessage;

        let reply = resReply?.props?.children?.props?.referencedMessage?.message;

        if (!reply) reply = resReply?.props?.referencedMessage?.message;

        if (reply) {
          let mentionType = 0;

          if (res.props.className.includes(Style.mentioned)) {
            if (parsed) {
              if (!parsed.broadMention) {
                mentionType = 2;
                res.props.className = res.props.className.replace(Style.mentioned, '');
              } else mentionType = 3;
            } else mentionType = 2;
          }

          res.props.childrenRepliedMessage = settings.replyMode != 0 ? null : React.createElement('div', { ref: e => {
            if (!e) return;
            const target = traverseTree(
              getReactInstance(e),
              ['sibling', ['child', 3], 'sibling', 'child', 'stateNode']
            );

            if (!target) return;
            if (target.__rqHasInjected) return;

            const container = document.createElement('span');

            ReactDOM.render(React.createElement(ReplyHeader, {
              author: reply.author, channel: args.channel
            }), container);

            target.appendChild(container);
            target.__rqHasInjected = true;
            container.setAttribute("rq-injected", "")

            e.remove();
          }});

          const location = args.message.messageReference;

          const renderedQuote = React.createElement(Quote, {
            link: [ location.guild_id, location.channel_id, location.message_id ],
            parent: [ ...document.location.href.split('/').slice(4,6), args.message.id ],
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

    return _res;
  }

  startObserver () {
    this.observer = new MutationObserver((m) => {
      m.forEach(mutation => {
        const nodes = mutation.removedNodes;
        if (nodes.length > 0) {
          nodes.forEach(node => {
            if (node.tagName === "MAIN") {
              node.querySelectorAll("[rq-injected]").forEach(el => {
                ReactDOM.unmountComponentAtNode(el);
              })
            }
          });
        }
      });
    });

    this.observer.observe(document.body, {
      subtree: true,
      childList: true
    }); // TODO: disconnect when reply mode isnt 0
  }

  pluginWillUnload () {
    powercord.api.settings.unregisterSettings('rich-quotes');
    uninject('Rich-Quotes-Channel-Message');
    uninject('Rich-Quotes-List-Message');
    this.observer.disconnect();
    this.observer = null;
  }
};

const { Plugin } = require('powercord/entities');
const { inject, uninject } = require('powercord/injector');
const { getModule, React } = require('powercord/webpack');

const Style = getModule([ 'mentioned' ], false);


const Renderer = require('./components/Renderer');

const Settings = require('./components/Settings');

const { settings, linkSelector, quoteSelector } = require('./utils/vars.js');

module.exports = class RichQuotes extends Plugin {
  async startPlugin () {
    powercord.api.settings.registerSettings("rich-quotes", {
      label: 'Rich Quotes',
      category: this.entityID,
      render: Settings
    });

    this.loadStylesheet('./style.scss');

    const cacheSearch = this.settings.get('cacheSearch', true);

    if (!cacheSearch && window.localStorage.richQuoteCache) window.localStorage.removeItem('richQuoteCache');

    const ChannelMessage = (await getModule([ 'MESSAGE_ID_PREFIX' ])).default;
    const MessageContent = await getModule(m => m.type && m.type.displayName === 'MessageContent');
    const cmType = ChannelMessage.type;
    const mcType = MessageContent.type;

    inject('Rich-Quotes-Message', ChannelMessage, 'type', (args, res) => {
      if (res.props.childrenMessageContent) {
        let quotes;
        if (quoteSelector.test(args[0].message.content))
          quotes = this.getQuotes(`${args[0].message.content}`.split('\n'));

        if (quotes || linkSelector.test(args[0].message.content)) {
          if (quotes && !quotes.broadMention)
            res.props.className = res.props.className.replace(Style.mentioned, '');

          let MessageC = res.props.childrenMessageContent.props;

          MessageC.content = this.renderQuotes(
            MessageC.content, args[0].message,
            quotes?.quotes, quotes?.broadMention
          );

          MessageC.rq_preventInject = true;
        }
      }

      return res;
    }, false);
    Object.assign(ChannelMessage.type, cmType);

    // For search, pinned, inbox, threads, and other plugin compatibility
    inject('Rich-Quotes-Message-Content', MessageContent, 'type', (args, res) => {
      if (!args[0].rq_preventInject) {
        let quotes;
        if (quoteSelector.test(args[0].message.content))
          quotes = this.getQuotes(`${args[0].message.content}`.split('\n'));
        
        if (quotes || linkSelector.test(args[0].message.content)) res.props.children = this.renderQuotes(
          res.props.children[0], args[0].message,
          quotes?.quotes, quotes?.broadMention
        );
      }
      
      return res;
    })
    Object.assign(MessageContent.type, mcType);
  }

  renderQuotes(content, message, quotes, broadMention) {
    return React.createElement(Renderer, { 
      content, message, quotes, broadMention,
      settings: (() => {
        let resolved = {};
  
        Object.entries(settings.list).forEach(([ key, setting ]) => { resolved[key] = this.settings.get(key, setting.fallback) })
  
        return resolved;
      })()
    });
  }

  /**
   * Get markdown quotes from message contents
   * @param {Object[]} raw_contents 
   */
  getQuotes(raw_contents) {
    const currentUser = getModule([ 'getCurrentUser' ], false).getCurrentUser();

    let quotes = [],
        broadMention = false;

    for (let i in raw_contents) {
      const raw = `${raw_contents[i]}`;
    
      raw_contents[i] = { raw, type: 0 };

      if (/^> (.+)/.test(raw)) {
        raw_contents[i].type = 1;

        if (i != 0 && raw_contents[i-1]?.type === 1)
          raw_contents[i].quote = [ ...raw_contents[i-1].quote, raw.slice(2) ];
        else raw_contents[i].quote = [ raw.slice(2) ];
      }

      if (/^ ?<@!?(\d+)>/.test(raw)) {
        const id = /^ ?<@!?(\d+)>/.exec(raw)[1];

        if (raw_contents[i-1].type === 1) quotes.push({
          content: raw_contents[i-1].quote.join('\n').trim(),
          author: id
        });
        else if (id === currentUser.id) broadMention = true;
      }
    }

    return quotes.length !== 0 ? { quotes, broadMention } : false;
  }

  pluginWillUnload () {
    powercord.api.settings.unregisterSettings("rich-quotes");
    uninject('Rich-Quotes-Message');
    uninject('Rich-Quotes-Message-Content');
  }
};

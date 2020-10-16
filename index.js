const { Plugin } = require('powercord/entities');
const { inject, uninject } = require('powercord/injector');
const { getModule, React } = require('powercord/webpack');
const renderer = require('./components/Renderer');
const settings = require('./components/Settings')
const linkSelector = /https?:\/\/((canary|ptb)\.)?discord(app)?\.com\/channels\/(\d{17,19}|@me)\/\d{17,19}\/\d{17,19}/

module.exports = class RichQuotes extends Plugin {
  startPlugin () {
    powercord.api.settings.registerSettings(this.entityID, {
      label: 'Rich Quotes', category: this.entityID, render: settings
    })

    this.loadStylesheet('./style.scss');

    const MessageContent = getModule(m => m.type && m.type.displayName === 'MessageContent', false)
    
    inject('Rich-Quotes-Message', MessageContent, 'type', (args, res) => {
      if (
        (/(?:> )([\s\S]+?)\n(<@!?(\d+)>)/g).test(args[0].message.content) || 
        linkSelector.test(args[0].message.content)) {
        // ugggggghhhh I put a console log here and its spams on message hover. whyyyyyyyy

        const cacheSearch = this.settings.get("cacheSearch", true);

        if (!cacheSearch && window.localStorage.richQuoteCache) window.localStorage.removeItem("richQuoteCache");
        
        res.props.children = React.createElement(renderer, {
          content: args[0].content,
          message: args[0].message,
          settings: {
            cacheSearch: cacheSearch,
            partialQuotes: this.settings.get("partialQuotes", true)
          }
        })
      }

      return res;
    }, false);
    MessageContent.type.displayName = 'MessageContent';
  }


  pluginWillUnload () {
    uninject('Rich-Quotes-Message');
  }
};

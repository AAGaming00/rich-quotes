const { Plugin } = require('powercord/entities');
const { inject, uninject } = require('powercord/injector');
const { getModule, React } = require('powercord/webpack');
const renderer = require('./components/Renderer');
const linkSelector = /https?:\/\/((canary|ptb)\.)?discord(app)?\.com\/channels\/(\d{17,19}|@me)\/\d{17,19}\/\d{17,19}/g

module.exports = class RichQuotes extends Plugin {
  startPlugin () {
    const MessageContent = getModule(m => m.type && m.type.displayName === 'MessageContent', false)
    this.loadStylesheet('./style.scss');
    inject('Rich-Quotes-Message', MessageContent, 'type', (args, res) => {
      if (
        (/(?:> )([\s\S]+?)\n(<@!?(\d+)>)/g).test(args[0].message.content) || 
        linkSelector.test(args[0].message.content)) {

        res.props.children = React.createElement(renderer, {
          content: args[0].content,
          message: args[0].message
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

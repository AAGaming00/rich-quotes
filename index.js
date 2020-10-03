const { Plugin } = require('powercord/entities');
const { inject, uninject } = require('powercord/injector');
const { getModule, React } = require('powercord/webpack');
const MessageContent = getModule(m => m.type && m.type.displayName === 'MessageContent', false);require('powercord/components');
const renderer = require('./components/InlineQuoteContainer');
module.exports = class Quowoter extends Plugin {
  startPlugin () {
    this.loadStylesheet('./style.scss');
    inject('quowoter-Message', MessageContent, 'type', (args, res) => {
      // console.log(res);
      if ((/(> .+\n)+(<@!?(\d+)>)/g).test(args[0].message.content)) {
        res.props.children = React.createElement(renderer, {
          content: args[0].content,
          message: args[0].message
        });
      } else if ((/(https?:\/\/((canary|ptb)\.)?discord(app)?\.com\/channels\/(\d{17,19}|@me)\/\d{17,19}\/\d{17,19})+/g).test(args[0].message.content)) {
        res.props.children = React.createElement(renderer, {
          content: args[0].content,
          message: args[0].message
        });
      }
      return res;
    }, false);
    MessageContent.type.displayName = 'MessageContent';
  }


  pluginWillUnload () {
    uninject('quowoter-Message');
  }
};

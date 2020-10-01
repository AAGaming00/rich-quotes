const { Plugin } = require('powercord/entities');
const { inject, uninject } = require('powercord/injector');
const { getModule, React } = require('powercord/webpack');
const dispatcher = getModule([ 'dirtyDispatch' ], false);
const MessageContent = getModule(m => m.type && m.type.displayName === 'MessageContent', false);
const renderer = require('./QuoteHandler');
module.exports = class Quowoter extends Plugin {
  startPlugin () {
    inject('quowoter-Message', MessageContent, 'type', (args, res) => {
      if ((/(https?:\/\/((canary|ptb)\.)?discord(app)?\.com\/channels\/(\d{17,19}|@me)\/\d{17,19}\/\d{17,19})+/g).test(args[0].message.content)) {
        res.props.children = React.createElement(renderer, {
          content: args[0].content
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

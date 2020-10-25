const { Plugin } = require('powercord/entities');
const { inject, uninject } = require('powercord/injector');
const { getModule, React } = require('powercord/webpack');
const renderer = require('./components/Renderer');
const settings = require('./components/Settings');
const linkSelector = /https?:\/\/((canary|ptb)\.)?discord(app)?\.com\/channels\/(\d{17,19}|@me)\/\d{17,19}\/\d{17,19}/;

module.exports = class RichQuotes extends Plugin {
  async startPlugin () {
    powercord.api.settings.registerSettings("rich-quotes", {
      label: 'Rich Quotes',
      category: this.entityID,
      render: settings
    });

    this.loadStylesheet('./style.scss');

    const ChannelMessage = (await getModule([ 'MESSAGE_ID_PREFIX' ])).default;
    const oType = ChannelMessage.type;
    const { mentioned } = await getModule([ 'mentioned' ]);

    inject('Rich-Quotes-Message', ChannelMessage, 'type', (args, res) => {
      if (res.props.childrenMessageContent) { 
        if (
          (/(?:> )([\s\S]+?)\n(<@!?(\d+)>)/g).test(args[0].message.content) ||
          linkSelector.test(args[0].message.content)) {
          const currentUser = getModule([ 'getCurrentUser' ], false).getCurrentUser();
          const cacheSearch = this.settings.get('cacheSearch', true);
          
          if (!cacheSearch && window.localStorage.richQuoteCache) window.localStorage.removeItem('richQuoteCache');
          const MessageContent = res.props.childrenMessageContent.props;
          
          const get = (n, d) => this.settings.get(n, d = true);

          MessageContent.content = React.createElement(renderer, {
            content: MessageContent.content,
            message: args[0].message,
            settings: {
              cacheSearch,

              displayChannel: get('displayChannel'),
              displayTimestamp: get('displayTimestamp'),
              displayNickname: get('displayNickname'),

              displayReactions: get('displayReactions'),
              displayEmbeds: get('displayEmbeds'),
              
              embedImages: get('embedImages'), embedVideos: get('embedVideos'),
              embedYouTube: get('embedYouTube'), embedAudio: get('embedAudio'),
              embedFile: get('embedFile'), //embedSpecial: get('embedSpecial'),
              embedOther: get('embedOther'), embedAll: get('embedAll')
            }
          });
          
          if (!MessageContent.message.content.replace(`<@!${currentUser.id}`, '').includes(`<@!${currentUser.id}`)) {
            res.props.className = res.props.className.replace(mentioned, '');
          }
        }
      }

      return res;
    }, false);
    ChannelMessage.type.displayName = 'ChannelMessage';
    Object.assign(oType, ChannelMessage.type);
  }

  pluginWillUnload () {
    powercord.api.settings.unregisterSettings("rich-quotes");
    uninject('Rich-Quotes-Message');
  }
};

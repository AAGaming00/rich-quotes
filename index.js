const { Plugin } = require('powercord/entities');
const { inject, uninject } = require('powercord/injector');
const { getModule, React } = require('powercord/webpack');

const Renderer = require('./components/Renderer');

const Settings = require('./components/Settings');

const linkSelector = /https?:\/\/((canary|ptb)\.)?discord(app)?\.com\/channels\/(\d{17,19}|@me)\/\d{17,19}\/\d{17,19}/;

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

    const getSettings = () => {
      const get = (n, d) => this.settings.get(n, d = true);

      return {
        cacheSearch,

        displayChannel: get('displayChannel'),
        displayTimestamp: get('displayTimestamp'),
        displayNickname: get('displayNickname'),

        cullBotQuotes: get('cullBotQuotes'),
        displayReactions: get('displayReactions'),
        displayEmbeds: get('displayEmbeds'),
        
        embedImages: get('embedImages'), embedVideos: get('embedVideos'),
        embedYouTube: get('embedYouTube'), embedAudio: get('embedAudio'),
        embedFile: get('embedFile'), //embedSpecial: get('embedSpecial'),
        embedOther: get('embedOther'), embedAll: get('embedAll')
      }
    }
    

    // @todo (Re)add MessageContent injector for rendering in search/inbox/threads
    inject('Rich-Quotes-Message', ChannelMessage, 'type', (args, res) => {
      if (res.props.childrenMessageContent) { 
        if (
          (/(?:> )([\s\S]+?)\n(<@!?(\d+)>)/g).test(args[0].message.content) ||
          linkSelector.test(args[0].message.content)) {
          const currentUser = getModule([ 'getCurrentUser' ], false).getCurrentUser();
          const { mentioned } = getModule([ 'mentioned' ], false);

          let MessageC = res.props.childrenMessageContent.props

          MessageC.content = React.createElement(Renderer, {
            content: MessageC.content,
            message: args[0].message,
            settings: getSettings()
          });

          MessageC.rqinject = true;
          
          if (!MessageC.message.content.replace(new RegExp(`<@!${currentUser.id}`, 'g'), '').includes(`<@!${currentUser.id}`))
            res.props.className = res.props.className.replace(mentioned, '');
        }
      }

      return res;
    }, false);
    Object.assign(ChannelMessage.type, cmType);

    inject('Rich-Quotes-Message-Content', MessageContent, 'type', (args, res) => {

      if (!args[0].rqinject && (linkSelector.test(args[0].message.content) || (/(?:> )([\s\S]+?)\n(<@!?(\d+)>)/g).test(args[0].message.content))) {
        console.log(res.props.children[0]);

        res.props.children = React.createElement(Renderer, {
          content: res.props.children,
          message: args[0].message,
          settings: getSettings()
        });
      }
      
      return res;
    })
    Object.assign(MessageContent.type, mcType);
  }

  pluginWillUnload () {
    powercord.api.settings.unregisterSettings("rich-quotes");
    uninject('Rich-Quotes-Message');
    uninject('Rich-Quotes-Message-Content');
  }
};

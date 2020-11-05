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
      const settingsList = [
        'displayChannel','displayTimestamp','displayNickname',
        'cullBotQuotes','displayReactions','displayEmbeds',
        'embedImages','embedVideos','embedYouTube','embedAudio',
        'embedFile',/* 'embedSpecial',*/ 'embedOther', 'embedAll'];
      
      let settings = { cacheSearch };

      settingsList.forEach((setting) => { settings[setting] = this.settings.get(setting, true) })

      return settings
    }
    

    inject('Rich-Quotes-Message', ChannelMessage, 'type', (args, res) => {
      if (res.props.childrenMessageContent) { 
        if (
          (/(?:> )([\s\S]+?)\n(<@!?(\d+)>)/g).test(args[0].message.content) ||
          linkSelector.test(args[0].message.content)
        ) {
          const currentUser = getModule([ 'getCurrentUser' ], false).getCurrentUser();
          const { mentioned } = getModule([ 'mentioned' ], false);

          let MessageC = res.props.childrenMessageContent.props

          MessageC.content = React.createElement(Renderer, {
            content: MessageC.content,
            message: args[0].message,
            settings: getSettings()
          });

          MessageC.preventInject = true;

          if (!MessageC.message.content.replace(new RegExp(`<@!${currentUser.id}`, 'g'), '').includes(`<@!${currentUser.id}`))
            res.props.className = res.props.className.replace(mentioned, '');
        }
      }

      return res;
    }, false);
    Object.assign(ChannelMessage.type, cmType);

    // For search, pinned, inbox, threads, and other plugin compatibility
    inject('Rich-Quotes-Message-Content', MessageContent, 'type', (args, res) => {

      if (!args[0].preventInject && (
        linkSelector.test(args[0].message.content) || 
        (/(?:> )([\s\S]+?)\n(<@!?(\d+)>)/g).test(args[0].message.content)
      )) res.props.children = React.createElement(Renderer, {
        content: res.props.children[0],
        message: args[0].message,
        settings: getSettings()
      });
      
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

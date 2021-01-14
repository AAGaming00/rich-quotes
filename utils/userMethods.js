const { React, getModule, contextMenu, getModuleByDisplayName } = require('powercord/webpack');

module.exports = {
   openUserPopout: function(event, userId, guildId) {
      const UserPopout = getModuleByDisplayName('ConnectedUserPopout', false);
      const PopoutDispatcher = getModule([ 'openPopout' ], false);

      // modified from smart typers
      PopoutDispatcher.openPopout(event.target, {
         containerClass: 'rich-quotes-popout',
         render: (props) => React.createElement(UserPopout, { ...props, userId, guildId }),
         closeOnScroll: false, shadow: false, position: 'right'
      }, 'quote-user-popout');
   },

   openUserContextMenu: function(event, userId, channelId, guildId) {
      const GroupDMUserContextMenu = getModuleByDisplayName('GroupDMUserContextMenu', false);
      const GuildChannelUserContextMenu = getModuleByDisplayName('GuildChannelUserContextMenu', false);
      const userStore = getModule([ 'getCurrentUser' ], false);

      if (!guildId) {
         return contextMenu.openContextMenu(event, (props) => React.createElement(GroupDMUserContextMenu, {
            ...props,
            user: userStore.getUser(userId),
            channel: channelId
         }));
      }

      contextMenu.openContextMenu(event, (props) => React.createElement(GuildChannelUserContextMenu, {
         ...props,
         user: userStore.getUser(userId), guildId, channelId,
         popoutPosition: 'top', showMediaItems: false
      }));
   }
}
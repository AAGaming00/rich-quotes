const { React, getModule, contextMenu, getModuleByDisplayName } = require('powercord/webpack');
const { avatar, clickable, username } = getModule([ 'systemMessageAccessories' ], false);
const UserPopout = getModuleByDisplayName('UserPopout', false);
const PopoutDispatcher = getModule([ 'openPopout' ], false);
const GroupDMUserContextMenu = getModuleByDisplayName('GroupDMUserContextMenu', false);
const GuildChannelUserContextMenu = getModuleByDisplayName('GuildChannelUserContextMenu', false);
const userStore = getModule([ 'getCurrentUser' ], false);
module.exports = class InlineQuote extends React.Component {
  openPopout (event) {
    const guildId = this.props.channel.guild_id;
    const userId = this.props.author.id;
    // modified from smart typers
    PopoutDispatcher.openPopout(event.target, {
      closeOnScroll: false,
      containerClass: 'quowoter-popout',
      render: (props) => React.createElement(UserPopout, {
        ...props,
        userId,
        guildId
      }),
      shadow: false,
      position: 'left'
    }, 'quote-user-popout');
  }

  openUserContextMenu (event) {
    const guildId = this.props.channel.guild_id;
    const userId = this.props.author.id;

    if (!guildId) {
      return contextMenu.openContextMenu(event, (props) => React.createElement(GroupDMUserContextMenu, {
        ...props,
        user: userStore.getUser(userId),
        channel: this.props.channel
      }));
    }

    contextMenu.openContextMenu(event, (props) => React.createElement(GuildChannelUserContextMenu, {
      ...props,
      user: userStore.getUser(userId),
      guildId,
      channelId: this.props.channel.id,
      showMediaItems: false,
      popoutPosition: 'top'
    }));
  }

  render () {
    return (
      <>
        <div key={this.props.content} className='qo-inline'>
          <div className='qo-header header-23xsNx threads-header-hack'>
            <img src={this.props.author.avatarURL} onClick={(e) => {
              this.openPopout(e);
            }} onContextMenu={(e) => {
              this.openUserContextMenu(e);
            }} aria-hidden="true" class={`qo-avatar threads-avatar-hack revert-reply-hack ${avatar} ${clickable}`} alt=" "></img>
            <div onClick={(e) => {
              this.openPopout(e);
            }} onContextMenu={(e) => {
              this.openUserContextMenu(e);
            }} className={`qo-username ${username} ${clickable}`}>{this.props.author.username}</div>
          </div>
          <div className='qo-content'>
            {this.props.content}
          </div>
        </div>
      </>
    );
  }
};

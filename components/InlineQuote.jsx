const { React, getModule, contextMenu, getModuleByDisplayName } = require('powercord/webpack');
const { Icon, Spinner } = require('powercord/components');
const UserPopout = getModuleByDisplayName('UserPopout', false);
const PopoutDispatcher = getModule([ 'openPopout' ], false);
const GroupDMUserContextMenu = getModuleByDisplayName('GroupDMUserContextMenu', false);
const GuildChannelUserContextMenu = getModuleByDisplayName('GuildChannelUserContextMenu', false);
const userStore = getModule([ 'getCurrentUser' ], false);

function renderExtras(extras) {
  let parsed_extras = [];
  if (extras.raw_content.length != 0) extras.raw_content.forEach((e) => {
    if (e.type == "image") parsed_extras.push(<img src={e.src} className="re-image"></img>)
    else if (e.type == "video") parsed_extras.push(<video poster={e.preview_image} src={e.src} className="re-video" loop preload="none" autoPlay></video>)
  });

  return parsed_extras
}

module.exports = class InlineQuote extends React.Component {
  constructor (props) {
    super(props);
    this.state = {};
  }

  // contains code by Bowser65 (Powercord's server, https://discord.com/channels/538759280057122817/539443165455974410/662376605418782730)
  search (content, author_id, max_id, id, dm, asc) {
    return new Promise((resolve, reject) => {
      const Search = getModule(m => m.prototype && m.prototype.retryLater, false);
      const opts = { author_id,
        max_id,
        content,
        include_nsfw: true };
      const s = new Search(id, dm ? 'DM' : 'GUILD', asc
        ? { offset: 0,
          sort_by: 'timestamp',
          sort_order: 'asc',
          ...opts }
        : opts);
      s.fetch(res => resolve(res.body), () => void 0, reject);
    });
  }

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
    const { avatar, clickable, username } = getModule([ 'systemMessageAccessories' ], false);
    const { transitionTo } = getModule([ 'transitionTo' ], false);
    return (
      <div id="a11y-hack"><div key={this.props.content} className='re-inline'>
        <div className='re-header threads-header-hack'>
          <img src={this.props.author.avatarURL} onClick={(e) => {
            this.openPopout(e);
          }} onContextMenu={(e) => {
            this.openUserContextMenu(e);
          }} aria-hidden="true" className={`re-avatar threads-avatar-hack revert-reply-hack ${avatar} ${clickable}`} alt=" "></img>
          <div onClick={(e) => {
            this.openPopout(e);
          }} onContextMenu={(e) => {
            this.openUserContextMenu(e);
          }} className={`re-username ${username} ${clickable}`}>{this.props.author.username}</div>
        </div>
        {this.props.link
          ? <div className='re-button-container'>
            <div style= {{ cursor: 'pointer' }} onClick= {() => {
              transitionTo(this.props.link.replace(/https?:\/\/((canary|ptb)\.)?discord(app)?\.com/g, ''));
            }}>
              <Icon className='re-jump re-180-flip' name="Reply"/></div></div>
          : <div className='re-button-container'>
            <div key={this.state.searchStatus} style= {{ cursor: 'pointer' }} onClick= {async () => {
              this.setState({ ...this.state,
                searchStatus: 'loading' });
              const result = await this.search(this.props.raw, this.props.author.id, this.props.timestamp, this.props.channel.guild_id || this.props.channel.id, !this.props.channel.guild_id);
              const message = result.messages[0].filter((e) => e?.content.includes(this.props.raw));
              if (!message) {
                this.setState({ ...this.state,
                  searchStatus: 'error' });
                return;
              }
              this.setState({ ...this.state,
                searchStatus: 'done' });
              //console.log(result, message[0]);
              transitionTo(`/channels/${this.props.channel.guild_id || '@me'}/${this.props.channel.id}/${message[0].id}`);
            }}>
              {this.state?.searchStatus === 'loading'
                ? <Spinner className='re-jump re-loading' type='pulsingEllipsis'/>
                : <Icon className='re-jump' name="Search"/>}</div></div>}
        <div className='re-content'>
          {this.props.content}
          <br></br>
          <div className='re-extras'>{ renderExtras(this.props.extras) }</div>
        </div>
      </div></div>
    );
  }
};

const { React, getModule, contextMenu, getModuleByDisplayName } = require('powercord/webpack');
const { Icon, Spinner } = require('powercord/components');

module.exports = class RichQuote extends React.Component {
  constructor (props) {
    super(props); this.state = {};
  }

  async search () {
    const { transitionTo } = await getModule([ 'transitionTo' ]);
    // contains code by Bowser65 (Powercord's server, https://discord.com/channels/538759280057122817/539443165455974410/662376605418782730)
    function searchAPI (content, author_id, max_id, id, dm, asc) {
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

    this.setState({ ...this.state,
      searchStatus: 'loading' });

    const result = await searchAPI(
      this.props.search.raw, this.props.author.id,
      this.props.search.timestamp, this.props.channel.guild_id || this.props.channel.id,
      !this.props.channel.guild_id
    );

    if (result.messages.length !== 0) {
      const message = result.messages[0].filter((e) => e?.content.includes(this.props.search.raw));

      if (!message) {
        this.setState({ ...this.state,
          searchStatus: 'error' });
        return;
      }

      this.setState({ ...this.state,
        searchStatus: 'done' });

      const messageRoute = `/channels/${this.props.channel.guild_id || '@me'}/${this.props.channel.id}/${message[0].id}`;

      transitionTo(messageRoute);
    } else {
      this.setState({ ...this.state,
        searchStatus: 'error' });
    }
  }

  openPopout (event) {
    const UserPopout = getModuleByDisplayName('UserPopout', false);
    const PopoutDispatcher = getModule([ 'openPopout' ], false);
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
    const GroupDMUserContextMenu = getModuleByDisplayName('GroupDMUserContextMenu', false);
    const GuildChannelUserContextMenu = getModuleByDisplayName('GuildChannelUserContextMenu', false);
    const userStore = getModule([ 'getCurrentUser' ], false);
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
    const { transitionTo } = getModule([ 'transitionTo' ], false);
    const { avatar, clickable, username } = getModule([ 'systemMessageAccessories' ], false);
    return (
      <div id="a11y-hack"><div key={this.props.content} className='rq-inline'><div className={`${this.props.mentionType === 2 ? 'rq-mention-highlight' : ''}`}>
        <div className='rq-header threads-header-hack'>
          <img className={`rq-avatar threads-avatar-hack revert-reply-hack ${avatar} ${clickable}`}
            src={this.props.author.avatarURL} onClick={(e) => this.openPopout(e)} onContextMenu={(e) => this.openUserContextMenu(e)} aria-hidden="true" alt=" ">
          </img>
          <div className={`rq-username ${`rq-mention-${this.props.mentionType}`} ${username} ${clickable}`}
            onClick={(e) => this.openPopout(e) } onContextMenu={(e) => this.openUserContextMenu(e)}>
            {(this.props.mentionType !== 0 ? '@' : '') + this.props.author.username}
          </div>
        </div>
        {this.props.link
          ? <div className='rq-button'>
            <div className='rq-clickable' onClick= {() => transitionTo(this.props.link) }><Icon className='rq-jump rq-180-flip' name="Reply"/></div>
          </div>
          : <div className='rq-button'>
            <div key={this.state?.searchStatus}
              className={(!this.state.searchStatus) ? 'rq-clickable' : ''}
              onClick= {async () => this.state?.searchStatus !== 'error' ? this.search() : false}
            >
              {this.state?.searchStatus === 'loading'
                ? <Spinner className='rq-loading' type='pulsingEllipsis'/>
                : this.state?.searchStatus === 'error'
                  ? <div title="Could not find matching message" className='rq-error'>!</div>
                  : <Icon className='rq-search' name="Search"/>
              }
            </div>
          </div>}
        <div className='rq-content'>
          {this.props.content}
          {/* this.props.accessories*/}
        </div>
      </div></div></div>
    );
  }
};

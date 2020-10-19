const { React, getModule, contextMenu, getModuleByDisplayName } = require('powercord/webpack');

const { Tooltip, Icon, Spinner } = require('powercord/components');

module.exports = class RichQuote extends React.Component {
  constructor (props) {
    super(props); this.state = { searchStatus: false };
  }

  static getDerivedStateFromProps (props, state) {
    return { ...Object.assign({}, props), ...state };
  }

  async search () {
    const { transitionTo } = await getModule([ 'transitionTo' ]);

    const setStatus = (s, link) => this.setState({ ...this.state, searchStatus: s, link });

    // contains code by Bowser65 (Powercord's server, https://discord.com/channels/538759280057122817/539443165455974410/662376605418782730)
    function searchAPI (content, author_id, max_id, id, dm, asc) {
      return new Promise((resolve, reject) => {
        const Search = getModule(m => m.prototype && m.prototype.retryLater, false);
        const opts = { author_id, max_id, content };
        const s = new Search(id, dm ? 'DM' : 'GUILD', 
          asc ? 
          { offset: 0, sort_by: 'timestamp', sort_order: 'asc', ...opts }
          : opts);

        s.fetch(res => resolve(res.body), () => void 0, reject);
      });
    }

    setStatus('loading');

    const result = await searchAPI(this.props.search.raw, this.props.author.id,
      this.props.search.timestamp, this.props.channel.guild_id || this.props.channel.id,
      !this.props.channel.guild_id
    );

    if (result.messages.length === 0) setStatus('error');
    else {
      const message = result.messages[0].filter((e) => e?.content.includes(this.props.search.raw))[0];

      if (!message) setStatus('error');
      else {
        const link = [ this.props.channel.guild_id || '@me', message.channel_id, message.id ];

        setStatus('done', link);

        if (this.props.settings.cacheSearch) {
          let newCache = false;

          if (!window.localStorage.richQuoteCache) newCache = true;

          const searchResult = { content: message.content, authorId: message.author.id, link };

          if (message.content !== this.props.search.raw) searchResult.original_content = this.props.search.raw;

          const { searches } = newCache ? [] : JSON.parse(window.localStorage.richQuoteCache);

          window.localStorage.richQuoteCache = JSON.stringify({ searches: [ ...searches, searchResult ]});
        }

        transitionTo(`/channels/${link.join('/')}`);
      }
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
    const { getName } = getModule([ 'getName' ], false);

    const MessageTimestamp = getModule([ 'MessageTimestamp' ], false);
    const Timestamp = getModule(m => m.prototype && m.prototype.toDate && m.prototype.month, false);

    const { avatar, clickable, username } = getModule([ 'systemMessageAccessories' ], false);

    const link = this.state.link,
          searchMsg = this.state.searchStatus,
          previewQuote = this.props.channel.id === 'uwu';

    const quoteTimestamp = link && this.props.settings.displayTimestamp ? new MessageTimestamp.MessageTimestamp({
      className: 'rq-timestamp',
      compact: false,
      timestamp: new Timestamp(this.props.message.timestamp),
      isOnlyVisibleOnHover: false
    }) : false;

    const highlightAlter = this.props.mentionType >= 2 ? 'rq-highlight-alt' : '',
          mention = this.props.mentionType !== 0 ? `rq-highlight ${highlightAlter}` : '',
          container = 'rq-highlight-container',
          highlightContainer = this.props.mentionType >= 2 ? 
            `${container} ${this.props.mentionType === 3 ? `${container}-alt` : ''}` : '';

    const MessageContent = getModule(m => m.type && m.type.displayName === 'MessageContent', false);

    const jumpTooltip = 'Jump to Message',
          searchTooltip = searchMsg ? searchMsg === 'error' ? 
            'Could not find matching message' : 
            'Message search loading...' : 
            'Search for Message';
    
    const previewJump = document.getElementById('uwu-0')?.scrollIntoViewIfNeeded;

    const allowSearch = !searchMsg && !previewQuote;

    // Nickname handler
    const displayName = this.props.settings.displayNickname ? 
      getName(link ? link[0] : this.props.channel.guild_id, this.props.channel.id, this.props.author) : false;

    return (
      <div id="a11y-hack"><div key={this.props.content} className='rq-inline'><div className={highlightContainer}>
        <div className='rq-header threads-header-hack'>
          <img className={`rq-avatar threads-avatar-hack revert-reply-hack ${avatar} ${clickable}`}
            src={this.props.author.avatarURL} onClick={(e) => this.openPopout(e)}
            onContextMenu={(e) => this.openUserContextMenu(e)} aria-hidden="true" alt=" ">
          </img>
          <div className='rq-userTag'>
            <span className={`rq-username ${mention} ${username} ${clickable}`}
              onClick={(e) => this.openPopout(e) } onContextMenu={(e) => this.openUserContextMenu(e)}
            >{`${this.props.mentionType !== 0 ? '@' : ''}${displayName}`}</span>{
              link && this.props.settings.displayChannel ? 
              <span>
                <span className='rq-infoText'>{`posted in ${this.props.channel.name ? '' : 'a DM'}`}</span>
                {
                  this.props.channel.name ?
                  <span className={`rq-channel ${!previewQuote ? 'rq-clickable' : ''} rq-highlight ${highlightAlter}`}
                    onClick= {() => !previewQuote ? transitionTo(`/channels/${link.slice(0, 2).join('/')}`) : false }
                  >{`#${this.props.channel.name}`}</span> : false
                }
              </span>
              : false }{ quoteTimestamp }
          </div>
        </div>

        <div className='rq-button-container'>{ link ? 
          <Tooltip position="left" text={jumpTooltip}>
          <div className='rq-button rq-jump rq-clickable' onClick= {() => !previewQuote ? transitionTo(`/channels/${link.join('/')}`) : previewJump()}>
            <Icon className='rq-180-flip' name="Reply"/>
          </div></Tooltip>
          : 
          <Tooltip position="left" text={searchTooltip}>
          <div key={searchMsg} className={`rq-button rq-search ${ allowSearch ? 'rq-clickable' : ''}`} onClick= {async () => allowSearch ? this.search() : false}>{
            !searchMsg ? <Icon className='rq-searching' name="Search"/> :
            searchMsg === 'loading' ? <Spinner className='rq-loading' type='pulsingEllipsis'/>
            : <div className='rq-error'>!</div>
          }</div></Tooltip>
        }</div>

        <div className='rq-content'>
          <MessageContent message={this.props.message} content={this.props.content}/>
          {this.props.accessories}
        </div>
      </div></div></div>
    );
  }
};

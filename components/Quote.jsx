const { React, getModule, contextMenu, getModuleByDisplayName } = require('powercord/webpack');

const { Tooltip, Icon, Spinner } = require('powercord/components');

const RequestError = require('./RequestError');

const getMsg = require('../utils/getMessage.js');
const embedHandler = require('../utils/embedHandler.js');

let errorParams = false;

module.exports = class RichQuote extends React.Component {
  constructor (props) {
    super(props); this.state = { searchStatus: false };
  }

  static getDerivedStateFromProps (props, state) {
    return { ...Object.assign({}, props), ...state };
  }

  async linkRes() {
    const MessageC = await getModule(m => m.prototype && m.prototype.getReaction && m.prototype.isSystemDM);
    const parser = await getModule(["parse", "parseTopic"]);

    if (this.props.link[0] !== '000000000000000000') {
      const getWithQueue = (() => {
          let pending = Promise.resolve()
      
          const run = async ([guildId, channelId, messageId]) => {
            try { await pending } finally {
              return getMsg(guildId, channelId, messageId);
            }
          }
          return (link) => (pending = run(link));
        })(),
        originalMessage = await getWithQueue(this.props.link);


      if (originalMessage.error) {
        errorParams = originalMessage;
        errorParams.link = this.props.link;
      }
      else {
        const { getChannel } = await getModule(['getChannel']);
        const { renderSimpleAccessories } = await getModule(m => m?.default?.displayName == 'renderAccessories');

        let messageData = { ...originalMessage };
        let hasEmbedSpoilers = false;

        if (this.props.settings.displayEmbeds) embedHandler(messageData, this.props.settings, hasEmbedSpoilers);
        else { 
          messageData.embeds = [];
          messageData.attachments = [];
        }

        if (!this.props.settings.displayReactions) messageData.reactions = [];

        this.props.content = await parser.parse(
          messageData.content.trim(), true, 
          { channelId: this.props.thisChannel }
        );

        this.props.author = messageData.author;

        this.props.message = await new MessageC({ ...messageData });
        this.props.channel = await getChannel(messageData.channel_id);

        if (this.props.settings.displayEmbeds && (this.props.message.embeds?.length !== 0 || this.props.message.attachments?.length !== 0)) {
          if (this.props.message.embeds?.length !== 0) {
            // @todo Attempt to find a function Discord has to normalize embed key's
            const fixers = [['description','rawDescription'],['title','rawTitle']];

            this.props.message.embeds.forEach((e, i) => fixers.forEach((f) => {
              if (e[f[0]]) {
                this.props.message.embeds[i][f[1]] = e[f[0]];
                delete this.props.message.embeds[i][f[0]];
              }
            }))
          }

          this.props.accessories = renderSimpleAccessories({ message: this.props.message, channel: this.props.channel}, hasEmbedSpoilers);
        } else this.props.accessories = false;
      }
    } else {
      // funni preview handler
      const getCurrentUser = await getModule([ 'getCurrentUser' ]);

      this.props.content = await parser.parse(
       'Check out this preview', true, 
        { channelId: '000000000000000000' }
      );

      this.props.author = await getCurrentUser.getCurrentUser();

      this.props.message = await new MessageC({ ...'' });
      this.props.channel = { id: 'owo', name: 'test-channel'};
      this.props.link = ['000000000000000000','000000000000000000','000000000000000000'];
    }

    this.setState(this.state);
  }

  async searchRes() {
    const { transitionTo } = await getModule([ 'transitionTo' ]);

    const setStatus = (s, link) => this.setState({ searchStatus: s, link });

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
          const searchResult = { content: message.content, authorId: message.author.id, link };

          let newCache = false;

          if (!window.localStorage.richQuoteCache) newCache = true;

          const { searches } = newCache ? false : JSON.parse(window.localStorage.richQuoteCache);

          window.localStorage.richQuoteCache = JSON.stringify({ searches: searches ? [ ...searches, searchResult ] : [ searchResult ]});
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
      containerClass: 'rich-quotes-popout',
      render: (props) => React.createElement(UserPopout, {
        ...props,
        userId,
        guildId
      }),
      shadow: false,
      position: 'right'
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
    if (errorParams) return (<RequestError {...errorParams}/>);
    else if (this.props.link && !this.props.content) {
      this.linkRes();

      return (<div className='rq-preloader'>
        <Spinner type='pulsingEllipsis' />
      </div>);
    }
    else {
      const { transitionTo } = getModule([ 'transitionTo' ], false);
      const { getName } = getModule([ 'getName' ], false);

      const MessageTimestamp = getModule([ 'MessageTimestamp' ], false);
      const Timestamp = getModule(m => m.prototype && m.prototype.toDate && m.prototype.month, false);

      const { avatar, clickable, username } = getModule([ 'systemMessageAccessories' ], false);


      const link = this.state.link,
            searchMsg = this.state.searchStatus,
            previewQuote = this.props.channel.id === 'owo';

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
      
      const previewJump = document.getElementById('owo-0')?.scrollIntoViewIfNeeded;

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
            <div key={searchMsg} className={`rq-button rq-search ${ allowSearch ? 'rq-clickable' : ''}`} onClick= {async () => allowSearch ? this.searchRes() : false}>{
              !searchMsg ? <Icon className='rq-search-icon' name="Search"/> :
              searchMsg === 'loading' ? <Spinner className='rq-loading-icon' type='pulsingEllipsis'/>
              : <div className='rq-error-icon'>!</div>
            }</div></Tooltip>
          }</div>

          <div className='rq-content'>
            {this.props.content ? <MessageContent message={this.props.message} content={this.props.content}/> : null}
            {this.props.accessories}
          </div>
        </div></div></div>
      );
    }
  }
};

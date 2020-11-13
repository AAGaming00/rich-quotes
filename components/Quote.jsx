const { React, getModule, contextMenu, getModuleByDisplayName } = require('powercord/webpack');

const { Spinner } = require('powercord/components');

const Button = require('./Button');
const RequestError = require('./RequestError');
const RenderError = require('./RenderError');
const MessageContextMenu = require('./MoreContextMenu')

const getMsg = require('../utils/getMessage.js');
const embedHandler = require('../utils/embedHandler.js');

const previewId = '000000000000000000';

let lastFetch = 0;


module.exports = class RichQuote extends React.Component {
  constructor (props) {
    super(props); this.state = { searchStatus: false, errorParams: false };
  }

  static getDerivedStateFromProps (props, state) {
    return { ...Object.assign({}, props), ...state };
  }

  async linkRes() {
    const MessageC = await getModule(m => m.prototype && m.prototype.getReaction && m.prototype.isSystemDM);
    const parser = await getModule(["parse", "parseTopic"]);

    if (this.state.link[0] !== previewId) {
      const getWithQueue = (() => {
          let pending = Promise.resolve()

          const run = async ([guildId, channelId, messageId]) => {
            try { await pending } finally {
              return getMsg(guildId, channelId, messageId, lastFetch);
            }
          }
          return (link) => (pending = run(link));
        })(),
        originalMessage = await getWithQueue(this.state.link);

      lastFetch = Date.now();


      if (originalMessage.error) {
        this.state.errorParams = originalMessage;
        this.state.errorParams.link = this.state.link;
      }
      else {
        const { getChannel } = await getModule(['getChannel']);
        const { renderSimpleAccessories } = await getModule(m => m?.default?.displayName == 'renderAccessories');

        let messageData = { ...originalMessage };
        let hasEmbedSpoilers = false;

        if (this.state.settings.displayEmbeds) embedHandler(messageData, this.state.settings, hasEmbedSpoilers);
        else { 
          messageData.embeds = [];
          messageData.attachments = [];
        }

        if (!this.state.settings.displayReactions) messageData.reactions = [];

        this.state.content = await parser.parse(
          messageData.content.trim(), true, 
          { channelId: this.state.thisChannel }
        );

        this.state.author = messageData.author;

        this.state.message = await new MessageC({ ...messageData });
        this.state.channel = await getChannel(messageData.channel_id);

        if (this.state.settings.displayEmbeds && (this.state.message.embeds?.length !== 0 || this.state.message.attachments?.length !== 0)) {
          if (this.state.message.embeds?.length !== 0) {
            // @todo Attempt to find a function Discord has to normalize embed key's
            const fixers = [['description','rawDescription'],['title','rawTitle']];

            this.state.message.embeds.forEach((e, i) => fixers.forEach((f) => {
              if (e[f[0]]) {
                this.state.message.embeds[i][f[1]] = e[f[0]];
                delete this.state.message.embeds[i][f[0]];
              }
            }))
          }

          this.state.accessories = renderSimpleAccessories({ message: this.state.message, channel: this.state.channel}, hasEmbedSpoilers);
        } else this.state.accessories = false;
      }
    } else {
      // funni preview handler
      const getCurrentUser = await getModule([ 'getCurrentUser' ]);

      this.state.content = await parser.parse(
       'Check out this preview', true, 
        { channelId: previewId }
      );

      this.state.author = await getCurrentUser.getCurrentUser();

      this.state.message = await new MessageC({ ...'' });
      this.state.channel = { id: 'owo', name: 'test-channel'};
      this.state.link = [previewId, previewId,previewId];
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

    const result = await searchAPI(this.state.search.raw, this.state.author.id,
      this.state.search.timestamp, this.state.channel.guild_id || this.state.channel.id,
      !this.state.channel.guild_id
    );

    if (result.messages.length === 0) setStatus('error');
    else {
      const message = result.messages[0].filter((e) => e?.content.includes(this.state.search.raw))[0];

      if (!message) setStatus('error');
      else {
        const link = [ this.state.channel.guild_id || '@me', message.channel_id, message.id ];

        setStatus('done', link);

        if (this.state.settings.cacheSearch) {
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
    const guildId = this.state.channel.guild_id;
    const userId = this.state.author.id;

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
    const guildId = this.state.channel.guild_id;
    const userId = this.state.author.id;

    if (!guildId) {
      return contextMenu.openContextMenu(event, (props) => React.createElement(GroupDMUserContextMenu, {
        ...props,
        user: userStore.getUser(userId),
        channel: this.state.channel
      }));
    }

    contextMenu.openContextMenu(event, (props) => React.createElement(GuildChannelUserContextMenu, {
      ...props,
      user: userStore.getUser(userId),
      guildId,
      channelId: this.state.channel.id,
      showMediaItems: false,
      popoutPosition: 'top'
    }));
  }

  openMoreContextMenu(e) {
    const { message, channel } = this.state;

    if (this.state.link[0] !== previewId) contextMenu.openContextMenu(e, () => React.createElement(MessageContextMenu, {
      message, channel, target: {...this,
        classList: {contains: ()=>{}},
        tagName: ''
      }, // hack to prevent emojiUtility errors
      settings: this.props.settings, isMarkdown: this.state.isMarkdown,
      link: this.state.link, clearLink: () => this.setState({ link: false, searchStatus: false })
    }));
  }

  render () {
    if (this.state.errorParams) return (<RequestError {...this.state.errorParams}/>);
    else if (this.state.link && !this.state.content) {
        this.linkRes();

        return (<div className='rq-preloader'>
          <Spinner type='pulsingEllipsis' />
        </div>);
    }

    const { transitionTo } = getModule([ 'transitionTo' ], false);
    const { parse } = getModule(['parse', 'parseTopic'], false);
    const { getGuild } = getModule(['getGuild'], false);
    const { getName } = getModule([ 'getName' ], false);

    const MessageTimestamp = getModule([ 'MessageTimestamp' ], false);
    const Timestamp = getModule(m => m.prototype && m.prototype.toDate && m.prototype.month, false);

    const MoreIcon = getModuleByDisplayName('OverflowMenuHorizontal', false)

    const { avatar, clickable, username } = getModule([ 'systemMessageAccessories' ], false);

    let channel = this.state.channel.name && this.state.link ? parse(`<#${this.state.link[1]}>`, true, { channelId: this.props.thisChannel }) : false;

    
    /*if (channel) {
      channel = 
    }*/

    const link = this.state.link,
          searchMsg = this.state.searchStatus,
          previewQuote = this.state.channel.id === 'owo',
          channelHeader = this.state.settings.displayChannel;

    const quoteTimestamp = link && this.state.settings.displayTimestamp ? new MessageTimestamp.MessageTimestamp({
      className: 'rq-timestamp',
      compact: false,
      timestamp: new Timestamp(this.state.message.timestamp),
      isOnlyVisibleOnHover: false
    }) : false;

    const highlightAlter = this.state.mentionType >= 2 ? 'rq-highlight-alt' : '',
          mention = this.state.mentionType !== 0 ? `rq-highlight ${highlightAlter}` : '',
          container = 'rq-highlight-container',
          highlightContainer = this.state.mentionType >= 2 ? 
            `${container} ${this.state.mentionType === 3 ? `${container}-alt` : ''}` : '';

    const MessageContent = getModule(m => m.type && m.type.displayName === 'MessageContent', false);

    // Nickname handler
    const displayName = this.state.settings.displayNickname ? 
      getName(link ? link[0] : this.state.channel.guild_id, this.state.channel.id, this.state.author) : false;

    return (<RenderError content={this.props.content}>
      <div id="a11y-hack"><div key={this.state.content} className='rq-inline'><div className={highlightContainer}>
        <div className='rq-header threads-header-hack'>
          <img className={`rq-avatar threads-avatar-hack revert-reply-hack ${avatar} ${clickable}`}
            src={this.state.author.avatarURL} onClick={(e) => this.openPopout(e)}
            onContextMenu={(e) => this.openUserContextMenu(e)} aria-hidden="true" alt=" ">
          </img>
          <div className='rq-userTag'>
            <span className={`rq-username ${mention} ${username} ${clickable}`}
              onClick={(e) => this.openPopout(e) } onContextMenu={(e) => this.openUserContextMenu(e)}
            >{`${this.state.mentionType !== 0 ? '@' : ''}${displayName}`}</span>{
              link && channelHeader ? <span>
                <span className='rq-infoText'>{`posted in ${this.state.channel.name ? '' : 'a DM'}`}</span>
                {channel}
              </span> : false }{ quoteTimestamp }
          </div>
        </div>

        <div className='rq-button-container'>
          { link ? [
            <Button {...{
              classes: [ 'jump' ], tooltip: 'Jump to Message', icon: 'Reply',
              function: () => {
                if (!previewQuote) transitionTo(`/channels/${link.join('/')}`);
                else document.getElementById('owo-0').scrollIntoViewIfNeeded;
              }
            }}></Button>, 
            !channelHeader ? <Button {...{
              classes: [ 'channel-jump' ], tooltip: 'Jump to Channel', icon: 'Hash',
              function: !previewQuote ? () => transitionTo(`/channels/${link[0]}/${link[1]}`) : false
            }}></Button> : false
            ].map(e=>(e)) : 
            <Button {...{
              classes: [ 'search' ], icon: !searchMsg ? 'Search' : false,
              tooltip: !searchMsg ? 
                'Search for Message' : searchMsg === 'loading' ?
                'Message search loading...' :
                'Could not find matching message',
              function: !(searchMsg || previewQuote) ? async () => this.searchRes() : false
            }}>{ searchMsg === 'loading' ?
              <Spinner className='rq-loading-icon' type='pulsingEllipsis'/> : <div className='rq-error-icon'>!</div>
            }</Button>
          }
            { this.props.settings.displayMoreBtn ?
              <Button {...{ classes: [ 'more' ], tooltip: 'More', function: (e) => this.openMoreContextMenu(e) }}><MoreIcon /></Button>
            : false }
        </div>

        <div className='rq-content'>
          {this.state.content ? <MessageContent message={this.state.message} content={this.state.content}/> : null}
          {this.state.accessories}
        </div>
      </div></div></div>
    </RenderError>);
  }
};

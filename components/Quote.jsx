const { React, getModule, contextMenu, getModuleByDisplayName } = require('powercord/webpack');

const { Spinner } = require('powercord/components');

const Avatar = require('./child/Avatar');
const Button = require('./child/Button');
const RequestError = require('./child/ErrorRequest');
const RenderError = require('./child/ErrorRender');
const MoreMenu = require('./child/MoreMenu');

const { openUserPopout, openUserContextMenu } = require('../utils/userMethods.js');

const getMessage = require('../utils/getMessage.js');
const embedHandler = require('../utils/embedHandler.js');
const parseRaw = require('../utils/rawParser.js');

const previewId = '000000000000000000';

class RichQuote extends React.Component {
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

      let messageData = await getMessage(this.state.link);

      if (messageData.error) {
        this.state.errorParams = messageData;
        this.state.errorParams.link = this.state.link;
      }
      else {
        const { renderSimpleAccessories } = await getModule(m => m?.default?.displayName == 'renderAccessories');
        const { getChannel } = await getModule(['getChannel']);

        let hasEmbedSpoilers = false;

        if (this.props.settings.displayEmbeds) embedHandler(messageData, this.props.settings, hasEmbedSpoilers);
        else {
          messageData.embeds = [];
          messageData.attachments = [];
        }

        if (!this.props.settings.displayReactions) messageData.reactions = [];

        this.state.content = await parser.parse(
          messageData.content.trim(), true, 
          { channelId: this.state.parent[1] }
        );

        this.state.author = messageData.author;

        if (this.props.gotAuthor) this.props.gotAuthor(this.state.author);

        this.state.message = await new MessageC({ ...messageData });
        this.state.channel = await getChannel(messageData.channel_id);

        if (this.state.message && this.props.settings.displayEmbeds && (!this.props.isReply || this.props.settings.reply_displayEmbeds)
          && (this.state.message.embeds?.length !== 0 || this.state.message.attachments?.length !== 0)) {

          if (this.state.message.embeds?.length !== 0) {
            // @todo Attempt to find a function Discord has to normalize embed key's
            const fixers = [['description','rawDescription'],['title','rawTitle']];

            this.state.message.embeds.forEach((e, i) => fixers.forEach((f) => {
              const value = e[f[0]];

              if (value) {
                if (value != '') this.state.message.embeds[i][f[1]] = value;

                delete this.state.message?.embeds[i][f[0]];
              }
            }));
          }

          this.state.accessories = renderSimpleAccessories({ message: this.state.message, channel: this.state.channel}, hasEmbedSpoilers);
        } else this.state.accessories = false;
      }
    } else {
      // funni preview handler
      this.state.content = await parser.parse(
       'Check out this preview', true, 
        { channelId: previewId }
      );

      this.state.author = this.props.currentUser;

      this.state.message = await new MessageC({ ...'' });
      this.state.channel = { id: 'owo', name: 'test-channel'};
      this.state.link = [previewId, previewId,previewId];
    }

    this.setState(this.state);
  }

  async searchRes() {
    const { transitionTo } = await getModule([ 'transitionTo' ]);

    const setStatus = (s, link) => this.setState({ searchStatus: s, link });

    // contains code by Bowser65 (was on the powercord server pre-nuke)
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

  openMoreMenu(e) {
    const { message, channel } = this.state;

    if (!this.state.link || this.state.link[0] !== previewId) 
      contextMenu.openContextMenu(e, () => React.createElement(MoreMenu, {
        message, channel, link: this.state.link, parent: this.props.parent,

        settings: this.props.settings, isMarkdown: this.state.isMarkdown,
        clearLink: () => this.setState({ link: false, searchStatus: false }),
        hideSelf: () => this.hideSelf(),

        // hack to prevent emojiUtility errors
        target: {...this, classList: { contains: () => {} }, tagName: '' }
      }));
  }

  /* deepscan-disable */ // haha dumb
  expandTop() {
    this.state.original.top = true;
    this.state.with_top = true;
    this.setState(this.state);
  }

  expandEnd() {
    this.state.original.end = true;
    this.state.with_end = true;
    this.setState(this.state);
  }
  /* deepscan-enable */

  hideSelf() {
    this.setState({ hidden: true });
  }

  render () {
    if (this.state.errorParams) return (<RequestError {...this.state.errorParams}/>);

    else if (this.props.parent && this.props.link ? this.props.parent[2] === this.props.link[2] : false)
      return (<RequestError {...{ error: 'same-link', inGuild: true, link: this.props.link }}/>);

    else if (this.state.link && !this.state.content) {
      this.linkRes();

      return (<div className='rq-preloader'>
        <Spinner type='pulsingEllipsis' />
      </div>);
    }

    const { transitionTo } = getModule([ 'transitionTo' ], false),
          { parse } = getModule(['parse', 'parseTopic'], false),
          { getGuild } = getModule(['getGuild'], false),
          { getNickname } = getModule([ 'getName' ], false);

    const MessageTimestamp = require('powercord/webpack').getModuleByDisplayName('MessageTimestamp', false),
          Timestamp = getModule(m => m.prototype && m.prototype.toDate && m.prototype.month, false),
          MessageContent = getModule(m => m.type && m.type.displayName === 'MessageContent', false);

    const Style = getModule([ 'systemMessageAccessories' ], false);

    const MoreIcon = getModuleByDisplayName('OverflowMenuHorizontal', false);

    const Renderer = require('./Renderer');

    const link = this.state.link,
          searchMsg = this.state.searchStatus,
          previewQuote = this.state.channel?.id === 'owo',
          channelHeader = this.props.settings.displayChannel,
          replyChannel = (!this.state.isReply || this.props.settings.replyMode == 2);

    let channel = !replyChannel && link && link[1] !== document.location.href.split('/')[5] ? 
      parse(`<#${this.state.link[1]}>`, true, { channelId: this.props.parent[1] })[0] : false;

    if (channel) {
      const guild = getGuild(this.state.link[0]);

      if (guild && guild.id !== this.props.parent[0]) channel.props.text = (<>
        <center className='rq-server-title'>{guild.name}</center>
        <center>{channel.props.text}</center>
      </>);
    }

    const quoteTimestamp = this.state.message && link && this.props.settings.displayTimestamp ? new MessageTimestamp({
            className: 'rq-timestamp', compact: false,
            timestamp: new Timestamp(this.state.message.timestamp),
            isOnlyVisibleOnHover: false
          }) : false,
          highlightAlter = this.state.mentionType >= 2 ? 'rq-highlight-alt' : '',
          mention = this.state.mentionType !== 0 ? `rq-highlight ${highlightAlter}` : '',
          container = 'rq-highlight-container',
          highlightContainer = this.state.mentionType >= 2 ? 
            `${container} ${this.state.mentionType === 3 ? `${container}-alt` : ''}` : '',
          displayName = this.props.settings.displayNickname ? 
            getNickname(this.state.channel?.guild_id, this.state.channel?.id, this.state.author)
            : this.state.author.name,
          renderNested = this.props.settings.nestedQuotes == 0 ? false : (this.props.level < this.props.settings.nestedQuotes);

    let content = global._.cloneDeep(this.state.content),
        replied = false,
        repliedAuthor = false,
        renderReply = true,
        renderAccessories = true;
    
    if (this.props.settings.partialQuotes && this.state.original) {

      if (this.state.with_top && this.state.with_end) content = global._.cloneDeep(this.state.content);
      else if (this.state.with_top) content = this.state.original.with_top;
      else if (this.state.with_end) content = this.state.original.with_end; 
      else content = this.state.original.content;

      if (!this.state.original.top) { 
        renderReply = false;
        content.unshift(<span className='rq-partial top' onClick={e => this.expandTop()}>…</span>);
      }
      if (!this.state.original.end) {
        renderAccessories = false;
        content.push(<span className='rq-partial end' onClick={e => this.expandEnd()}>…</span>);
      }
    }

    if (this.state.message?.messageReference && renderReply) {
      replied = true;

      if (this.state.repliedAuthor) repliedAuthor = (<span className='rq-author'
          onClick={e => openUserPopout(e, this.state.repliedAuthor.id, this.state.channel.guild_id) } 
          onContextMenu={e => openUserContextMenu(e, this.state.repliedAuthor.id, this.state.channel.id, this.state.channel.guild_id)}
        >
        <Avatar style={Style} user={this.state.repliedAuthor} />
        <span className={`rq-username rq-margin ${Style.username} ${Style.clickable}`}>{
          this.props.settings.displayNickname ? 
            getNickname(this.state.channel.guild_id, this.state.channel.id, this.state.repliedAuthor)
            : this.state.repliedAuthor.name
        }</span>
      </span>);

      if (!content) content = [];

      if (content.length === 0 || !content[0]?.props?.isReply) {
        if (renderNested) {
          const location = this.state.message.messageReference;

          let params = {
            link: [ this.state.link[0], location.channel_id, location.message_id ], 
            parent: link, 
            mentionType: 0, level: (this.props.level + 1), isReply: true, 
            gotAuthor: a => this.setState({ repliedAuthor: a }), 
            currentUser: this.props.currentUser, settings: this.props.settings
          }

          if (this.state.mentionType >= 2) params.mentionType = 3;

          content.unshift(<RichQuote {...params} />);
        }
        else content.unshift(<em className='rq-nesting-cap' isReply={true}>reply here, reached nesting cap</em>, <br />);
      }
    }

    let rqRender = false;

    if (renderNested && this.state.content[0] !== '' && this.props.currentUser) {
      const parsed = parseRaw((' ' + this.state.message?.content).slice(1).split('\n'), this.props.currentUser);

      if (parsed.quotes || parsed.hasLink) rqRender = <Renderer {...{
        content, message: this.state.message, quotes: parsed.quotes, broadMention: this.props.mentionType >= 2,
        parent: this.state.link, level: (this.props.level + 1), settings: this.props.settings
      }} />;
    }

    let nested = '';

    if (this.props.level !== 0) {
      nested = ' rq-nested';
      if (this.props.level % 2 === 0) nested += '-alt';
    }

    return (<RenderError content={this.props.content}>
      <div id="a11y-hack"><div 
        key={this.state.content} className={`rq-inline${nested}${ this.state.hidden ? ' rq-hidden' : '' }`} 
        onContextMenu={e => this.openMoreMenu(e)}
      ><div className={highlightContainer}>{

        !(this.props.isReply && this.props.settings.replyMode == 0) ? 
        <div className='rq-header threads-header-hack'>
          <div className='rq-userTag'>
            <span className='rq-author rq-author-main'
              onClick={e => openUserPopout(e, this.state.author.id, this.state.channel.guild_id) } 
              onContextMenu={e => openUserContextMenu(e, this.state.author.id, this.state.channel.id, this.state.channel.guild_id)}
            >
              <Avatar style={Style} user={this.state.author} />
              <span className={`rq-username ${mention} ${Style.username} ${Style.clickable}`}
              >{`${this.state.mentionType !== 0 ? '@' : ''}${displayName}`}</span>
            </span><span>{
              replied && repliedAuthor && this.props.settings.replyMode == 0 ? <span>
                <span className='rq-infoText rq-margin'>replied to</span>{repliedAuthor}
              </span> : false }{
              channelHeader && channel ? <span>
                <span className='rq-infoText'>{`in ${this.state.channel.name ? '' : 'a DM'}`}</span>
                {channel}
              </span> : false
            }</span>
            { quoteTimestamp }
          </div>
        </div> : repliedAuthor ? <div className='rq-header threads-header-hack'>
          <div className='rq-userTag'>
            <span className='rq-infoText'>replied to</span>{repliedAuthor}
          </div>
        </div> : <div />

        }<div className='rq-button-container'>{
          link ? [
            <Button {...{
              classes: [ this.props.isReply && this.props.settings.replyMode != 2 ? 'reply' : 'jump' ], 
              icon: 'Reply', tooltip: 'Jump to Message',
              function: () => {
                if (!previewQuote) transitionTo(`/channels/${link.join('/')}`);
                else document.getElementById('owo-0').scrollIntoViewIfNeeded;
              }
            }}></Button>, 
            !channelHeader && !replyChannel ? <Button {...{
              classes: [ 'channel-jump' ], icon: 'Hash',
              tooltip: channel?.props?.text || 'unknown-channel',
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
            }}>{
              searchMsg === 'loading' ? <Spinner className='rq-loading-icon' type='pulsingEllipsis'/> :
              <div className='rq-error-icon'>!</div>
            }</Button>
          }{
          this.props.settings.displayMoreBtn && (!this.props.isReply || this.props.settings.reply_displayMoreBtn) ?

            <Button {...{ classes: [ 'more' ], tooltip: 'More', function: e => this.openMoreMenu(e) }}><MoreIcon /></Button>
          : false
        }</div>

        <div className='rq-content'>
          { rqRender || (this.state.message ? <MessageContent message={this.state.message} content={content}/> : false) }
          { renderAccessories ? this.state.accessories : false }
          
        </div>
        { false /*<div className='rq-hide' onClick={e => this.hideSelf()}></div> hahaha in more menu because layout broken*/ }
      </div></div></div>
    </RenderError>);
  }
};

module.exports = RichQuote;
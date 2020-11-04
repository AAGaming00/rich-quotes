const { getModule, http: { get }, constants: { Endpoints }, React } = require('powercord/webpack');


const Quote = require('./Quote');
const RenderError = require('./RenderError');


let lastFetch;

module.exports = class QuoteRenderer extends React.Component {
  constructor (props) { super(props); this.state = {
    content: [<></>],
    loading: true} }

  static getDerivedStateFromProps (props, state) {
    return { ...Object.assign({}, props), ...state };
  }

  async componentDidUpdate () { if (!_.isEqual(this.props.message.content, this.state.message.content) && this.state.loading !== false) await this.buildQuote() }

  async componentDidMount () { await this.buildQuote() }

  async buildQuote () {
    const MessageC = await getModule(m => m.prototype && m.prototype.getReaction && m.prototype.isSystemDM);
    const { message, cozyMessage, groupStart } = await getModule([ 'cozyMessage' ]);
    const { blockquoteContainer } = await getModule([ 'blockquoteContainer' ]);
    const getCurrentUser = await getModule([ 'getCurrentUser' ]);
    const { getUser } = getCurrentUser;
    const { getChannel } = await getModule(['getChannel']);
    const parser = await getModule(["parse", "parseTopic"]);

    const content = [...this.props.content];
    const linkSelector = /https?:\/\/((canary|ptb)\.)?discord(app)?\.com\/channels\/(\d{17,19}|@me)\/\d{17,19}\/\d{17,19}/;

    for (const [i, e] of content.entries()){
      if (e && e.props) {
      let quoteParams = {
        className: `${message} ${cozyMessage} ${groupStart}`,
  
        content: undefined, author: undefined,
  
        message: undefined, channel: undefined, search: undefined,
        
        link: undefined, accessories: undefined, mentionType: 0,
  
        settings: this.props.settings, thisChannel: this.props.message.channel_id
      };
      let link = [];

      /* Link Handler */
      if (e.props.href && linkSelector.test(e.props.href)) link = e.props.href.split('/').slice(-3);

      /* Markup Quote Handler */
      if (e.props.className && e.props.className === blockquoteContainer 
        && content[i + 1]?.props?.children?.props?.className.includes('mention')) {

        const quoteMatch = /(?:> )([\s\S]+?)\n(<@!?(\d+)>)/.exec(this.props.message.content);
        const author = await getUser(quoteMatch[3]);
        const currentUser = await getCurrentUser.getCurrentUser();
        const channel = await getChannel(this.props.message.channel_id) || {id: 'owo'};
        
        const raw_content = quoteMatch[1].replace(/\n> /g, '\n').replace(/\n$/g, '').trim();

        content[i + 1] = null;

        if (currentUser.id !== author.id) quoteParams.mentionType = 1;
        else if (!this.props.message.content.replace(`<@!${currentUser.id}`, '').includes(`<@!${currentUser.id}`))
          quoteParams.mentionType = 2;
        else quoteParams.mentionType = 3;

        /* Search cache for matching messages */
        if (this.props.settings.cacheSearch && window.localStorage.richQuoteCache) 
        for (let cached_message of JSON.parse(window.localStorage.richQuoteCache).searches) if (
          cached_message.content.includes(raw_content) &&
          cached_message.authorId === author.id &&
          cached_message.link[0] === (channel.guild_id || '@me')
        ) link = cached_message.link;

        /* Parse and set info when message is not cached/linked */
        if (link.length === 0) {
          quoteParams.content = await parser.parse(
            raw_content, true, { channelId: this.props.message.channel_id }
          );

          quoteParams.message = await new MessageC({ ...quoteMatch });
          quoteParams.channel = channel;
  
          quoteParams.author = author;

          quoteParams.search = {
            timestamp: this.props.message.id,
            raw: raw_content
          };
        }
      }

      /* Set for Linked Quotes */
      if (link.length !== 0) quoteParams.link = link;

      /* Create Quote */
      if (quoteParams.link || quoteParams.content) content[i] = <Quote {...quoteParams}/>;
    }};

    if (content !== this.props.content) {
      if (this.props.message.author.bot && this.props.settings.cullBotQuotes) this.props.message.embeds = [];
      this.setState({...this.props, content, oldContent: this.props.content, loading: false });
    }
  }

  // queue based on https://stackoverflow.com/questions/53540348/js-async-await-tasks-queue
  getMsgWithQueue = (() => {
    let pending = Promise.resolve()

    const run = async ([guildId, channelId, messageId]) => {
      try { await pending } finally {
        return this.getMsg(guildId, channelId, messageId)
      }
    }
    return (link) => (pending = run(link));
  })()

  async getMsg (guildId, channelId, messageId) {
    const User = await getModule(m => m.prototype && m.prototype.tag);
    const Timestamp = await getModule(m => m.prototype && m.prototype.toDate && m.prototype.month);
    const { getMessage } = await getModule(['getMessages']);

    let message = getMessage(channelId, messageId);

    if (!message) {
      if (lastFetch > Date.now() - 2500) await new Promise(r => setTimeout(r, 2500));

      let data;

      const { getGuilds } = await getModule([ 'getGuilds' ]);

      const inGuild = guildId === '@me' ? true : (() => { let is = false;
        Object.keys(getGuilds()).forEach((key) => { if (key == guildId) is = true }); return is })();

      try { data = await get({
        url: Endpoints.MESSAGES(channelId),
        query: { limit: 1, around: messageId },
        retries: 2
      })} catch (e) {
        if (!e.text) return { error: 'failed-request', inGuild: inGuild };

        const error = JSON.parse(e.text).message;

        switch (error) {
          case 'Unknown Channel': return { error: 'unknown-channel', inGuild: true };
          case 'Missing Access': return { error: 'missing-access', inGuild: inGuild };
          default: return { error: 'invalid-response', inGuild: inGuild };
        }
      }
      
      lastFetch = Date.now();
      const msg = data.body[0];

      if (!msg.id === messageId) return { error: 'no-match', closest: msg.id, inGuild: true };
      
      if (!inGuild) return { error: 'missing-access', inGuild: false }

      msg.author = new User(msg.author);
      msg.timestamp = new Timestamp(msg.timestamp);

      message = msg;
    }
    return message;
  }

  render = () => <RenderError content={this.props.content}><div>{this.state.content}</div></RenderError>
};

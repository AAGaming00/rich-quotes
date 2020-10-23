const { getModule, http: { get }, constants: { Endpoints }, React } = require('powercord/webpack');


const Quote = require('./Quote');
const RequestError = require('./RequestError');
const RenderError = require('./RenderError');

const embedHandler = require('../utils/embedHandler.js');


let lastFetch;

module.exports = class QuoteRenderer extends React.Component {
  constructor (props) { super(props); this.state = {} }

  static getDerivedStateFromProps (props, state) {
    return { ...Object.assign({}, props), ...state };
  }

  async componentDidUpdate () { if (!_.isEqual(this.props.message.content, this.state.message.content)) await this.buildQuote() }

  async componentDidMount () { await this.buildQuote() }

  async buildQuote () {
    const MessageC = await getModule(m => m.prototype && m.prototype.getReaction && m.prototype.isSystemDM);
    const { message, cozyMessage, groupStart } = await getModule([ 'cozyMessage' ]);
    const { blockquoteContainer } = await getModule([ 'blockquoteContainer' ]);
    const getCurrentUser = await getModule([ 'getCurrentUser' ]);
    const { getUser } = getCurrentUser;
    const { getChannel } = await getModule(['getChannel']);
    const parser = await getModule(["parse", "parseTopic"]);
    const { renderSimpleAccessories } = await getModule(m => m?.default?.displayName == 'renderAccessories')

    const content = [...this.props.content];
    const linkSelector = /https?:\/\/((canary|ptb)\.)?discord(app)?\.com\/channels\/(\d{17,19}|@me)\/\d{17,19}\/\d{17,19}/g;

    content.forEach(async (e, i) => { if (e && e.props) {
      let quoteParams = {
        className: `${message} ${cozyMessage} ${groupStart}`,
  
        content: undefined, author: undefined,
  
        message: undefined, channel: undefined, search: undefined,
        
        link: undefined, accessories: undefined, mentionType: 0,
  
        settings: this.props.settings
      };
      let errorParams = false;

      let link = [];

      /* Link Handler */
      if (e.props.href && linkSelector.test(e.props.href)) link = e.props.href.split('/').slice(-3);
      

      /* Markup Quote Handler */
      if (e.props.className && e.props.className === blockquoteContainer 
        && content[i + 1]?.props?.children?.props?.className.includes('mention')) {

        const quoteMatch = /(?:> )([\s\S]+?)\n(<@!?(\d+)>)/g.exec(this.props.message.content);
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

      /* Fetch/Process Message & set info for linked messages */
      if (link.length !== 0) {
        if (link[0] !== '000000000000000000') {
          const originalMessage = await this.getMsgWithQueue(link);

          if (originalMessage.error) {
            errorParams = originalMessage;
            errorParams.link = link;
          }
          else {
            let messageData = { ...originalMessage };
            let hasEmbedSpoilers = false;

            if (this.props.settings.displayEmbeds) embedHandler(messageData, this.props.settings, hasEmbedSpoilers);
            else { 
              messageData.embeds = [];
              messageData.attachments = [];
            }

            if (!this.props.settings.displayReactions) messageData.reactions = [];

            quoteParams.content = await parser.parse(
              messageData.content.trim(), true, 
              { channelId: this.props.message.channel_id }
            );

            quoteParams.author = messageData.author;

            quoteParams.message = await new MessageC({ ...messageData });
            quoteParams.channel = await getChannel(messageData.channel_id);
            quoteParams.link = link;

            if (this.props.settings.displayEmbeds && (messageData.embeds?.length !== 0 || messageData.attachments?.length !== 0)) {
              quoteParams.accessories = renderSimpleAccessories({ message: messageData, channel: quoteParams.channel}, hasEmbedSpoilers);

              const fallbacks = [['codedLinks',[]],['giftCodes',[]],['mentionChannels',[]],['mentionRoles',[]],['reactions',[]],['stickers',[]]];

              if (!quoteParams.accessories.props.message.codedLinks) quoteParams.accessories.props.message.codedLinks = [];
              fallbacks.forEach(([key, fallback]) => {
                if (!quoteParams.accessories.props.message[key])
                  quoteParams.accessories.props.message[key] = fallback;
              });
            } else quoteParams.accessories = false;
          }
        } else {
          // funni preview handler
          quoteParams.content = await parser.parse(
           'Check out this preview', true, 
            { channelId: '000000000000000000' }
          );

          quoteParams.author = await getCurrentUser.getCurrentUser();

          quoteParams.message = await new MessageC({ ...'' });
          quoteParams.channel = { id: 'owo', name: 'test-channel'};
          quoteParams.link = ['000000000000000000','000000000000000000','000000000000000000'];
        }
      }

      /* Create Quote */
      if (quoteParams.content) content[i] = React.createElement(Quote, quoteParams);

      /* Create Request Error */
      if (errorParams) content[i] = React.createElement(RequestError, errorParams);
    }});

    this.setState({...this.props, content, oldContent: this.props.content });

    setTimeout(() => { this.forceUpdate() }, 500);
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

  render () { return (<RenderError content={this.props.content}><div key={this.props.content}>{this.state.content}</div></RenderError> ) }
};

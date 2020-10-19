const { getModule, http: { get }, constants: { Endpoints }, React } = require('powercord/webpack');
const mime = require('../node_modules/mime-types')

const quote = require('./Quote')

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

    let quoteParams = {
      className: `${message} ${cozyMessage} ${groupStart}`,

      content: undefined, author: undefined,

      message: undefined, channel: undefined, search: undefined,
      
      link: undefined, accessories: undefined, mentionType: 0,

      settings: this.props.settings
    };

    content.forEach(async (e, i) => { if (e && e.props) {
      let link = [];

      /* Link Handler */
      if (e.props.href && linkSelector.test(e.props.href)) link = e.props.href.split('/').slice(-3);
      

      /* Markup Quote Handler */
      if (e.props.className && e.props.className === blockquoteContainer 
        && content[i + 1]?.props?.children?.props?.className.includes('mention')) {

        const quoteMatch = /(?:> )([\s\S]+?)\n(<@!?(\d+)>)/g.exec(this.props.message.content);
        const author = await getUser(quoteMatch[3]);
        const currentUser = await getCurrentUser.getCurrentUser();
        const channel = await getChannel(this.props.message.channel_id) || {id: 'uwu'};
        
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
          const originalMessage = await this.getMsgWithQueue(link[1], link[2]);
          let messageData = { ...originalMessage };
          const settings = this.props.settings;
          let hasEmbedSpoilers = false;
          // @todo This giant hack has false negatives, eventually should be fixed
          const spoilerMatcher = (b) => new RegExp(`\\|\\|${b.replace(/[.*+\-?^${}()|[\]\\]/g, '\\$&').replace('\/\/','\/\/(.*?)').replace(/\//g,'\\/')}(.*?)\\|\\|`);

          if (!originalMessage) return;

          if (settings.displayEmbeds && !settings.embedAll) {
            if (messageData.embeds?.length !== 0) {
              let colorFixes = [];
              let urls = []

              messageData.embeds = messageData.embeds?.filter((embed, i) => {
                if (spoilerMatcher(embed.url).test(messageData.content)) hasEmbedSpoilers = true;
                if (typeof e.color !== 'string') colorFixes.push(i);

                let keepEmbed = true;

                if (embed.image) keepEmbed = settings.embedImages;
                else if (embed.video) {
                  keepEmbed = settings.embedVideos;
                  if (!embed.video.proxyURL) keepEmbed = settings.embedYouTube
                } else keepEmbed = settings.embedOther;

                if (keepEmbed) urls.push(embed.url);

                if (urls.length === 1 && messageData.content === urls[0]) messageData.content = '';

                return keepEmbed;
              });

              // @todo Move this to filter?
              if (colorFixes.length !== 0) colorFixes.forEach((e, i) => { if (messageData.embeds[i]) messageData.embeds[i].color = '#00000000' });
            }

            if (messageData.attachments?.length !== 0) 
            messageData.attachments = messageData.attachments.filter((file) => {
              const mime_type = mime.lookup(file.proxy_url.split('/')[6]);
              if (mime_type) switch (mime_type.split('/')[0]) {
                case 'image': return settings.embedImages; break;
                case 'video': return settings.embedVideos; break;
                case 'audio': return settings.embedAudio;  break;
                default:      return settings.embedFile;   break;
              }
              else return settings.embedFile;
            });
          } else if (settings.displayEmbeds) {
            let urls = [];

            messageData.embeds.forEach((embed, i) => {
              if (spoilerMatcher(embed.url).test(messageData.content)) hasEmbedSpoilers = true;
              if (typeof e.color !== 'string') messageData.embeds[i].color = '#00000000';
              urls.push(embed.url);
            });

            if (urls.length === 1 && messageData.content === urls[0]) messageData.content = '';
          } else { 
            messageData.embeds = [];
            messageData.attachments = [];
          }

          quoteParams.content = await parser.parse(
            messageData.content.trim(), true, 
            { channelId: this.props.message.channel_id }
          );

          quoteParams.author = messageData.author;

          quoteParams.message = await new MessageC({ ...messageData });
          quoteParams.channel = await getChannel(messageData.channel_id);
          quoteParams.link = link;

          if (settings.displayEmbeds && (messageData.embeds?.length !== 0 || messageData.attachments?.length !== 0)) 
            quoteParams.accessories = renderSimpleAccessories({ message: messageData, channel: quoteParams.channel}, hasEmbedSpoilers)
          else quoteParams.accessories = false;

        } else {
          // funni preview handler
          quoteParams.content = await parser.parse(
           'Check out this preview', true, 
            { channelId: '000000000000000000' }
          );

          quoteParams.author = await getCurrentUser.getCurrentUser();

          quoteParams.message = await new MessageC({ ...'' });
          quoteParams.channel = { id: 'uwu', name: 'test-channel'};
          quoteParams.link = ['000000000000000000','000000000000000000','000000000000000000'];
        }
      }

      /* Render Quote */
      if (quoteParams.content) content[i] = React.createElement(quote, quoteParams);
    }});

    this.setState({...this.props, content, oldContent: this.props.content });

    setTimeout(() => { this.forceUpdate() }, 500);
  }

  // queue based on https://stackoverflow.com/questions/53540348/js-async-await-tasks-queue
  getMsgWithQueue = (() => {
    let pending = Promise.resolve()

    const run = async (channelId, messageId) => {
      try { await pending } finally {
        return this.getMsg(channelId, messageId)
      }
    }

    return (channelId, messageId) => (pending = run(channelId, messageId))
  })()

  async getMsg (channelId, messageId) {
    const User = await getModule(m => m.prototype && m.prototype.tag)
    const Timestamp = await getModule(m => m.prototype && m.prototype.toDate && m.prototype.month)
    const { getMessage } = await getModule(['getMessages'])
    let message = getMessage(channelId, messageId);

    if (!message) {
      if (lastFetch > Date.now() - 2500) await new Promise(r => setTimeout(r, 2500));
      
      const data = await get({
        url: Endpoints.MESSAGES(channelId),
        query: {
          limit: 1,
          around: messageId
        },
        retries: 2
      });
      
      lastFetch = Date.now();
      message = data.body.find(m => m.id == messageId);

      if (!message) return;

      message.author = new User(message.author);
      message.timestamp = new Timestamp(message.timestamp);
    }
    return message;
  }

  render () { return ( <div key={this.props.content}>{this.state.content}</div> ) }
};

const { getModule, http: { get }, constants: { Endpoints }, React } = require('powercord/webpack');
const quote = require('./Quote')
let lastFetch;

module.exports = class QuoteRenderer extends React.Component {
  constructor (props) {
    super(props);
    this.state = { };
  }
  static getDerivedStateFromProps(props, state) {
     if (!state.new) {
     return { ...Object.assign({}, props) };
     }
     return state
  }
  async componentDidUpdate () {
    if (!_.isEqual(this.props.message.content, this.state.message.content)) await this.buildQuote()
  }
  async componentDidMount () {
    await this.buildQuote()
  }
  async buildQuote () {
    const MessageC = await getModule(m => m.prototype && m.prototype.getReaction && m.prototype.isSystemDM)
    const { message, cozyMessage, groupStart } = await getModule([ 'cozyMessage' ])
    const { blockquoteContainer } = await getModule([ 'blockquoteContainer' ])
    const getCurrentUser = await getModule([ 'getCurrentUser' ]);
    const { getUser } = getCurrentUser;
    const { getChannel } = await getModule(['getChannel'])
    const parser = await getModule(["parse", "parseTopic"]);
    // const { renderSimpleAccessories } = await getModule(m => m?.default?.displayName == 'renderAccessories')

    const content = [...this.props.content];
    const linkSelector = /https?:\/\/((canary|ptb)\.)?discord(app)?\.com\/channels\/(\d{17,19}|@me)\/\d{17,19}\/\d{17,19}/g;

    let quoteParams = {
      className: `${message} ${cozyMessage} ${groupStart}`,

      content: undefined, author: undefined,

      message: undefined, channel: undefined, search: undefined,
      
      link: undefined, accessories: undefined, mentionType: 0
    };

    content.forEach(async (e, i) => { if (e && e.props) {
      /* Link Handler */
      if (e.props.href && linkSelector.test(e.props.href)) {
        const linkIds = e.props.href.split('/');
        const messageData = await this.getMsgWithQueue(linkIds[5], linkIds[6]);

        if (!messageData) return;

        if (messageData.embeds) messageData.embeds.forEach((e, i) => {
          if (typeof e.color !== 'string') 
            messageData.embeds[i].color = '#00000000';
        });

        quoteParams.content = await parser.parse(
          messageData.content.trim(), true, 
          { channelId: this.props.message.channel_id }
        );

        quoteParams.author = messageData.author;

        quoteParams.message = await new MessageC({ ...messageData });
        quoteParams.channel = await getChannel(messageData.channel_id);
        quoteParams.link = e.props.href.replace(/https?:\/\/((canary|ptb)\.)?discord(app)?\.com/g, '');

        //quoteParams.accessories = React.createElement(renderSimpleAccessories, {
        //  message: messageData,
        //  channel: quoteParams.channel,
        //  hasSpoilerEmbeds: false
        //})
      }

      /* Markup Quote Handler */
      if (e.props?.className === blockquoteContainer 
        && content[i + 1]?.props?.children?.props?.className.includes('mention')) {

        const messageData = /(?:> )([\s\S]+?)\n(<@!?(\d+)>)/g.exec(this.props.message.content);
        const author = await getUser(messageData[3]);
        const currentUser = await getCurrentUser.getCurrentUser();

        quoteParams.content = await parser.parse(
          messageData[1].replace(/\n> /g, '\n').replace(/\n$/g, '').trim(), 
          true, { channelId: this.props.message.channel_id }
        );

        quoteParams.author = author;
        quoteParams.mentionType = currentUser.id === author.id ? 2 : 1;

        quoteParams.message = await new MessageC({ ...messageData });
        quoteParams.channel = await getChannel(this.props.message.channel_id);
        
        quoteParams.search = {
          timestamp: this.props.message.id,
          raw: messageData[1].replace(/\n> /g, '\n').replace(/\n$/g, '')
        };
      }

      if (quoteParams.content) content[i] = React.createElement(quote, quoteParams);

      if (quoteParams.mentionType !== 0) content[i + 1] = null;
    }});

    this.setState({...this.props, content, oldContent: this.props.content, new: true });

    setTimeout(() => { this.forceUpdate() }, 500);
  }

  // queue based on https://stackoverflow.com/questions/53540348/js-async-await-tasks-queue
  getMsgWithQueue = (() => {
    let pending = Promise.resolve()

    const run = async (channelId, messageId) => {
        try {
            await pending
        } finally {
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

  render () {
    return ( <div key={this.props.content}>{this.state.content}</div> )
  }
};

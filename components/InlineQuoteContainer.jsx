const { getModule, http: { get }, constants: { Endpoints }, React } = require('powercord/webpack');
const MessageC = getModule(m => m.prototype && m.prototype.getReaction && m.prototype.isSystemDM, false)
const User = getModule(m => m.prototype && m.prototype.tag, false)
const Timestamp = getModule(m => m.prototype && m.prototype.toDate && m.prototype.month, false)
const { message, cozyMessage, groupStart } = getModule([ 'cozyMessage' ], false)
const { blockquoteContainer } = getModule([ 'blockquoteContainer' ], false)
const { getMessage } = getModule(['getMessages'], false)
const { getUser } = getModule([ 'getCurrentUser' ], false)
const { getChannel } = getModule(['getChannel'], false)
const parser = getModule(["parse", "parseTopic"], false).parse;
const quote = require('./InlineQuote')
//console.log(blockquoteContainer)
let lastFetch;

module.exports = class InlineQuoteContainer extends React.Component {
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
  async componentDidMount () {
    const content = [...this.state.content];
    //console.log(content)
    content.forEach(async (e, i) => { if (e && e.props) {
      if (e.props.href && (/https?:\/\/((canary|ptb)\.)?discord(app)?\.com\/channels\/(\d{17,19}|@me)\/\d{17,19}\/\d{17,19}/g).test(e.props.href)) {
        const linkArray = e.props.href.split('/');
        const messageData = await this.getMsgWithQueue(linkArray[5], linkArray[6]);

        if (!messageData) return;

        //console.log(messageData)
        if (messageData.embeds) {
          messageData.embeds.forEach((e, i) => {
            //console.log(e);
            if (typeof e.color !== 'string') {
              messageData.embeds[i].color = '#00000000';
            }
          });
        }

        //msg.message.content = msg.message.content.replace(e.props.href, '')
        content[i] = React.createElement(quote, {
          className: `${message} ${cozyMessage} ${groupStart}`,
          groupId: messageData.id,
          message: new MessageC({ ...messageData }),
          channel: getChannel(messageData.channel_id),
          author: messageData.author,
          content: parser(messageData.content.trim(), true, { channelId: this.props.message.channel_id }),
          style: { cursor: "pointer" },
          link: e.props.href
        });
      }

      if (e.props?.className === blockquoteContainer && content[i + 1]?.props?.children?.props?.className.includes('mention')) {
        //msg.message.content = msg.message.content.replace(e.props.href, '')
        const messageData = /(?:> )([\s\S]+)(<@!?(\d+)>)/g.exec(this.props.message.content);
        //console.log(messageData, messageData[1].replace(/\n> /g, ''))
        content[i + 1] = null;
        
        content[i] = React.createElement(quote, {
          className: `${message} ${cozyMessage} ${groupStart}`,
          author: getUser(messageData[3]),
          content: parser(messageData[1].replace(/\n> /g, '\n').replace(/\n$/g, '').trim(), true, { channelId: this.props.message.channel_id }),
          channel: getChannel(this.props.message.channel_id)
          //onClick: () => { transitionTo(e.props.href.replace(/https?:\/\/((canary|ptb)\.)?discord(app)?\.com/g, '')); },
          //style: { cursor: "pointer" }
        });
      }
    }});
    this.setState({ content, new: true });
    setTimeout(() => {
      this.forceUpdate()
    }, 500);
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
    return ( <div key={this.state.content}>{this.state.content}</div> )
  }
};

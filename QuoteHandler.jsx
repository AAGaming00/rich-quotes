const { getModule, http: { get }, constants: { Endpoints }, React } = require('powercord/webpack');
const MessageC = getModule(m => m.prototype && m.prototype.getReaction && m.prototype.isSystemDM, false)
const { AsyncComponent } = require('powercord/components');
const ChannelMessage = AsyncComponent.from(getModule(m => m.type && m.type.displayName === 'ChannelMessage', false));
const User = getModule(m => m.prototype && m.prototype.tag, false)
const Timestamp = getModule(m => m.prototype && m.prototype.toDate && m.prototype.month, false)
const { message, cozyMessage, groupStart } = getModule([ 'cozyMessage' ], false)
const { transitionTo } = getModule(["transitionTo"], false);
const { getMessage } = getModule(['getMessages'], false)
const { getChannel } = getModule(['getChannel'], false)
let lastFetch;
module.exports = class QuoteHandler extends React.Component {
  constructor (props) {
    super(props);
    this.state = { };
    console.log(this.props)
  }
  static getDerivedStateFromProps(props, state) {
     console.log(props)
     if (!state.new) {
     return { ...Object.assign({}, props) };
     }
     return state
  }
  async componentDidMount () {
    const content = [...this.state.content]
    content.forEach(async (e, i) => {
        if (e.props && e.props.href && (/https?:\/\/((canary|ptb)\.)?discord(app)?\.com\/channels\/(\d{17,19}|@me)\/\d{17,19}\/\d{17,19}/g).test(e.props.href)) {
          const linkArray = e.props.href.split('/')
          const messageData = await this.getMsgWithQueue(linkArray[5], linkArray[6])
          console.log(messageData)
          //msg.message.content = msg.message.content.replace(e.props.href, '')
          content[i] = React.createElement(ChannelMessage, {
              className: `${message} ${cozyMessage} ${groupStart}`,
              groupId: messageData.id,
              message: new MessageC({
                  ...messageData,
              }),
              channel: getChannel(messageData.channel_id),
              onClick: () => {transitionTo(e.props.href.replace(/https?:\/\/((canary|ptb)\.)?discord(app)?\.com/g, ''))},
              style: { cursor: "pointer" }
          })
        }
        console.log(content[i])
    });
    console.log(content)
    this.setState({ content, new: true });
    setTimeout(() => {
      this.forceUpdate()
    }, 100);
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
      if (lastFetch > Date.now() - 2500) {
        await new Promise(r => setTimeout(r, 2500));
      }
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
      if (!message) {
        return;
      }
      message.author = new User(message.author);
      message.timestamp = new Timestamp(message.timestamp);
    }
    return message;
  }

  render () {
    console.log(this.state)
    return (
        <div key={this.state.content}>{this.state.content}</div>
    )
    }
};

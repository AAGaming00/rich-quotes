const { getModule, http: { get }, constants: { Endpoints }, React } = require('powercord/webpack');
const { AsyncComponent } = require('powercord/components');

let lastFetch;

module.exports = class QuoteHandler extends React.Component {
  constructor (props) {
    super(props);
    this.state = {};
  }
  static getDerivedStateFromProps(props, state) {
     if (!state.new) return { ...Object.assign({}, props) };
     // else
     return state
  }

  async componentDidMount () {
  const MessageC = getModule(m => m.prototype && m.prototype.getReaction && m.prototype.isSystemDM, false)
  const User = getModule(m => m.prototype && m.prototype.tag, false)
  const ChannelMessage = AsyncComponent.from(getModule(m => m.type && m.type.displayName === 'ChannelMessage', false));
  const Timestamp = getModule(m => m.prototype && m.prototype.toDate && m.prototype.month, false)
  const { message, cozyMessage, groupStart } = getModule([ 'cozyMessage' ], false)
  const { transitionTo } = getModule(["transitionTo"], false);
  const { getMessage } = getModule(['getMessages'], false)
  const { getChannel } = getModule(['getChannel'], false)
    const content = [...this.state.content]

    content.forEach(async (e, i) => {
      if (e.props?.href && (/https?:\/\/((canary|ptb)\.)?discord(app)?\.com\/channels\/(\d{17,19}|@me)\/\d{17,19}\/\d{17,19}/g).test(e.props.href)) {
        const linkArray = e.props.href.split('/');
        const messageData = await this.getMsgWithQueue(linkArray[5], linkArray[6]);
        
        if (!messageData) return;

        if (messageData.embeds) {
          messageData.embeds.forEach((e, i) => {
            //console.log(e);
            if (typeof e.color !== 'string') {
              messageData.embeds[i].color = '#00000000';
            }
          });
        }
        
        //msg.message.content = msg.message.content.replace(e.props.href, '')
        content[i] = React.createElement(ChannelMessage, {
          className: `${message} ${cozyMessage} ${groupStart}`,
          groupId: messageData.id,
          message: new MessageC({
            ...messageData,
          }),
          channel: getChannel(messageData.channel_id),
          onClick: () => { transitionTo(e.props.href.replace(/https?:\/\/((canary|ptb)\.)?discord(app)?\.com/g, '')); },
          style: { cursor: "pointer" }
        });
      }
    });
    this.setState({ content, new: true });
    setTimeout(() => {
      this.forceUpdate()
    }, 500);
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

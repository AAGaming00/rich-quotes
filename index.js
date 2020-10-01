const { Plugin } = require('powercord/entities');
const { inject, uninject } = require('powercord/injector');
const { getOwnerInstance } = require('powercord/util')
const { getModule, http: { get }, constants: { Endpoints }, React } = require('powercord/webpack');
const { AsyncComponent } = require('powercord/components');
const { default: State } = require('sucrase/dist/parser/tokenizer/state');
const { getMessage, getMessages } = getModule(['getMessages'], false)
const { getChannel } = getModule(['getChannel'], false)
const { getChannelId } = getModule(["getLastSelectedChannelId"], false);
const dispatcher = getModule(['dirtyDispatch'], false)
const Message = getModule(m => m.default && m.default.displayName === 'Message', false);
const ChannelMessage = AsyncComponent.from(getModule(m => m.type && m.type.displayName === 'ChannelMessage', false))
const MessageC = getModule(m => m.prototype && m.prototype.getReaction && m.prototype.isSystemDM, false)
const User = getModule(m => m.prototype && m.prototype.tag, false)
const Timestamp = getModule(m => m.prototype && m.prototype.toDate && m.prototype.month, false)
const { message, cozyMessage, groupStart } = getModule([ 'cozyMessage' ], false)
const { messageContent, contents } = getModule([ 'messageContent' ], false)
const { transitionTo } = getModule(["transitionTo"], false);
let cache = [];
let cache2 = [];
let lastFetch;
module.exports = class Quowoter extends Plugin {
  startPlugin () {
    console.log(Message, ChannelMessage);
    inject('quowoter-Message', Message, 'default', (args) => {
      console.log(args)
      const cachemsg = cache2[args[0].childrenMessageContent.props.message.id]
      console.log(args, cachemsg);
      if ((/(https?:\/\/((canary|ptb)\.)?discord(app)?\.com\/channels\/(\d{17,19}|@me)\/\d{17,19}\/\d{17,19})+/g).test(args[0].childrenMessageContent.props.message.content) && !cachemsg) {
      this.processLinks(args[0].childrenMessageContent.props, args[0].childrenMessageContent)
      }
      if (cachemsg) {
        args[0].childrenMessageContent.props.content = cachemsg.props.content
      }
      return args;
    }, true);
    Message.default.displayName = 'Message';
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
    let message = getMessage(channelId, messageId) || cache[messageId];
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
    cache[messageId] = message;
    return message;
  }

  pluginWillUnload () {
    uninject('quowoter-Message');
    cache2 = []
    cache = [];
  }


  async processLinks(msg, res) {
      res.props.content.forEach(async (e, i) => {
        if (e.props && e.props.href && (/https?:\/\/((canary|ptb)\.)?discord(app)?\.com\/channels\/(\d{17,19}|@me)\/\d{17,19}\/\d{17,19}/g).test(e.props.href)) {
          const linkArray = e.props.href.split('/')
          const messageData = await this.getMsgWithQueue(linkArray[5], linkArray[6])
          console.log(messageData)
          //msg.message.content = msg.message.content.replace(e.props.href, '')
          res.props.content[i] = React.createElement(ChannelMessage, {
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
      });
    cache2[msg.message.id] = res
      this.updateMessage(
        {
          id: msg.message.id,
          channel_id: msg.message.channel_id,
          author: msg.message.author,
        }
      );
    }
  
    updateMessage(message) {
      dispatcher.dirtyDispatch({
        type: "MESSAGE_UPDATE",
        message,
      });
    }
  };

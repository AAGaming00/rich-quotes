const { getModule, React } = require('powercord/webpack');

const Style = getModule([ 'blockquoteContainer' ], false);

const Quote = require('./Quote');

const { linkSelector } = require('../utils/vars.js');

module.exports = class RQRenderer extends React.Component {
  constructor (props) { super(props); this.state = { loading: true } }

  async componentDidUpdate () { 
    if (!_.isEqual(this.props.message.content, this.state.message?.content) || this.state.loading) 
      await this.buildQuote();
  }

  async componentDidMount () { await this.buildQuote() }

  async buildQuote () {
    const content = [...this.props.content];

    const thisLocation = [document.location.href.split('/')[4], this.props.message.channel_id, this.props.message.id];

    let quotes = this.props.quotes;

    let targetEntries = [];

    /* Find Quotes */
    for (const [i, e] of content.entries()) { if (e && e.props) { 
      if (e.props.href) {
        const link = e.props.href.match(linkSelector);

        if (link) targetEntries.push({ i: i, value: link.slice(1) });
      }

      else if (quotes && e.props.className && e.props.className === Style.blockquoteContainer 
        && content[i + 1]?.props?.children?.props?.className.includes('mention')) {

        targetEntries.push({ i: i, value: quotes[0] });
        quotes = quotes.slice(1);
      }
    }}

    /* Render Quotes */
    if (targetEntries.length !== 0) {
      const MessageC = await getModule(m => m.prototype && m.prototype.getReaction && m.prototype.isSystemDM);
      const { message, cozyMessage, groupStart } = await getModule([ 'cozyMessage' ]);
      const { getCurrentUser, getUser } = await getModule([ 'getCurrentUser' ]);
      const { getChannel } = await getModule(['getChannel']);
      const parser = await getModule(['parse', 'parseTopic']);


      for (const {i, value} of targetEntries) {
        let quoteParams = {
          className: `${message} ${cozyMessage} ${groupStart}`,

          parent: thisLocation, level: this.props.level, mentionType: 0,

          settings: this.props.settings
        };

        /* Link Handler */
        if (Array.isArray(value)) quoteParams.link = value;

        /* Markup Quote Handler */
        if (!quoteParams.link) {
          const currentUser = (await getCurrentUser()).id;
          const channel = await getChannel(this.props.message.channel_id) || {id: 'owo'};

          const rawContent = value.content.trim();

          content[i + 1] = null;
          quoteParams.isMarkdown = true;

          if (currentUser !== value.author) quoteParams.mentionType = 1;
          else if (!this.props.broadMention) quoteParams.mentionType = 2;

          if (this.props.broadMention) quoteParams.mentionType = 3;

          /* Search cache for matching messages */
          if (this.props.settings.cacheSearch && window.localStorage.richQuoteCache) 
          for (let cached_message of JSON.parse(window.localStorage.richQuoteCache).searches) if (
            cached_message.content.includes(rawContent) &&
            cached_message.authorId === value.author &&
            cached_message.link[0] === (channel.guild_id || '@me')
          ) quoteParams.link = cached_message.link;

          /* Parse and set info when message is not cached/linked */
          if (!quoteParams.link) {
            const author = await getUser(value.author);

            quoteParams.content = await parser.parse(
              rawContent, true, { channelId: this.props.message.channel_id }
            );

            quoteParams.message = await new MessageC({
              author, id: this.props.message.id, content: rawContent, channel_id: quoteParams.parent[1]
            });

            quoteParams.channel = channel;

            quoteParams.author = author;

            quoteParams.search = {
              timestamp: this.props.message.id,
              raw: rawContent
            };
          }
        }

        /* Create Quote */
        content[i] = <Quote {...quoteParams}/>;
      };

      if (this.props.message.author.bot && this.props.settings.cullBotQuotes) this.props.message.embeds = [];

      this.setState({...this.props, content, oldContent: this.props.content, loading: false });
    }
  }

  render = () => <>{this.state.content || this.props.content}</>
};

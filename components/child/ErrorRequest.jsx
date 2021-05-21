const { getModule, http: { get }, constants: { Endpoints }, React } = require('powercord/webpack');
const { ButtonItem } = require('powercord/components/settings');
const { Button } = require('powercord/components');

module.exports = class RQRequestError extends React.PureComponent {
  constructor (props) { super(props); this.state = { content: false} }

  static getDerivedStateFromProps (props, state) {
    return { ...Object.assign({}, props), ...state };
  }

  async componentDidMount () { await this.buildError() }

  async buildError () {
    const { getGuild } = await getModule([ 'getGuild' ]);
    const { joinGuild } = await getModule([ 'joinGuild' ]);
    const { transitionTo } = await getModule([ 'transitionTo' ]);

    const guild_id = this.props.link[0];

    const errorText = 'rq-error-text colorStandard-2KCXvj';
    const isCurrentGuild = window.location.href.split('/')[4] === guild_id;

    let errorBody = [];

    switch (this.props.error) {
      case 'missing-access': {
        if (this.props.inGuild) errorBody = [
          (<div className={errorText}>{`Error: Missing access to channel on ${isCurrentGuild ? 'this server.' : `${getGuild(guild_id).name} server.`}`}</div>),
          isCurrentGuild ? false : 
          (<ButtonItem button='Go to Server' color={Button.Colors.GREEN}
            onClick={() => transitionTo(`/channels/${guild_id}`) }
          ></ButtonItem>)
        ];
        else if (guild_id !== '@me') {
          let missingGuild = false;
          try {
            missingGuild = await get({ url: Endpoints.GUILD_PREVIEW(guild_id), retries: 1 });
          } catch (e) {}

          if (missingGuild) {
            errorBody = [
              (<div className={errorText}>{`Error: Not on the ${missingGuild.body.name} server`}</div>),
              (<ButtonItem button={`Join ${missingGuild.body.name}`} color={Button.Colors.GREEN} onClick={() => joinGuild(guild_id)}></ButtonItem>)
            ]
          } else errorBody = [(<div className={errorText}>Error: Private/Deleted server</div>)];
        }
        else errorBody = [(<div className={errorText}>Error: Other user's DM</div>)];
      } break;
      case 'no-match': errorBody = [
        (<div className={errorText}>Error: Message deleted or invalid ID</div>),
        (<ButtonItem button={`Jump to Closest`} color={Button.Colors.GREEN}
          onClick={() => transitionTo(`/channels/${[this.props.link[0], this.props.link[1], this.props.closest].join('/')}`) }
        ></ButtonItem>)
      ]; break;
      case 'unknown-channel': errorBody = guild_id !== '@me' ? [
        (<div className={errorText}>{`Error: Channel missing or deleted on ${isCurrentGuild ? 'this server.' : 'another server.'}`}</div>),
        isCurrentGuild ? false : 
        (<ButtonItem button='Go to Server' color={Button.Colors.GREEN}
          onClick={() => transitionTo(`/channels/${guild_id}`) }
        ></ButtonItem>)
      ] : [(<div className={errorText}>Error: Invalid DM</div>)]; break;
      case 'same-link': errorBody = [(<div className={errorText}>Error: Link goes to this message</div>)]; break;
      case 'failed-request': errorBody = [(<div className={errorText}>Error: Discord API request failed</div>)]; break;
      case 'invalid-response': errorBody = [(<div className={errorText}>Error: Malformed Discord API response</div>)]; break;
    }

    if (!errorBody[1]) errorBody.push(false);

    this.setState({ content: (<div className='rq-error rq-error-request'><div className="rq-error-highlight">{errorBody[0]}{errorBody[1]}</div></div>) });
  }

  render() { return (<>{this.state.content}</>); }
}

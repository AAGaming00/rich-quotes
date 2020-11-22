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

    const linkGuild = this.props.link[0];

    const errorText = 'rq-error-text colorStandard-2KCXvj';
    const isCurrentGuild = window.location.href.split('/')[4] === linkGuild;

    let errorBody = [];

    switch (this.props.error) {
      case 'missing-access': {
        if (this.props.inGuild) errorBody = [
          (<div className={errorText}>{`Error: Missing access to channel on ${isCurrentGuild ? 'this server.' : `${getGuild(linkGuild).name} server.`}`}</div>),
          isCurrentGuild ? false : 
          (<ButtonItem button='Go to Server' color={Button.Colors.GREEN}
            onClick={() => { getModule([ 'transitionTo' ], false).transitionTo(`/channels/${linkGuild}`) }}
          ></ButtonItem>)
        ];
        else if (linkGuild !== '@me') {
          let missingGuild = false;
          try {
            missingGuild = await get({ url: Endpoints.GUILD_PREVIEW(linkGuild), retries: 1 });
          } catch (e) {}

          if (missingGuild) {
            errorBody = [
              (<div className={errorText}>{`Error: Not on the ${missingGuild.body.name} server`}</div>),
              // @todo Find session_id so we can give join button

              /*(<ButtonItem button={`Join ${missingGuild.body.name}`} color={Button.Colors.GREEN}
                onClick={async () => {
                  const invite = await get({ url: Endpoints.GUILD_VANITY_URL(linkGuild) });

                  console.log(invite);

                  require('powercord/utils').gotoOrJoinServer('MINECRAFT');
                }}
              ></ButtonItem>)*/
            ]
          } else errorBody = [(<div className={errorText}>Error: Private/Deleted server</div>)];
        }
        else errorBody = [(<div className={errorText}>Error: Other user's DM</div>)];
      } break;
      case 'no-match': errorBody = [
        (<div className={errorText}>Error: Message deleted or invalid ID</div>),
        (<ButtonItem button={`Jump to Closest`} color={Button.Colors.GREEN}
          onClick={() => {
            const link = [this.props.link[0], this.props.link[1], this.props.closest];

            getModule([ 'transitionTo' ], false).transitionTo(`/channels/${link.join('/')}`);
          }}
        ></ButtonItem>)
      ]; break;
      case 'unknown-channel': errorBody = linkGuild !== '@me' ? [
        (<div className={errorText}>{`Error: Channel missing or deleted on ${isCurrentGuild ? 'this server.' : 'another server.'}`}</div>),
        isCurrentGuild ? false : 
        (<ButtonItem button='Go to Server' color={Button.Colors.GREEN}
          onClick={() => { getModule([ 'transitionTo' ], false).transitionTo(`/channels/${linkGuild}`) }}
        ></ButtonItem>)
      ] : [(<div className={errorText}>Error: Invalid DM</div>)]; break;
      case 'failed-request': errorBody = [(<div className={errorText}>Error: Discord API request failed</div>)]; break;
      case 'invalid-response': errorBody = [(<div className={errorText}>Error: Malformed Discord API response</div>)]; break;
    }
    
    if (!errorBody[1]) errorBody.push(false);

    this.setState({ content: (<div className='rq-error rq-error-request'>{errorBody[0]}{errorBody[1]}</div>) });
  }

  render() { return (<>{this.state.content}</>); }
}

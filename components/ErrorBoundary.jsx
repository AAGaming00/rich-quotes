const { getModule, React } = require('powercord/webpack');
const { clipboard } = getModule([ 'clipboard' ], false);
const { ButtonItem } = require('powercord/components/settings');
const { Button } = require('powercord/components');

class ErrorBoundary extends React.PureComponent {
  constructor (props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  componentDidCatch (error) {
    console.error(error);

    this.setState({ hasError: true,
      error });

    if (typeof this.props.onError === 'function') {
      this.props.onError(error);
    }
  }

  render () {
    const { getGuilds } = getModule([ 'getGuilds' ], false);
    const parser = getModule(["parse", "parseTopic"], false);
    

    const support = { 
      author: { name: 'AAGaming', id: '373833473091436546' },
      server: { name: 'Powercord', invite: 'nFRHhDk', link: ['538759280057122817','755004260902764646'] } // plugin-support
    }

    const inGuild = () => { let is = false;
      Object.keys(getGuilds()).forEach((key) => { if (key == support.server.link[0]) is = true }); return is };
    
    let server_link = (parser.parse(inGuild() ?
      `https://${document.location.href.split('/')[2]}/channels/${support.server.link.join('/')}` :

      `https://discord.gg/${support.server.invite}`))[0];

    server_link.props.children[0] = `${support.server.name} server`;
    
    let errorString = this.state.error?.stack;

    errorString // Clean error string
      ?.split('\n')
      .filter(l => !l.includes('discordapp.com/assets/') && !l.includes('discord.com/assets/'))
      .join('\n')
      .split('../../')
      .join('')
      .substring(0, 2000 - 36);
    
    // Jank ass sanity check
    const badPlugins = ['open-in-spotify']
    const hasBad = (() => { let has = false;
      powercord.pluginManager.getPlugins().forEach((name) => { badPlugins.forEach((bad) => { if (name.includes(bad)) has = true;})}); return has })();
    
    if (errorString?.length === 2000 - 36) errorString += '...';

    if (this.state.hasError) {
      return (<>
        <div className='rq-error'>
          { hasBad ? 
            <div className = 'rq-error-text colorStandard-2KCXvj'>
              You have Open in Spotify installed, it is probably causing the issue, disable the plugin.
            </div> :
            <div className = 'rq-error-text colorStandard-2KCXvj'>
              An error occurred while rendering this element. {'\n'}
              Click the button below to copy the error message. {'\n'}
              Send it to {support.author.name} in the {server_link} for support.
            </div>
          }
          { hasBad ? 
            <ButtonItem button={'Disable & Reload'} color={Button.Colors.GREEN}
              onClick={() => { powercord.pluginManager.disable('open-in-spotify'); setTimeout(() => window.location.reload(), 250) }}
            ></ButtonItem> : 
            <ButtonItem button='Copy Error Message' color={Button.Colors.GREEN}
              onClick={ () => clipboard.copy( `<@${support.author.id}>\n\`\`\`js\n${errorString}\n\`\`\`` ) }
            ></ButtonItem>
          }
        </div>
        {this.props.content}
      </>);
    }
    return this.props.children;
  }
}

module.exports = ErrorBoundary;

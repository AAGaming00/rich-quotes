const { getModule, React } = require('powercord/webpack');
const { clipboard } = getModule([ 'clipboard' ], false);

class ErrorBoundary extends React.PureComponent {
  constructor (props) {
    super(props);
    this.state = { hasError: false,
      error: null };
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
    if (this.state.hasError) {
      return (
        <>
          <div className = 'rq-error colorStandard-2KCXvj size14-e6ZScH'>
                    An error occurred while rendering this element.
            {'\n'}
                    Click the button below to copy the error message.
            {'\n'}
                    Send it to AAGaming in the Powercord server for support.
          </div>
          <button onClick = {() => {
            let errorString = this.state.error.stack
              .split('\n')
              .filter(l => !l.includes('discordapp.com/assets/') && !l.includes('discord.com/assets/'))
              .join('\n')
              .split('../../')
              .join('')
              .substring(0, 2000 - 36);
            if (errorString.length === 2000 - 36) {
              errorString += '...';
            }
            clipboard.copy(
              `<@373833473091436546>\n\`\`\`js\n${errorString}\n\`\`\``
            );
          }}>
            Copy Error Message
          </button>
          {'\n'}
          {this.props.content}
        </>
      );
    }
    return this.props.children;
  }
}

module.exports = ErrorBoundary;

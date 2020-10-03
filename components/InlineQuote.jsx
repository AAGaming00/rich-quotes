const { React, getModule } = require('powercord/webpack');
const avatar = getModule([ 'avatar' ], false);
module.exports = class InlineQuote extends React.Component {
  componentDidMount () {
    //console.log(this.props.author, avatar);
  }

  render () {
    return (
      <>
        <div key={this.props.content} className='qo-inline'>
          <div className='qo-header header-23xsNx threads-header-hack'>
            <img src={this.props.author.avatarURL} aria-hidden="true" class={`qo-avatar threads-avatar-hack revert-reply-hack avatar-1BDn8e clickable-1bVtEA`} alt=" "></img>
            <div className='qo-username username-1A8OIy clickable-1bVtEA'>{this.props.author.username}</div>
          </div>
          <div className='qo-content'>
            {this.props.content}
          </div>
        </div>
      </>
    );
  }
};

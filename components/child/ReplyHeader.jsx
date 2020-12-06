const { React, getModule } = require('powercord/webpack');

const Avatar = require('./Avatar');

const { openUserPopout, openUserContextMenu } = require('./../../utils/userMethods.js');

module.exports = function ({ author, channel }) {
  const Style = getModule([ 'systemMessageAccessories' ], false);

  return (<span className='rq-reply-header'>
    <span className='rq-infoText'>replied to</span>
    <span className='rq-author'
      onClick={e => openUserPopout(e, author.id, channel.guild_id) } 
      onContextMenu={e => openUserContextMenu(e, author.id, channel.id, channel.guild_id)}
    >
      <Avatar style={Style} user={author} />
      <span className={`rq-username rq-margin ${Style.username} ${Style.clickable}`}>{author.username}</span>
    </span>
  </span>);
};
const { React, getModule } = require('powercord/webpack');

const Style = getModule([ 'systemMessageAccessories' ], false);

const { openUserPopout, openUserContextMenu } = require('../../utils/userMethods.js');

module.exports = function ({ user, context }) {
  return (<img 
    className={`rq-avatar threads-avatar-hack revert-reply-hack ${Style.avatar} ${Style.clickable}`} 
    src={user.avatarURL} 
    onClick={context ? e => openUserPopout(e, user.id, context.guild_id) : false} 
    onContextMenu={context ? e => openUserContextMenu(e, user.id, context.id, context.guild_id) : false} 
  aria-hidden="true" alt=" " />);
};

const { React } = require('powercord/webpack');

module.exports = function ({ style, user }) {
  return (<img 
    className={`rq-avatar threads-avatar-hack revert-reply-hack ${style.avatar} ${style.clickable}`} 
    src={`https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=32`} 
    aria-hidden="true" alt=" " />);
};
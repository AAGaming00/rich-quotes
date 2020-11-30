const { React } = require('powercord/webpack');

module.exports = function ({ style, user }) {
  return (<img className={`rq-avatar threads-avatar-hack revert-reply-hack ${style.avatar} ${style.clickable}`} src={user.avatarURL} aria-hidden="true" alt=" " />);
};
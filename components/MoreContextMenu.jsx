const { getModule } = require('powercord/webpack');

module.exports = function (props) {
  const orig = getModule(x => x.default?.displayName === 'MessageContextMenu', false);
  const res = orig.default(props);
  console.log(res);
  return res;
};

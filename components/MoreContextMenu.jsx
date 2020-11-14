const { getModule, React } = require('powercord/webpack');

module.exports = function (props) {
  const { MenuGroup, MenuItem } = getModule([ 'MenuGroup' ], false);

  const res = getModule(x => x.default?.displayName === 'MessageContextMenu', false).default(props);

  if (props.isMarkdown) {
    if (!props.link) {
      const idCheck = new RegExp(`(${['add\\-reaction', 'edit', 'pin', 'mark\\-unread', 'copy\\-link', 'delete'].join('|')})$`);

      res.props.children[2].props.children = res.props.children[2].props.children.filter((c, j) => {
        if (c && j !== 0 && c.props?.id ? !idCheck.test(c.props.id) : false) return true; else return false;
      });

      res.props.children[5] = null;
    } else if (props.settings.cacheSearch) 
    res.props.children.push(React.createElement(MenuGroup, { children: [ React.createElement(MenuItem, {
      id: 'clear-cache',
      disabled: false,
      label: 'Clear Message Match',
      action: () => {
        window.localStorage.richQuoteCache = JSON.stringify({
          searches: JSON.parse(window.localStorage.richQuoteCache).searches.filter((message) => {
            if (message.link[2] === props.link[2]) return false;
            else return true;
          }
        )});

        props.clearLink();
      }
    })]}));
  }

  if (props.link) {
    const idCheck = new RegExp(`(${[props.settings.displayReactions ? 'nope' : 'add\\-reaction', 'mark\\-unread', 'delete'].join('|')})$`);

    res.props.children[2].props.children = res.props.children[2].props.children.filter((c, j) => {
      if (c && (props.settings.displayReactions ? true : j !== 0) &&
        c.props?.id ? (c.props.id !== 'edit' && !idCheck.test(c.props.id)) : false) return true; else return false;
    });
  }

  return res;
};

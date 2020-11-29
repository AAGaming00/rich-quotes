const { React } = require('powercord/webpack');

const { Tooltip, Icon } = require('powercord/components');

module.exports = function (props) {
  return (
    <Tooltip className='rq-tooltip' position="left" text={props.tooltip}>
      <div className={`rq-button ${props.classes.map(c=>`rq-${c}`).join(' ')}${
        props.function ? ' rq-clickable' : ''}`} onClick={props.function}>
        {props.icon ? <Icon name={props.icon}/> : props.children}
      </div></Tooltip>
  );
};

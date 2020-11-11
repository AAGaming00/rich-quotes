const { React } = require('powercord/webpack');

const { Tooltip, Icon } = require('powercord/components');

module.exports = class RichQuoteButton extends React.Component {
   render() { return (
      <Tooltip className='rq-tooltip' position="left" text={this.props.tooltip}>
      <div className={`rq-button ${this.props.classes.map(c=>`rq-${c}`).join(' ')}${
         this.props.function ? ' rq-clickable' : ''}`} onClick={this.props.function}>
         {this.props.icon ? <Icon name={this.props.icon}/> : this.props.children}
      </div></Tooltip>
   )}
}
const { React } = require('powercord/webpack');

const { FormTitle } = require('powercord/components');
const { SwitchItem, ButtonItem } = require('powercord/components/settings');
const { Button } = require('powercord/components');

const QuotesPreview = require('./Preview')

const settingStrings = {
  displayChannel: ['Display Channel', 'When disabled channel will instead be displayed in info.'],
  displayTimestamp: ['Display Timestamps', 'When disabled timestamps will instead be displayed in info'],
  cacheSearch: ['Cache quote searches','When disabled quote search will no longer cache results.'],
  partialQuotes: ['Partial Quotes','When disabled full messages will display on cached quotes.'],
  clearCache: ['Clear Cache','When disabled quote search will no longer cache results.']
}

module.exports = class Settings extends React.Component {
  constructor(props) {
    super(props)
    this.state = {reload: false}
  }
  toggleSetting (setting) {
    const { getSetting, toggleSetting } = this.props;
    toggleSetting(setting)
    this.setState({...this.state, reload: Date.now().toString()})
  }

  render () {
    const { getSetting } = this.props;


    return (
      <div>
        <FormTitle>Preview</FormTitle>
        
        <QuotesPreview key={this.state.reload} {...this.props}/>
        

        <FormTitle className='rq-settingsHeader'>Display</FormTitle>

        <SwitchItem note={settingStrings.displayChannel[1]}
          value={getSetting('displayChannel', true)}
          onChange={() => this.toggleSetting('displayChannel')}
        >{settingStrings.displayChannel[0]}</SwitchItem>

        <SwitchItem note={settingStrings.displayTimestamp[1]}
          value={getSetting('displayTimestamp', true)}
          onChange={() => this.toggleSetting('displayTimestamp')}
        >{settingStrings.displayTimestamp[0]}</SwitchItem>


        <FormTitle className='rq-settingsHeader'>Caching</FormTitle>

        <SwitchItem note={settingStrings.cacheSearch[1]}
          value={getSetting('cacheSearch', true)}
          onChange={() => this.toggleSetting('cacheSearch')}
        >{settingStrings.cacheSearch[0]}</SwitchItem>

        {/*<SwitchItem note={settingStrings.partialQuotes[1]}
          value={getSetting('partialQuotes', true)}
          onChange={() => this.toggleSetting('partialQuotes')}
        >{settingStrings.partialQuotes[0]}</SwitchItem>*/}

        <ButtonItem
          onClick={() => window.localStorage.removeItem('richQuoteCache')}
          note="Completely clear search result cache."
          button="Clear Cache" color={Button.Colors.RED}
        ></ButtonItem>
      </div>
    );
  }
};

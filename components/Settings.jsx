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
  render () {
    const { getSetting, toggleSetting } = this.props;

    // @todo Have preview reload on display changes
    return (
      <div>
        <FormTitle tag='h3'>Preview</FormTitle>
        
        <QuotesPreview {...this.props}/>
        <p className="rq-settingsNote">(Switch settings pages to view display changes)</p>
        

        <FormTitle className='rq-settingsHeader' tag='h3'>Display</FormTitle>

        <SwitchItem note={settingStrings.displayChannel[1]}
          value={getSetting('displayChannel', true)}
          onChange={() => toggleSetting('displayChannel')}
        >{settingStrings.displayChannel[0]}</SwitchItem>

        <SwitchItem note={settingStrings.displayTimestamp[1]}
          value={getSetting('displayTimestamp', true)}
          onChange={() => toggleSetting('displayTimestamp')}
        >{settingStrings.displayTimestamp[0]}</SwitchItem>


        <FormTitle className='rq-settingsHeader' tag='h3'>Caching</FormTitle>

        <SwitchItem note={settingStrings.cacheSearch[1]}
          value={getSetting('cacheSearch', true)}
          onChange={() => toggleSetting('cacheSearch')}
        >{settingStrings.cacheSearch[0]}</SwitchItem>

        {/*<SwitchItem note={settingStrings.partialQuotes[1]}
          value={getSetting('partialQuotes', true)}
          onChange={() => toggleSetting('partialQuotes')}
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

const { React } = require('powercord/webpack');

const { FormTitle } = require('powercord/components');
const { SwitchItem, ButtonItem, Category } = require('powercord/components/settings');
const { Button } = require('powercord/components');

const QuotesPreview = require('./Preview')

const settingStrings = {
  displayChannel: ['Display Channel', 'When disabled channel will instead be displayed in info.'],
  displayTimestamp: ['Display Timestamps', 'When disabled timestamps will instead be displayed in info.'],
  displayNickname: ['Display Nickname', 'When disabled will always show actual username.'],
  displayReactions: ['Display Reactions', 'When disabled will not display reactions.'],
  cullBotQuotes: ['Cull Bot Quotes', 'Removes embeds from bot messages that have an error-free linked quote.'],

  displayEmbeds: ['Display Embeds', 'When disabled will not display images/videos/etc.'],

  embedImages: ['Embed Images', 'When disabled will not display images.'],
  embedVideos: ['Embed Videos', 'When disabled will not display regular videos.'],
  embedYouTube: ['Embed YouTube', 'When disabled will not display special external vidoes like YouTube.'],
  embedAudio: ['Embed Audio', 'When disabled will not display attached audio files.'],
  embedFile: ['Embed Files', 'When disabled will not display attached misc. files.'],
  //embedSpecial: ['Embed Special', 'When disabled will not display special embeds eg. Sketchfab.'],
  embedOther: ['Embed Other', 'When disabled will not display misc. embeds eg. github repo description.'],

  cacheSearch: ['Cache quote searches', 'When disabled quote search will no longer cache results.'],
  partialQuotes: ['Partial Quotes', 'When disabled full messages will display on cached quotes.'],
  clearCache: ['Clear Cache', 'When disabled quote search will no longer cache results.']
}

const embedSettings = ['embedImages', 'embedVideos', 'embedYouTube', 'embedAudio', 'embedFile',/* 'embedSpecial',*/ 'embedOther'];

module.exports = class Settings extends React.Component {
  constructor(props) {
    super(props); this.state = {reload: false, categoryOpened: false};
  }

  toggleSetting (setting, defaultOption) {
    const { getSetting } = this.props;
    this.props.toggleSetting(setting, defaultOption);
    this.setState({...this.state, reload: Date.now().toString()});

    let embedAll = true;
    
    embedSettings.forEach((type) => { if (getSetting(type) === false) embedAll = false; });

    if (getSetting('embedAll') !== embedAll) this.props.toggleSetting('embedAll', defaultOption);

  }

  componentDidMount () {
    this.componentDidUpdate()
  }

  componentDidUpdate () {
    setTimeout(() => document.getElementById('owo-6').scrollIntoViewIfNeeded(), 100);
  }

  render () {
    const { getSetting } = this.props;

    const displaySettings = ['displayChannel', 'displayTimestamp', 'displayNickname', 'displayReactions', 'cullBotQuotes', 'displayEmbeds'];

    return (
      <div>
        <FormTitle>Preview</FormTitle>

        <QuotesPreview key={this.state.reload} {...this.props}/>


        <FormTitle className='rq-settingsHeader'>Display</FormTitle>

        {displaySettings.map((setting, i) =>
          <SwitchItem key={i} note={settingStrings[setting][1]}
            value={getSetting(setting, true)}
            onChange={() => this.toggleSetting(setting, true)}
          >{settingStrings[setting][0]}</SwitchItem>
        )}

        <Category name='Embed Types' description='Individual toggles for all embed types.' 
          opened={this.state.categoryOpened} onChange={() => this.setState({ categoryOpened: !this.state.categoryOpened })}>
          {embedSettings.map((setting, i) =>
            <SwitchItem key={i} note={settingStrings[setting][1]}
              value={getSetting(setting, true)}
              onChange={() => this.toggleSetting(setting, true)}
            >{settingStrings[setting][0]}</SwitchItem>
          )}
        </Category>

        <FormTitle className='rq-settingsHeader'>Caching</FormTitle>

        <SwitchItem note={settingStrings.cacheSearch[1]}
          value={getSetting('cacheSearch', true)}
          onChange={() => this.props.toggleSetting('cacheSearch', true)}
        >{settingStrings.cacheSearch[0]}</SwitchItem>

        {/*<SwitchItem note={settingStrings.partialQuotes[1]}
          value={getSetting('partialQuotes', true)}
          onChange={() => this.toggleSetting('partialQuotes', true)}
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

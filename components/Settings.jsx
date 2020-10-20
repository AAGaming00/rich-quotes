const { React } = require('powercord/webpack');

const { FormTitle } = require('powercord/components');
const { SwitchItem, ButtonItem } = require('powercord/components/settings');
const { Button } = require('powercord/components');

const QuotesPreview = require('./Preview')

const settingStrings = {
  displayChannel: ['Display Channel', 'When disabled channel will instead be displayed in info.'],
  displayTimestamp: ['Display Timestamps', 'When disabled timestamps will instead be displayed in info.'],
  displayNickname: ['Display Nickname', 'When disabled will always show actual username.'],
  
  displayEmbeds: ['Display Embeds', 'When disabled will not display images/videos/etc.\nCurrently broken and can cause crashes.'],

  embedImages: ['Embed Images', 'When disabled will not display images.'],
  embedVideos: ['Embed Videos', 'When disabled will not display regular videos.'],
  embedYouTube: ['Embed YouTube', 'When disabled will not display special external vidoes like YouTube.'],
  embedAudio: ['Embed Audio', 'When disabled will not display attached audio files.'],
  embedFile: ['Embed Files', 'When disabled will not display attached misc. files.'],
  //embedSpecial: ['Embed Special', 'When disabled will not display special embeds eg. Sketchfab.'],
  embedOther: ['Embed Other', 'When disabled will not display misc. embeds eg. github repo description.'],

  cacheSearch: ['Cache quote searches','When disabled quote search will no longer cache results.'],
  partialQuotes: ['Partial Quotes','When disabled full messages will display on cached quotes.'],
  clearCache: ['Clear Cache','When disabled quote search will no longer cache results.']
}

module.exports = class Settings extends React.Component {
  constructor(props) {
    super(props)
    this.state = {reload: false}
  }
  toggleSetting (setting, defaultOption) {
    const { getSetting } = this.props;
    this.props.toggleSetting(setting, defaultOption);
    this.setState({...this.state, reload: Date.now().toString()});

    const embedDisplays = [ 'embedImages', 'embedVideos', 'embedYouTube', 'embedAudio', 'embedFile', 'embedSpecial', 'embedOther' ]

    let embedAll = true;
    
    embedDisplays.forEach((type) => { if (getSetting(type) === false) embedAll = false; });

    if (getSetting('embedAll') !== embedAll) this.props.toggleSetting('embedAll', defaultOption);

  }

  componentDidMount () {
    this.componentDidUpdate()
  }

  componentDidUpdate () {
    setTimeout(() => document.getElementById('uwu-6').scrollIntoViewIfNeeded(), 100);
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
          onChange={() => this.toggleSetting('displayChannel', true)}
        >{settingStrings.displayChannel[0]}</SwitchItem>

        <SwitchItem note={settingStrings.displayTimestamp[1]}
          value={getSetting('displayTimestamp', true)}
          onChange={() => this.toggleSetting('displayTimestamp', true)}
        >{settingStrings.displayTimestamp[0]}</SwitchItem>

        <SwitchItem note={settingStrings.displayNickname[1]}
          value={getSetting('displayNickname', true)}
          onChange={() => this.toggleSetting('displayNickname', true)}
        >{settingStrings.displayNickname[0]}</SwitchItem>


        <SwitchItem note={settingStrings.displayEmbeds[1]}
          value={getSetting('displayEmbeds', false)}
          onChange={() => this.toggleSetting('displayEmbeds', false)}
        >{settingStrings.displayEmbeds[0]}</SwitchItem>

        <SwitchItem note={settingStrings.embedImages[1]}
          value={getSetting('embedImages', true)}
          onChange={() => this.toggleSetting('embedImages', true)}
        >{settingStrings.embedImages[0]}</SwitchItem>

        <SwitchItem note={settingStrings.embedVideos[1]}
          value={getSetting('embedVideos', true)}
          onChange={() => this.toggleSetting('embedVideos', true)}
        >{settingStrings.embedVideos[0]}</SwitchItem>

        <SwitchItem note={settingStrings.embedYouTube[1]}
          value={getSetting('embedYouTube', true)}
          onChange={() => this.toggleSetting('embedYouTube', true)}
        >{settingStrings.embedYouTube[0]}</SwitchItem>

        <SwitchItem note={settingStrings.embedAudio[1]}
          value={getSetting('embedAudio', true)}
          onChange={() => this.toggleSetting('embedAudio', true)}
        >{settingStrings.embedAudio[0]}</SwitchItem>

        <SwitchItem note={settingStrings.embedFile[1]}
          value={getSetting('embedFile', true)}
          onChange={() => this.toggleSetting('embedFile', true)}
        >{settingStrings.embedFile[0]}</SwitchItem>

        {/*<SwitchItem note={settingStrings.embedSpecial[1]}
          value={getSetting('embedSpecial', true)}
          onChange={() => this.toggleSetting('embedSpecial', true)}
        >{settingStrings.embedSpecial[0]}</SwitchItem>*/}

        <SwitchItem note={settingStrings.embedOther[1]}
          value={getSetting('embedOther', true)}
          onChange={() => this.toggleSetting('embedOther', true)}
        >{settingStrings.embedOther[0]}</SwitchItem>
        


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

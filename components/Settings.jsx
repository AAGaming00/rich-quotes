const { React } = require('powercord/webpack');

const { FormTitle } = require('powercord/components');
const { Category, SwitchItem, RadioGroup, SliderInput, ButtonItem } = require('powercord/components/settings');
const buttonColors = require('powercord/components').Button.Colors;

const ChannelPreview = require('./child/ChannelPreview');

let previewChildren = false;

const settings = require('../utils/settings.js');

const embedTypes = Object.entries(settings.list).slice(settings.embeds[0], settings.embeds[0] + settings.embeds[1]);

module.exports = class Settings extends React.Component {
  constructor(props) {
    super(props); this.state = { reload: false, masterCategoryOpened: false, extraCategoryOpened: false };
  }


  toggleDisplay (setting, defaultOption) {
    const { toggleSetting } = this.props;

    toggleSetting(setting, defaultOption);
    this.state.reload = Date.now().toString();
  }

  toggleEmbed (setting, defaultOption) {
    const { getSetting, toggleSetting } = this.props;

    toggleSetting(setting, defaultOption);

    let embedAll = true;

    embedTypes.forEach(([type]) => { if (getSetting(type) === false) embedAll = false; });

    if (getSetting('embedAll') !== embedAll) toggleSetting('embedAll', defaultOption);
  }

  render () {
    const { getSetting, toggleSetting, updateSetting } = this.props;

    const display = Object.entries(settings.list).slice(settings.display[0], settings.display[1]);

    const replyStrings = Object.entries(settings.list.replyMode.strings);

    return (
      <div>
        <FormTitle>Preview (broken, bug AA)</FormTitle>

        {/*<ChannelPreview reload={this.state.reload}/>*/}

        <FormTitle className='rq-settingsHeader'>Display</FormTitle>

        {display.map(([ key, setting ], i) =>
          <SwitchItem key={i} note={setting.strings[1]}
            value={getSetting(key, setting.fallback)}
            onChange={() => this.toggleDisplay(key, setting.fallback)}
          >{setting.strings[0]}</SwitchItem>
        )}

        <Category name='Embed Types' description='Individual toggles for all embed types.' 
          opened={this.state.masterCategoryOpened} onChange={() => this.setState({ masterCategoryOpened: !this.state.masterCategoryOpened })}>
          {embedTypes.map(([ key, setting ], i) =>
            <SwitchItem key={i} note={setting.strings[1]}
              value={getSetting(key, setting.fallback)}
              onChange={() => this.toggleEmbed(key, setting.fallback)}
            >{setting.strings[0]}</SwitchItem>
          )}
        </Category>

        <SliderInput
          note={settings.list.nestedQuotes.strings[1]}
          initialValue={ getSetting('nestedQuotes', 3) }
          minValue={ 0 } maxValue={ 6 }
          markers={[ 0, 1, 2, 3, 4, 5, 6 ]}
          stickToMarkers={true}
          onValueChange={ v => updateSetting('nestedQuotes', v) }
        >{settings.list.nestedQuotes.strings[0]}</SliderInput>

        <SwitchItem note={settings.list.cullQuoteCommands.strings[1]}
          value={getSetting('cullQuoteCommands', true)}
          onChange={() => toggleSetting('cullQuoteCommands', true)}
        >{settings.list.cullQuoteCommands.strings[0]}</SwitchItem>

        <SwitchItem note={settings.list.cullBotQuotes.strings[1]}
          value={getSetting('cullBotQuotes', true)}
          onChange={() => toggleSetting('cullBotQuotes', true)}
        >{settings.list.cullBotQuotes.strings[0]}</SwitchItem>


        <FormTitle className='rq-settingsHeader'>Replies</FormTitle>

        <SwitchItem note={settings.list.replyReplace.strings[1]}
          value={getSetting('replyReplace', true)}
          onChange={() => toggleSetting('replyReplace', true)}
        >{settings.list.replyReplace.strings[0]}</SwitchItem>

        <RadioGroup
          note={replyStrings[0][1]}
          value={getSetting('replyMode', 0)}
          onChange={s => updateSetting('replyMode', s.value)}
          options={replyStrings.slice(1).map(([name, desc], i) => ({
            name, desc, value: i
          }))}
        >{replyStrings[0][0]}</RadioGroup>

        <Category name='Reply Display' description='More fine tuned settings for Replies.' 
          opened={this.state.extraCategoryOpened} onChange={() => this.setState({ extraCategoryOpened: !this.state.extraCategoryOpened })}>
          <SwitchItem note={settings.list.displayMoreBtn.strings[1]}
            value={getSetting('reply_displayMoreBtn', true)}
            onChange={() => toggleSetting('reply_displayMoreBtn', true)}
          >{settings.list.displayMoreBtn.strings[0]}</SwitchItem>

          <SwitchItem note={settings.list.displayEmbeds.strings[1]}
            value={getSetting('reply_displayEmbeds', true)}
            onChange={() => toggleSetting('reply_displayEmbeds', true)}
          >{settings.list.displayEmbeds.strings[0]}</SwitchItem>
        </Category>

        <FormTitle className='rq-settingsHeader'>Caching</FormTitle>

        <SwitchItem note={settings.list.cacheSearch.strings[1]}
          value={getSetting('cacheSearch', true)}
          onChange={() => toggleSetting('cacheSearch', true)}
        >{settings.list.cacheSearch.strings[0]}</SwitchItem>

        {/*<SwitchItem note={settingStrings.partialQuotes[1]}
          value={getSetting('partialQuotes', true)}
          onChange={() => this.toggleSetting('partialQuotes', true)}
        >{settingStrings.partialQuotes[0]}</SwitchItem>*/}

        <ButtonItem
          onClick={() => window.localStorage.removeItem('richQuoteCache')}
          note='Completely clear search result cache.'
          button='Clear Cache' color={buttonColors.RED}
        ></ButtonItem>
      </div>
    );
  }
};

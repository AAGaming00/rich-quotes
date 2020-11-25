const { React } = require('powercord/webpack');

const { FormTitle } = require('powercord/components');
const { Category, SwitchItem, RadioGroup, SliderInput, ButtonItem } = require('powercord/components/settings');
const buttonColors = require('powercord/components').Button.Colors;

const ChannelPreview = require('./child/ChannelPreview')

const { settings } = require('./../utils/vars.js');

module.exports = class Settings extends React.Component {
  constructor(props) {
    super(props); this.state = { reload: false, categoryOpened: false };
  }

  toggleDisplay (setting, defaultOption) {
    const { getSetting, toggleSetting } = this.props;
    toggleSetting(setting, defaultOption);
    this.setState({...this.state, reload: Date.now().toString()});

    let embedAll = true;

    Object.entries(settings.list).slice(settings.embeds[0], settings.embeds[1] + 1).forEach(([type]) => { if (getSetting(type) === false) embedAll = false; });

    if (getSetting('embedAll') !== embedAll) this.props.toggleSetting('embedAll', defaultOption);

  }

  componentDidMount () { this.componentDidUpdate() }

  componentDidUpdate () {
    // @todo Switch preview jump to a ref
    setTimeout(() => document.getElementById('owo-6').scrollIntoViewIfNeeded(), 100)
  }

  render () {
    const { getSetting, toggleSetting, updateSetting } = this.props;

    const embedTypes = Object.entries(settings.list).slice(settings.embeds[0], settings.embeds[0] + settings.embeds[1]);

    const replyStrings = Object.entries(settings.list.replyMode.strings);

    return (
      <div>
        <FormTitle>Preview</FormTitle>

        <ChannelPreview key={this.state.reload} {...this.props}/>


        <FormTitle className='rq-settingsHeader'>Display</FormTitle>

        {Object.entries(settings.list).slice(settings.display[0], settings.display[1] + 1).map(([ key, setting ], i) =>
          <SwitchItem key={i} note={setting.strings[1]}
            value={getSetting(key, setting.fallback)}
            onChange={() => toggleSetting(key, setting.fallback)}
          >{setting.strings[0]}</SwitchItem>
        )}

        <Category name='Embed Types' description='Individual toggles for all embed types.' 
          opened={this.state.categoryOpened} onChange={() => this.setState({ categoryOpened: !this.state.categoryOpened })}>
          {embedTypes.map(([ key, setting ], i) =>
            <SwitchItem key={i} note={setting.strings[1]}
              value={getSetting(key, setting.fallback)}
              onChange={() => this.toggleSetting(key, setting.fallback)}
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

        <SwitchItem note={settings.list.replyReplace.strings[1]}
          value={getSetting('replyReplace', true)}
          onChange={() => this.props.toggleSetting('replyReplace', true)}
        >{settings.list.replyReplace.strings[0]}</SwitchItem>

        <RadioGroup
          note={replyStrings[0][1]}
          value={getSetting('replyMode', 0)}
          onChange={s => updateSetting('displayMode', s.value)}
          options={replyStrings.slice(1).map(([name, desc], i) => ({
            name, desc, value: i
          }))}
        >{replyStrings[0][0]}</RadioGroup>

        <SwitchItem note={settings.list.cullBotQuotes.strings[1]}
          value={getSetting('cullBotQuotes', true)}
          onChange={() => this.props.toggleSetting('cullBotQuotes', true)}
        >{settings.list.cullBotQuotes.strings[0]}</SwitchItem>

        <FormTitle className='rq-settingsHeader'>Caching</FormTitle>

        <SwitchItem note={settings.list.cacheSearch.strings[1]}
          value={getSetting('cacheSearch', true)}
          onChange={() => this.props.toggleSetting('cacheSearch', true)}
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

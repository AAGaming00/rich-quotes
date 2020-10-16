const { React } = require("powercord/webpack");

const { SwitchItem, ButtonItem } = require("powercord/components/settings");
const { Button } = require("powercord/components");

module.exports = class Settings extends React.Component {
    async render() {
        const { getSetting, toggleSetting } = this.props;

        return (
            <div>
                {quote_preview}
                <SwitchItem
                    note="When disabled quote search will no longer cache results."
                    value={getSetting("cacheSearch", true)}
                    onChange={() => toggleSetting("cacheSearch")}
                >
                Cache quote searches
                </SwitchItem>
                {/*<SwitchItem
                    note="When disabled full messages will display on cached quotes."
                    value={getSetting("partialQuotes", true)}
                    onChange={() => toggleSetting("partialQuotes")}
                >
                Partial Quotes
                </SwitchItem>*/}
                <ButtonItem
                    onClick={() => window.localStorage.removeItem("richQuoteCache")}
                    note="Completely clear search result cache."
                    button="Clear Cache" color={Button.Colors.RED}
                ></ButtonItem>
            </div>
        );
    }
};
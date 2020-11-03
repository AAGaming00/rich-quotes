const { React } = require('powercord/webpack');
const Text = require('powercord/components')
// Use Memo here because it doesnt need props since its a preloader lol
module.exports = (() => {
return <Text>preloader yes</Text>
});

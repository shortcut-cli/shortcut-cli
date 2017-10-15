const Clubhouse = require('clubhouse-lib');
const configure = require('./configure.js');
const config = configure.loadConfig();

if (!config) {
    console.error('Please run install to configure API access');
    process.exit(1);
}

module.exports = Clubhouse.create(config.token);

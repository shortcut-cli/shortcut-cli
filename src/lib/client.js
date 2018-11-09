const Clubhouse = require('clubhouse-lib');
const config = require('./configure.js').loadConfig();

if (!config) {
    console.error('Please run install to configure API access');
    process.exit(1);
}

module.exports = Clubhouse.create(config.token);

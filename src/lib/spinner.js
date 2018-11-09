const Spinner = require('cli-spinner').Spinner;
const spinner = (text) => {
    return new Spinner({
        text: text ? text : 'Loading... %s ',
        stream: process.stderr
    });
};

module.exports = spinner;

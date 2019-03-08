const Spinner = require('cli-spinner').Spinner;
const spinner = text => {
    const spin = new Spinner({
        text: text ? text : 'Loading... %s ',
        stream: process.stderr,
    });
    spin.setSpinnerString(27);
    return spin;
};

module.exports = spinner;

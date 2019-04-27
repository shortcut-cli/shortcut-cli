import { Spinner } from 'cli-spinner';

const spinner = (text: string = '') => {
    const spin = new Spinner({
        text: text ? text : 'Loading... %s ',
        stream: process.stderr,
    });
    spin.setSpinnerString(27);
    return spin;
};

export default spinner;

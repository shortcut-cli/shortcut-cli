const path = require('path');
const fs = require('fs');
const os = require('os');
const pkg = require('../../package');
const configFile = path.resolve(os.homedir(), '.' + pkg.name, 'config.json');

const loadConfig = () => {
    if (fs.existsSync(configFile)) {
        try {
            return JSON.parse(fs.readFileSync(configFile, 'utf8'));
        } catch (e) {
            console.error(e);
            return false;
        }
    }
    return false;
};

const saveConfig = (opt) => {
    const dir = path.dirname(configFile);
    try {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir);
        }
        fs.writeFileSync(configFile, JSON.stringify(opt), { flag: 'w' });
        return true;
    } catch (e) {
        console.error(e);
        return false;
    }
};

const saveWorkspace = (name, workspace) => {
    const extant = loadConfig();
    let workspaces = extant.workspaces || {};
    workspaces[name] = workspace;
    return saveConfig(Object.assign({}, extant, {
        workspaces
    }));
}

const removeWorkspace = (name) => {
    const extant = loadConfig();
    delete extant.workspaces[name];
    return saveConfig(Object.assign({}, extant));
}

module.exports = {
    loadConfig,
    saveConfig,
    saveWorkspace,
    removeWorkspace,
};

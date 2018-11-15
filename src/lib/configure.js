const path = require('path');
const fs = require('fs');
const os = require('os');
const pkg = require('../../package');
const configFile = path.resolve(os.homedir(), '.' + pkg.name, 'config.json');

const loadConfig = () => {
    const envToken = process.env.CLUBHOUSE_API_TOKEN;
    if (fs.existsSync(configFile)) {
        try {
            const config = JSON.parse(fs.readFileSync(configFile, 'utf8'));
            if (envToken) {
                return Object.assign({}, config, { token: envToken });
            }
            return config;
        } catch (e) {
            console.error(e);
            return false;
        }
    }
    if (envToken) {
        return { token: envToken };
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

const updateConfig = (opt) => {
    const extant = loadConfig() || {};
    return saveConfig(Object.assign({}, extant, opt));
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
};

module.exports = {
    loadConfig,
    saveConfig,
    updateConfig,
    saveWorkspace,
    removeWorkspace,
};

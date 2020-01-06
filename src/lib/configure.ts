import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';

const configDir =
    process.env.XDG_CONFIG_HOME ||
    path.resolve(process.env.XDG_DATA_HOME || os.homedir(), '.config', 'clubhouse-cli');

const configFile = path.resolve(configDir, 'config.json');
const legacyConfigDir = path.resolve(os.homedir(), '.clubhouse-cli');

export const loadConfig = () => {
    const envToken = process.env.CLUBHOUSE_API_TOKEN;
    if (fs.existsSync(legacyConfigDir)) {
        createConfigDir();
        fs.renameSync(legacyConfigDir, configDir);
    }
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

const createConfigDir = () => {
    const dir = path.dirname(configDir);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
    }
    if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir);
    }
};

const saveConfig = (opt: any) => {
    try {
        createConfigDir();
        fs.writeFileSync(configFile, JSON.stringify(opt), { flag: 'w' });
        return true;
    } catch (e) {
        console.error(e);
        return false;
    }
};

const updateConfig = (opt: any) => {
    const extant = loadConfig() || {};
    return saveConfig(Object.assign({}, extant, opt));
};

const saveWorkspace = (name: string, workspace: any) => {
    const extant = loadConfig();
    let workspaces = extant.workspaces || {};
    workspaces[name] = workspace;
    return saveConfig(
        Object.assign({}, extant, {
            workspaces,
        })
    );
};

const removeWorkspace = (name: string) => {
    const extant = loadConfig();
    delete extant.workspaces[name];
    return saveConfig(Object.assign({}, extant));
};

export default {
    loadConfig,
    updateConfig,
    saveWorkspace,
    removeWorkspace,
};

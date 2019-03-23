import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';

//TODO: Move to XDG_CONFIG
const configFile = path.resolve(os.homedir(), '.clubhouse-cli', 'config.json');

export const loadConfig = () => {
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

const saveConfig = (opt: any) => {
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

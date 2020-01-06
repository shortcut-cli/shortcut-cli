import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';

//TODO: Move to XDG_CONFIG
const configFile = path.resolve(os.homedir(), '.clubhouse-cli', 'config.json');

export interface Config {
    mentionName: string;

    // Clubhouse workspace
    // https://help.clubhouse.io/hc/en-us/sections/360000212786-Organizations-and-Workspaces.
    workspaceName: string;

    token: string;

    // Object used by club workspace. Unrelated to the clubhouse concept of workspace.
    workspaces: { [key: string]: object };
}

export const loadConfig: () => Config = () => {
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
            return {};
        }
    }
    if (envToken) {
        return { token: envToken };
    }
    return {};
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

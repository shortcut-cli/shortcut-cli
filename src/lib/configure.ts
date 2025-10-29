import path from 'path';
import fs from 'fs';
import os from 'os';

function getConfigDir(suffix: string) {
    const configBaseDir =
        process.env.XDG_CONFIG_HOME ||
        path.resolve(process.env.XDG_DATA_HOME || os.homedir(), '.config');
    return path.resolve(configBaseDir, suffix);
}

const configDir = getConfigDir('shortcut-cli');

const configFile = path.resolve(configDir, 'config.json');

const legacyConfigDirs = [
    getConfigDir('clubhouse-cli'),
    path.resolve(os.homedir(), '.clubhouse-cli'),
];

export interface Config {
    mentionName: string;
    urlSlug: string;
    token: string;
    // Object used by short workspace.
    // This is unrelated to the concept of Shortcut Workspaces.
    workspaces: { [key: string]: object };
}

let CONFIG_CACHE = null as Config;

/**
 * Config load function to be used in most-cases.
 */
export const loadConfig: () => Config = () => {
    const config = loadCachedConfig();

    if (!config || config === ({} as Config) || !config.token) {
        console.error("Please run 'short install' to configure Shortcut API access or set SHORTCUT_API_TOKEN.");
        process.exit(11);
    }

    const envUrlSlug = process.env.SHORTCUT_URL_SLUG || process.env.CLUBHOUSE_URL_SLUG;
    if (!config.urlSlug && envUrlSlug) {
        config.urlSlug = envUrlSlug;
    }

    const envMentionName = process.env.SHORTCUT_MENTION_NAME || process.env.CLUBHOUSE_MENTION_NAME;
    if (!config.mentionName && envMentionName) {
        config.mentionName = envMentionName;
    }

    if (!config.urlSlug) {
        console.warn(
            "shortcut-cli: URL slug not configured. Set SHORTCUT_URL_SLUG or run 'short install --refresh' for full functionality."
        );
        config.urlSlug = '';
    }

    if (!config.mentionName) {
        console.warn(
            "shortcut-cli: Mention name not configured. Set SHORTCUT_MENTION_NAME or run 'short install --refresh' for full functionality."
        );
        config.mentionName = '';
    }

    if (!config.workspaces) {
        config.workspaces = {};
    }

    CONFIG_CACHE = { ...config };

    return config;
};

/**
 * Only use this function directly if you need to avoid the config check.
 */
export const loadCachedConfig: () => Config = () => {
    if (CONFIG_CACHE) {
        return { ...CONFIG_CACHE };
    }
    let config = {} as Config;
    const token = process.env.SHORTCUT_API_TOKEN || process.env.CLUBHOUSE_API_TOKEN;
    legacyConfigDirs.forEach((dir) => {
        if (fs.existsSync(dir)) {
            createConfigDir();
            fs.renameSync(dir, configDir);
        }
    });
    if (fs.existsSync(configFile)) {
        try {
            config = JSON.parse(fs.readFileSync(configFile, 'utf8'));
        } catch (e) {
            console.error(e);
            process.exit(10);
        }
    }
    if (token) {
        config = { ...config, token };
    }
    if (!config.workspaces) {
        config.workspaces = {};
    }
    CONFIG_CACHE = { ...config };
    return config;
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

const saveConfig = (config: Config) => {
    try {
        createConfigDir();
        fs.writeFileSync(configFile, JSON.stringify(config), { flag: 'w' });
        CONFIG_CACHE = { ...config };
        return true;
    } catch (e) {
        console.error(e);
        return false;
    }
};

export const updateConfig = (newConfig: Config) => {
    const extantConfig = loadCachedConfig() || {};
    return saveConfig({ ...newConfig, ...extantConfig });
};

const saveWorkspace = (name: string, workspace: any) => {
    const extantConfig = loadCachedConfig();
    const workspaces = extantConfig.workspaces || {};
    workspaces[name] = workspace;
    return saveConfig({ workspaces, ...extantConfig });
};

const removeWorkspace = (name: string) => {
    const extant = loadCachedConfig();
    delete extant.workspaces[name];
    return saveConfig(Object.assign({}, extant));
};

export default {
    loadConfig,
    updateConfig,
    saveWorkspace,
    removeWorkspace,
};

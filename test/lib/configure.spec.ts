import fs from 'fs';
import os from 'os';
import path from 'path';

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('configure', () => {
    let tmpDir: string;
    let origEnv: NodeJS.ProcessEnv;

    beforeEach(() => {
        // Create an isolated temp directory for each test
        tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'shortcut-cli-test-'));
        origEnv = { ...process.env };

        // Point config resolution at our temp dir
        process.env.XDG_CONFIG_HOME = tmpDir;

        // Reset module cache so CONFIG_CACHE is cleared and configDir is recalculated
        vi.resetModules();
    });

    afterEach(() => {
        process.env = origEnv;
        // Clean up temp dir
        fs.rmSync(tmpDir, { recursive: true, force: true });
    });

    async function importConfigure() {
        const mod = await import('../../src/lib/configure');
        return mod;
    }

    describe('loadConfig', () => {
        it('returns config with token from env', async () => {
            process.env.SHORTCUT_API_TOKEN = 'my-test-token';
            process.env.SHORTCUT_URL_SLUG = 'test-workspace';
            process.env.SHORTCUT_MENTION_NAME = 'test-user';

            const { loadConfig } = await importConfigure();
            const config = loadConfig();

            expect(config.token).toBe('my-test-token');
            expect(config.urlSlug).toBe('test-workspace');
            expect(config.mentionName).toBe('test-user');
            expect(config.workspaces).toEqual({});
        });

        it('calls process.exit(11) when no token is available', async () => {
            delete process.env.SHORTCUT_API_TOKEN;
            delete process.env.CLUBHOUSE_API_TOKEN;

            const exitSpy = vi.spyOn(process, 'exit').mockImplementation(((code?: number) => {
                throw new Error(`process.exit(${code})`);
            }) as () => never);

            const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

            const { loadConfig } = await importConfigure();

            expect(() => loadConfig()).toThrow('process.exit(11)');
            expect(exitSpy).toHaveBeenCalledWith(11);

            exitSpy.mockRestore();
            consoleErrorSpy.mockRestore();
        });

        it('fills urlSlug from SHORTCUT_URL_SLUG env var', async () => {
            process.env.SHORTCUT_API_TOKEN = 'my-token';
            process.env.SHORTCUT_URL_SLUG = 'my-slug';
            process.env.SHORTCUT_MENTION_NAME = 'my-mention';

            const { loadConfig } = await importConfigure();
            const config = loadConfig();

            expect(config.urlSlug).toBe('my-slug');
        });

        it('fills mentionName from SHORTCUT_MENTION_NAME env var', async () => {
            process.env.SHORTCUT_API_TOKEN = 'my-token';
            process.env.SHORTCUT_URL_SLUG = 'my-slug';
            process.env.SHORTCUT_MENTION_NAME = 'my-mention';

            const { loadConfig } = await importConfigure();
            const config = loadConfig();

            expect(config.mentionName).toBe('my-mention');
        });

        it('fills urlSlug from CLUBHOUSE_URL_SLUG env var as fallback', async () => {
            process.env.SHORTCUT_API_TOKEN = 'my-token';
            delete process.env.SHORTCUT_URL_SLUG;
            process.env.CLUBHOUSE_URL_SLUG = 'clubhouse-slug';
            process.env.SHORTCUT_MENTION_NAME = 'my-mention';

            const { loadConfig } = await importConfigure();
            const config = loadConfig();

            expect(config.urlSlug).toBe('clubhouse-slug');
        });

        it('fills mentionName from CLUBHOUSE_MENTION_NAME env var as fallback', async () => {
            process.env.SHORTCUT_API_TOKEN = 'my-token';
            process.env.SHORTCUT_URL_SLUG = 'my-slug';
            delete process.env.SHORTCUT_MENTION_NAME;
            process.env.CLUBHOUSE_MENTION_NAME = 'clubhouse-mention';

            const { loadConfig } = await importConfigure();
            const config = loadConfig();

            expect(config.mentionName).toBe('clubhouse-mention');
        });

        it('warns when urlSlug is not configured and sets empty string', async () => {
            process.env.SHORTCUT_API_TOKEN = 'my-token';
            delete process.env.SHORTCUT_URL_SLUG;
            delete process.env.CLUBHOUSE_URL_SLUG;
            process.env.SHORTCUT_MENTION_NAME = 'my-mention';

            const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

            const { loadConfig } = await importConfigure();
            const config = loadConfig();

            expect(config.urlSlug).toBe('');
            expect(warnSpy).toHaveBeenCalledWith(
                expect.stringContaining('URL slug not configured')
            );

            warnSpy.mockRestore();
        });

        it('warns when mentionName is not configured and sets empty string', async () => {
            process.env.SHORTCUT_API_TOKEN = 'my-token';
            process.env.SHORTCUT_URL_SLUG = 'my-slug';
            delete process.env.SHORTCUT_MENTION_NAME;
            delete process.env.CLUBHOUSE_MENTION_NAME;

            const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

            const { loadConfig } = await importConfigure();
            const config = loadConfig();

            expect(config.mentionName).toBe('');
            expect(warnSpy).toHaveBeenCalledWith(
                expect.stringContaining('Mention name not configured')
            );

            warnSpy.mockRestore();
        });
    });

    describe('loadCachedConfig', () => {
        it('returns cached config on second call', async () => {
            process.env.SHORTCUT_API_TOKEN = 'my-token';
            process.env.SHORTCUT_URL_SLUG = 'my-slug';
            process.env.SHORTCUT_MENTION_NAME = 'my-mention';

            const { loadCachedConfig } = await importConfigure();

            const first = loadCachedConfig();
            const second = loadCachedConfig();

            expect(first).toEqual(second);
            expect(first.token).toBe('my-token');
        });

        it('reads config from config file', async () => {
            delete process.env.SHORTCUT_API_TOKEN;
            delete process.env.CLUBHOUSE_API_TOKEN;

            // Create the config file
            const configDir = path.join(tmpDir, 'shortcut-cli');
            fs.mkdirSync(configDir, { recursive: true });
            const configFile = path.join(configDir, 'config.json');
            fs.writeFileSync(
                configFile,
                JSON.stringify({ token: 'file-token', urlSlug: 'file-slug' })
            );

            const { loadCachedConfig } = await importConfigure();
            const config = loadCachedConfig();

            expect(config.token).toBe('file-token');
            expect(config.urlSlug).toBe('file-slug');
        });

        it('env token overrides file token', async () => {
            process.env.SHORTCUT_API_TOKEN = 'env-token';

            // Create the config file with a different token
            const configDir = path.join(tmpDir, 'shortcut-cli');
            fs.mkdirSync(configDir, { recursive: true });
            const configFile = path.join(configDir, 'config.json');
            fs.writeFileSync(
                configFile,
                JSON.stringify({ token: 'file-token', urlSlug: 'file-slug' })
            );

            const { loadCachedConfig } = await importConfigure();
            const config = loadCachedConfig();

            expect(config.token).toBe('env-token');
            expect(config.urlSlug).toBe('file-slug');
        });

        it('exits with code 10 on JSON parse error', async () => {
            delete process.env.SHORTCUT_API_TOKEN;
            delete process.env.CLUBHOUSE_API_TOKEN;

            // Write invalid JSON to config file
            const configDir = path.join(tmpDir, 'shortcut-cli');
            fs.mkdirSync(configDir, { recursive: true });
            const configFile = path.join(configDir, 'config.json');
            fs.writeFileSync(configFile, '{invalid json!!!');

            const exitSpy = vi.spyOn(process, 'exit').mockImplementation(((code?: number) => {
                throw new Error(`process.exit(${code})`);
            }) as () => never);
            const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

            const { loadCachedConfig } = await importConfigure();

            expect(() => loadCachedConfig()).toThrow('process.exit(10)');
            expect(exitSpy).toHaveBeenCalledWith(10);

            exitSpy.mockRestore();
            consoleErrorSpy.mockRestore();
        });

        it('initializes workspaces to empty object if not present', async () => {
            process.env.SHORTCUT_API_TOKEN = 'my-token';

            const { loadCachedConfig } = await importConfigure();
            const config = loadCachedConfig();

            expect(config.workspaces).toEqual({});
        });
    });

    describe('updateConfig', () => {
        it('saves merged config to file', async () => {
            process.env.SHORTCUT_API_TOKEN = 'my-token';
            process.env.SHORTCUT_URL_SLUG = 'my-slug';
            process.env.SHORTCUT_MENTION_NAME = 'my-mention';

            const { updateConfig } = await importConfigure();

            const result = updateConfig({ urlSlug: 'new-slug' });
            expect(result).toBe(true);

            // Verify the config file was written
            const configFile = path.join(tmpDir, 'shortcut-cli', 'config.json');
            expect(fs.existsSync(configFile)).toBe(true);

            const savedConfig = JSON.parse(fs.readFileSync(configFile, 'utf8'));
            expect(savedConfig.token).toBe('my-token');
            // Extant config takes precedence in the spread: { ...newConfig, ...extantConfig }
            // So the existing cached values remain
        });
    });

    describe('saveWorkspace / removeWorkspace', () => {
        it('adds a workspace', async () => {
            process.env.SHORTCUT_API_TOKEN = 'my-token';
            process.env.SHORTCUT_URL_SLUG = 'my-slug';
            process.env.SHORTCUT_MENTION_NAME = 'my-mention';

            const configure = (await importConfigure()).default;

            const result = configure.saveWorkspace('my-ws', { foo: 'bar' });
            expect(result).toBe(true);

            // Verify it was saved by reading the config file
            const configFile = path.join(tmpDir, 'shortcut-cli', 'config.json');
            const savedConfig = JSON.parse(fs.readFileSync(configFile, 'utf8'));
            expect(savedConfig.workspaces).toBeDefined();
            expect(savedConfig.workspaces['my-ws']).toEqual({ foo: 'bar' });
        });

        it('removes a workspace', async () => {
            process.env.SHORTCUT_API_TOKEN = 'my-token';
            process.env.SHORTCUT_URL_SLUG = 'my-slug';
            process.env.SHORTCUT_MENTION_NAME = 'my-mention';

            const configure = (await importConfigure()).default;

            // First add a workspace
            configure.saveWorkspace('ws-to-remove', { data: 123 });

            // Now remove it
            const result = configure.removeWorkspace('ws-to-remove');
            expect(result).toBe(true);

            // Verify it was removed
            const configFile = path.join(tmpDir, 'shortcut-cli', 'config.json');
            const savedConfig = JSON.parse(fs.readFileSync(configFile, 'utf8'));
            expect(savedConfig.workspaces['ws-to-remove']).toBeUndefined();
        });
    });

    describe('legacy config dir migration', () => {
        it('migrates legacy clubhouse-cli config dir', async () => {
            process.env.SHORTCUT_API_TOKEN = 'my-token';

            // Create the legacy config directory with a config file
            const legacyDir = path.join(tmpDir, 'clubhouse-cli');
            fs.mkdirSync(legacyDir, { recursive: true });
            fs.writeFileSync(
                path.join(legacyDir, 'config.json'),
                JSON.stringify({ token: 'legacy-token', urlSlug: 'legacy-slug' })
            );

            const { loadCachedConfig } = await importConfigure();
            const config = loadCachedConfig();

            // After migration, the legacy dir should no longer exist
            expect(fs.existsSync(legacyDir)).toBe(false);

            // The new config dir should exist with the migrated data
            const newConfigDir = path.join(tmpDir, 'shortcut-cli');
            expect(fs.existsSync(newConfigDir)).toBe(true);

            // env token takes priority over file token
            expect(config.token).toBe('my-token');
        });
    });
});

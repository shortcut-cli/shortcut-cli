/**
 * Tests for client.ts module and Prism mock server connectivity.
 *
 * The module-level tests verify the client.ts logic (token handling, baseURL
 * override). The Prism tests confirm the ShortcutClient can communicate with
 * the mock server and receives well-formed API responses.
 *
 * When the Shortcut API spec is updated, just re-download the swagger file
 * and all mock responses automatically update to match.
 */
import { describe, it, expect, vi, afterEach } from 'vitest';

import { createMockClient } from '../helpers/mock-client';

describe('client.ts module', () => {
    afterEach(() => {
        vi.resetModules();
        vi.restoreAllMocks();
    });

    it('uses SHORTCUT_API_BASE_URL env var when set', async () => {
        const originalBaseURL = process.env.SHORTCUT_API_BASE_URL;
        const originalToken = process.env.SHORTCUT_API_TOKEN;

        process.env.SHORTCUT_API_BASE_URL = 'http://custom-base.example.com';
        process.env.SHORTCUT_API_TOKEN = 'my-token';

        vi.resetModules();
        const clientModule = await import('../../src/lib/client');
        const client = clientModule.default;

        // The client's axios instance baseURL should be overridden by the env var
        const axiosDefaults = (
            client as unknown as { instance?: { defaults?: { baseURL?: string } } }
        ).instance?.defaults;
        expect(axiosDefaults?.baseURL).toBe('http://custom-base.example.com');

        process.env.SHORTCUT_API_BASE_URL = originalBaseURL;
        process.env.SHORTCUT_API_TOKEN = originalToken;
    });

    it('uses the API token from config', async () => {
        const savedToken = process.env.SHORTCUT_API_TOKEN;
        process.env.SHORTCUT_API_TOKEN = 'my-specific-test-token';

        vi.resetModules();
        const clientModule = await import('../../src/lib/client');
        const client = clientModule.default;

        // In test env, the token comes from SHORTCUT_API_TOKEN env var
        // via configure.ts. The client should have the token in its axios headers.
        const headers = (
            client as unknown as {
                instance?: { defaults?: { headers?: Record<string, string> } };
            }
        ).instance?.defaults?.headers;
        expect(headers?.['Shortcut-Token']).toBe('my-specific-test-token');

        process.env.SHORTCUT_API_TOKEN = savedToken;
    });
});

describe('ShortcutClient against Prism mock server', () => {
    const client = createMockClient();

    it('should list projects and return array data', async () => {
        const response = await client.listProjects();
        expect(response.status).toBe(200);
        expect(Array.isArray(response.data)).toBe(true);
        // Each project should have at minimum an id and name
        expect(response.data[0]).toHaveProperty('id');
        expect(response.data[0]).toHaveProperty('name');
    });

    it('should list workflows and return array with states', async () => {
        const response = await client.listWorkflows();
        expect(response.status).toBe(200);
        expect(Array.isArray(response.data)).toBe(true);
        // Each workflow should have states
        expect(response.data[0]).toHaveProperty('states');
        expect(Array.isArray(response.data[0].states)).toBe(true);
    });

    it('should list members and return array data', async () => {
        const response = await client.listMembers({});
        expect(response.status).toBe(200);
        expect(Array.isArray(response.data)).toBe(true);
        // Each member should have an id and profile
        expect(response.data[0]).toHaveProperty('id');
        expect(response.data[0]).toHaveProperty('profile');
    });

    it('should list labels and return array data', async () => {
        const response = await client.listLabels({});
        expect(response.status).toBe(200);
        expect(Array.isArray(response.data)).toBe(true);
        expect(response.data[0]).toHaveProperty('id');
        expect(response.data[0]).toHaveProperty('name');
    });

    it('should list epics and return array data', async () => {
        const response = await client.listEpics({});
        expect(response.status).toBe(200);
        expect(Array.isArray(response.data)).toBe(true);
        expect(response.data[0]).toHaveProperty('id');
        expect(response.data[0]).toHaveProperty('name');
    });

    it('should list iterations and return array data', async () => {
        const response = await client.listIterations({});
        expect(response.status).toBe(200);
        expect(Array.isArray(response.data)).toBe(true);
        expect(response.data[0]).toHaveProperty('id');
        expect(response.data[0]).toHaveProperty('name');
    });

    it('should list groups (teams) and return array data', async () => {
        const response = await client.listGroups();
        expect(response.status).toBe(200);
        expect(Array.isArray(response.data)).toBe(true);
        expect(response.data[0]).toHaveProperty('id');
        expect(response.data[0]).toHaveProperty('name');
    });

    it('should list objectives and return array data', async () => {
        const response = await client.listObjectives();
        expect(response.status).toBe(200);
        expect(Array.isArray(response.data)).toBe(true);
        expect(response.data[0]).toHaveProperty('id');
        expect(response.data[0]).toHaveProperty('name');
    });

    it('should search stories and return paginated result', async () => {
        const response = await client.searchStories({ query: 'test' });
        expect(response.status).toBe(200);
        expect(response.data).toBeDefined();
        // Search result has a data array and pagination info
        expect(response.data).toHaveProperty('data');
        expect(Array.isArray(response.data.data)).toBe(true);
        expect(response.data).toHaveProperty('total');
    });

    it('should list custom fields and return array data', async () => {
        const response = await client.listCustomFields();
        expect(response.status).toBe(200);
        expect(Array.isArray(response.data)).toBe(true);
        expect(response.data[0]).toHaveProperty('id');
        expect(response.data[0]).toHaveProperty('name');
    });
});

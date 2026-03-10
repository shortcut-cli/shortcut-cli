/**
 * Sample tests demonstrating the Prism mock server setup.
 *
 * These tests call the real ShortcutClient methods against the Prism mock
 * server. Prism auto-generates valid responses from the Swagger spec --
 * zero hand-written mocks.
 *
 * When the Shortcut API spec is updated, just re-download the swagger file
 * and all mock responses automatically update to match.
 */
import { describe, it, expect } from 'vitest';

import { createMockClient } from '../helpers/mock-client';

describe('ShortcutClient against Prism mock server', () => {
    const client = createMockClient();

    describe('Projects', () => {
        it('should list projects', async () => {
            const response = await client.listProjects();
            expect(response.status).toBe(200);
            expect(response.data).toBeDefined();
            expect(Array.isArray(response.data)).toBe(true);
        });
    });

    describe('Workflows', () => {
        it('should list workflows', async () => {
            const response = await client.listWorkflows();
            expect(response.status).toBe(200);
            expect(response.data).toBeDefined();
            expect(Array.isArray(response.data)).toBe(true);
        });
    });

    describe('Members', () => {
        it('should list members', async () => {
            const response = await client.listMembers({});
            expect(response.status).toBe(200);
            expect(response.data).toBeDefined();
            expect(Array.isArray(response.data)).toBe(true);
        });
    });

    describe('Labels', () => {
        it('should list labels', async () => {
            const response = await client.listLabels({});
            expect(response.status).toBe(200);
            expect(response.data).toBeDefined();
            expect(Array.isArray(response.data)).toBe(true);
        });
    });

    describe('Epics', () => {
        it('should list epics', async () => {
            const response = await client.listEpics({});
            expect(response.status).toBe(200);
            expect(response.data).toBeDefined();
            expect(Array.isArray(response.data)).toBe(true);
        });
    });

    describe('Iterations', () => {
        it('should list iterations', async () => {
            const response = await client.listIterations({});
            expect(response.status).toBe(200);
            expect(response.data).toBeDefined();
            expect(Array.isArray(response.data)).toBe(true);
        });
    });

    describe('Groups', () => {
        it('should list groups (teams)', async () => {
            const response = await client.listGroups();
            expect(response.status).toBe(200);
            expect(response.data).toBeDefined();
            expect(Array.isArray(response.data)).toBe(true);
        });
    });

    describe('Objectives', () => {
        it('should list objectives', async () => {
            const response = await client.listObjectives();
            expect(response.status).toBe(200);
            expect(response.data).toBeDefined();
            expect(Array.isArray(response.data)).toBe(true);
        });
    });

    describe('Search', () => {
        it('should search stories', async () => {
            const response = await client.searchStories({ query: 'test' });
            expect(response.status).toBe(200);
            expect(response.data).toBeDefined();
            expect(response.data.data).toBeDefined();
        });
    });

    describe('Custom Fields', () => {
        it('should list custom fields', async () => {
            const response = await client.listCustomFields();
            expect(response.status).toBe(200);
            expect(response.data).toBeDefined();
            expect(Array.isArray(response.data)).toBe(true);
        });
    });
});

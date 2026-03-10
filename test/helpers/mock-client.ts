/**
 * Creates a ShortcutClient that talks to the local Prism mock server
 * instead of the real Shortcut API.
 *
 * The Prism server auto-generates responses from the Swagger spec.
 * No hand-written mocks required.
 */
import { ShortcutClient } from '@shortcut/client';

const PRISM_BASE_URL = 'http://127.0.0.1:4010';

/**
 * Create a ShortcutClient instance pointed at the Prism mock server.
 */
export function createMockClient(): InstanceType<typeof ShortcutClient> {
    return new ShortcutClient('test-token', {
        baseURL: PRISM_BASE_URL,
    });
}

/**
 * The base URL of the Prism mock server, for use in tests that need
 * to make raw HTTP requests.
 */
export const MOCK_BASE_URL = PRISM_BASE_URL;

/**
 * Vitest Global Setup
 *
 * Starts a Prism mock server from the Shortcut Swagger spec before all tests,
 * and tears it down after. The server auto-generates responses from the spec --
 * no hand-written mocks needed.
 *
 * When the Shortcut API spec changes, just re-download the swagger file and
 * all mocks automatically update.
 */
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SPEC_PATH = path.resolve(__dirname, 'fixtures/shortcut.swagger.json');
const PRISM_PORT = 4010;
const PRISM_HOST = '127.0.0.1';

let server: { close: () => Promise<void> } | null = null;

export async function setup() {
    // Dynamic require to avoid type issues with Prism's fp-ts dependencies
    const { getHttpOperationsFromSpec } = await import('@stoplight/prism-http');
    const { createServer } = await import('@stoplight/prism-http-server');
    const pino = (await import('pino')).default;

    const logger = pino({
        level: 'silent',
        customLevels: { success: 32 },
    });

    console.log('[test] Loading Shortcut API spec...');
    const operations = await getHttpOperationsFromSpec(SPEC_PATH);
    console.log(`[test] Loaded ${operations.length} API operations from spec`);

    const mockServer = createServer(operations, {
        cors: true,
        config: {
            checkSecurity: false,
            validateRequest: false,
            validateResponse: false,
            mock: { dynamic: false },
            errors: false,
            upstreamProxy: undefined,
            isProxy: false,
        },
        components: {
            logger,
        },
    });

    const address = await mockServer.listen(PRISM_PORT, PRISM_HOST);
    console.log(`[test] Prism mock server started at ${address}`);

    server = mockServer;
}

export async function teardown() {
    if (server) {
        await server.close();
        console.log('[test] Prism mock server stopped');
    }
}

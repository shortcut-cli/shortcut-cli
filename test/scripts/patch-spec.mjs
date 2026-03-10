#!/usr/bin/env node
/* global console */
/**
 * Patches the downloaded Shortcut swagger spec to add `minimum: 0` or
 * `minimum: 1` to integer fields that lack a minimum constraint.
 *
 * Without this, Prism's static mode generates -9007199254740991
 * (MIN_SAFE_INTEGER) for all int64 fields because @stoplight/http-spec
 * injects `minimum: -9007199254740991` when no minimum is specified,
 * and the sampler returns the minimum value.
 *
 * Run automatically as part of `pnpm test:update-spec`.
 */
import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SPEC_PATH = resolve(__dirname, '../fixtures/shortcut.swagger.json');

const spec = JSON.parse(readFileSync(SPEC_PATH, 'utf-8'));

let patched = 0;

/**
 * Add `minimum` to integer fields that don't have one.
 * - ID fields get minimum: 1 (IDs are always positive)
 * - Count/stat fields get minimum: 0 (counts can be zero)
 */
function patchIntegerMinimum(schema, propName) {
    if (!schema || typeof schema !== 'object') return;

    if (schema.type === 'integer' && !('minimum' in schema)) {
        const name = propName.toLowerCase();
        // Counts, stats, sizes, and estimates can be zero
        const isZeroable =
            name.includes('num_') ||
            name.includes('total') ||
            name.includes('count') ||
            name.includes('size') ||
            name.includes('estimate') ||
            name.includes('position') ||
            name.includes('cycle_time') ||
            name.includes('lead_time') ||
            name.includes('average_') ||
            name.includes('progress') ||
            name === 'old' ||
            name === 'new';
        schema.minimum = isZeroable ? 0 : 1;
        patched++;
    }

    // Recurse into items (for array element schemas)
    if (schema.items) {
        patchIntegerMinimum(schema.items, propName);
    }

    // Recurse into x-oneOf / oneOf / allOf / anyOf
    for (const combiner of ['x-oneOf', 'oneOf', 'allOf', 'anyOf']) {
        if (Array.isArray(schema[combiner])) {
            for (const s of schema[combiner]) {
                patchIntegerMinimum(s, propName);
            }
        }
    }
}

// Walk all definitions
for (const [, def] of Object.entries(spec.definitions || {})) {
    if (def.properties) {
        for (const [propName, propSchema] of Object.entries(def.properties)) {
            patchIntegerMinimum(propSchema, propName);
        }
    }
}

writeFileSync(SPEC_PATH, JSON.stringify(spec, null, 2) + '\n');
console.log(`[patch-spec] Patched ${patched} integer fields with minimum constraints`);

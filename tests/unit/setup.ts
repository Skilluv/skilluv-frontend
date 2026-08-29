import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

/**
 * SvelteKit's `$env/dynamic/public` resolves to a virtual module that reads
 * from the running server's environment. Under Vitest there is no such server,
 * so importing it throws — and now that the API client reads the API origin
 * from it, that reaches every test that touches a client.
 *
 * An empty environment is also the right default for the suite: unset is what
 * makes the clients stay on the relative `/api` they were written against.
 * A test that cares about a declared origin mocks the module itself, and a
 * file-level `vi.mock` wins over this one.
 */
vi.mock('$env/dynamic/public', () => ({ env: {} }));

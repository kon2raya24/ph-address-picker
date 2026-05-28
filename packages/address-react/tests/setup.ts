import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

// We run with globals:false, so Testing Library's auto-cleanup isn't registered.
// Register it explicitly to unmount between tests (prevents DOM/id bleed).
afterEach(() => {
  cleanup();
});

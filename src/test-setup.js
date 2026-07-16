import { vi } from 'vitest';

class MockResizeObserver {
  constructor(callback) {
    this.callback = callback;
    this.observed = [];
  }
  observe(el) { this.observed.push(el); }
  unobserve() {}
  disconnect() { this.observed = []; }
}

globalThis.ResizeObserver = MockResizeObserver;

// Suppress console.error in tests unless debugging
const originalError = console.error;
console.error = (...args) => {
  if (args[0]?.includes?.('Error fetching')) return;
  originalError(...args);
};

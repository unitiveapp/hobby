import '@testing-library/jest-dom';

// Silence React Native warnings in test output
global.console.warn = vi.fn();

// Mock requestAnimationFrame
global.requestAnimationFrame = (cb: FrameRequestCallback) => {
  return setTimeout(() => cb(performance.now()), 0) as unknown as number;
};
global.cancelAnimationFrame = (id: number) => clearTimeout(id);

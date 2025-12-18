import '@testing-library/jest-dom';
import React from 'react';

// Mock react-router-dom completely
jest.mock('react-router-dom', () => ({
  BrowserRouter: ({ children }) => <div data-testid="browser-router">{children}</div>,
  Routes: ({ children }) => <div data-testid="routes">{children}</div>,
  Route: ({ children }) => <div data-testid="route">{children}</div>,
  Navigate: () => <div data-testid="navigate" />,
  useNavigate: () => jest.fn(),
  useLocation: () => ({
    pathname: '/',
    search: '?name=testuser&room=testroom&avatar=testavatar',
    hash: '',
    state: null,
  }),
  useRoutes: () => <div data-testid="mock-routes" />,
}));

// Mock query-string with proper implementation
jest.mock('query-string', () => ({
  parse: jest.fn((searchString) => {
    // Return proper object with name, room, avatar properties
    return {
      name: 'testuser',
      room: 'testroom',
      avatar: 'testavatar'
    };
  })
}));

// Mock socket.io-client globally
jest.mock('socket.io-client', () => ({
  io: jest.fn(() => ({
    emit: jest.fn(),
    on: jest.fn((event, callback) => {
      // Mock some socket events for testing
      if (event === 'connect') {
        setTimeout(() => callback(), 0);
      }
    }),
    disconnect: jest.fn(),
    connect: jest.fn(),
  })),
}));

// Mock emoji-picker-react
jest.mock('emoji-picker-react', () => {
  return function MockEmojiPicker({ onEmojiClick }) {
    return (
      <div data-testid="emoji-picker">
        <button onClick={() => onEmojiClick && onEmojiClick({ emoji: '😀' })}>
          😀
        </button>
      </div>
    );
  };
});

// Mock all timers to prevent memory leaks
global.setTimeout = jest.fn((fn, delay) => {
  // Execute immediately for tests
  fn();
  return 1;
});

global.clearTimeout = jest.fn();
global.setInterval = jest.fn(() => 1);
global.clearInterval = jest.fn();

// Mock MediaRecorder
global.MediaRecorder = jest.fn().mockImplementation(() => ({
  start: jest.fn(),
  stop: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  ondataavailable: jest.fn(),
  onstop: jest.fn(),
  state: 'inactive',
}));

// Mock navigator.mediaDevices
Object.defineProperty(navigator, 'mediaDevices', {
  writable: true,
  value: {
    getUserMedia: jest.fn(() => Promise.resolve({
      getTracks: () => [{ stop: jest.fn() }]
    })),
  },
});

// Mock Notification API
global.Notification = jest.fn().mockImplementation(() => ({}));
global.Notification.permission = 'granted';
global.Notification.requestPermission = jest.fn(() => Promise.resolve('granted'));

// Fix localStorage mock to return null instead of undefined
const localStorageMock = {
  getItem: jest.fn(() => null),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true
});

// Mock fetch globally
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve([]),
  })
);

// Mock Audio constructor
global.Audio = jest.fn().mockImplementation(() => ({
  play: jest.fn(() => Promise.resolve()),
  pause: jest.fn(),
  load: jest.fn(),
}));

// Mock FileReader
global.FileReader = jest.fn().mockImplementation(() => ({
  readAsDataURL: jest.fn(),
  onloadend: jest.fn(),
  result: 'data:image/png;base64,test',
}));

// Mock URL.createObjectURL
global.URL.createObjectURL = jest.fn(() => 'blob:test');

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock document properties
Object.defineProperty(document, 'hidden', {
  writable: true,
  value: false,
});

Object.defineProperty(document, 'title', {
  writable: true,
  value: 'Test',
});

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
  
  // Reset localStorage mock
  localStorageMock.getItem.mockImplementation(() => null);
  localStorageMock.setItem.mockClear();
  localStorageMock.removeItem.mockClear();
  localStorageMock.clear.mockClear();
});
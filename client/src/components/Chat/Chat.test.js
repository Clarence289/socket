import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { act } from 'react';
import '@testing-library/jest-dom';
import Chat from './Chat';

// Mock query-string specifically for this test file
jest.mock('query-string', () => ({
  parse: jest.fn(() => ({
    name: 'testuser',
    room: 'testroom',
    avatar: 'testavatar'
  }))
}));

describe('Chat Component', () => {
  beforeEach(() => {
    // Mock localStorage with proper values for Chat component
    localStorage.getItem = jest.fn((key) => {
      switch (key) {
        case 'chat_name':
          return 'testuser';
        case 'chat_room':
          return 'testroom';
        case 'chat_avatar':
          return 'testavatar';
        case 'chat_user':
          return JSON.stringify({ email: 'test@example.com', avatar: 'testavatar' });
        case 'chat_joined':
          return 'true';
        default:
          return null;
      }
    });
  });

  afterEach(() => {
    cleanup();
    jest.clearAllMocks();
  });

  test('renders Chat component without crashing', () => {
    const { container } = render(<Chat />);
    expect(container).toBeInTheDocument();
  });

  test('renders basic chat elements', () => {
    const { container } = render(<Chat />);
    expect(container.firstChild).toBeInTheDocument();
  });
});
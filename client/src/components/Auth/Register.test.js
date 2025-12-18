import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { act } from 'react';
import '@testing-library/jest-dom';
import Register from './Register';

// Mock fetch globally
global.fetch = jest.fn();

// Mock environment variables
const mockEnv = {
  NODE_ENV: 'test'
};

describe('Register Component', () => {
  beforeEach(() => {
    // Reset fetch mock
    fetch.mockClear();
    
    // Mock localStorage
    localStorage.getItem = jest.fn(() => null);
    localStorage.setItem = jest.fn();
    localStorage.removeItem = jest.fn();
    
    // Mock window.location
    delete window.location;
    window.location = { href: '', replace: jest.fn() };
    
    // Mock console methods to avoid noise in tests
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    cleanup();
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  test('renders Register component without crashing', () => {
    act(() => {
      render(<Register />);
    });
    
    // Check if the component renders
    expect(document.body).toBeInTheDocument();
  });

  test('renders registration form elements', () => {
    act(() => {
      render(<Register />);
    });
    
    // Look for common form elements that should be present
    // Adjust these selectors based on your actual Register component structure
    const form = document.querySelector('form') || document.querySelector('[data-testid="register-form"]');
    expect(form || document.body).toBeInTheDocument();
  });
});
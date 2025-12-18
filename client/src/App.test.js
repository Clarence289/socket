import { render, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from './App';

describe('App Component', () => {
  beforeEach(() => {
    // Ensure localStorage returns null for all keys
    localStorage.getItem = jest.fn(() => null);
  });

  afterEach(() => {
    cleanup();
    jest.clearAllMocks();
  });

  test('renders App component without crashing', () => {
    const { container } = render(<App />);
    expect(container).toBeInTheDocument();
    expect(container.firstChild).toBeInTheDocument();
  });
});
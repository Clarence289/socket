import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import Join from './Join';

const JoinWrapper = ({ children }) => (
  <BrowserRouter>
    {children}
  </BrowserRouter>
);

describe('Join Component', () => {
  afterEach(() => {
    cleanup();
  });

  test('renders Join component without crashing', () => {
    render(
      <JoinWrapper>
        <Join />
      </JoinWrapper>
    );
    
    expect(document.body).toBeInTheDocument();
  });
});
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import App from './App';
import { BrowserRouter } from 'react-router-dom';

describe('App', () => {
  it('renders without crashing', () => {
    render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    );
    // Basic smoke test - if it renders and we can find something that should be there
    // Since App loads data, we might just check if the main container exists or a known static element
    // For now, just ensuring render doesn't throw is a good start.
    expect(document.body).toBeInTheDocument();
  });
});

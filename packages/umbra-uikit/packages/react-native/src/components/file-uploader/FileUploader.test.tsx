/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { FileUploader } from './FileUploader';
import { WispProvider } from '../../providers';

// ---------------------------------------------------------------------------
// Wrapper
// ---------------------------------------------------------------------------

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <WispProvider mode="dark">{children}</WispProvider>
);

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

describe('FileUploader — rendering', () => {
  it('renders without crashing', () => {
    const { container } = render(
      <Wrapper>
        <FileUploader />
      </Wrapper>,
    );
    expect(container).toBeTruthy();
  });

  it('renders the default upload text', () => {
    render(
      <Wrapper>
        <FileUploader />
      </Wrapper>,
    );
    expect(screen.getByText('Tap to select a file')).toBeInTheDocument();
  });

  it('renders custom title text', () => {
    render(
      <Wrapper>
        <FileUploader title="Drop your files here" />
      </Wrapper>,
    );
    expect(screen.getByText('Drop your files here')).toBeInTheDocument();
  });

  it('renders description text', () => {
    render(
      <Wrapper>
        <FileUploader description="PNG, JPG up to 10MB" />
      </Wrapper>,
    );
    expect(screen.getByText('PNG, JPG up to 10MB')).toBeInTheDocument();
  });

  it('renders auto-generated description from accept and maxSize', () => {
    render(
      <Wrapper>
        <FileUploader accept=".png,.jpg" maxSize={5242880} />
      </Wrapper>,
    );
    expect(screen.getByText('.png,.jpg \u00B7 up to 5MB')).toBeInTheDocument();
  });

  it('has button accessibility role', () => {
    const { container } = render(
      <Wrapper>
        <FileUploader />
      </Wrapper>,
    );
    const button = container.querySelector('[role="button"]');
    expect(button).toBeTruthy();
  });

  it('has correct displayName', () => {
    expect(FileUploader.displayName).toBe('FileUploader');
  });
});

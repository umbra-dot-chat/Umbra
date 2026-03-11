/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import React from 'react';
import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { QRCode } from './QRCode';
import { WispProvider } from '../../providers';

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <WispProvider mode="dark">{children}</WispProvider>
);

describe('QRCode (RN) — rendering', () => {
  it('renders without crashing', () => {
    const { container } = render(
      <Wrapper>
        <QRCode value="hello" />
      </Wrapper>,
    );
    expect(container).toBeTruthy();
  });

  it('renders an SVG element', () => {
    const { container } = render(
      <Wrapper>
        <QRCode value="https://example.com" />
      </Wrapper>,
    );
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('renders modules', () => {
    const { container } = render(
      <Wrapper>
        <QRCode value="test" />
      </Wrapper>,
    );
    const svg = container.querySelector('svg')!;
    const rects = svg.querySelectorAll('rect');
    expect(rects.length).toBeGreaterThan(1);
  });

  it('renders circles for circle dotStyle', () => {
    const { container } = render(
      <Wrapper>
        <QRCode value="test" dotStyle="circle" />
      </Wrapper>,
    );
    const svg = container.querySelector('svg')!;
    const circles = svg.querySelectorAll('circle');
    expect(circles.length).toBeGreaterThan(0);
  });

  it('handles different sizes', () => {
    const { container } = render(
      <Wrapper>
        <QRCode value="test" size="lg" />
      </Wrapper>,
    );
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('handles logo children', () => {
    const { container } = render(
      <Wrapper>
        <QRCode value="test" errorLevel="H">
          <span>LOGO</span>
        </QRCode>
      </Wrapper>,
    );
    expect(container).toBeTruthy();
  });
});

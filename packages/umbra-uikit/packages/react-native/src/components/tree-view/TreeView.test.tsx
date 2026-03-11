/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { TreeView } from './TreeView';
import type { TreeNode } from './TreeView';
import { WispProvider } from '../../providers';

// ---------------------------------------------------------------------------
// Wrapper
// ---------------------------------------------------------------------------

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <WispProvider mode="dark">{children}</WispProvider>
);

const defaultNodes: TreeNode[] = [
  {
    id: 'root-1',
    label: 'Documents',
    children: [
      { id: 'doc-1', label: 'Resume.pdf' },
      { id: 'doc-2', label: 'Cover Letter.pdf' },
    ],
  },
  {
    id: 'root-2',
    label: 'Images',
    children: [
      { id: 'img-1', label: 'Photo.png' },
    ],
  },
  { id: 'root-3', label: 'README.md' },
];

// ---------------------------------------------------------------------------
// Rendering nodes
// ---------------------------------------------------------------------------

describe('TreeView — rendering nodes', () => {
  it('renders top-level node labels', () => {
    render(
      <Wrapper>
        <TreeView nodes={defaultNodes} />
      </Wrapper>,
    );
    expect(screen.getByText('Documents')).toBeInTheDocument();
    expect(screen.getByText('Images')).toBeInTheDocument();
    expect(screen.getByText('README.md')).toBeInTheDocument();
  });

  it('renders child nodes when parent is expanded by default', () => {
    render(
      <Wrapper>
        <TreeView nodes={defaultNodes} defaultExpanded={['root-1']} />
      </Wrapper>,
    );
    expect(screen.getByText('Resume.pdf')).toBeInTheDocument();
    expect(screen.getByText('Cover Letter.pdf')).toBeInTheDocument();
  });

  it('renders without crashing with empty nodes', () => {
    const { container } = render(
      <Wrapper>
        <TreeView nodes={[]} />
      </Wrapper>,
    );
    expect(container).toBeTruthy();
  });

  it('renders a flat list of leaf nodes without crashing', () => {
    const flatNodes: TreeNode[] = [
      { id: '1', label: 'File A' },
      { id: '2', label: 'File B' },
    ];
    render(
      <Wrapper>
        <TreeView nodes={flatNodes} />
      </Wrapper>,
    );
    expect(screen.getByText('File A')).toBeInTheDocument();
    expect(screen.getByText('File B')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Expand / Collapse
// ---------------------------------------------------------------------------

describe('TreeView — expand/collapse', () => {
  it('expands a collapsed node when clicked', () => {
    render(
      <Wrapper>
        <TreeView nodes={defaultNodes} />
      </Wrapper>,
    );
    // Click "Documents" to expand it
    const documentsNode = screen.getByText('Documents');
    fireEvent.click(documentsNode);
    expect(screen.getByText('Resume.pdf')).toBeInTheDocument();
  });

  it('calls onToggle when a node with children is toggled', () => {
    const onToggle = vi.fn();
    render(
      <Wrapper>
        <TreeView nodes={defaultNodes} onToggle={onToggle} />
      </Wrapper>,
    );
    fireEvent.click(screen.getByText('Documents'));
    expect(onToggle).toHaveBeenCalledWith('root-1');
  });

  it('supports controlled expanded state', () => {
    render(
      <Wrapper>
        <TreeView nodes={defaultNodes} expanded={['root-2']} />
      </Wrapper>,
    );
    expect(screen.getByText('Photo.png')).toBeInTheDocument();
  });

  it('expands multiple nodes via defaultExpanded', () => {
    render(
      <Wrapper>
        <TreeView nodes={defaultNodes} defaultExpanded={['root-1', 'root-2']} />
      </Wrapper>,
    );
    expect(screen.getByText('Resume.pdf')).toBeInTheDocument();
    expect(screen.getByText('Photo.png')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Selection
// ---------------------------------------------------------------------------

describe('TreeView — selection', () => {
  it('calls onSelect when a node is clicked', () => {
    const onSelect = vi.fn();
    render(
      <Wrapper>
        <TreeView nodes={defaultNodes} onSelect={onSelect} />
      </Wrapper>,
    );
    fireEvent.click(screen.getByText('README.md'));
    expect(onSelect).toHaveBeenCalledWith('root-3');
  });

  it('respects defaultSelectedId', () => {
    const { container } = render(
      <Wrapper>
        <TreeView nodes={defaultNodes} defaultSelectedId="root-3" />
      </Wrapper>,
    );
    expect(container).toBeTruthy();
    expect(screen.getByText('README.md')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Sizes
// ---------------------------------------------------------------------------

describe('TreeView — sizes', () => {
  const sizes = ['sm', 'md', 'lg'] as const;

  sizes.forEach((size) => {
    it(`renders size="${size}" without crashing`, () => {
      render(
        <Wrapper>
          <TreeView nodes={defaultNodes} size={size} />
        </Wrapper>,
      );
      expect(screen.getByText('Documents')).toBeInTheDocument();
    });
  });
});

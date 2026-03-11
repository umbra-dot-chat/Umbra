import React, { useState } from 'react';
import { FolderCard, useThemeColors } from '@wisp-ui/react';
import type { ComponentEntry } from '../types';

// ---------------------------------------------------------------------------
// Card preview (compact)
// ---------------------------------------------------------------------------

function FolderCardPreview() {
  const colors = useThemeColors();
  return (
    <div style={{ display: 'flex', gap: 8, padding: 12 }}>
      <FolderCard name="Documents" fileCount={12} />
      <FolderCard name="Images" fileCount={48} selected />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Interactive demo
// ---------------------------------------------------------------------------

function InteractiveDemo() {
  const [selected, setSelected] = useState<string | null>(null);

  const folders = [
    { id: '1', name: 'Documents', fileCount: 12 },
    { id: '2', name: 'Images', fileCount: 48 },
    { id: '3', name: 'Videos', fileCount: 6 },
    { id: '4', name: 'Music', fileCount: 156 },
    { id: '5', name: 'Projects', fileCount: 3 },
    { id: '6', name: 'Downloads', fileCount: 24 },
  ];

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
        gap: 12,
        padding: 16,
      }}
    >
      {folders.map((folder) => (
        <FolderCard
          key={folder.id}
          name={folder.name}
          fileCount={folder.fileCount}
          selected={selected === folder.id}
          onClick={() => setSelected(folder.id)}
          onDoubleClick={() => alert(`Navigate into ${folder.name}`)}
        />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Skeleton demo
// ---------------------------------------------------------------------------

function SkeletonDemo() {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
        gap: 12,
        padding: 16,
      }}
    >
      {Array.from({ length: 4 }, (_, i) => (
        <FolderCard key={i} name="" skeleton />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Drop target demo
// ---------------------------------------------------------------------------

function DropTargetDemo() {
  return (
    <div style={{ display: 'flex', gap: 12, padding: 16 }}>
      <FolderCard name="Normal" fileCount={5} />
      <FolderCard name="Drop Target" fileCount={8} dropTarget />
      <FolderCard name="Selected" fileCount={3} selected />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Registry entry
// ---------------------------------------------------------------------------

export const folderCardEntry: ComponentEntry = {
  slug: 'folder-card',
  name: 'FolderCard',
  category: 'components',
  subcategory: 'File Management',
  description:
    'Displays a folder in a file channel grid view with icon, name, and file count. Supports selection, hover, and drop-target states for drag-and-drop operations.',
  variantCount: 3,
  keywords: [
    'folder', 'card', 'file', 'directory', 'grid', 'selection',
    'drag', 'drop', 'file-manager', 'community',
  ],

  cardPreview: <FolderCardPreview />,

  props: [
    { name: 'name', type: 'string', required: true, description: 'Folder display name.' },
    { name: 'fileCount', type: 'number', description: 'Number of files inside the folder.' },
    { name: 'onClick', type: '() => void', description: 'Callback on single click.' },
    { name: 'onDoubleClick', type: '() => void', description: 'Callback on double click (navigate into).' },
    { name: 'onContextMenu', type: '(e: MouseEvent) => void', description: 'Callback on right-click.' },
    { name: 'selected', type: 'boolean', default: 'false', description: 'Whether the folder is selected.' },
    { name: 'skeleton', type: 'boolean', default: 'false', description: 'Show skeleton loading state.' },
    { name: 'dropTarget', type: 'boolean', default: 'false', description: 'Highlight as a drop target.' },
  ],

  examples: [
    {
      title: 'Interactive Grid',
      render: <InteractiveDemo />,
      code: `import { FolderCard } from '@wisp-ui/react';

<FolderCard
  name="Documents"
  fileCount={12}
  selected={selected === id}
  onClick={() => setSelected(id)}
  onDoubleClick={() => navigateInto(id)}
/>`,
    },
    {
      title: 'States',
      render: <DropTargetDemo />,
      code: `<FolderCard name="Normal" fileCount={5} />
<FolderCard name="Drop Target" dropTarget />
<FolderCard name="Selected" selected />`,
    },
    {
      title: 'Skeleton Loading',
      render: <SkeletonDemo />,
      code: `<FolderCard name="" skeleton />`,
    },
  ],
};

/**
 * MyPanel — Renders in the "right-panel" slot.
 *
 * This component gets a full panel on the right side of the chat.
 * Use it for rich content like boards, lists, or detail views.
 */

import React, { useState, useEffect } from 'react';

/**
 * A simple panel that demonstrates plugin UI capabilities.
 * Replace this with your own panel content!
 */
export function MyPanel() {
  const [items, setItems] = useState<string[]>(['Item 1', 'Item 2', 'Item 3']);
  const [newItem, setNewItem] = useState('');

  const handleAdd = () => {
    if (!newItem.trim()) return;
    setItems((prev) => [...prev, newItem.trim()]);
    setNewItem('');
  };

  const handleRemove = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  return React.createElement(
    'div',
    {
      style: {
        padding: 16,
        display: 'flex',
        flexDirection: 'column' as const,
        gap: 12,
        height: '100%',
      },
    },
    // Title
    React.createElement(
      'h3',
      {
        style: {
          margin: 0,
          fontSize: 16,
          fontWeight: 700,
          color: '#E4E4E7',
        },
      },
      'My Plugin Panel'
    ),
    // Description
    React.createElement(
      'p',
      {
        style: {
          margin: 0,
          fontSize: 12,
          color: '#71717A',
        },
      },
      'This is a template panel. Edit MyPanel.tsx to build your own UI.'
    ),
    // Add item form
    React.createElement(
      'div',
      {
        style: { display: 'flex', gap: 8 },
      },
      React.createElement('input', {
        type: 'text',
        value: newItem,
        onChange: (e: any) => setNewItem(e.target.value),
        onKeyDown: (e: any) => { if (e.key === 'Enter') handleAdd(); },
        placeholder: 'Add an item...',
        style: {
          flex: 1,
          padding: '6px 10px',
          borderRadius: 6,
          border: '1px solid #27272A',
          backgroundColor: '#09090B',
          color: '#E4E4E7',
          fontSize: 13,
          outline: 'none',
        },
      }),
      React.createElement(
        'button',
        {
          onClick: handleAdd,
          style: {
            padding: '6px 12px',
            borderRadius: 6,
            border: 'none',
            backgroundColor: '#6366F1',
            color: '#FFFFFF',
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
          },
        },
        'Add'
      )
    ),
    // Items list
    React.createElement(
      'div',
      {
        style: {
          display: 'flex',
          flexDirection: 'column' as const,
          gap: 4,
          flex: 1,
          overflowY: 'auto' as const,
        },
      },
      ...items.map((item, i) =>
        React.createElement(
          'div',
          {
            key: i,
            style: {
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 10px',
              borderRadius: 6,
              backgroundColor: '#18181B',
              border: '1px solid #27272A',
            },
          },
          React.createElement(
            'span',
            { style: { fontSize: 13, color: '#E4E4E7' } },
            item
          ),
          React.createElement(
            'button',
            {
              onClick: () => handleRemove(i),
              style: {
                padding: '2px 6px',
                borderRadius: 4,
                border: '1px solid #27272A',
                backgroundColor: 'transparent',
                color: '#71717A',
                fontSize: 11,
                cursor: 'pointer',
              },
            },
            'Remove'
          )
        )
      )
    )
  );
}

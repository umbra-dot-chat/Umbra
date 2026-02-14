/**
 * SidebarWidget — Renders in the "sidebar-section" slot.
 *
 * This component appears below the conversation list in the left sidebar.
 * Keep it compact — it shares space with other sidebar content.
 */

import React, { useState, useEffect } from 'react';

/**
 * A simple sidebar widget that shows a counter.
 * Replace this with your own UI!
 */
export function SidebarWidget() {
  const [count, setCount] = useState(0);

  return React.createElement(
    'div',
    {
      style: {
        padding: '8px 12px',
        margin: '0 6px',
        borderRadius: 8,
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        border: '1px solid rgba(99, 102, 241, 0.2)',
      },
    },
    React.createElement(
      'div',
      {
        style: {
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        },
      },
      React.createElement(
        'span',
        {
          style: {
            fontSize: 12,
            fontWeight: 600,
            color: '#A5B4FC',
          },
        },
        'My Plugin'
      ),
      React.createElement(
        'button',
        {
          onClick: () => setCount((c) => c + 1),
          style: {
            fontSize: 11,
            padding: '2px 8px',
            borderRadius: 4,
            border: '1px solid rgba(99, 102, 241, 0.3)',
            backgroundColor: 'transparent',
            color: '#A5B4FC',
            cursor: 'pointer',
          },
        },
        `Count: ${count}`
      )
    )
  );
}

import React, { useEffect } from 'react';
import type { Preview } from '@storybook/react';
import { WispProvider } from '@wisp-ui/react';
import { WispProvider as RNWispProvider } from '@wisp-ui/react-native';

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: { disable: true },
    layout: 'centered',
  },
  globalTypes: {
    theme: {
      description: 'Theme mode',
      toolbar: {
        title: 'Theme',
        icon: 'mirror',
        items: [
          { value: 'dark', title: 'Dark', icon: 'moon' },
          { value: 'light', title: 'Light', icon: 'sun' },
        ],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: {
    theme: 'dark',
  },
  decorators: [
    (Story, context) => {
      const theme = (context.globals.theme || 'dark') as 'dark' | 'light';

      const isDark = theme === 'dark';
      // Cool blue-black dark, pure white light (panda feel)
      const bgColor = isDark ? '#0A0E15' : '#FFFFFF';
      const textColor = isDark ? '#F7F8FA' : '#0F1219';

      useEffect(() => {
        document.body.style.backgroundColor = bgColor;
        document.body.style.color = textColor;
        document.body.style.transition = 'background-color 0.3s ease, color 0.3s ease';
        document.documentElement.setAttribute('data-wisp-mode', theme);

        // Inject skeleton pulse animation (once)
        if (!document.getElementById('wisp-keyframes')) {
          const style = document.createElement('style');
          style.id = 'wisp-keyframes';
          style.textContent = `
            @keyframes wisp-skeleton-pulse {
              0%, 100% { opacity: 1; }
              50% { opacity: 0.4; }
            }
          `;
          document.head.appendChild(style);
        }
        if (isDark) {
          document.documentElement.classList.add('dark-mode');
          document.documentElement.classList.remove('light-mode');
        } else {
          document.documentElement.classList.add('light-mode');
          document.documentElement.classList.remove('dark-mode');
        }
      }, [theme]);

      return (
        <WispProvider mode={theme}>
          <RNWispProvider mode={theme}>
            <div
              style={{
                padding: 32,
                minHeight: '100vh',
                backgroundColor: bgColor,
                color: textColor,
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                transition: 'background-color 0.3s ease, color 0.3s ease',
              }}
            >
              <Story />
            </div>
          </RNWispProvider>
        </WispProvider>
      );
    },
  ],
};

export default preview;

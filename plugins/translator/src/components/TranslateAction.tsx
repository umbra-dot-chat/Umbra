/**
 * TranslateAction — Renders in the "message-actions" slot.
 *
 * Shows a small "Translate" button next to each message. When clicked,
 * it calls the MyMemory translation API and stores the result in the
 * shared state so TranslationDecorator can display it.
 */

import React, { useState } from 'react';
import type { PluginMessage } from '@umbra/plugin-sdk';
import { translations, targetLang, addTranslation } from '../state';

interface TranslateActionProps {
  message: PluginMessage;
  conversationId: string;
}

export function TranslateAction({ message }: TranslateActionProps) {
  const [loading, setLoading] = useState(false);

  const alreadyTranslated = translations.has(message.id);

  const handleClick = async () => {
    if (loading || alreadyTranslated) return;

    setLoading(true);
    try {
      const encoded = encodeURIComponent(message.text);
      const url = `https://api.mymemory.translated.net/get?q=${encoded}&langpair=auto|${targetLang}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data?.responseData?.translatedText) {
        addTranslation(message.id, data.responseData.translatedText);
      }
    } catch (err) {
      console.error('[Translator] Translation failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return React.createElement(
    'button',
    {
      onClick: handleClick,
      disabled: loading || alreadyTranslated,
      style: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '4px 8px',
        borderRadius: 6,
        border: '1px solid #27272A',
        backgroundColor: alreadyTranslated ? '#1a2e1a' : '#18181B',
        color: alreadyTranslated ? '#4ade80' : '#A1A1AA',
        fontSize: 12,
        cursor: loading ? 'wait' : alreadyTranslated ? 'default' : 'pointer',
        opacity: loading ? 0.6 : 1,
        transition: 'background-color 150ms',
      },
      onMouseEnter: (e: any) => {
        if (!loading && !alreadyTranslated) {
          e.currentTarget.style.backgroundColor = '#27272A';
        }
      },
      onMouseLeave: (e: any) => {
        e.currentTarget.style.backgroundColor = alreadyTranslated
          ? '#1a2e1a'
          : '#18181B';
      },
    },
    React.createElement(
      'span',
      { style: { fontSize: 12 } },
      alreadyTranslated ? '\u2713' : '\uD83C\uDF10'
    ),
    loading ? 'Translating...' : alreadyTranslated ? 'Translated' : 'Translate'
  );
}

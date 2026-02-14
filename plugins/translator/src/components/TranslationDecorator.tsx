/**
 * TranslationDecorator — Renders in the "message-decorator" slot.
 *
 * If a translation exists for the current message, this component renders
 * it below the message bubble with a subtle background and a small label
 * indicating the target language.
 */

import React, { useState, useEffect } from 'react';
import type { PluginMessage } from '@umbra/plugin-sdk';
import { translations, targetLang, subscribe } from '../state';

/** Map of common language codes to readable names */
const LANG_NAMES: Record<string, string> = {
  es: 'Spanish',
  fr: 'French',
  de: 'German',
  it: 'Italian',
  pt: 'Portuguese',
  ru: 'Russian',
  zh: 'Chinese',
  ja: 'Japanese',
  ko: 'Korean',
  ar: 'Arabic',
  hi: 'Hindi',
  nl: 'Dutch',
  sv: 'Swedish',
  pl: 'Polish',
  tr: 'Turkish',
  vi: 'Vietnamese',
  th: 'Thai',
  uk: 'Ukrainian',
  cs: 'Czech',
  ro: 'Romanian',
  el: 'Greek',
  da: 'Danish',
  fi: 'Finnish',
  no: 'Norwegian',
  hu: 'Hungarian',
  he: 'Hebrew',
  id: 'Indonesian',
  ms: 'Malay',
  en: 'English',
};

function getLangName(code: string): string {
  return LANG_NAMES[code] ?? code.toUpperCase();
}

interface TranslationDecoratorProps {
  message: PluginMessage;
  conversationId: string;
}

export function TranslationDecorator({ message }: TranslationDecoratorProps) {
  // Force re-render when translations change
  const [, setTick] = useState(0);

  useEffect(() => {
    const unsub = subscribe(() => setTick((t) => t + 1));
    return unsub;
  }, []);

  const translated = translations.get(message.id);
  if (!translated) return null;

  return React.createElement(
    'div',
    {
      style: {
        marginTop: 4,
        padding: '6px 10px',
        borderRadius: 6,
        backgroundColor: 'rgba(99, 102, 241, 0.08)',
        border: '1px solid rgba(99, 102, 241, 0.15)',
        maxWidth: '100%',
      },
    },
    // Label
    React.createElement(
      'div',
      {
        style: {
          fontSize: 10,
          fontWeight: 600,
          color: '#818CF8',
          marginBottom: 2,
          textTransform: 'uppercase' as const,
          letterSpacing: 0.5,
        },
      },
      `Translated to ${getLangName(targetLang)}`
    ),
    // Translated text
    React.createElement(
      'div',
      {
        style: {
          fontSize: 13,
          color: '#D4D4D8',
          lineHeight: 1.4,
          wordBreak: 'break-word' as const,
        },
      },
      translated
    )
  );
}

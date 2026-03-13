import { useState, useCallback, useMemo, useRef } from 'react';
import { dbg } from '@/utils/debug';

const SRC = 'useSlashCommand';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SlashCommandSuggestion {
  /** The text to fill in */
  label: string;
  /** Short description */
  description?: string;
}

export interface SlashCommandDef {
  /** Unique ID, e.g. "ghost:help" or "system:clear" */
  id: string;
  /** The command text typed after "/", e.g. "ghost help" */
  command: string;
  /** Display label shown in the menu */
  label: string;
  /** Short description */
  description?: string;
  /** Emoji or icon */
  icon?: string;
  /** Category for grouping: "System", "Ghost", or plugin name */
  category: string;
  /**
   * If true, selecting this command fills the input with "/<command>" and sends it.
   * If false/undefined, onExecute is called directly.
   */
  sendAsMessage?: boolean;
  /** Called when the command is selected. Receives args if command has arguments. */
  onExecute?: ((args: string) => void) | (() => void);
  /** Usage hint for commands with arguments, e.g. "<track-id>" */
  args?: string;
  /** Return suggestions for the arguments portion. Called with partial arg text. */
  getSuggestions?: (partialArgs: string) => SlashCommandSuggestion[];
}

export interface UseSlashCommandOptions {
  /** All available slash commands */
  commands: SlashCommandDef[];
  /** Maximum suggestions to show. @default 8 */
  maxSuggestions?: number;
}

export interface UseSlashCommandReturn {
  /** Whether the slash command menu should be visible */
  slashOpen: boolean;
  /** The current filter query (text after "/") */
  slashQuery: string;
  /** Filtered commands matching the query */
  filteredCommands: SlashCommandDef[];
  /** Currently highlighted item index */
  activeIndex: number;
  /** Update the active index */
  setActiveIndex: (index: number | ((prev: number) => number)) => void;
  /** Call this when text changes — detects "/" trigger */
  handleTextChange: (text: string) => void;
  /**
   * Call this when a command is selected.
   * Returns { newText, shouldSend } — set input to newText, and if shouldSend
   * is true, submit it immediately.
   */
  selectCommand: (cmd: SlashCommandDef, currentText: string) => { newText: string; shouldSend: boolean };
  /** Dismiss the slash menu */
  closeSlash: () => void;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useSlashCommand({
  commands,
  maxSuggestions = 8,
}: UseSlashCommandOptions): UseSlashCommandReturn {
  const [slashOpen, setSlashOpen] = useState(false);
  const [slashQuery, setSlashQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);

  const filteredCommands = useMemo(() => {
    if (!slashOpen) return [];
    if (!slashQuery) return commands.slice(0, maxSuggestions);

    const q = slashQuery.toLowerCase();

    // Check if a command is fully typed and user is typing args
    const matchedCmd = commands.find((cmd) => {
      const cmdText = cmd.command.toLowerCase();
      return q === cmdText || q.startsWith(cmdText + ' ');
    });

    if (matchedCmd?.getSuggestions) {
      // Extract the args portion after the command
      const argsText = q.slice(matchedCmd.command.length).trim();
      const suggestions = matchedCmd.getSuggestions(argsText);
      if (suggestions.length > 0) {
        // Convert suggestions to SlashCommandDef items for the menu
        return suggestions.slice(0, maxSuggestions).map((s, i) => ({
          id: `${matchedCmd.id}:suggestion:${i}`,
          command: `${matchedCmd.command} ${s.label}`,
          label: s.label,
          description: s.description,
          icon: matchedCmd.icon,
          category: matchedCmd.category,
          sendAsMessage: matchedCmd.sendAsMessage,
          onExecute: matchedCmd.onExecute,
          args: undefined,
        } as SlashCommandDef));
      }
    }

    // Default: filter commands by query
    return commands
      .filter((cmd) => {
        return (
          cmd.command.toLowerCase().includes(q) ||
          cmd.label.toLowerCase().includes(q) ||
          (cmd.description && cmd.description.toLowerCase().includes(q)) ||
          cmd.category.toLowerCase().includes(q)
        );
      })
      .slice(0, maxSuggestions);
  }, [slashOpen, slashQuery, commands, maxSuggestions]);

  const handleTextChange = useCallback(
    (text: string) => {
      // Slash commands must start at the beginning of the message
      if (!text.startsWith('/')) {
        if (slashOpen) {
          setSlashOpen(false);
          setSlashQuery('');
        }
        return;
      }

      // Don't trigger if there's a space before any meaningful text
      // (allows "/ " to close the menu)
      const afterSlash = text.slice(1);

      // Open the slash menu
      setSlashQuery(afterSlash);
      setActiveIndex(0);
      if (!slashOpen) setSlashOpen(true);
    },
    [slashOpen],
  );

  const selectCommand = useCallback(
    (cmd: SlashCommandDef, currentText: string): { newText: string; shouldSend: boolean } => {
      setSlashOpen(false);
      setSlashQuery('');

      // Extract the args portion: "/tutor spanish" → "spanish"
      const argsText = currentText.startsWith('/')
        ? currentText.slice(1 + cmd.command.length).trim()
        : '';

      if (__DEV__) dbg.info('messages', 'selectCommand', { id: cmd.id, sendAsMessage: cmd.sendAsMessage }, SRC);

      if (cmd.sendAsMessage) {
        // Always call onExecute for local state changes (e.g. therapy session activation)
        if (cmd.onExecute) {
          (cmd.onExecute as (args: string) => void)(argsText);
        }
        // Fill in the current text as-is (preserves args) and send it
        const fullCommand = argsText ? `/${cmd.command} ${argsText}` : `/${cmd.command}`;
        return { newText: fullCommand, shouldSend: true };
      }

      // Execute the local command and clear the input
      if (cmd.onExecute) {
        (cmd.onExecute as (args: string) => void)(argsText);
      }
      return { newText: '', shouldSend: false };
    },
    [],
  );

  const closeSlash = useCallback(() => {
    setSlashOpen(false);
    setSlashQuery('');
  }, []);

  return {
    slashOpen,
    slashQuery,
    filteredCommands,
    activeIndex,
    setActiveIndex,
    handleTextChange,
    selectCommand,
    closeSlash,
  };
}

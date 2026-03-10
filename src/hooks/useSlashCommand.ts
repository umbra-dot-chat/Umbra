import { useState, useCallback, useMemo, useRef } from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

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
  /** Called when the command is selected (for local commands) */
  onExecute?: () => void;
  /** Usage hint for commands with arguments, e.g. "<track-id>" */
  args?: string;
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
    return commands
      .filter((cmd) => {
        // Match against the command text, label, description, and category
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
    (cmd: SlashCommandDef, _currentText: string): { newText: string; shouldSend: boolean } => {
      setSlashOpen(false);
      setSlashQuery('');

      if (cmd.sendAsMessage) {
        // Fill in the command text and send it
        const fullCommand = `/${cmd.command}`;
        return { newText: fullCommand, shouldSend: true };
      }

      // Execute the local command and clear the input
      cmd.onExecute?.();
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

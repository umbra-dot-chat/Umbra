import { useState, useCallback, useMemo } from 'react';
import type { SlashCommand, SlashCommandSuggestion } from '@umbra/plugin-sdk';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SlashDropdownItem {
  /** Display label (command name or suggestion label) */
  label: string;
  description?: string;
  icon?: string;
  /** The full text to insert when selected */
  insertText: string;
  /** If this is a command-level item, the command reference */
  command?: SlashCommand;
}

export interface UseSlashCommandOptions {
  /** All registered slash commands. */
  commands: SlashCommand[];
  /** Maximum number of suggestions to show. @default 5 */
  maxSuggestions?: number;
}

export interface UseSlashCommandReturn {
  /** Whether the slash command dropdown should be visible. */
  slashOpen: boolean;
  /** The current search query (text after the "/" trigger). */
  slashQuery: string;
  /** Unified dropdown items (commands or argument suggestions). */
  dropdownItems: SlashDropdownItem[];
  /** Filtered commands matching the query (for backward compat). */
  filteredCommands: SlashCommand[];
  /** Currently highlighted item index. */
  activeIndex: number;
  /** Update the active index (e.g. from keyboard navigation). */
  setActiveIndex: (index: number) => void;
  /** Call this when the text changes — detects "/" trigger. */
  handleTextChange: (text: string) => void;
  /** Execute the selected command, extracting args from the message text. Returns true if handled. */
  executeCommand: (command: SlashCommand, fullText: string) => boolean;
  /** Dismiss the slash command dropdown without selecting. */
  closeSlash: () => void;
  /** Insert the selected command into the text. Returns new text with `/command `. */
  insertCommand: (command: SlashCommand) => string;
  /** Select a dropdown item. Returns the text to set in the input. */
  selectItem: (item: SlashDropdownItem) => string;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useSlashCommand({
  commands,
  maxSuggestions = 5,
}: UseSlashCommandOptions): UseSlashCommandReturn {
  const [slashOpen, setSlashOpen] = useState(false);
  const [slashQuery, setSlashQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  // Track whether we're in arg-suggestion mode
  const [matchedCommand, setMatchedCommand] = useState<SlashCommand | null>(null);
  const [argQuery, setArgQuery] = useState('');

  // Build dropdown items: either command suggestions or argument suggestions
  const dropdownItems = useMemo((): SlashDropdownItem[] => {
    if (!slashOpen) return [];

    // Argument suggestion mode
    if (matchedCommand?.getSuggestions) {
      const suggestions = matchedCommand.getSuggestions(argQuery);
      return suggestions
        .slice(0, maxSuggestions)
        .map((s: SlashCommandSuggestion) => ({
          label: s.label,
          description: s.description,
          icon: matchedCommand.icon,
          insertText: `/${matchedCommand.command} ${s.label}`,
          command: matchedCommand,
        }));
    }

    // Command suggestion mode
    const q = slashQuery.toLowerCase();
    const filtered = q
      ? commands.filter(
          (c) =>
            c.command.toLowerCase().startsWith(q) ||
            c.label.toLowerCase().includes(q)
        )
      : commands;

    return filtered.slice(0, maxSuggestions).map((c) => ({
      label: `/${c.command}`,
      description: c.description,
      icon: c.icon,
      insertText: `/${c.command} `,
      command: c,
    }));
  }, [slashOpen, matchedCommand, argQuery, slashQuery, commands, maxSuggestions]);

  // Keep filteredCommands for backward compat
  const filteredCommands = useMemo(() => {
    if (!slashOpen || matchedCommand) return [];
    if (!slashQuery) return commands.slice(0, maxSuggestions);
    const q = slashQuery.toLowerCase();
    return commands
      .filter(
        (c) =>
          c.command.toLowerCase().startsWith(q) ||
          c.label.toLowerCase().includes(q)
      )
      .slice(0, maxSuggestions);
  }, [slashOpen, matchedCommand, slashQuery, commands, maxSuggestions]);

  const handleTextChange = useCallback(
    (text: string) => {
      // Slash commands only trigger when "/" is at position 0
      if (!text.startsWith('/')) {
        setSlashOpen(false);
        setSlashQuery('');
        setMatchedCommand(null);
        setArgQuery('');
        return;
      }

      const afterSlash = text.slice(1);
      const spaceIndex = afterSlash.indexOf(' ');

      if (spaceIndex === -1) {
        // Still typing command name — show command suggestions
        setSlashQuery(afterSlash);
        setMatchedCommand(null);
        setArgQuery('');
        setActiveIndex(0);
        setSlashOpen(true);
        return;
      }

      // User has typed a space after the command — check for arg suggestions
      const cmdName = afterSlash.slice(0, spaceIndex).toLowerCase();
      const cmd = commands.find((c) => c.command.toLowerCase() === cmdName);

      if (cmd?.getSuggestions) {
        const args = afterSlash.slice(spaceIndex + 1);
        setMatchedCommand(cmd);
        setArgQuery(args);
        setSlashQuery('');
        setActiveIndex(0);
        setSlashOpen(true);
      } else {
        // No arg suggestions for this command
        setSlashOpen(false);
        setSlashQuery('');
        setMatchedCommand(null);
        setArgQuery('');
      }
    },
    [commands]
  );

  const insertCommand = useCallback(
    (command: SlashCommand): string => {
      setSlashOpen(false);
      setSlashQuery('');
      setMatchedCommand(null);
      setArgQuery('');
      return `/${command.command} `;
    },
    []
  );

  const selectItem = useCallback(
    (item: SlashDropdownItem): string => {
      setSlashOpen(false);
      setSlashQuery('');
      setMatchedCommand(null);
      setArgQuery('');
      return item.insertText;
    },
    []
  );

  const executeCommand = useCallback(
    (command: SlashCommand, fullText: string): boolean => {
      const prefix = `/${command.command}`;
      if (!fullText.startsWith(prefix)) return false;

      const args = fullText.slice(prefix.length).trim();
      command.onExecute(args);
      setSlashOpen(false);
      setSlashQuery('');
      setMatchedCommand(null);
      setArgQuery('');
      return true;
    },
    []
  );

  const closeSlash = useCallback(() => {
    setSlashOpen(false);
    setSlashQuery('');
    setMatchedCommand(null);
    setArgQuery('');
  }, []);

  return {
    slashOpen,
    slashQuery,
    dropdownItems,
    filteredCommands,
    activeIndex,
    setActiveIndex,
    handleTextChange,
    executeCommand,
    closeSlash,
    insertCommand,
    selectItem,
  };
}

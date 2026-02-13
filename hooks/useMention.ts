import { useState, useCallback, useMemo, useRef } from 'react';
import type { MentionUser } from '@coexist/wisp-react-native';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface UseMentionOptions {
  /** All available users that can be mentioned. */
  users: MentionUser[];
  /** Maximum number of suggestions to show. @default 5 */
  maxSuggestions?: number;
}

export interface UseMentionReturn {
  /** Whether the mention dropdown should be visible. */
  mentionOpen: boolean;
  /** The current search query (text after the "@" trigger). */
  mentionQuery: string;
  /** Filtered users matching the query. */
  filteredUsers: MentionUser[];
  /** Currently highlighted item index. */
  activeIndex: number;
  /** Update the active index (e.g. from keyboard navigation). */
  setActiveIndex: (index: number) => void;
  /** Call this when the text changes — detects "@" trigger. */
  handleTextChange: (text: string) => void;
  /** Call this from MessageInput's onSelectionChange. */
  handleSelectionChange: (event: { nativeEvent: { selection: { start: number; end: number } } }) => void;
  /** Call this from MessageInput's onKeyPress — handles arrow/enter/escape for mention navigation. */
  handleKeyPress: (event: { nativeEvent: { key: string } }, currentText: string) => string | null;
  /** Call this when a user is selected from the dropdown. Returns the new text. */
  insertMention: (user: MentionUser, currentText: string) => string;
  /** Dismiss the mention dropdown without selecting. */
  closeMention: () => void;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useMention({ users, maxSuggestions = 5 }: UseMentionOptions): UseMentionReturn {
  const [mentionOpen, setMentionOpen] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const [triggerPos, setTriggerPos] = useState(-1);

  // Use a ref for cursor position so it's always up-to-date (no stale closure issues)
  const cursorPosRef = useRef(0);

  const filteredUsers = useMemo(() => {
    if (!mentionOpen) return users.slice(0, maxSuggestions);
    if (!mentionQuery) return users.slice(0, maxSuggestions);
    const q = mentionQuery.toLowerCase();
    return users
      .filter((u) => u.name.toLowerCase().includes(q) || (u.username && u.username.toLowerCase().includes(q)))
      .slice(0, maxSuggestions);
  }, [mentionOpen, mentionQuery, users, maxSuggestions]);

  const handleSelectionChange = useCallback(
    (event: { nativeEvent: { selection: { start: number; end: number } } }) => {
      cursorPosRef.current = event.nativeEvent.selection.start;
    },
    [],
  );

  const handleTextChange = useCallback(
    (text: string) => {
      // Use text.length as the cursor position since the user just typed something
      // and the cursor is at the end of what they typed. The ref may not have
      // updated yet due to event ordering.
      const searchFrom = text.length;
      const beforeCursor = text.slice(0, searchFrom);
      const atIndex = beforeCursor.lastIndexOf('@');

      if (atIndex === -1) {
        setMentionOpen(false);
        setTriggerPos(-1);
        return;
      }

      // "@" must be at start or preceded by a space/newline
      const charBefore = atIndex > 0 ? text[atIndex - 1] : ' ';
      const isWordBoundary = charBefore === ' ' || charBefore === '\n' || atIndex === 0;

      if (!isWordBoundary) {
        setMentionOpen(false);
        setTriggerPos(-1);
        return;
      }

      // Extract query: text between "@" and end (no spaces allowed in query)
      const queryText = text.slice(atIndex + 1, searchFrom);
      if (queryText.includes(' ')) {
        setMentionOpen(false);
        setTriggerPos(-1);
        return;
      }

      // Open the mention dropdown
      setTriggerPos(atIndex);
      setMentionQuery(queryText);
      setActiveIndex(0);
      setMentionOpen(true);
    },
    [],
  );

  const insertMention = useCallback(
    (user: MentionUser, currentText: string): string => {
      if (triggerPos === -1) return currentText;

      const before = currentText.slice(0, triggerPos);
      const after = currentText.slice(triggerPos + 1 + mentionQuery.length);
      const mention = `@${user.name} `;
      const newText = before + mention + after;

      setMentionOpen(false);
      setTriggerPos(-1);
      setMentionQuery('');

      return newText;
    },
    [triggerPos, mentionQuery],
  );

  const handleKeyPress = useCallback(
    (event: { nativeEvent: { key: string } }, currentText: string): string | null => {
      if (!mentionOpen) return null;

      const { key } = event.nativeEvent;

      if (key === 'ArrowDown') {
        setActiveIndex((prev) => (prev + 1) % filteredUsers.length);
        return ''; // signal: handled, don't propagate
      }

      if (key === 'ArrowUp') {
        setActiveIndex((prev) => (prev - 1 + filteredUsers.length) % filteredUsers.length);
        return '';
      }

      if (key === 'Enter') {
        const selected = filteredUsers[activeIndex];
        if (selected) {
          return insertMention(selected, currentText);
        }
        return null;
      }

      if (key === 'Escape') {
        setMentionOpen(false);
        setTriggerPos(-1);
        setMentionQuery('');
        return '';
      }

      return null; // not handled
    },
    [mentionOpen, filteredUsers, activeIndex, insertMention],
  );

  const closeMention = useCallback(() => {
    setMentionOpen(false);
    setTriggerPos(-1);
    setMentionQuery('');
  }, []);

  return {
    mentionOpen,
    mentionQuery,
    filteredUsers,
    activeIndex,
    setActiveIndex,
    handleTextChange,
    handleSelectionChange,
    handleKeyPress,
    insertMention,
    closeMention,
  };
}

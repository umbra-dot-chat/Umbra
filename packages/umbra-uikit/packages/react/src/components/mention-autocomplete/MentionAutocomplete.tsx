/**
 * @module MentionAutocomplete
 * @description Dropdown overlay for @mention user search and selection.
 */
import React, { forwardRef, useMemo, useCallback, useEffect, useRef } from 'react';
import type { MentionAutocompleteProps, MentionUser } from '@coexist/wisp-core/types/MentionAutocomplete.types';
import {
  resolveMentionAutocompleteColors,
  buildMentionContainerStyle,
  buildMentionItemStyle,
  buildMentionAvatarWrapperStyle,
  buildMentionOnlineDotStyle,
  buildMentionNameStyle,
  buildMentionUsernameStyle,
  buildMentionEmptyStyle,
} from '@coexist/wisp-core/styles/MentionAutocomplete.styles';
import { useTheme } from '../../providers';

// ---------------------------------------------------------------------------
// MentionAutocomplete
// ---------------------------------------------------------------------------

/**
 * MentionAutocomplete — Dropdown list for @mention user selection.
 *
 * @remarks
 * Renders a filtered list of users matching the current @mention query.
 * Supports keyboard navigation (arrow keys + Enter) and click selection.
 * Typically positioned above or below the message input.
 *
 * @example
 * ```tsx
 * <MentionAutocomplete
 *   users={filteredUsers}
 *   query="ali"
 *   activeIndex={0}
 *   onSelect={(user) => insertMention(user)}
 *   onActiveIndexChange={setActiveIndex}
 * />
 * ```
 */
export const MentionAutocomplete = forwardRef<HTMLDivElement, MentionAutocompleteProps>(
  function MentionAutocomplete(
    {
      users,
      query,
      activeIndex = 0,
      onSelect,
      onActiveIndexChange,
      maxVisible = 5,
      open = true,
      loading = false,
      emptyText = 'No users found',
      style: userStyle,
      className,
      ...rest
    },
    ref,
  ) {
    const { theme } = useTheme();
    const listRef = useRef<HTMLDivElement>(null);

    const colors = useMemo(
      () => resolveMentionAutocompleteColors(theme),
      [theme],
    );

    const containerStyle = useMemo(
      () => buildMentionContainerStyle(colors, maxVisible, theme),
      [colors, maxVisible, theme],
    );

    const avatarWrapperStyle = useMemo(
      () => buildMentionAvatarWrapperStyle(),
      [],
    );

    const onlineDotStyle = useMemo(
      () => buildMentionOnlineDotStyle(colors, theme),
      [colors, theme],
    );

    const emptyStyle = useMemo(
      () => buildMentionEmptyStyle(colors, theme),
      [colors, theme],
    );

    // Scroll active item into view
    useEffect(() => {
      if (listRef.current) {
        const items = listRef.current.querySelectorAll('[data-mention-item]');
        const activeItem = items[activeIndex] as HTMLElement;
        if (activeItem) {
          activeItem.scrollIntoView({ block: 'nearest' });
        }
      }
    }, [activeIndex]);

    if (!open) return null;

    const showEmpty = !loading && users.length === 0;

    return (
      <div
        ref={(node) => {
          // Merge refs
          (listRef as any).current = node;
          if (typeof ref === 'function') ref(node);
          else if (ref) (ref as any).current = node;
        }}
        role="listbox"
        aria-label="Mention suggestions"
        className={className}
        style={{ ...containerStyle, ...userStyle }}
        {...rest}
      >
        {loading && (
          <div style={emptyStyle}>Searching…</div>
        )}

        {showEmpty && (
          <div style={emptyStyle}>{emptyText}</div>
        )}

        {!loading && users.map((user, index) => (
          <MentionItem
            key={user.id}
            user={user}
            active={index === activeIndex}
            colors={colors}
            theme={theme}
            avatarWrapperStyle={avatarWrapperStyle}
            onlineDotStyle={onlineDotStyle}
            onSelect={onSelect}
            onHover={() => onActiveIndexChange?.(index)}
          />
        ))}
      </div>
    );
  },
);

MentionAutocomplete.displayName = 'MentionAutocomplete';

// ---------------------------------------------------------------------------
// MentionItem (internal)
// ---------------------------------------------------------------------------

function MentionItem({
  user,
  active,
  colors,
  theme,
  avatarWrapperStyle,
  onlineDotStyle,
  onSelect,
  onHover,
}: {
  user: MentionUser;
  active: boolean;
  colors: ReturnType<typeof resolveMentionAutocompleteColors>;
  theme: ReturnType<typeof useTheme>['theme'];
  avatarWrapperStyle: React.CSSProperties;
  onlineDotStyle: React.CSSProperties;
  onSelect: (user: MentionUser) => void;
  onHover: () => void;
}) {
  const itemStyle = useMemo(
    () => buildMentionItemStyle(colors, active, theme),
    [colors, active, theme],
  );

  const nameStyle = useMemo(
    () => buildMentionNameStyle(colors, active, theme),
    [colors, active, theme],
  );

  const usernameStyle = useMemo(
    () => buildMentionUsernameStyle(colors, active, theme),
    [colors, active, theme],
  );

  const handleClick = useCallback(() => {
    onSelect(user);
  }, [user, onSelect]);

  return (
    <div
      role="option"
      aria-selected={active}
      data-mention-item
      style={itemStyle}
      onClick={handleClick}
      onMouseEnter={onHover}
    >
      {/* Avatar */}
      <div style={avatarWrapperStyle}>
        {user.avatar}
        {user.online && <div style={onlineDotStyle} />}
      </div>

      {/* Name + username */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={nameStyle}>{user.name}</span>
        {user.username && <span style={usernameStyle}>@{user.username}</span>}
      </div>
    </div>
  );
}

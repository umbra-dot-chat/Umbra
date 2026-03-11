/**
 * AdvancedSearchPanel -- Extended search filters panel with dedicated inputs
 * for advanced search syntax.
 *
 * @remarks
 * Composes Input, Select, Toggle, and Button to provide a grid of filter
 * inputs: text query, from user, in channel, date range, boolean toggles,
 * with Search/Reset buttons and a result count badge.
 *
 * @module components/advanced-search-panel
 * @example
 * ```tsx
 * <AdvancedSearchPanel
 *   filters={filters}
 *   onFiltersChange={setFilters}
 *   onSearch={() => performSearch()}
 *   channels={[{ id: '1', name: 'general' }]}
 * />
 * ```
 */
import React, { forwardRef, useMemo, useCallback } from 'react';
import type {
  AdvancedSearchPanelProps,
  AdvancedSearchFilters,
} from '@coexist/wisp-core/types/AdvancedSearchPanel.types';
import {
  resolveAdvancedSearchPanelColors,
  buildContainerStyle,
  buildHeaderStyle,
  buildTitleStyle,
  buildResultBadgeStyle,
  buildFilterGridStyle,
  buildFieldGroupStyle,
  buildLabelStyle,
  buildToggleRowStyle,
  buildToggleItemStyle,
  buildFooterStyle,
} from '@coexist/wisp-core/styles/AdvancedSearchPanel.styles';
import { useTheme } from '../../providers';
import { Input } from '../../primitives/input';
import { Button } from '../../primitives/button';
import { Toggle } from '../../primitives/toggle';

// ---------------------------------------------------------------------------
// AdvancedSearchPanel
// ---------------------------------------------------------------------------

/**
 * AdvancedSearchPanel -- Grid-based filter panel for advanced message search.
 *
 * @remarks
 * All filter state is controlled via `filters` / `onFiltersChange`.
 */
export const AdvancedSearchPanel = forwardRef<HTMLDivElement, AdvancedSearchPanelProps>(
  function AdvancedSearchPanel(
    {
      filters,
      onFiltersChange,
      onSearch,
      onReset,
      channels,
      users,
      loading = false,
      resultCount,
      title = 'Advanced Search',
      skeleton = false,
      style: userStyle,
      className,
      ...rest
    },
    ref,
  ) {
    const { theme } = useTheme();

    // -----------------------------------------------------------------------
    // Colors
    // -----------------------------------------------------------------------
    const panelColors = useMemo(
      () => resolveAdvancedSearchPanelColors(theme),
      [theme],
    );

    // -----------------------------------------------------------------------
    // Styles
    // -----------------------------------------------------------------------
    const containerStyle = useMemo(
      () => buildContainerStyle(theme, panelColors),
      [theme, panelColors],
    );
    const headerStyle = useMemo(() => buildHeaderStyle(theme), [theme]);
    const titleStyle = useMemo(
      () => buildTitleStyle(theme, panelColors),
      [theme, panelColors],
    );
    const resultBadgeStyle = useMemo(
      () => buildResultBadgeStyle(theme, panelColors),
      [theme, panelColors],
    );
    const filterGridStyle = useMemo(() => buildFilterGridStyle(theme), [theme]);
    const fieldGroupStyle = useMemo(() => buildFieldGroupStyle(theme), [theme]);
    const labelStyle = useMemo(
      () => buildLabelStyle(theme, panelColors),
      [theme, panelColors],
    );
    const toggleRowStyle = useMemo(() => buildToggleRowStyle(theme), [theme]);
    const toggleItemStyle = useMemo(() => buildToggleItemStyle(theme), [theme]);
    const footerStyle = useMemo(() => buildFooterStyle(theme), [theme]);

    // -----------------------------------------------------------------------
    // Handlers
    // -----------------------------------------------------------------------
    const update = useCallback(
      (patch: Partial<AdvancedSearchFilters>) => {
        onFiltersChange({ ...filters, ...patch });
      },
      [filters, onFiltersChange],
    );

    // -----------------------------------------------------------------------
    // Render
    // -----------------------------------------------------------------------
    return (
      <div
        ref={ref}
        className={className}
        style={{ ...containerStyle, ...userStyle } as React.CSSProperties}
        {...rest}
      >
        {/* Header */}
        <div style={headerStyle as React.CSSProperties}>
          <h3 style={titleStyle as React.CSSProperties}>{title}</h3>
          {resultCount !== undefined && (
            <span
              style={resultBadgeStyle as React.CSSProperties}
              data-testid="result-count"
            >
              {resultCount} result{resultCount !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {/* Filter grid */}
        <div style={filterGridStyle as React.CSSProperties}>
          {/* Query */}
          <div style={{ ...fieldGroupStyle, gridColumn: '1 / -1' } as React.CSSProperties}>
            <label style={labelStyle as React.CSSProperties}>Search query</label>
            <Input
              placeholder="Enter search terms..."
              value={filters.query ?? ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                update({ query: e.target.value })
              }
              disabled={loading}
              fullWidth
            />
          </div>

          {/* From user */}
          <div style={fieldGroupStyle as React.CSSProperties}>
            <label style={labelStyle as React.CSSProperties}>From user</label>
            <Input
              placeholder="Username"
              value={filters.fromUser ?? ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                update({ fromUser: e.target.value })
              }
              disabled={loading}
              fullWidth
            />
          </div>

          {/* In channel */}
          <div style={fieldGroupStyle as React.CSSProperties}>
            <label style={labelStyle as React.CSSProperties}>In channel</label>
            {channels && channels.length > 0 ? (
              <select
                value={filters.inChannel ?? ''}
                onChange={(e) => update({ inChannel: e.target.value || undefined })}
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '6px 8px',
                  borderRadius: theme.radii.md,
                  border: `1px solid ${panelColors.border}`,
                  backgroundColor: theme.colors.background.sunken,
                  color: theme.colors.text.primary,
                  fontSize: theme.typography.sizes.sm.fontSize,
                } as React.CSSProperties}
              >
                <option value="">All channels</option>
                {channels.map((ch) => (
                  <option key={ch.id} value={ch.id}>
                    {ch.name}
                  </option>
                ))}
              </select>
            ) : (
              <Input
                placeholder="Channel name"
                value={filters.inChannel ?? ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  update({ inChannel: e.target.value })
                }
                disabled={loading}
                fullWidth
              />
            )}
          </div>

          {/* Before date */}
          <div style={fieldGroupStyle as React.CSSProperties}>
            <label style={labelStyle as React.CSSProperties}>Before date</label>
            <Input
              type="date"
              value={filters.before ?? ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                update({ before: e.target.value })
              }
              disabled={loading}
              fullWidth
            />
          </div>

          {/* After date */}
          <div style={fieldGroupStyle as React.CSSProperties}>
            <label style={labelStyle as React.CSSProperties}>After date</label>
            <Input
              type="date"
              value={filters.after ?? ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                update({ after: e.target.value })
              }
              disabled={loading}
              fullWidth
            />
          </div>
        </div>

        {/* Boolean toggles */}
        <div style={toggleRowStyle as React.CSSProperties}>
          <div style={toggleItemStyle as React.CSSProperties}>
            <Toggle
              checked={filters.hasFile ?? false}
              onChange={(checked: boolean) => update({ hasFile: checked })}
              disabled={loading}
              size="sm"
            />
            <span style={labelStyle as React.CSSProperties}>Has file</span>
          </div>

          <div style={toggleItemStyle as React.CSSProperties}>
            <Toggle
              checked={filters.hasReaction ?? false}
              onChange={(checked: boolean) => update({ hasReaction: checked })}
              disabled={loading}
              size="sm"
            />
            <span style={labelStyle as React.CSSProperties}>Has reaction</span>
          </div>

          <div style={toggleItemStyle as React.CSSProperties}>
            <Toggle
              checked={filters.isPinned ?? false}
              onChange={(checked: boolean) => update({ isPinned: checked })}
              disabled={loading}
              size="sm"
            />
            <span style={labelStyle as React.CSSProperties}>Is pinned</span>
          </div>
        </div>

        {/* Footer */}
        <div style={footerStyle as React.CSSProperties}>
          {onReset && (
            <Button
              variant="secondary"
              size="sm"
              onClick={onReset}
              disabled={loading}
            >
              Reset
            </Button>
          )}
          {onSearch && (
            <Button
              variant="primary"
              size="sm"
              onClick={onSearch}
              disabled={loading}
              isLoading={loading}
            >
              Search
            </Button>
          )}
        </div>
      </div>
    );
  },
);

AdvancedSearchPanel.displayName = 'AdvancedSearchPanel';

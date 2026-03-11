/**
 * @module FileTypeAllowlistSettings
 */
import React, { forwardRef, useMemo, useState } from 'react';
import type { FileTypeAllowlistSettingsProps } from '@coexist/wisp-core/types/FileTypeAllowlistSettings.types';
import {
  buildAllowlistRootStyle,
  buildAllowlistSectionTitleStyle,
  buildAllowlistPresetRowStyle,
  buildAllowlistPresetChipStyle,
  buildAllowlistTagListStyle,
  buildAllowlistTagStyle,
  buildAllowlistTagRemoveStyle,
  buildAllowlistEmptyStyle,
} from '@coexist/wisp-core/styles/FileTypeAllowlistSettings.styles';
import { useTheme } from '../../providers';

// ---------------------------------------------------------------------------
// FileTypeAllowlistSettings
// ---------------------------------------------------------------------------

/**
 * FileTypeAllowlistSettings — settings panel for managing file type allow/blocklists.
 *
 * @example
 * ```tsx
 * <FileTypeAllowlistSettings
 *   allowedTypes={['image/*', 'application/pdf']}
 *   blockedTypes={['.exe', '.bat']}
 *   onUpdate={(allowed, blocked) => save(allowed, blocked)}
 *   presets={[
 *     { label: 'Images', types: ['image/*'] },
 *     { label: 'Documents', types: ['application/pdf', '.doc', '.docx'] },
 *   ]}
 * />
 * ```
 */
export const FileTypeAllowlistSettings = forwardRef<HTMLDivElement, FileTypeAllowlistSettingsProps>(
  function FileTypeAllowlistSettings(
    {
      allowedTypes,
      blockedTypes,
      onUpdate,
      presets = [],
      skeleton = false,
      style: userStyle,
      className,
      ...rest
    },
    ref,
  ) {
    const { theme } = useTheme();
    const [addInput, setAddInput] = useState('');

    const rootStyle = useMemo(() => buildAllowlistRootStyle(theme), [theme]);
    const titleStyle = useMemo(() => buildAllowlistSectionTitleStyle(theme), [theme]);
    const presetRowStyle = useMemo(() => buildAllowlistPresetRowStyle(theme), [theme]);
    const tagListStyle = useMemo(() => buildAllowlistTagListStyle(theme), [theme]);
    const emptyStyle = useMemo(() => buildAllowlistEmptyStyle(theme), [theme]);

    const handleRemoveAllowed = (type: string) => {
      onUpdate(allowedTypes.filter(t => t !== type), blockedTypes);
    };

    const handleRemoveBlocked = (type: string) => {
      onUpdate(allowedTypes, blockedTypes.filter(t => t !== type));
    };

    const handlePresetToggle = (types: string[]) => {
      // If all types in the preset are already allowed, remove them; otherwise add them
      const allPresent = types.every(t => allowedTypes.includes(t));
      if (allPresent) {
        onUpdate(allowedTypes.filter(t => !types.includes(t)), blockedTypes);
      } else {
        const newAllowed = [...new Set([...allowedTypes, ...types])];
        onUpdate(newAllowed, blockedTypes);
      }
    };

    const isPresetActive = (types: string[]) => types.every(t => allowedTypes.includes(t));

    return (
      <div ref={ref} className={className} style={{ ...rootStyle, ...userStyle }} data-testid="file-type-allowlist-settings" {...rest}>
        {/* Presets */}
        {presets.length > 0 && (
          <>
            <div style={titleStyle}>Quick Presets</div>
            <div style={presetRowStyle}>
              {presets.map(preset => (
                <button
                  key={preset.label}
                  type="button"
                  style={buildAllowlistPresetChipStyle(theme, isPresetActive(preset.types))}
                  onClick={() => handlePresetToggle(preset.types)}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </>
        )}

        {/* Allowed types */}
        <div style={titleStyle}>Allowed Types</div>
        {allowedTypes.length === 0 ? (
          <div style={emptyStyle}>All file types are allowed</div>
        ) : (
          <div style={tagListStyle}>
            {allowedTypes.map(type => (
              <span key={type} style={buildAllowlistTagStyle(theme, 'allowed')}>
                {type}
                <button type="button" style={buildAllowlistTagRemoveStyle(theme)} onClick={() => handleRemoveAllowed(type)} aria-label={`Remove ${type}`}>
                  {'\u00D7'}
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Blocked types */}
        <div style={titleStyle}>Blocked Types</div>
        {blockedTypes.length === 0 ? (
          <div style={emptyStyle}>No file types are blocked</div>
        ) : (
          <div style={tagListStyle}>
            {blockedTypes.map(type => (
              <span key={type} style={buildAllowlistTagStyle(theme, 'blocked')}>
                {type}
                <button type="button" style={buildAllowlistTagRemoveStyle(theme)} onClick={() => handleRemoveBlocked(type)} aria-label={`Remove ${type}`}>
                  {'\u00D7'}
                </button>
              </span>
            ))}
          </div>
        )}
      </div>
    );
  },
);

FileTypeAllowlistSettings.displayName = 'FileTypeAllowlistSettings';

import React, { forwardRef, useMemo, useState, useCallback } from 'react';
import { User } from 'lucide-react';
import type { AvatarProps } from '@coexist/wisp-core/types/Avatar.types';
import { avatarSizeMap } from '@coexist/wisp-core/types/Avatar.types';
import {
  buildContainerStyle,
  buildInnerStyle,
  buildImageStyle,
  buildInitialsStyle,
  buildStatusStyle,
  buildSkeletonStyle,
  extractInitials,
} from '@coexist/wisp-core/styles/Avatar.styles';
import { useTheme } from '../../providers';

/**
 * Avatar — Displays a user or entity representation as an image, initials, or icon.
 *
 * @remarks
 * Key features:
 * - Image source with automatic error fallback to initials or icon.
 * - Five size presets (`xs` through `xl`) and two shapes (`circle`, `square`).
 * - Optional status indicator dot (`online`, `offline`, `busy`, `away`).
 * - Built-in skeleton loading state.
 * - Forwards a ref to the outer `<div>` wrapper.
 *
 * @module primitives/avatar
 * @example
 * ```tsx
 * <Avatar src="/photo.jpg" name="Ada Lovelace" size="lg" />
 * <Avatar name="Grace Hopper" status="online" />
 * <Avatar skeleton size="md" />
 * ```
 */
export const Avatar = forwardRef<HTMLDivElement, AvatarProps>(function Avatar(
  {
    src,
    alt,
    name,
    size = 'md',
    shape = 'circle',
    fallbackIcon: FallbackIcon = User,
    status,
    skeleton = false,
    onSurface = false,
    className,
    style: userStyle,
    ...rest
  },
  ref,
) {
  const { theme } = useTheme();
  const themeColors = theme.colors;
  const sizeConfig = avatarSizeMap[size];
  const [imgError, setImgError] = useState(false);

  const handleImgError = useCallback(() => {
    setImgError(true);
  }, []);

  const containerStyle = useMemo(
    () => buildContainerStyle(sizeConfig, shape, theme),
    [sizeConfig, shape, theme],
  );

  const innerStyle = useMemo(
    () => buildInnerStyle(sizeConfig, shape, theme, onSurface),
    [sizeConfig, shape, theme, onSurface],
  );

  const imgStyle = useMemo(() => buildImageStyle(), [theme]);

  const initialsStyle = useMemo(
    () => buildInitialsStyle(sizeConfig, theme, onSurface),
    [sizeConfig, theme, onSurface],
  );

  if (skeleton) {
    const skeletonStyle = buildSkeletonStyle(sizeConfig, shape, theme);
    return (
      <div
        aria-hidden
        data-testid="avatar-skeleton"
        className={className}
        style={{ ...skeletonStyle, ...userStyle }}
      />
    );
  }

  const initials = name ? extractInitials(name) : '';
  const showImage = src && !imgError;

  const renderContent = () => {
    if (showImage) {
      return (
        <img
          src={src}
          alt={alt || name || 'Avatar'}
          style={imgStyle}
          onError={handleImgError}
        />
      );
    }

    if (initials) {
      return <span style={initialsStyle}>{initials}</span>;
    }

    return (
      <FallbackIcon
        size={sizeConfig.iconSize}
        color={onSurface ? themeColors.background.surface : themeColors.text.inverse}
        strokeWidth={2}
      />
    );
  };

  return (
    <div
      ref={ref}
      className={className}
      style={{ ...containerStyle, ...userStyle }}
      role="img"
      aria-label={alt || name || 'Avatar'}
      {...rest}
    >
      <div style={innerStyle}>
        {renderContent()}
      </div>
      {status && (
        <span
          style={buildStatusStyle(sizeConfig, status, shape, theme)}
          aria-hidden
        />
      )}
    </div>
  );
});

Avatar.displayName = 'Avatar';

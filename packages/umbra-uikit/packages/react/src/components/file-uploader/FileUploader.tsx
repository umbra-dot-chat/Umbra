/**
 * @module FileUploader
 */
import React, { forwardRef, useRef, useState, useCallback, useMemo } from 'react';
import type { FileUploaderProps } from '@coexist/wisp-core/types/FileUploader.types';
import {
  buildDropzoneStyle,
  buildDropzoneIconStyle,
  buildDropzoneTitleStyle,
  buildDropzoneDescriptionStyle,
  buildDropzoneLinkStyle,
} from '@coexist/wisp-core/styles/FileUploader.styles';
import { useTheme } from '../../providers';

/**
 * FileUploader — Drag-and-drop file upload for the Wisp design system.
 *
 * @remarks
 * A dropzone component supporting click-to-browse and drag-and-drop with
 * file type and size validation.
 *
 * @example
 * ```tsx
 * <FileUploader
 *   accept="image/*"
 *   maxSize={5 * 1024 * 1024}
 *   onChange={(files) => console.log(files)}
 * />
 * ```
 */
export const FileUploader = forwardRef<HTMLDivElement, FileUploaderProps>(function FileUploader(
  {
    accept,
    multiple = false,
    maxSize,
    maxFiles,
    onChange,
    onReject,
    disabled = false,
    title,
    description,
    icon: Icon,
    style: userStyle,
    className,
    ...rest
  },
  ref,
) {
  const { theme } = useTheme();
  const themeColors = theme.colors;
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const dropzoneStyle = useMemo(
    () => buildDropzoneStyle(theme, isDragOver, disabled),
    [theme, isDragOver, disabled],
  );
  const iconStyle = useMemo(
    () => buildDropzoneIconStyle(theme),
    [theme],
  );
  const titleStyle = useMemo(
    () => buildDropzoneTitleStyle(theme),
    [theme],
  );
  const descriptionStyle = useMemo(
    () => buildDropzoneDescriptionStyle(theme),
    [theme],
  );
  const linkStyle = useMemo(
    () => buildDropzoneLinkStyle(theme),
    [theme],
  );

  const processFiles = useCallback(
    (fileList: FileList | null) => {
      if (!fileList || disabled) return;
      const files = Array.from(fileList);
      const accepted: File[] = [];

      for (const file of files) {
        if (maxSize && file.size > maxSize) {
          onReject?.(file, `File exceeds maximum size of ${(maxSize / 1024 / 1024).toFixed(1)}MB`);
          continue;
        }
        accepted.push(file);
      }

      const limited = maxFiles ? accepted.slice(0, maxFiles) : accepted;
      if (limited.length > 0) {
        onChange?.(limited);
      }
    },
    [disabled, maxSize, maxFiles, onChange, onReject],
  );

  const handleClick = useCallback(() => {
    if (!disabled) inputRef.current?.click();
  }, [disabled]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragOver(true);
  }, [disabled]);

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      processFiles(e.dataTransfer.files);
    },
    [processFiles],
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      processFiles(e.target.files);
      // Reset input so same file can be re-selected
      if (inputRef.current) inputRef.current.value = '';
    },
    [processFiles],
  );

  // Default icon: upload cloud
  const DefaultIcon = () => (
    <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );

  const DisplayIcon = Icon || DefaultIcon;

  return (
    <div
      ref={ref}
      className={className}
      style={{ ...dropzoneStyle, ...userStyle }}
      onClick={handleClick}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-disabled={disabled || undefined}
      {...rest}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleInputChange}
        style={{ display: 'none' }}
        tabIndex={-1}
      />

      <div style={iconStyle}>
        <DisplayIcon size={22} color="currentColor" strokeWidth={2} />
      </div>

      <div style={titleStyle}>
        {title || (
          <span>
            <span style={linkStyle}>Click to upload</span> or drag and drop
          </span>
        )}
      </div>

      {(description || accept || maxSize) && (
        <div style={descriptionStyle}>
          {description || [
            accept && `${accept}`,
            maxSize && `up to ${(maxSize / 1024 / 1024).toFixed(0)}MB`,
          ].filter(Boolean).join(' · ')}
        </div>
      )}
    </div>
  );
});

FileUploader.displayName = 'FileUploader';

/**
 * Import Hooks
 *
 * React hooks for importing chat history.
 *
 * @packageDocumentation
 */

import { useState, useCallback, useMemo } from 'react';
import type {
  ImportSource,
  ImportSourceInfo,
  ImportParseResult,
  ImportProgress,
  ImportResult,
  ImportOptions,
} from './types';
import {
  getImportSources,
  getImportSourceInfo,
  parseImportFile,
  detectImportSource,
  importChatData,
  getImportPreview,
} from './api';

/**
 * Hook for managing import sources.
 */
export function useImportSources() {
  const sources = useMemo(() => getImportSources(), []);

  const getSourceInfo = useCallback((source: ImportSource) => {
    return getImportSourceInfo(source);
  }, []);

  return {
    sources,
    getSourceInfo,
  };
}

/**
 * State for the import process.
 */
export interface UseImportState {
  /** Currently selected source. */
  selectedSource: ImportSource | null;
  /** Selected file for import. */
  selectedFile: File | null;
  /** Parsed import data. */
  parseResult: ImportParseResult | null;
  /** Import result after completion. */
  importResult: ImportResult | null;
  /** Current import progress. */
  progress: ImportProgress | null;
  /** Whether parsing is in progress. */
  isParsing: boolean;
  /** Whether import is in progress. */
  isImporting: boolean;
  /** Error message if any. */
  error: string | null;
}

/**
 * Hook for managing the import process.
 */
export function useImport() {
  const [selectedSource, setSelectedSource] = useState<ImportSource | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parseResult, setParseResult] = useState<ImportParseResult | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [progress, setProgress] = useState<ImportProgress | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Select a file and optionally auto-detect the source.
   */
  const selectFile = useCallback(async (file: File, autoDetect = true) => {
    setSelectedFile(file);
    setError(null);
    setParseResult(null);
    setImportResult(null);

    if (autoDetect) {
      try {
        const detected = await detectImportSource(file);
        if (detected) {
          setSelectedSource(detected);
        }
      } catch {
        // Auto-detection failed, user will need to select manually
      }
    }
  }, []);

  /**
   * Select an import source.
   */
  const selectSource = useCallback((source: ImportSource) => {
    setSelectedSource(source);
    setError(null);
  }, []);

  /**
   * Parse the selected file.
   */
  const parseFile = useCallback(async () => {
    if (!selectedFile || !selectedSource) {
      setError('Please select a file and import source');
      return null;
    }

    setIsParsing(true);
    setError(null);
    setParseResult(null);

    try {
      const result = await parseImportFile(selectedFile, selectedSource);

      if (result.errors.length > 0 && result.conversations.length === 0) {
        setError(result.errors.join('. '));
        return null;
      }

      setParseResult(result);
      return result;
    } catch (err: any) {
      setError(err.message || 'Failed to parse import file');
      return null;
    } finally {
      setIsParsing(false);
    }
  }, [selectedFile, selectedSource]);

  /**
   * Execute the import.
   */
  const executeImport = useCallback(
    async (options: ImportOptions = {}) => {
      if (!parseResult) {
        setError('Please parse the file first');
        return null;
      }

      setIsImporting(true);
      setError(null);
      setProgress(null);

      try {
        const result = await importChatData(parseResult, {
          ...options,
          onProgress: (p) => {
            setProgress(p);
            options.onProgress?.(p);
          },
        });

        setImportResult(result);

        if (!result.success) {
          setError(result.errors.join('. '));
        }

        return result;
      } catch (err: any) {
        setError(err.message || 'Failed to import data');
        return null;
      } finally {
        setIsImporting(false);
      }
    },
    [parseResult]
  );

  /**
   * Get a preview of the import.
   */
  const preview = useMemo(() => {
    if (!parseResult) return null;
    return getImportPreview(parseResult);
  }, [parseResult]);

  /**
   * Reset the import state.
   */
  const reset = useCallback(() => {
    setSelectedSource(null);
    setSelectedFile(null);
    setParseResult(null);
    setImportResult(null);
    setProgress(null);
    setIsParsing(false);
    setIsImporting(false);
    setError(null);
  }, []);

  return {
    // State
    selectedSource,
    selectedFile,
    parseResult,
    importResult,
    progress,
    isParsing,
    isImporting,
    error,
    preview,

    // Actions
    selectSource,
    selectFile,
    parseFile,
    executeImport,
    reset,
  };
}

/**
 * Hook for getting import source info.
 */
export function useImportSourceInfo(source: ImportSource | null): ImportSourceInfo | null {
  return useMemo(() => {
    if (!source) return null;
    return getImportSourceInfo(source);
  }, [source]);
}

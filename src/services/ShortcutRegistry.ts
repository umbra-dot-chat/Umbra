/**
 * ShortcutRegistry — Global keyboard shortcut manager.
 *
 * Plugins register shortcuts via PluginAPI.registerShortcut().
 * The registry listens to keydown events and dispatches to handlers.
 */

export interface PluginShortcut {
  id: string;
  label: string;
  /** Key combo string, e.g. "ctrl+shift+r" */
  keys: string;
  onTrigger: () => void;
  /** Category for grouping in settings UI */
  category?: string;
}

interface ParsedCombo {
  ctrl: boolean;
  shift: boolean;
  alt: boolean;
  meta: boolean;
  key: string;
}

function parseCombo(keys: string): ParsedCombo {
  const parts = keys.toLowerCase().split('+').map((s) => s.trim());
  return {
    ctrl: parts.includes('ctrl') || parts.includes('control'),
    shift: parts.includes('shift'),
    alt: parts.includes('alt'),
    meta: parts.includes('meta') || parts.includes('cmd') || parts.includes('command'),
    key: parts.filter((p) =>
      p !== 'ctrl' && p !== 'control' && p !== 'shift' && p !== 'alt' &&
      p !== 'meta' && p !== 'cmd' && p !== 'command'
    )[0] ?? '',
  };
}

function matchesEvent(combo: ParsedCombo, event: KeyboardEvent): boolean {
  return (
    combo.ctrl === (event.ctrlKey || event.metaKey) &&
    combo.shift === event.shiftKey &&
    combo.alt === event.altKey &&
    combo.key === event.key.toLowerCase()
  );
}

class ShortcutRegistryImpl {
  private shortcuts = new Map<string, { pluginId: string; shortcut: PluginShortcut; combo: ParsedCombo }>();
  private listening = false;
  private handler: ((e: KeyboardEvent) => void) | null = null;

  register(pluginId: string, shortcut: PluginShortcut): () => void {
    const fullId = `${pluginId}:${shortcut.id}`;
    const combo = parseCombo(shortcut.keys);

    this.shortcuts.set(fullId, { pluginId, shortcut, combo });
    this.ensureListener();

    return () => {
      this.shortcuts.delete(fullId);
      if (this.shortcuts.size === 0) {
        this.removeListener();
      }
    };
  }

  getAll(): Map<string, PluginShortcut[]> {
    const grouped = new Map<string, PluginShortcut[]>();
    for (const { pluginId, shortcut } of this.shortcuts.values()) {
      const list = grouped.get(pluginId) ?? [];
      list.push(shortcut);
      grouped.set(pluginId, list);
    }
    return grouped;
  }

  getAllFlat(): Array<{ pluginId: string; shortcut: PluginShortcut }> {
    return Array.from(this.shortcuts.values()).map(({ pluginId, shortcut }) => ({
      pluginId,
      shortcut,
    }));
  }

  handleKeyEvent(event: KeyboardEvent): boolean {
    for (const { combo, shortcut } of this.shortcuts.values()) {
      if (matchesEvent(combo, event)) {
        event.preventDefault();
        event.stopPropagation();
        try { shortcut.onTrigger(); } catch { /* ignore */ }
        return true;
      }
    }
    return false;
  }

  private ensureListener(): void {
    if (this.listening || typeof document === 'undefined') return;
    this.handler = (e: KeyboardEvent) => this.handleKeyEvent(e);
    document.addEventListener('keydown', this.handler, true);
    this.listening = true;
  }

  private removeListener(): void {
    if (!this.listening || !this.handler) return;
    document.removeEventListener('keydown', this.handler, true);
    this.handler = null;
    this.listening = false;
  }

  clear(): void {
    this.shortcuts.clear();
    this.removeListener();
  }
}

/** Global singleton */
export const ShortcutRegistry = new ShortcutRegistryImpl();

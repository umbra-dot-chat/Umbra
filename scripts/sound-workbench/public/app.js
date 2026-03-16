/* Sound Workbench — React UI */
/* eslint-disable */

const { useState, useEffect, useRef, useCallback } = React;

// ─────────────────────────────────────────────────────────────────────────────
// API helpers
// ─────────────────────────────────────────────────────────────────────────────

const api = {
  async getConfig() {
    const r = await fetch('/api/config');
    return r.json();
  },
  async getThemes() {
    const r = await fetch('/api/themes');
    return r.json();
  },
  async getTheme(name) {
    const r = await fetch(`/api/theme/${name}`);
    if (!r.ok) return null;
    return r.json();
  },
  async createTheme(name, mood) {
    const r = await fetch('/api/theme', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, mood }),
    });
    return r.json();
  },
  async generate(theme, soundName, prompt, duration_seconds, prompt_influence) {
    const r = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ theme, soundName, prompt, duration_seconds, prompt_influence }),
    });
    return r.json();
  },
  async approve(theme, soundName, file) {
    const r = await fetch('/api/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ theme, soundName, file }),
    });
    return r.json();
  },
  async unapprove(theme, soundName) {
    const r = await fetch('/api/unapprove', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ theme, soundName }),
    });
    return r.json();
  },
  async deleteVariant(theme, sound, file) {
    const r = await fetch(`/api/variant/${theme}/${sound}/${file}`, { method: 'DELETE' });
    return r.json();
  },
  async exportTheme(theme) {
    const r = await fetch('/api/export', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ theme }),
    });
    return r.json();
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Audio player (singleton to avoid overlapping sounds)
// ─────────────────────────────────────────────────────────────────────────────

let currentAudio = null;
let currentPlayingId = null;

function playAudio(url, id, onEnd) {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
  }
  if (currentPlayingId === id) {
    currentPlayingId = null;
    if (onEnd) onEnd();
    return;
  }
  const audio = new Audio(url);
  currentAudio = audio;
  currentPlayingId = id;
  audio.play();
  audio.onended = () => {
    currentPlayingId = null;
    currentAudio = null;
    if (onEnd) onEnd();
  };
}

function stopAudio() {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null;
    currentPlayingId = null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Components
// ─────────────────────────────────────────────────────────────────────────────

function PlayButton({ url, id }) {
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setPlaying(currentPlayingId === id);
    }, 100);
    return () => clearInterval(interval);
  }, [id]);

  return (
    <button
      className={`btn-play ${playing ? 'playing' : ''}`}
      onClick={() => {
        playAudio(url, id, () => setPlaying(false));
        setPlaying(currentPlayingId !== id);
      }}
      title={playing ? 'Stop' : 'Play'}
    >
      {playing ? '\u25A0' : '\u25B6'}
    </button>
  );
}

function VariantRow({ theme, soundName, variant, isApproved, onApprove, onDelete, onRefresh }) {
  const url = `/api/audio/${theme}/${soundName}/${variant.file}`;
  const playId = `${theme}/${soundName}/${variant.file}`;

  return (
    <div className={`variant-row ${isApproved ? 'is-approved' : ''}`}>
      <PlayButton url={url} id={playId} />
      <div className="variant-info" title={variant.prompt}>
        {variant.prompt?.substring(0, 60)}
        {variant.prompt?.length > 60 ? '...' : ''}
        <span style={{ marginLeft: 8, opacity: 0.5 }}>
          {new Date(variant.created).toLocaleTimeString()}
        </span>
      </div>
      <div className="variant-actions">
        {isApproved ? (
          <button className="btn btn-success btn-sm" onClick={onApprove} title="Unapprove">
            \u2713 Approved
          </button>
        ) : (
          <button className="btn btn-sm" onClick={onApprove} title="Approve this variant">
            \u2713
          </button>
        )}
        <button className="btn-danger" onClick={onDelete} title="Delete variant">\u2715</button>
      </div>
    </div>
  );
}

function CompareBar({ theme, soundName, variants }) {
  if (variants.length < 2) return null;

  const playVariant = (idx) => {
    const v = variants[idx];
    const url = `/api/audio/${theme}/${soundName}/${v.file}`;
    playAudio(url, `compare-${idx}-${v.file}`);
  };

  return (
    <div className="compare-bar">
      <span style={{ color: 'var(--text-muted)', marginRight: 4 }}>Compare:</span>
      {variants.map((v, i) => (
        <button key={v.file} className="btn btn-sm" onClick={() => playVariant(i)}>
          <span className="compare-label">{String.fromCharCode(65 + i)}</span>
        </button>
      ))}
      <button className="btn btn-sm" onClick={() => {
        // Play all in sequence with 500ms gap
        let idx = 0;
        const playNext = () => {
          if (idx >= variants.length) return;
          const v = variants[idx];
          const url = `/api/audio/${theme}/${soundName}/${v.file}`;
          const audio = new Audio(url);
          currentAudio = audio;
          currentPlayingId = `seq-${v.file}`;
          audio.play();
          audio.onended = () => {
            idx++;
            setTimeout(playNext, 500);
          };
        };
        stopAudio();
        playNext();
      }}>
        All \u25B6
      </button>
    </div>
  );
}

function SoundCard({ theme, soundName, soundData, config, mood, onRefresh }) {
  const category = config.soundToCategory[soundName];
  const defaultDuration = config.defaultDurations[category] || 1.0;
  const defaultPrompt = mood
    ? `${mood}: ${config.defaultPrompts[soundName]}`
    : config.defaultPrompts[soundName];

  const [prompt, setPrompt] = useState(soundData?.prompt || defaultPrompt || '');
  const [duration, setDuration] = useState(defaultDuration);
  const [influence, setInfluence] = useState(0.5);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);

  const variants = soundData?.variants || [];
  const approved = soundData?.approved || null;

  const status = approved ? 'approved' : variants.length > 0 ? 'variants' : 'pending';
  const statusLabels = { pending: 'Pending', variants: `${variants.length} variants`, approved: 'Approved' };

  const handleGenerate = async () => {
    setGenerating(true);
    setError(null);
    try {
      const result = await api.generate(theme, soundName, prompt, duration, influence);
      if (result.error) throw new Error(result.error);
      onRefresh();
    } catch (e) {
      setError(e.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleApprove = async (file) => {
    if (approved === file) {
      await api.unapprove(theme, soundName);
    } else {
      await api.approve(theme, soundName, file);
    }
    onRefresh();
  };

  const handleDelete = async (file) => {
    await api.deleteVariant(theme, soundName, file);
    onRefresh();
  };

  return (
    <div className={`sound-card ${status === 'approved' ? 'approved' : ''}`}>
      <div className="sound-card-header">
        <span className="sound-name">{soundName}</span>
        <span className={`status-badge status-${status}`}>{statusLabels[status]}</span>
      </div>

      <div className="gen-controls">
        <div className="gen-prompt">
          <label>Prompt</label>
          <textarea
            rows="2"
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            placeholder="Describe the sound you want..."
          />
        </div>
        <div className="gen-slider">
          <label>Duration: {duration.toFixed(1)}s</label>
          <input
            type="range" min="0.3" max="5.0" step="0.1"
            value={duration}
            onChange={e => setDuration(parseFloat(e.target.value))}
          />
        </div>
        <div className="gen-slider">
          <label>Influence: {influence.toFixed(1)}</label>
          <input
            type="range" min="0" max="1" step="0.1"
            value={influence}
            onChange={e => setInfluence(parseFloat(e.target.value))}
          />
        </div>
        <button
          className="btn btn-primary"
          onClick={handleGenerate}
          disabled={generating || !prompt.trim()}
          style={{ alignSelf: 'flex-end', marginBottom: 2 }}
        >
          {generating ? <><span className="spinner"></span> Generating...</> : 'Generate'}
        </button>
      </div>

      {error && (
        <div style={{ color: 'var(--red)', fontSize: 13, marginBottom: 8 }}>{error}</div>
      )}

      {variants.length > 0 && (
        <>
          <CompareBar theme={theme} soundName={soundName} variants={variants} />
          <div className="variants">
            {/* Show approved first */}
            {variants
              .sort((a, b) => (a.file === approved ? -1 : b.file === approved ? 1 : 0))
              .map(v => (
                <VariantRow
                  key={v.file}
                  theme={theme}
                  soundName={soundName}
                  variant={v}
                  isApproved={v.file === approved}
                  onApprove={() => handleApprove(v.file)}
                  onDelete={() => handleDelete(v.file)}
                  onRefresh={onRefresh}
                />
              ))}
          </div>
        </>
      )}
    </div>
  );
}

function CategorySection({ catId, catInfo, theme, manifest, config, mood, onRefresh }) {
  const [open, setOpen] = useState(true);
  const sounds = catInfo.sounds;
  const approvedCount = sounds.filter(s => manifest?.sounds?.[s]?.approved).length;
  const allApproved = approvedCount === sounds.length;

  return (
    <div className="category">
      <div className="category-header" onClick={() => setOpen(!open)}>
        <div className="category-title">
          <span className={`category-chevron ${open ? 'open' : ''}`}>\u25B6</span>
          {catInfo.label}
          <span className={`category-badge ${allApproved ? 'complete' : ''}`}>
            {approvedCount}/{sounds.length}
          </span>
        </div>
      </div>
      {open && (
        <div className="category-body">
          {sounds.map(s => (
            <SoundCard
              key={s}
              theme={theme}
              soundName={s}
              soundData={manifest?.sounds?.[s]}
              config={config}
              mood={mood}
              onRefresh={onRefresh}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ExportModal({ snippet, outputDir, onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2>Theme Exported!</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>
          Files copied to: <code style={{ color: 'var(--green)' }}>{outputDir}</code>
        </p>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 8 }}>
          Add these to <code>SoundEngine.ts</code> to register the theme:
        </p>
        <pre>{snippet}</pre>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
          <button className="btn" onClick={() => {
            navigator.clipboard.writeText(snippet);
          }}>Copy Snippet</button>
          <button className="btn btn-primary" onClick={onClose}>Done</button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// App
// ─────────────────────────────────────────────────────────────────────────────

function App() {
  const [config, setConfig] = useState(null);
  const [themeName, setThemeName] = useState('');
  const [mood, setMood] = useState('');
  const [manifest, setManifest] = useState(null);
  const [existingThemes, setExistingThemes] = useState([]);
  const [exportResult, setExportResult] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [themeActive, setThemeActive] = useState(false);

  // Load config on mount
  useEffect(() => {
    api.getConfig().then(setConfig);
    api.getThemes().then(setExistingThemes);
  }, []);

  const refreshManifest = useCallback(async () => {
    if (!themeName) return;
    const m = await api.getTheme(themeName);
    if (m) {
      setManifest(m);
      setMood(m.mood || mood);
    }
  }, [themeName]);

  const activateTheme = async () => {
    if (!themeName || !/^[a-z0-9-]+$/.test(themeName)) return;
    const m = await api.createTheme(themeName, mood);
    setManifest(m);
    setThemeActive(true);
    setExistingThemes(await api.getThemes());
  };

  const loadTheme = async (name) => {
    setThemeName(name);
    const m = await api.getTheme(name);
    if (m) {
      setManifest(m);
      setMood(m.mood || '');
      setThemeActive(true);
    }
  };

  const updateMood = async () => {
    if (!themeName) return;
    await api.createTheme(themeName, mood);
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const result = await api.exportTheme(themeName);
      if (result.error) {
        alert(result.error);
      } else {
        setExportResult(result);
      }
    } catch (e) {
      alert(e.message);
    } finally {
      setExporting(false);
    }
  };

  if (!config) return <div style={{ padding: 40, textAlign: 'center' }}><span className="spinner"></span></div>;

  const approvedCount = config.allSounds.filter(s => manifest?.sounds?.[s]?.approved).length;
  const totalSounds = config.allSounds.length;

  return (
    <div>
      <h1 style={{ fontSize: 22, marginBottom: 4 }}>Sound Workbench</h1>
      <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 20 }}>
        Generate, audition, and approve AI sounds for Umbra
      </p>

      {!config.hasApiKey && (
        <div className="warning-banner">
          ElevenLabs API key not configured. Add <code>ELEVENLABS_API_KEY</code> to{' '}
          <code>scripts/sound-workbench/.env</code> and restart the server.
        </div>
      )}

      {/* Existing themes */}
      {!themeActive && existingThemes.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <label>Resume existing theme</label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
            {existingThemes.map(t => (
              <button key={t} className="btn" onClick={() => loadTheme(t)}>{t}</button>
            ))}
          </div>
        </div>
      )}

      {/* Theme header */}
      <div className="header">
        <div className="header-left">
          <div>
            <label>Theme Name</label>
            <input
              type="text"
              value={themeName}
              onChange={e => setThemeName(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
              placeholder="e.g. crystal-cave"
              disabled={themeActive}
            />
          </div>
          <div>
            <label>Mood / Style (prepended to all prompts)</label>
            <textarea
              rows="2"
              value={mood}
              onChange={e => setMood(e.target.value)}
              onBlur={themeActive ? updateMood : undefined}
              placeholder="e.g. ethereal, crystalline, ambient, gentle reverb"
            />
          </div>
          {!themeActive && (
            <button
              className="btn btn-primary"
              onClick={activateTheme}
              disabled={!themeName || !/^[a-z0-9-]+$/.test(themeName)}
            >
              Start Theme
            </button>
          )}
        </div>

        {themeActive && (
          <div className="header-right">
            <div className="progress-text">{approvedCount}/{totalSounds} sounds approved</div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${(approvedCount / totalSounds) * 100}%` }}></div>
            </div>
            <button
              className="btn btn-primary"
              onClick={handleExport}
              disabled={approvedCount < totalSounds || exporting}
            >
              {exporting ? <><span className="spinner"></span> Exporting...</> : `Export Theme (${approvedCount}/${totalSounds})`}
            </button>
            {approvedCount > 0 && approvedCount < totalSounds && (
              <button
                className="btn btn-sm"
                onClick={() => {
                  // Play all approved in sequence
                  const approved = config.allSounds
                    .filter(s => manifest?.sounds?.[s]?.approved)
                    .map(s => ({
                      name: s,
                      url: `/api/audio/${themeName}/${s}/${manifest.sounds[s].approved}`,
                    }));
                  let idx = 0;
                  const playNext = () => {
                    if (idx >= approved.length) return;
                    const { url, name } = approved[idx];
                    const audio = new Audio(url);
                    currentAudio = audio;
                    currentPlayingId = `preview-${name}`;
                    audio.play();
                    audio.onended = () => { idx++; setTimeout(playNext, 300); };
                  };
                  stopAudio();
                  playNext();
                }}
              >
                Preview Approved
              </button>
            )}
          </div>
        )}
      </div>

      {/* Category grid */}
      {themeActive && Object.entries(config.categories).map(([catId, catInfo]) => (
        <CategorySection
          key={catId}
          catId={catId}
          catInfo={catInfo}
          theme={themeName}
          manifest={manifest}
          config={config}
          mood={mood}
          onRefresh={refreshManifest}
        />
      ))}

      {exportResult && (
        <ExportModal
          snippet={exportResult.snippet}
          outputDir={exportResult.outputDir}
          onClose={() => setExportResult(null)}
        />
      )}
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);

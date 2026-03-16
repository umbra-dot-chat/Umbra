#!/usr/bin/env node
/**
 * Sound Workbench — Express server for AI sound generation + management.
 *
 * Proxies ElevenLabs Sound Effects API, manages generated variants on disk,
 * and serves the workbench UI.
 */

require('dotenv').config();
const express = require('express');
const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');
const ffmpegPath = require('ffmpeg-static');

const app = express();
const PORT = process.env.PORT || 3456;
const WORKING = path.join(__dirname, 'working');
const ASSETS = path.resolve(__dirname, '../../assets/sounds');

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ─────────────────────────────────────────────────────────────────────────────
// Sound definitions (mirrors SoundEngine.ts)
// ─────────────────────────────────────────────────────────────────────────────

const CATEGORIES = {
  message:    { label: 'Messages',    sounds: ['message_send', 'message_receive', 'message_delete', 'mention'] },
  call:       { label: 'Calls',       sounds: ['call_join', 'call_leave', 'call_ringing', 'user_join_voice', 'user_leave_voice', 'call_mute', 'call_unmute'] },
  navigation: { label: 'Navigation',  sounds: ['tab_switch', 'dialog_open', 'dialog_close'] },
  social:     { label: 'Social',      sounds: ['friend_request', 'friend_accept', 'notification'] },
  system:     { label: 'System',      sounds: ['toggle_on', 'toggle_off', 'error', 'success'] },
};

const ALL_SOUNDS = Object.values(CATEGORIES).flatMap(c => c.sounds);

const DEFAULT_DURATIONS = {
  message: 0.8, call: 1.5, navigation: 0.4, social: 1.0, system: 0.5,
};

const SOUND_TO_CATEGORY = {};
for (const [cat, { sounds }] of Object.entries(CATEGORIES)) {
  for (const s of sounds) SOUND_TO_CATEGORY[s] = cat;
}

// Default prompt templates per sound name
const DEFAULT_PROMPTS = {
  message_send:      'short soft whoosh, digital send notification, UI sound effect',
  message_receive:   'gentle notification chime, incoming message alert, UI sound effect',
  message_delete:    'soft crumple or dissolve, subtle deletion sound, UI sound effect',
  mention:           'bright attention ping, someone mentioned you, UI notification',
  call_join:         'warm connection tone, joining a voice call, UI sound effect',
  call_leave:        'soft disconnect tone, leaving a voice call, UI sound effect',
  call_ringing:      'pleasant ringtone loop, incoming call, loopable, 2 seconds',
  user_join_voice:   'subtle arrival chime, someone joined the call, UI sound effect',
  user_leave_voice:  'subtle departure tone, someone left the call, UI sound effect',
  call_mute:         'quick mute click, microphone off, UI sound effect',
  call_unmute:       'quick unmute click, microphone on, UI sound effect',
  tab_switch:        'very short subtle click, tab navigation, minimal UI sound',
  dialog_open:       'soft pop or expand, modal opening, UI sound effect',
  dialog_close:      'soft close or collapse, modal closing, UI sound effect',
  friend_request:    'friendly notification, new friend request received, UI sound',
  friend_accept:     'happy confirmation chime, friend request accepted, UI sound',
  notification:      'general notification alert, attention getter, UI sound effect',
  toggle_on:         'crisp switch on click, toggle enabled, UI sound effect',
  toggle_off:        'crisp switch off click, toggle disabled, UI sound effect',
  error:             'soft error tone, something went wrong, UI warning sound',
  success:           'pleasant success chime, action completed, UI confirmation',
};

app.get('/api/config', (_req, res) => {
  res.json({
    categories: CATEGORIES,
    allSounds: ALL_SOUNDS,
    defaultDurations: DEFAULT_DURATIONS,
    soundToCategory: SOUND_TO_CATEGORY,
    defaultPrompts: DEFAULT_PROMPTS,
    hasApiKey: !!process.env.ELEVENLABS_API_KEY,
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Manifest helpers
// ─────────────────────────────────────────────────────────────────────────────

function manifestPath(theme) {
  return path.join(WORKING, theme, 'manifest.json');
}

function readManifest(theme) {
  const p = manifestPath(theme);
  if (!fs.existsSync(p)) return null;
  return JSON.parse(fs.readFileSync(p, 'utf-8'));
}

function writeManifest(theme, data) {
  const dir = path.join(WORKING, theme);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(manifestPath(theme), JSON.stringify(data, null, 2));
}

function ensureManifest(theme, mood) {
  let m = readManifest(theme);
  if (!m) {
    m = { themeName: theme, mood: mood || '', sounds: {} };
    for (const s of ALL_SOUNDS) {
      m.sounds[s] = { prompt: '', approved: null, variants: [] };
    }
    writeManifest(theme, m);
  }
  return m;
}

// ─────────────────────────────────────────────────────────────────────────────
// ffmpeg normalization
// ─────────────────────────────────────────────────────────────────────────────

function normalizeAudio(inputPath) {
  return new Promise((resolve, reject) => {
    const outputPath = inputPath.replace(/_raw\.mp3$/, '.mp3');
    const args = [
      '-y', '-i', inputPath,
      '-af', 'silenceremove=start_periods=1:start_silence=0.05:start_threshold=-50dB,silenceremove=stop_periods=1:stop_silence=0.05:stop_threshold=-50dB,loudnorm=I=-16:TP=-1.5:LRA=11',
      '-ar', '44100', '-ac', '1',
      '-b:a', '128k',
      outputPath,
    ];
    execFile(ffmpegPath, args, (err, _stdout, stderr) => {
      if (err) {
        console.error('ffmpeg error:', stderr);
        return reject(err);
      }
      // Remove raw file
      try { fs.unlinkSync(inputPath); } catch (_) {}
      resolve(outputPath);
    });
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// API routes
// ─────────────────────────────────────────────────────────────────────────────

// List themes
app.get('/api/themes', (_req, res) => {
  fs.mkdirSync(WORKING, { recursive: true });
  const themes = fs.readdirSync(WORKING, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name);
  res.json(themes);
});

// Get theme manifest
app.get('/api/theme/:name', (req, res) => {
  const m = readManifest(req.params.name);
  if (!m) return res.status(404).json({ error: 'Theme not found' });
  res.json(m);
});

// Create/update theme mood
app.post('/api/theme', (req, res) => {
  const { name, mood } = req.body;
  if (!name || !/^[a-z0-9-]+$/.test(name)) {
    return res.status(400).json({ error: 'Theme name must be kebab-case' });
  }
  const m = ensureManifest(name, mood);
  if (mood !== undefined) {
    m.mood = mood;
    writeManifest(name, m);
  }
  res.json(m);
});

// Generate a sound variant via ElevenLabs
app.post('/api/generate', async (req, res) => {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'ELEVENLABS_API_KEY not set in .env' });

  const { theme, soundName, prompt, duration_seconds, prompt_influence } = req.body;
  if (!theme || !soundName || !prompt) {
    return res.status(400).json({ error: 'theme, soundName, and prompt are required' });
  }

  const m = ensureManifest(theme);
  const soundDir = path.join(WORKING, theme, soundName);
  fs.mkdirSync(soundDir, { recursive: true });

  try {
    const response = await fetch('https://api.elevenlabs.io/v1/sound-generation', {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: prompt,
        duration_seconds: duration_seconds || DEFAULT_DURATIONS[SOUND_TO_CATEGORY[soundName]] || 1.0,
        prompt_influence: prompt_influence ?? 0.5,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.status(response.status).json({ error: `ElevenLabs API error: ${errText}` });
    }

    const ts = Date.now();
    const rawFile = `variant_${ts}_raw.mp3`;
    const rawPath = path.join(soundDir, rawFile);
    const buffer = Buffer.from(await response.arrayBuffer());
    fs.writeFileSync(rawPath, buffer);

    // Normalize
    const normalizedPath = await normalizeAudio(rawPath);
    const finalFile = path.basename(normalizedPath);

    // Update manifest
    m.sounds[soundName] = m.sounds[soundName] || { prompt: '', approved: null, variants: [] };
    m.sounds[soundName].variants.push({
      file: finalFile,
      prompt,
      duration_seconds: duration_seconds || DEFAULT_DURATIONS[SOUND_TO_CATEGORY[soundName]] || 1.0,
      created: new Date().toISOString(),
    });
    m.sounds[soundName].prompt = prompt;
    writeManifest(theme, m);

    res.json({
      file: finalFile,
      url: `/api/audio/${theme}/${soundName}/${finalFile}`,
      variantCount: m.sounds[soundName].variants.length,
    });
  } catch (err) {
    console.error('Generate error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Stream audio file
app.get('/api/audio/:theme/:sound/:file', (req, res) => {
  const filePath = path.join(WORKING, req.params.theme, req.params.sound, req.params.file);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'File not found' });
  res.type('audio/mpeg').sendFile(filePath);
});

// Approve a variant
app.post('/api/approve', (req, res) => {
  const { theme, soundName, file } = req.body;
  const m = readManifest(theme);
  if (!m) return res.status(404).json({ error: 'Theme not found' });
  if (!m.sounds[soundName]) return res.status(404).json({ error: 'Sound not found' });
  m.sounds[soundName].approved = file;
  writeManifest(theme, m);
  res.json({ ok: true });
});

// Unapprove a sound
app.post('/api/unapprove', (req, res) => {
  const { theme, soundName } = req.body;
  const m = readManifest(theme);
  if (!m) return res.status(404).json({ error: 'Theme not found' });
  if (!m.sounds[soundName]) return res.status(404).json({ error: 'Sound not found' });
  m.sounds[soundName].approved = null;
  writeManifest(theme, m);
  res.json({ ok: true });
});

// Delete a variant
app.delete('/api/variant/:theme/:sound/:file', (req, res) => {
  const { theme, sound, file } = req.params;
  const filePath = path.join(WORKING, theme, sound, file);
  try { fs.unlinkSync(filePath); } catch (_) {}

  const m = readManifest(theme);
  if (m && m.sounds[sound]) {
    m.sounds[sound].variants = m.sounds[sound].variants.filter(v => v.file !== file);
    if (m.sounds[sound].approved === file) m.sounds[sound].approved = null;
    writeManifest(theme, m);
  }
  res.json({ ok: true });
});

// Export approved sounds to assets/sounds/{themeName}/
app.post('/api/export', (req, res) => {
  const { theme } = req.body;
  const m = readManifest(theme);
  if (!m) return res.status(404).json({ error: 'Theme not found' });

  const missing = ALL_SOUNDS.filter(s => !m.sounds[s]?.approved);
  if (missing.length > 0) {
    return res.status(400).json({ error: `Missing approved sounds: ${missing.join(', ')}` });
  }

  const outDir = path.join(ASSETS, theme);
  fs.mkdirSync(outDir, { recursive: true });

  for (const soundName of ALL_SOUNDS) {
    const src = path.join(WORKING, theme, soundName, m.sounds[soundName].approved);
    const dest = path.join(outDir, `${soundName}.mp3`);
    fs.copyFileSync(src, dest);
  }

  // Generate code snippet for SoundEngine registration
  const snippet = `
// Add to SoundThemeId union type:
| '${theme}'

// Add to SOUND_THEMES array:
{ id: '${theme}', name: '${m.themeName}', description: '${m.mood}', type: 'audio' },

// Add to AUDIO_PACKS:
${theme}: audioPackUrls('${theme}'),
`.trim();

  res.json({ ok: true, outputDir: outDir, snippet, fileCount: ALL_SOUNDS.length });
});

// Re-normalize a specific file
app.post('/api/normalize/:theme/:sound/:file', async (req, res) => {
  const { theme, sound, file } = req.params;
  const filePath = path.join(WORKING, theme, sound, file);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'File not found' });

  try {
    // Rename current to _raw for re-processing
    const rawPath = filePath.replace('.mp3', '_raw.mp3');
    fs.renameSync(filePath, rawPath);
    await normalizeAudio(rawPath);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// Start
// ─────────────────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`\n  Sound Workbench running at http://localhost:${PORT}`);
  console.log(`  ElevenLabs API key: ${process.env.ELEVENLABS_API_KEY ? 'configured' : 'NOT SET — add to .env'}`);
  console.log(`  Working directory: ${WORKING}\n`);
});

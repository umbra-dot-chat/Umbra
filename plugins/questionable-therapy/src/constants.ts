/**
 * Constants for the Questionable Therapy plugin.
 */

/** Zen ambient audio track definitions. */
export const ZEN_TRACKS = [
  {
    id: 'rain-garden',
    name: 'Rain Garden',
    description: 'Gentle rain with soft drone',
  },
  {
    id: 'ocean-breath',
    name: 'Ocean Breath',
    description: 'Waves with deep hum',
  },
  {
    id: 'forest-floor',
    name: 'Forest Floor',
    description: 'Woodland ambience',
  },
  {
    id: 'temple-bells',
    name: 'Temple Bells',
    description: 'Soft chimes with reverb',
  },
  {
    id: 'starlight',
    name: 'Starlight',
    description: 'Warm pad with binaural beats',
  },
] as const;

/** Tag used by Ghost to mark therapy session messages. */
export const THERAPY_TAG = '[THERAPY-SESSION]';

/** Regex to strip therapy tags from displayed messages. */
export const THERAPY_TAG_REGEX = /\[THERAPY-SESSION\]\s*/g;

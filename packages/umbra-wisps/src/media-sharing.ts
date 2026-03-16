/**
 * Rich media content library for wisp community interactions.
 *
 * Provides curated content pools (images, links, fun facts) organized
 * by wisp interest areas so media sharing feels persona-consistent.
 */

export interface MediaContent {
  type: 'image' | 'link' | 'embed';
  url: string;
  title?: string;
  description?: string;
  /** Interest tags for persona matching */
  tags: string[];
}

/** Curated content pool organized by interest category */
const CONTENT_POOL: MediaContent[] = [
  // Art & Visual
  {
    type: 'link', url: 'https://artvee.com',
    title: 'Artvee — Free Classic Art',
    tags: ['digital art', 'pixel art', 'aurora borealis'],
  },
  {
    type: 'link', url: 'https://www.artstation.com',
    title: 'ArtStation — Digital Art Community',
    tags: ['digital art', 'pixel art', 'synthwave'],
  },
  {
    type: 'link', url: 'https://lospec.com/palette-list',
    title: 'Lospec — Pixel Art Palette Database',
    tags: ['pixel art', 'digital art'],
  },
  {
    type: 'link', url: 'https://www.shadertoy.com',
    title: 'Shadertoy — Live Shader Gallery',
    tags: ['digital art', 'synthwave', 'neon lights'],
  },

  // Nature & Plants
  {
    type: 'link', url: 'https://www.inaturalist.org',
    title: 'iNaturalist — Nature Observations',
    tags: ['botany', 'soil composition', 'weather', 'herbal remedies', 'marine biology'],
  },
  {
    type: 'link', url: 'https://www.gbif.org',
    title: 'GBIF — Global Biodiversity Database',
    tags: ['botany', 'marine biology', 'herbal remedies'],
  },
  {
    type: 'link', url: 'https://plants.usda.gov',
    title: 'USDA Plant Database',
    tags: ['botany', 'soil composition', 'herbal remedies'],
  },

  // Music & Audio
  {
    type: 'link', url: 'https://musicforprogramming.net',
    title: 'Music for Programming',
    tags: ['ambient music', 'synthwave', 'lo-fi beats'],
  },
  {
    type: 'link', url: 'https://freesound.org',
    title: 'Freesound — Collaborative Sound Library',
    tags: ['field recording', 'acoustics', 'music production'],
  },
  {
    type: 'link', url: 'https://poolsuite.net',
    title: 'Poolsuite FM — Retro Internet Radio',
    tags: ['synthwave', 'lo-fi beats', 'ambient music'],
  },
  {
    type: 'link', url: 'https://www.discogs.com',
    title: 'Discogs — Music Database & Marketplace',
    tags: ['vinyl records', 'heavy metal music', 'music production'],
  },

  // Games & Strategy
  {
    type: 'link', url: 'https://lichess.org',
    title: 'Lichess — Free Chess',
    tags: ['chess', 'game theory', 'logic puzzles'],
  },
  {
    type: 'link', url: 'https://www.speedrun.com',
    title: 'Speedrun.com — Speedrunning Leaderboards',
    tags: ['speed runs', 'pranks'],
  },
  {
    type: 'link', url: 'https://brilliant.org',
    title: 'Brilliant — Math & Logic Puzzles',
    tags: ['logic puzzles', 'game theory', 'probability theory'],
  },
  {
    type: 'link', url: 'https://www.bicyclecards.com/rules',
    title: 'Bicycle Cards — Card Game Rules',
    tags: ['card games', 'probability theory'],
  },

  // Science & Tech
  {
    type: 'link', url: 'https://arxiv.org',
    title: 'arXiv — Scientific Papers',
    tags: ['cryptography', 'probability theory', 'acoustics'],
  },
  {
    type: 'link', url: 'https://www.falstad.com/circuit/',
    title: 'Circuit Simulator',
    tags: ['circuit design', 'networking', 'robotics'],
  },
  {
    type: 'link', url: 'https://hackaday.com',
    title: 'Hackaday — Hardware Hacking',
    tags: ['circuit design', 'robotics', 'metalworking'],
  },
  {
    type: 'link', url: 'https://neoncrafter.com',
    title: 'NeonCrafter — Neon Sign Designer',
    tags: ['neon lights', 'digital art', 'circuit design'],
  },

  // Philosophy & Dreams
  {
    type: 'link', url: 'https://plato.stanford.edu',
    title: 'Stanford Encyclopedia of Philosophy',
    tags: ['philosophy', 'lucid dreaming', 'ancient languages'],
  },
  {
    type: 'link', url: 'https://www.world-of-lucid-dreaming.com',
    title: 'World of Lucid Dreaming',
    tags: ['lucid dreaming', 'philosophy', 'cloud watching'],
  },

  // Ocean & Water
  {
    type: 'link', url: 'https://www.surf-forecast.com',
    title: 'Surf Forecast',
    tags: ['surfing', 'tide charts', 'weather'],
  },
  {
    type: 'link', url: 'https://oceanservice.noaa.gov',
    title: 'NOAA Ocean Service',
    tags: ['marine biology', 'tide charts', 'surfing'],
  },

  // Space & Stars
  {
    type: 'link', url: 'https://stellarium-web.org',
    title: 'Stellarium — Online Planetarium',
    tags: ['stargazing', 'aurora borealis', 'cloud watching'],
  },
  {
    type: 'link', url: 'https://www.spaceweatherlive.com',
    title: 'SpaceWeatherLive — Aurora Forecasts',
    tags: ['aurora borealis', 'stargazing', 'weather'],
  },

  // Luck & Probability
  {
    type: 'link', url: 'https://www.random.org',
    title: 'Random.org — True Random Numbers',
    tags: ['probability theory', 'card games', 'fortune cookies'],
  },

  // Cryptography & Mystery
  {
    type: 'link', url: 'https://cryptopals.com',
    title: 'Cryptopals — Crypto Challenges',
    tags: ['cryptography', 'logic puzzles'],
  },
  {
    type: 'link', url: 'https://www.omniglot.com',
    title: 'Omniglot — Writing Systems & Languages',
    tags: ['ancient languages', 'cryptography', 'conspiracy theories'],
  },

  // Food & Comfort
  {
    type: 'link', url: 'https://www.seriouseats.com',
    title: 'Serious Eats — Food Science & Recipes',
    tags: ['comfort food', 'barbecue', 'herbal remedies'],
  },
  {
    type: 'link', url: 'https://www.amazingribs.com',
    title: 'AmazingRibs — BBQ Science',
    tags: ['barbecue', 'metalworking', 'comfort food'],
  },

  // Kindness & Journaling
  {
    type: 'link', url: 'https://750words.com',
    title: '750 Words — Daily Writing Practice',
    tags: ['journaling', 'small kindnesses', 'philosophy'],
  },
];

/** Fun facts organized by interest tags */
const FUN_FACTS: { fact: string; tags: string[] }[] = [
  // Ocean & Nature
  { fact: 'Octopuses have three hearts and blue blood.', tags: ['marine biology', 'surfing'] },
  { fact: 'The deepest part of the ocean is deeper than Mount Everest is tall.', tags: ['marine biology', 'tide charts'] },
  { fact: 'Coral reefs support 25% of all marine species despite covering less than 1% of the ocean floor.', tags: ['marine biology', 'surfing'] },
  { fact: 'The longest recorded surf ride lasted 3 hours 55 minutes on the Amazon River bore tide.', tags: ['surfing', 'tide charts'] },

  // Botany & Nature
  { fact: 'Plants can hear themselves being eaten and release defensive chemicals in response.', tags: ['botany', 'herbal remedies'] },
  { fact: 'The oldest known living tree is over 5,000 years old — a bristlecone pine in California.', tags: ['botany', 'soil composition'] },
  { fact: 'Mycorrhizal fungi connect 90% of plant species in underground networks called the "Wood Wide Web."', tags: ['botany', 'soil composition', 'networking'] },

  // Chess & Strategy
  { fact: 'The shortest chess game possible is just two moves — the Fool\'s Mate.', tags: ['chess', 'game theory'] },
  { fact: 'There are more possible chess games than atoms in the observable universe.', tags: ['chess', 'game theory', 'probability theory'] },
  { fact: 'Sun Tzu\'s "The Art of War" has been required reading at West Point since 1Mo.', tags: ['military history', 'game theory'] },

  // Electronics & Circuits
  { fact: 'The first computer bug was an actual moth found in a relay at Harvard in 1947.', tags: ['circuit design', 'robotics'] },
  { fact: 'A single bolt of lightning contains enough energy to toast 100,000 slices of bread.', tags: ['circuit design', 'weather'] },
  { fact: 'The first neon sign was displayed at a Paris motor show in 1910.', tags: ['neon lights', 'circuit design'] },

  // Luck & Probability
  { fact: 'The probability of a Royal Flush in poker is 1 in 649,740.', tags: ['probability theory', 'card games'] },
  { fact: 'The odds of finding a four-leaf clover are roughly 1 in 5,000.', tags: ['four-leaf clovers', 'probability theory'] },
  { fact: 'Fortune cookies were invented in San Francisco, not China.', tags: ['fortune cookies', 'comfort food'] },

  // Philosophy & Dreams
  { fact: 'Lucid dreaming was scientifically verified in 1975 by researcher Keith Hearne.', tags: ['lucid dreaming', 'philosophy'] },
  { fact: 'Aristotle wrote the first known text on dream interpretation in the 4th century BC.', tags: ['philosophy', 'lucid dreaming', 'ancient languages'] },
  { fact: 'Clouds are classified into 10 basic genera — the system dates back to 1802.', tags: ['cloud watching', 'weather'] },

  // Music & Sound
  { fact: 'Vinyl records can theoretically last over 100 years if stored properly.', tags: ['vinyl records', 'music production'] },
  { fact: 'The 432Hz vs 440Hz tuning debate has been going on since the 1800s.', tags: ['acoustics', 'music production', 'ambient music'] },
  { fact: 'Whales can hear each other\'s songs from over 1,000 miles away.', tags: ['field recording', 'marine biology', 'acoustics'] },
  { fact: 'The quietest place on Earth is an anechoic chamber at -20.6 decibels.', tags: ['acoustics', 'field recording'] },

  // Art & Visual
  { fact: 'The aurora borealis and aurora australis happen simultaneously at both poles.', tags: ['aurora borealis', 'stargazing'] },
  { fact: 'The first pixel art dates back to the 1970s with early video game sprites.', tags: ['pixel art', 'digital art', 'speed runs'] },
  { fact: 'Synthwave as a genre was directly inspired by 1980s film soundtracks.', tags: ['synthwave', 'ambient music'] },

  // Space & Stars
  { fact: 'There are more stars in the universe than grains of sand on all of Earth\'s beaches.', tags: ['stargazing', 'philosophy'] },
  { fact: 'Neutron stars spin up to 716 times per second.', tags: ['stargazing', 'probability theory'] },

  // Cryptography & Language
  { fact: 'The Rosetta Stone was the key to deciphering Egyptian hieroglyphs in 1822.', tags: ['ancient languages', 'cryptography'] },
  { fact: 'The Enigma machine had 158 quintillion possible settings.', tags: ['cryptography', 'military history'] },
  { fact: 'There are still undeciphered writing systems, including Linear A from ancient Crete.', tags: ['ancient languages', 'conspiracy theories'] },

  // Metalworking & Forge
  { fact: 'Damascus steel blades from the Middle Ages contained carbon nanotubes — centuries before modern science.', tags: ['metalworking', 'military history'] },
  { fact: 'The heaviest barbell ever lifted in competition weighed 501 kg (1,104 lbs).', tags: ['arm wrestling', 'barbecue'] },

  // Comfort & Kindness
  { fact: 'Studies show that writing in a journal for 15 minutes a day can boost immune function.', tags: ['journaling', 'small kindnesses', 'herbal remedies'] },
  { fact: 'Random acts of kindness trigger the release of serotonin in both the giver and receiver.', tags: ['small kindnesses', 'journaling'] },

  // Speed & Chaos
  { fact: 'The world record for Super Mario Bros. any% speedrun is under 4 minutes 55 seconds.', tags: ['speed runs', 'pranks'] },
  { fact: 'Fireworks were invented in China over 2,000 years ago to scare away evil spirits.', tags: ['fireworks', 'conspiracy theories'] },
];

/**
 * Get media content matching a wisp's interests.
 * Returns a random content item with affinity for the wisp's persona.
 */
export function getMediaForWisp(wispInterests: string[]): MediaContent | null {
  if (wispInterests.length === 0) return null;

  const lowerInterests = wispInterests.map(i => i.toLowerCase());

  // Score each content item by tag overlap with wisp interests
  const scored = CONTENT_POOL.map(item => {
    let score = 0;
    for (const tag of item.tags) {
      if (lowerInterests.includes(tag.toLowerCase())) {
        score += 3;
      }
    }
    // Add small random factor so it's not always the same item
    score += Math.random() * 2;
    return { item, score };
  });

  // Filter to items with at least one matching tag
  const matching = scored.filter(s => s.score >= 3);
  if (matching.length === 0) {
    // Fallback: pick any random content
    return CONTENT_POOL[Math.floor(Math.random() * CONTENT_POOL.length)];
  }

  matching.sort((a, b) => b.score - a.score);

  // Pick from top 5 for variety
  const topN = matching.slice(0, Math.min(5, matching.length));
  return topN[Math.floor(Math.random() * topN.length)].item;
}

/**
 * Get a fun fact matching a wisp's interests.
 */
export function getFunFactForWisp(wispInterests: string[]): string | null {
  if (wispInterests.length === 0) return null;

  const lowerInterests = wispInterests.map(i => i.toLowerCase());

  const scored = FUN_FACTS.map(entry => {
    let score = 0;
    for (const tag of entry.tags) {
      if (lowerInterests.includes(tag.toLowerCase())) {
        score += 3;
      }
    }
    score += Math.random() * 2;
    return { entry, score };
  });

  const matching = scored.filter(s => s.score >= 3);
  if (matching.length === 0) {
    // Fallback: pick any random fact
    return FUN_FACTS[Math.floor(Math.random() * FUN_FACTS.length)].fact;
  }

  matching.sort((a, b) => b.score - a.score);
  const topN = matching.slice(0, Math.min(5, matching.length));
  return topN[Math.floor(Math.random() * topN.length)].entry.fact;
}

/**
 * Format a media share as a community message.
 * Returns the text content with embedded link/image markdown.
 */
export function formatMediaMessage(content: MediaContent): string {
  const desc = content.description ? `\n${content.description}` : '';
  switch (content.type) {
    case 'link':
      return content.title
        ? `${content.title}\n${content.url}${desc}`
        : content.url;
    case 'image':
      return content.title
        ? `${content.title}\n${content.url}${desc}`
        : content.url;
    case 'embed':
      return content.title
        ? `${content.title}\n${content.url}${desc}`
        : content.url;
    default:
      return content.url;
  }
}

/**
 * Format a fun fact share with persona flair.
 * Takes the wisp name for attribution.
 */
export function formatFunFact(fact: string, wispName: string): string {
  const intros = [
    `did you know? ${fact}`,
    `fun fact: ${fact}`,
    `here is something cool — ${fact}`,
    `I just learned this — ${fact}`,
    `random knowledge drop: ${fact}`,
  ];
  return intros[Math.floor(Math.random() * intros.length)];
}

/**
 * Decide what type of content to share (weighted random):
 * - 50% plain text (handled elsewhere)
 * - 25% link share
 * - 15% fun fact
 * - 10% image/embed
 */
export function pickContentType(): 'text' | 'link' | 'fun_fact' | 'image' {
  const roll = Math.random();
  if (roll < 0.50) return 'text';
  if (roll < 0.75) return 'link';
  if (roll < 0.90) return 'fun_fact';
  return 'image';
}

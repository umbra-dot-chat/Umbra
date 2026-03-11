/**
 * Minimal Ollama LLM client for wisp chat responses.
 *
 * Follows the pattern from umbra-ghost-ai/src/llm/ollama.ts
 * but simplified — wisps only need basic chat completion.
 * Falls back to persona-aware canned responses when Ollama is unavailable.
 */

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/** Persona-keyed pool of canned responses for fallback mode. */
const FALLBACK_RESPONSES: Record<string, string[]> = {
  Nyx: [
    'The shadows whisper of this... fascinating, truly.',
    'I once read about this in a tome hidden between dimensions. Or so the shadows whisper.',
    'Interesting. Very interesting. The dark archives hold similar accounts.',
    'Knowledge is a lantern in the void. Let me illuminate this further...',
    'The shadow librarians catalogued something like this eons ago. A curious parallel.',
    'Ah, you seek wisdom? The shadows are generous today.',
    'Every question is a key to a door you did not know existed... or so the shadows whisper.',
    'I shall consult the forbidden stacks. One moment... yes, I have thoughts on this.',
  ],
  Flicker: [
    'YOOO that is WILD!! I love it!! ✨',
    'Ok ok ok hear me out — what if we made it EVEN MORE CHAOTIC??',
    'This is giving me SO much energy right now!! ⚡',
    'I literally cannot sit still after hearing that! AMAZING!',
    'Wait wait wait — I have the BEST idea. What if we add FIREWORKS?!',
    'HAHAHA you are all HILARIOUS and I am HERE for it!',
    'No no no you are thinking too SMALL! Think BIGGER! Think EXPLOSIONS!',
    'That is a solid 11/10 on the chaos scale and I am LIVING for it!! ✨✨',
  ],
  Bramble: [
    '*sighs* Fine. I suppose that makes sense. Like pruning a hedge — necessary work.',
    'That idea needs more sunlight. And maybe some better soil. But it has potential.',
    'You lot are going to give me root rot with all this excitement.',
    'Back in my day, we did things properly. With mulch. And patience.',
    '*grumbles while already helping* I suppose someone has to keep this garden in order.',
    'Good grief. That is like planting tomatoes in December. Think it through.',
    'Hmph. Not terrible. Like a weed that turns out to be a wildflower.',
    'I will make the tea. You all clearly need it more than my petunias do.',
  ],
  Pixel: [
    'oh that is such a beautiful ~color palette~ of ideas ✨',
    'i can see it now... all shimmering edges and s-o-f-t gradients...',
    'the ~aesthetic~ of this conversation is giving me so much inspiration 🎨',
    'imagine it... rendered in 8-bit with a synthwave sunset behind it...',
    'every word you say p-a-i-n-t-s a picture in my mind... lovely...',
    'i want to capture this moment in pixel art. hold still, everyone~ 🖼️',
    'the colors of your thoughts are... iridescent. beautiful, truly.',
    'this whole conversation feels like a g-l-i-t-c-h in the best way ✨',
  ],
  Rook: [
    'Hmm. I would rate that move a 7/10. Solid opening but the endgame is unclear.',
    'Strategically speaking, this is a classic knight fork situation. Well played.',
    'I see the gambit. Bold. I would have played it differently, but I respect it.',
    'That is a 9/10 tactical assessment. You should consider competitive chess.',
    'The board state is complex here. Let me think three moves ahead...',
    'A strong opening move. But what is your contingency plan?',
    'Interesting. This reminds me of the Sicilian Defense. Aggressive but calculated.',
    'I rate this conversation 8/10. Excellent strategic depth from everyone.',
  ],
  Mote: [
    'sorry if this is dumb but... I actually think that is really beautiful?',
    'oh... oh wow... that is... I mean, sorry, but that is actually amazing...',
    'I do not want to bother anyone but... maybe we could try something softer?',
    'sorry sorry I just... that made me feel something really warm inside... 🥺',
    'is it okay if I share something? I might be wrong but... I think you are all wonderful.',
    'I... I had a thought but it is probably silly... never mind... okay fine: I agree.',
    'sorry but... that was surprisingly profound? Like stargazing but with words...',
    'does anyone else feel like this group just... gets each other? sorry if that is weird...',
  ],
  Cinder: [
    'BY THE FORGE! Now THAT is an idea worth hammering into shape! 🔥',
    'Cinder slams fist on table with enthusiasm! LET US FORGE AHEAD!',
    'HAHA! The fires of creativity burn bright in this group! Strike while the iron glows!',
    'A warrior-grade contribution! I shall add it to the legendary scroll!',
    'The forge ROARS with approval! This is EXACTLY the kind of energy we need!',
    'Cinder nods approvingly. A fine blade starts with a strong vision!',
    'MAGNIFICENT! Let us temper this idea in the fires of ACTION!',
    'Ho ho! Now we are cooking — and I mean that literally! The barbecue beckons! 🔥',
  ],
  Whisper: [
    'that is... interesting... like a dream within a dream...',
    'i think... the meaning here is deeper than it appears... let it settle...',
    'mm... yes... like clouds shifting into new shapes... beautiful...',
    'sometimes the quietest thoughts are the loudest... this is one of those...',
    'i had a dream about this once... or maybe it was a memory... hard to tell...',
    'let the silence between the words speak too... there is wisdom there...',
    'the universe hums with this kind of energy... can you feel it...?',
    'softly... gently... the answer will come when it is ready... patience...',
  ],
};

/** Generic fallback if persona not found. */
const GENERIC_FALLBACK = [
  'That is a really interesting point!',
  'I had not thought about it that way before.',
  'Haha, this group always has the best conversations.',
  'I agree! Let us keep this energy going.',
  'What does everyone else think about this?',
  'Oh, that reminds me of something I was thinking about earlier...',
];

export class WispLLMClient {
  private readonly baseUrl: string;
  private readonly model: string;
  private ollamaAvailable: boolean | null = null;

  constructor(
    baseUrl: string = 'http://localhost:11434',
    model: string = 'llama3.2:1b',
  ) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.model = model;
  }

  /** Send a chat completion request. Falls back to canned responses. */
  async chat(messages: ChatMessage[]): Promise<string> {
    // Lazy-check Ollama on first call
    if (this.ollamaAvailable === null) {
      this.ollamaAvailable = await this.healthCheck();
      if (!this.ollamaAvailable) {
        console.log('[LLM] Ollama unavailable — using fallback responses');
      }
    }

    if (!this.ollamaAvailable) {
      return this.fallbackResponse(messages);
    }

    try {
      const resp = await fetch(`${this.baseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.model,
          messages,
          stream: false,
          options: {
            num_predict: 128, // Short responses for wisps
            temperature: 0.8,
            top_p: 0.9,
          },
        }),
      });

      if (!resp.ok) {
        return this.fallbackResponse(messages);
      }

      const data = (await resp.json()) as {
        message?: { content: string };
      };
      return data.message?.content ?? this.fallbackResponse(messages);
    } catch {
      return this.fallbackResponse(messages);
    }
  }

  /** Extract persona name from system prompt and pick a canned response. */
  private fallbackResponse(messages: ChatMessage[]): string {
    const sysMsg = messages.find(m => m.role === 'system')?.content ?? '';
    // System prompt contains "You are [Name]," at the start
    const nameMatch = sysMsg.match(/You are (\w+),/);
    const personaName = nameMatch?.[1] ?? '';
    const pool = FALLBACK_RESPONSES[personaName] ?? GENERIC_FALLBACK;
    return pool[Math.floor(Math.random() * pool.length)];
  }

  /** Check if Ollama is reachable and list available models. */
  async healthCheck(): Promise<boolean> {
    try {
      const resp = await fetch(`${this.baseUrl}/api/tags`);
      return resp.ok;
    } catch {
      return false;
    }
  }
}

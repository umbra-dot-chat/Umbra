/**
 * Calls Test Suite — 14 scenarios covering voice and video call lifecycle.
 *
 * Covers: voice/video connect, caller/callee hangup, decline, ring timeout,
 * ring timeout race (Bug #3), busy signal, glare (Bug #4), call during active,
 * mute/camera state, voice-to-video type check, and sequential calls.
 */

import {
  type Scenario,
  type ScenarioContext,
  registerSuite,
  sleep,
  pollUntil,
} from '../scenarios.js';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Standard "befriend two bots" step — A sends request to B, poll until mutual. */
function befriendStep(aIndex: number, bIndex: number, timeout = 10_000) {
  return {
    name: `Befriend bot ${aIndex} and bot ${bIndex}`,
    action: async (ctx: ScenarioContext) => {
      const a = ctx.bots[aIndex];
      const b = ctx.bots[bIndex];
      a.sendFriendRequest(b.identity.did);
      await sleep(500);
    },
    validate: (ctx: ScenarioContext) => {
      return ctx.bots[aIndex].friendCount >= 1 && ctx.bots[bIndex].friendCount >= 1;
    },
    timeout,
  };
}

/** Befriend A with two others (B and C). */
function befriendTriple(timeout = 15_000) {
  return {
    name: 'Befriend A with B and C',
    action: async (ctx: ScenarioContext) => {
      const [a, b, c] = ctx.bots;
      a.sendFriendRequest(b.identity.did);
      await sleep(300);
      a.sendFriendRequest(c.identity.did);
      await sleep(500);
    },
    validate: (ctx: ScenarioContext) => {
      const [a, b, c] = ctx.bots;
      return a.friendCount >= 2 && b.friendCount >= 1 && c.friendCount >= 1;
    },
    timeout,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. calls-voice-connect
// ─────────────────────────────────────────────────────────────────────────────

const callsVoiceConnect: Scenario = {
  name: 'calls-voice-connect',
  description: 'A calls B (voice). B auto-accepts. Both connect, hold 5s, A ends call cleanly.',
  botCount: 2,
  timeout: 30_000,
  tags: ['smoke', 'critical'],
  steps: [
    befriendStep(0, 1),
    {
      name: 'A starts a voice call to B',
      action: async (ctx: ScenarioContext) => {
        const [a, b] = ctx.bots;
        await a.startCall(b.identity.did, 'voice');
      },
    },
    {
      name: 'Wait for both to be connected',
      action: async () => {},
      validate: (ctx: ScenarioContext) => {
        const [a, b] = ctx.bots;
        return (
          a.currentCall?.status === 'connected' &&
          b.currentCall?.status === 'connected'
        );
      },
      timeout: 15_000,
    },
    {
      name: 'Hold call for 5 seconds',
      action: async () => {
        await sleep(5000);
      },
    },
    {
      name: 'A ends the call',
      action: async (ctx: ScenarioContext) => {
        const a = ctx.bots[0];
        a.endCall();
        await sleep(500);
      },
      validate: (ctx: ScenarioContext) => {
        const [a, b] = ctx.bots;
        return a.currentCall === null && b.currentCall === null;
      },
      timeout: 10_000,
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// 2. calls-video-connect
// ─────────────────────────────────────────────────────────────────────────────

const callsVideoConnect: Scenario = {
  name: 'calls-video-connect',
  description: 'A calls B (video). B auto-accepts. Both connect, hold 5s, A ends call cleanly.',
  botCount: 2,
  timeout: 30_000,
  tags: ['smoke', 'critical'],
  steps: [
    befriendStep(0, 1),
    {
      name: 'A starts a video call to B',
      action: async (ctx: ScenarioContext) => {
        const [a, b] = ctx.bots;
        await a.startCall(b.identity.did, 'video');
      },
    },
    {
      name: 'Wait for both to be connected',
      action: async () => {},
      validate: (ctx: ScenarioContext) => {
        const [a, b] = ctx.bots;
        return (
          a.currentCall?.status === 'connected' &&
          b.currentCall?.status === 'connected'
        );
      },
      timeout: 15_000,
    },
    {
      name: 'Hold call for 5 seconds',
      action: async () => {
        await sleep(5000);
      },
    },
    {
      name: 'A ends the call',
      action: async (ctx: ScenarioContext) => {
        const a = ctx.bots[0];
        a.endCall();
        await sleep(500);
      },
      validate: (ctx: ScenarioContext) => {
        const [a, b] = ctx.bots;
        return a.currentCall === null && b.currentCall === null;
      },
      timeout: 10_000,
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// 3. calls-caller-hangup
// ─────────────────────────────────────────────────────────────────────────────

const callsCallerHangup: Scenario = {
  name: 'calls-caller-hangup',
  description: 'A calls B but cancels before B answers. Both should have no active call.',
  botCount: 2,
  timeout: 30_000,
  tags: ['critical'],
  steps: [
    befriendStep(0, 1),
    {
      name: 'Disable B auto-accept and A starts call',
      action: async (ctx: ScenarioContext) => {
        const [a, b] = ctx.bots;
        (ctx.bots[1] as any).config.autoAcceptCalls = false;
        await a.startCall(b.identity.did);
        await sleep(2000);
      },
    },
    {
      name: 'A cancels the call before B answers',
      action: async (ctx: ScenarioContext) => {
        const a = ctx.bots[0];
        a.endCall('cancelled');
        await sleep(500);
      },
      validate: (ctx: ScenarioContext) => {
        const [a, b] = ctx.bots;
        return a.currentCall === null && b.currentCall === null;
      },
      timeout: 10_000,
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// 4. calls-callee-hangup
// ─────────────────────────────────────────────────────────────────────────────

const callsCalleeHangup: Scenario = {
  name: 'calls-callee-hangup',
  description: 'A calls B (auto-accept). After connected, B ends the call. A\'s call should end.',
  botCount: 2,
  timeout: 30_000,
  tags: [],
  steps: [
    befriendStep(0, 1),
    {
      name: 'A starts a call to B',
      action: async (ctx: ScenarioContext) => {
        const [a, b] = ctx.bots;
        await a.startCall(b.identity.did);
      },
    },
    {
      name: 'Wait for both to be connected',
      action: async () => {},
      validate: (ctx: ScenarioContext) => {
        const [a, b] = ctx.bots;
        return (
          a.currentCall?.status === 'connected' &&
          b.currentCall?.status === 'connected'
        );
      },
      timeout: 15_000,
    },
    {
      name: 'B ends the call',
      action: async (ctx: ScenarioContext) => {
        const b = ctx.bots[1];
        b.endCall();
        await sleep(500);
      },
      validate: (ctx: ScenarioContext) => {
        const [a, b] = ctx.bots;
        return a.currentCall === null && b.currentCall === null;
      },
      timeout: 10_000,
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// 5. calls-decline
// ─────────────────────────────────────────────────────────────────────────────

const callsDecline: Scenario = {
  name: 'calls-decline',
  description: 'A calls B. B declines. A gets call ended notification.',
  botCount: 2,
  timeout: 30_000,
  tags: ['critical'],
  steps: [
    befriendStep(0, 1),
    {
      name: 'Disable B auto-accept and A starts call',
      action: async (ctx: ScenarioContext) => {
        (ctx.bots[1] as any).config.autoAcceptCalls = false;
        const [a, b] = ctx.bots;
        await a.startCall(b.identity.did);
      },
    },
    {
      name: 'Wait for B to have a pending incoming call',
      action: async () => {},
      validate: (ctx: ScenarioContext) => {
        const b = ctx.bots[1];
        return b.pendingCalls.length > 0;
      },
      timeout: 10_000,
    },
    {
      name: 'B declines the call',
      action: async (ctx: ScenarioContext) => {
        const b = ctx.bots[1];
        const pending = b.pendingCalls[0];
        b.declineCall(pending.callId, 'declined');
        await sleep(500);
      },
      validate: (ctx: ScenarioContext) => {
        const [a, b] = ctx.bots;
        return a.currentCall === null && b.currentCall === null;
      },
      timeout: 10_000,
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// 6. calls-ring-timeout
// ─────────────────────────────────────────────────────────────────────────────

const callsRingTimeout: Scenario = {
  name: 'calls-ring-timeout',
  description: 'A calls B but B never answers. After 45s ring timeout, A\'s call should end.',
  botCount: 2,
  timeout: 60_000,
  tags: ['critical', 'slow'],
  steps: [
    befriendStep(0, 1),
    {
      name: 'Disable B auto-accept and A starts call',
      action: async (ctx: ScenarioContext) => {
        (ctx.bots[1] as any).config.autoAcceptCalls = false;
        const [a, b] = ctx.bots;
        await a.startCall(b.identity.did);
      },
    },
    {
      name: 'Wait 46 seconds for ring timeout',
      action: async () => {
        await sleep(46_000);
      },
      timeout: 50_000,
    },
    {
      name: 'Validate A\'s call has timed out',
      action: async () => {},
      validate: (ctx: ScenarioContext) => {
        const a = ctx.bots[0];
        return a.currentCall === null;
      },
      timeout: 10_000,
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// 7. calls-ring-timeout-race (Bug #3)
// ─────────────────────────────────────────────────────────────────────────────

const callsRingTimeoutRace: Scenario = {
  name: 'calls-ring-timeout-race',
  description: 'Bug #3: B accepts near the 45s ring timeout boundary. Call should connect successfully.',
  botCount: 2,
  timeout: 60_000,
  tags: ['bug', 'slow'],
  steps: [
    befriendStep(0, 1),
    {
      name: 'Disable B auto-accept and A starts call',
      action: async (ctx: ScenarioContext) => {
        (ctx.bots[1] as any).config.autoAcceptCalls = false;
        const [a, b] = ctx.bots;
        await a.startCall(b.identity.did);
      },
    },
    {
      name: 'Wait ~43 seconds (near the 45s timeout boundary)',
      action: async () => {
        await sleep(43_000);
      },
      timeout: 45_000,
    },
    {
      name: 'B accepts the call near the timeout boundary',
      action: async (ctx: ScenarioContext) => {
        const b = ctx.bots[1];
        if (b.pendingCalls.length === 0) {
          throw new Error('No pending calls on B — call may have already timed out');
        }
        const pending = b.pendingCalls[0];
        await b.acceptCall(pending.callId);
      },
    },
    {
      name: 'Validate call connects successfully',
      action: async () => {},
      validate: (ctx: ScenarioContext) => {
        const [a, b] = ctx.bots;
        return (
          a.currentCall?.status === 'connected' &&
          b.currentCall?.status === 'connected'
        );
      },
      timeout: 10_000,
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// 8. calls-busy
// ─────────────────────────────────────────────────────────────────────────────

const callsBusy: Scenario = {
  name: 'calls-busy',
  description: 'A is in a call with B. C calls A. A should auto-respond busy.',
  botCount: 3,
  timeout: 30_000,
  tags: [],
  steps: [
    befriendTriple(),
    {
      name: 'A calls B and they connect',
      action: async (ctx: ScenarioContext) => {
        const [a, b] = ctx.bots;
        await a.startCall(b.identity.did);
      },
    },
    {
      name: 'Wait for A and B to be connected',
      action: async () => {},
      validate: (ctx: ScenarioContext) => {
        const [a, b] = ctx.bots;
        return (
          a.currentCall?.status === 'connected' &&
          b.currentCall?.status === 'connected'
        );
      },
      timeout: 15_000,
    },
    {
      name: 'C calls A while A is in a call',
      action: async (ctx: ScenarioContext) => {
        const [a, , c] = ctx.bots;
        // Listen for call ended on C to capture the busy reason
        c.events.once('callEnded', (data: any) => {
          ctx.state.set('cCallEndReason', data.reason);
        });
        await c.startCall(a.identity.did);
        await sleep(2000);
      },
    },
    {
      name: 'Validate C\'s call ended (busy)',
      action: async () => {},
      validate: (ctx: ScenarioContext) => {
        const c = ctx.bots[2];
        // C should no longer have an active call
        return c.currentCall === null;
      },
      timeout: 10_000,
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// 9. calls-glare (Bug #4)
// ─────────────────────────────────────────────────────────────────────────────

const callsGlare: Scenario = {
  name: 'calls-glare',
  description: 'Bug #4: Both bots call each other simultaneously. Should resolve without infinite hang.',
  botCount: 2,
  timeout: 30_000,
  tags: ['bug'],
  steps: [
    befriendStep(0, 1),
    {
      name: 'Disable auto-accept on both bots',
      action: async (ctx: ScenarioContext) => {
        (ctx.bots[0] as any).config.autoAcceptCalls = false;
        (ctx.bots[1] as any).config.autoAcceptCalls = false;
      },
    },
    {
      name: 'Both bots call each other simultaneously',
      action: async (ctx: ScenarioContext) => {
        const [a, b] = ctx.bots;
        // Fire both calls without awaiting in between
        a.startCall(b.identity.did);
        b.startCall(a.identity.did);
        await sleep(1000);
      },
    },
    {
      name: 'Validate glare resolves (no infinite hang)',
      action: async () => {
        // Give the system time to resolve the glare condition
        await sleep(5000);
      },
      validate: (ctx: ScenarioContext) => {
        const [a, b] = ctx.bots;
        // At least one of these should be true:
        // - One bot has an active connected call and the other does too (resolved to one call)
        // - Both calls ended (both null)
        // - One has a call, the other doesn't
        // The key assertion: the system did not hang — we reached this point
        const aCall = a.currentCall;
        const bCall = b.currentCall;

        // If both are connected to each other, that's a success
        if (aCall?.status === 'connected' && bCall?.status === 'connected') return true;
        // If both ended, that's also acceptable (glare caused mutual cancel)
        if (aCall === null && bCall === null) return true;
        // If one has a call and the other doesn't, acceptable
        if (aCall === null || bCall === null) return true;

        // Still resolving — not yet settled
        return false;
      },
      timeout: 15_000,
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// 10. calls-during-active
// ─────────────────────────────────────────────────────────────────────────────

const callsDuringActive: Scenario = {
  name: 'calls-during-active',
  description: 'A is in a call with B. A tries to call C. The second call should not start.',
  botCount: 3,
  timeout: 30_000,
  tags: [],
  steps: [
    befriendTriple(),
    {
      name: 'A calls B and they connect',
      action: async (ctx: ScenarioContext) => {
        const [a, b] = ctx.bots;
        await a.startCall(b.identity.did);
      },
    },
    {
      name: 'Wait for A and B to be connected',
      action: async () => {},
      validate: (ctx: ScenarioContext) => {
        const [a, b] = ctx.bots;
        return (
          a.currentCall?.status === 'connected' &&
          b.currentCall?.status === 'connected'
        );
      },
      timeout: 15_000,
    },
    {
      name: 'A tries to call C while in call with B',
      action: async (ctx: ScenarioContext) => {
        const [a, , c] = ctx.bots;
        // Store B's DID so we can verify A is still in the original call
        ctx.state.set('bDid', ctx.bots[1].identity.did);
        try {
          await a.startCall(c.identity.did);
        } catch {
          // Expected — A should not be able to start a second call
        }
        await sleep(1000);
      },
      validate: (ctx: ScenarioContext) => {
        const [a, , c] = ctx.bots;
        const bDid = ctx.state.get('bDid') as string;
        // A should still be in the call with B, not C
        const aStillWithB = a.currentCall?.remoteDid === bDid && a.currentCall?.status === 'connected';
        // C should have no active call
        const cNoCall = c.currentCall === null;
        return aStillWithB && cNoCall;
      },
      timeout: 10_000,
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// 11. calls-mute-state
// ─────────────────────────────────────────────────────────────────────────────

const callsMuteState: Scenario = {
  name: 'calls-mute-state',
  description: 'A calls B, connects, A mutes. B should see remoteIsMuted = true.',
  botCount: 2,
  timeout: 30_000,
  tags: ['critical'],
  steps: [
    befriendStep(0, 1),
    {
      name: 'A starts a call to B',
      action: async (ctx: ScenarioContext) => {
        const [a, b] = ctx.bots;
        await a.startCall(b.identity.did);
      },
    },
    {
      name: 'Wait for both to be connected',
      action: async () => {},
      validate: (ctx: ScenarioContext) => {
        const [a, b] = ctx.bots;
        return (
          a.currentCall?.status === 'connected' &&
          b.currentCall?.status === 'connected'
        );
      },
      timeout: 15_000,
    },
    {
      name: 'A sends muted state',
      action: async (ctx: ScenarioContext) => {
        const a = ctx.bots[0];
        a.sendCallState(true, false);
        await sleep(500);
      },
      validate: (ctx: ScenarioContext) => {
        const b = ctx.bots[1];
        return b.currentCall?.remoteIsMuted === true;
      },
      timeout: 10_000,
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// 12. calls-camera-state
// ─────────────────────────────────────────────────────────────────────────────

const callsCameraState: Scenario = {
  name: 'calls-camera-state',
  description: 'A calls B (video), connects, A turns camera off. B should see remoteIsCameraOff = true.',
  botCount: 2,
  timeout: 30_000,
  tags: [],
  steps: [
    befriendStep(0, 1),
    {
      name: 'A starts a video call to B',
      action: async (ctx: ScenarioContext) => {
        const [a, b] = ctx.bots;
        await a.startCall(b.identity.did, 'video');
      },
    },
    {
      name: 'Wait for both to be connected',
      action: async () => {},
      validate: (ctx: ScenarioContext) => {
        const [a, b] = ctx.bots;
        return (
          a.currentCall?.status === 'connected' &&
          b.currentCall?.status === 'connected'
        );
      },
      timeout: 15_000,
    },
    {
      name: 'A sends camera-off state',
      action: async (ctx: ScenarioContext) => {
        const a = ctx.bots[0];
        a.sendCallState(false, true);
        await sleep(500);
      },
      validate: (ctx: ScenarioContext) => {
        const b = ctx.bots[1];
        return b.currentCall?.remoteIsCameraOff === true;
      },
      timeout: 10_000,
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// 13. calls-voice-to-video
// ─────────────────────────────────────────────────────────────────────────────

const callsVoiceToVideo: Scenario = {
  name: 'calls-voice-to-video',
  description: 'A starts a voice call to B. After connected, validate the call type is voice.',
  botCount: 2,
  timeout: 30_000,
  tags: [],
  steps: [
    befriendStep(0, 1),
    {
      name: 'A starts a voice call to B',
      action: async (ctx: ScenarioContext) => {
        const [a, b] = ctx.bots;
        await a.startCall(b.identity.did, 'voice');
      },
    },
    {
      name: 'Wait for both to be connected',
      action: async () => {},
      validate: (ctx: ScenarioContext) => {
        const [a, b] = ctx.bots;
        return (
          a.currentCall?.status === 'connected' &&
          b.currentCall?.status === 'connected'
        );
      },
      timeout: 15_000,
    },
    {
      name: 'Validate call type is voice on both sides',
      action: async () => {},
      validate: (ctx: ScenarioContext) => {
        const [a, b] = ctx.bots;
        return (
          a.currentCall?.callType === 'voice' &&
          b.currentCall?.callType === 'voice'
        );
      },
      timeout: 5_000,
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// 14. calls-sequential
// ─────────────────────────────────────────────────────────────────────────────

const callsSequential: Scenario = {
  name: 'calls-sequential',
  description: 'A calls B twice in sequence. Both calls complete cleanly with no state leaks.',
  botCount: 2,
  timeout: 45_000,
  tags: ['critical'],
  steps: [
    befriendStep(0, 1),
    // --- First call ---
    {
      name: 'A starts the first call to B',
      action: async (ctx: ScenarioContext) => {
        const [a, b] = ctx.bots;
        await a.startCall(b.identity.did);
      },
    },
    {
      name: 'Wait for first call to connect',
      action: async () => {},
      validate: (ctx: ScenarioContext) => {
        const [a, b] = ctx.bots;
        return (
          a.currentCall?.status === 'connected' &&
          b.currentCall?.status === 'connected'
        );
      },
      timeout: 15_000,
    },
    {
      name: 'Hold first call for 3 seconds, then A ends it',
      action: async (ctx: ScenarioContext) => {
        await sleep(3000);
        const a = ctx.bots[0];
        a.endCall();
        await sleep(500);
      },
      validate: (ctx: ScenarioContext) => {
        const [a, b] = ctx.bots;
        return a.currentCall === null && b.currentCall === null;
      },
      timeout: 10_000,
    },
    // --- Gap between calls ---
    {
      name: 'Wait 2 seconds between calls',
      action: async () => {
        await sleep(2000);
      },
    },
    // --- Second call ---
    {
      name: 'A starts the second call to B',
      action: async (ctx: ScenarioContext) => {
        const [a, b] = ctx.bots;
        await a.startCall(b.identity.did);
      },
    },
    {
      name: 'Wait for second call to connect',
      action: async () => {},
      validate: (ctx: ScenarioContext) => {
        const [a, b] = ctx.bots;
        return (
          a.currentCall?.status === 'connected' &&
          b.currentCall?.status === 'connected'
        );
      },
      timeout: 15_000,
    },
    {
      name: 'Hold second call for 3 seconds, then A ends it',
      action: async (ctx: ScenarioContext) => {
        await sleep(3000);
        const a = ctx.bots[0];
        a.endCall();
        await sleep(500);
      },
      validate: (ctx: ScenarioContext) => {
        const [a, b] = ctx.bots;
        return a.currentCall === null && b.currentCall === null;
      },
      timeout: 10_000,
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// Suite Registration
// ─────────────────────────────────────────────────────────────────────────────

registerSuite({
  name: 'calls',
  description: 'Voice and video call scenarios',
  scenarios: [
    callsVoiceConnect,
    callsVideoConnect,
    callsCallerHangup,
    callsCalleeHangup,
    callsDecline,
    callsRingTimeout,
    callsRingTimeoutRace,
    callsBusy,
    callsGlare,
    callsDuringActive,
    callsMuteState,
    callsCameraState,
    callsVoiceToVideo,
    callsSequential,
  ],
});

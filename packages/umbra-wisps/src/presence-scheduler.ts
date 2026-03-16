/**
 * PresenceScheduler -- manages wisp online/offline shifts.
 *
 * Each wisp gets a "shift" window of hours when it is online.
 * Shifts overlap so there are always 4-8 wisps online at any time.
 * Off-shift wisps disconnect from the relay and stop presence broadcasts.
 * On-shift wisps reconnect and resume normal operation.
 */

import { EventEmitter } from 'events';
import type { Wisp } from './wisp.js';

export interface WispShift {
  wispName: string;
  /** Hour (0-23) when the wisp comes online */
  startHour: number;
  /** Duration in hours (8-16) */
  durationHours: number;
  /** Random offset in minutes (-30 to +30) to prevent synchronized starts */
  jitterMinutes: number;
}

/**
 * Default shift distribution ensures 4-8 wisps are always online:
 * - Group A (indices 0,3,6,9):  6am-10pm  (16h)
 * - Group B (indices 1,4,7,10): 2pm-6am   (16h)
 * - Group C (indices 2,5,8,11): 10pm-2pm  (16h)
 *
 * Each shift has generous overlap so transitions feel natural.
 * Wisps that go offline broadcast a presence_offline event.
 * Wisps that come online reconnect and broadcast presence_online.
 */
export class PresenceScheduler extends EventEmitter {
  private shifts: Map<string, WispShift> = new Map();
  private checkInterval: ReturnType<typeof setInterval> | null = null;
  private onlineWisps: Set<string> = new Set();
  private running = false;

  constructor(
    private getWisp: (name: string) => Wisp | undefined,
    private getAllWispNames: () => string[],
  ) {
    super();
  }

  /** Generate default shifts for all wisps. */
  generateShifts(): void {
    const names = this.getAllWispNames();
    const shiftGroups = [
      { startHour: 6, durationHours: 16 },
      { startHour: 14, durationHours: 16 },
      { startHour: 22, durationHours: 16 },
    ];

    names.forEach((name, i) => {
      const group = shiftGroups[i % shiftGroups.length];
      const jitter = Math.round((Math.random() - 0.5) * 60); // -30 to +30 min
      this.shifts.set(name, {
        wispName: name,
        startHour: group.startHour,
        durationHours: group.durationHours,
        jitterMinutes: jitter,
      });
    });
  }

  /** Check if a wisp should be online right now. */
  isOnShift(wispName: string): boolean {
    const shift = this.shifts.get(wispName);
    if (!shift) return true; // Default: online if no shift configured

    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const startMinutes = shift.startHour * 60 + shift.jitterMinutes;
    const endMinutes = startMinutes + shift.durationHours * 60;

    // Handle wrap-around midnight
    if (endMinutes > 24 * 60) {
      return currentMinutes >= startMinutes || currentMinutes < (endMinutes % (24 * 60));
    }
    return currentMinutes >= startMinutes && currentMinutes < endMinutes;
  }

  /** Start the scheduler -- checks every 5 minutes. */
  start(): void {
    this.running = true;
    this.generateShifts();
    this.check(); // Initial check
    this.checkInterval = setInterval(() => this.check(), 5 * 60 * 1000);
  }

  stop(): void {
    this.running = false;
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  /** Check all wisps and bring online / take offline as needed. */
  private check(): void {
    for (const [name] of this.shifts) {
      const shouldBeOnline = this.isOnShift(name);
      const isOnline = this.onlineWisps.has(name);

      if (shouldBeOnline && !isOnline) {
        this.bringOnline(name);
      } else if (!shouldBeOnline && isOnline) {
        this.takeOffline(name);
      }
    }
  }

  private bringOnline(name: string): void {
    const wisp = this.getWisp(name);
    if (!wisp || wisp.running) {
      this.onlineWisps.add(name);
      return;
    }
    void wisp.start().then(() => {
      this.onlineWisps.add(name);
      this.emit('online', name);
      console.log(`[Scheduler] ${name} came online (shift start)`);
    });
  }

  private takeOffline(name: string): void {
    const wisp = this.getWisp(name);
    if (wisp?.running) {
      wisp.stop();
    }
    this.onlineWisps.delete(name);
    this.emit('offline', name);
    console.log(`[Scheduler] ${name} went offline (shift end)`);
  }

  /** Get current status. */
  getStatus(): { online: string[]; offline: string[]; shifts: WispShift[] } {
    const online: string[] = [];
    const offline: string[] = [];
    for (const name of this.getAllWispNames()) {
      if (this.onlineWisps.has(name)) online.push(name);
      else offline.push(name);
    }
    return { online, offline, shifts: Array.from(this.shifts.values()) };
  }
}

/**
 * soundNotifications.ts
 * Web Audio API–based sound system. No audio files required.
 * All tones are generated programmatically.
 */

let audioCtx: AudioContext | null = null;
let ringIntervalId: ReturnType<typeof setInterval> | null = null;
let isMuted = false;

/** Lazily create / resume the AudioContext on first use. */
function getCtx(): AudioContext | null {
  try {
    if (!audioCtx || audioCtx.state === "closed") {
      audioCtx = new AudioContext();
    }
    if (audioCtx.state === "suspended") {
      void audioCtx.resume();
    }
    return audioCtx;
  } catch {
    return null;
  }
}

/** Unlock AudioContext on first user gesture (required on mobile). */
export function unlockAudio(): void {
  getCtx();
}

export function setMuted(muted: boolean): void {
  isMuted = muted;
  if (muted) stopRingtone();
}

export function getMuted(): boolean {
  return isMuted;
}

/**
 * Play a single tone burst.
 * @param freq    Frequency in Hz
 * @param duration Duration in seconds
 * @param type    Oscillator wave type
 * @param vol     Peak gain (0–1)
 * @param delay   Start delay in seconds from now
 */
function playTone(
  freq: number,
  duration: number,
  type: OscillatorType = "sine",
  vol = 0.3,
  delay = 0,
): void {
  if (isMuted) return;
  const ctx = getCtx();
  if (!ctx) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.type = type;
  osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);

  gain.gain.setValueAtTime(0, ctx.currentTime + delay);
  gain.gain.linearRampToValueAtTime(vol, ctx.currentTime + delay + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration);

  osc.start(ctx.currentTime + delay);
  osc.stop(ctx.currentTime + delay + duration + 0.02);
}

// ── Public sound functions ──────────────────────────────────────────────────

/** Soft double-ding: new message received. */
export function playMessageTone(): void {
  playTone(880, 0.12, "sine", 0.25, 0);
  playTone(1100, 0.14, "sine", 0.22, 0.15);
}

/** Triple ascending chime: task reminder / due alert. */
export function playTaskReminderTone(): void {
  playTone(660, 0.18, "sine", 0.28, 0);
  playTone(880, 0.18, "sine", 0.28, 0.22);
  playTone(1100, 0.28, "sine", 0.28, 0.46);
}

/** Short success chime: task marked complete. */
export function playTaskCompleteTone(): void {
  playTone(880, 0.10, "sine", 0.22, 0);
  playTone(1100, 0.10, "sine", 0.22, 0.12);
  playTone(1320, 0.22, "sine", 0.25, 0.26);
}

/** Low descending tone: task overdue / delayed. */
export function playOverdueTone(): void {
  playTone(440, 0.20, "triangle", 0.30, 0);
  playTone(330, 0.30, "triangle", 0.28, 0.25);
}

/** Two-tone call ring pattern (one burst). */
function ringBurst(): void {
  playTone(480, 0.35, "square", 0.18, 0);
  playTone(540, 0.35, "square", 0.18, 0.12);
  playTone(480, 0.35, "square", 0.18, 0.40);
  playTone(540, 0.35, "square", 0.18, 0.52);
}

/** Start repeating ringtone for an incoming call. */
export function playCallRingtone(): void {
  if (isMuted) return;
  stopRingtone(); // clear any existing
  ringBurst();
  ringIntervalId = setInterval(() => ringBurst(), 2800);
}

/** Stop the repeating call ringtone. */
export function stopRingtone(): void {
  if (ringIntervalId !== null) {
    clearInterval(ringIntervalId);
    ringIntervalId = null;
  }
}

/** Short ascending: call connected. */
export function playCallConnectedTone(): void {
  playTone(880, 0.12, "sine", 0.22, 0);
  playTone(1100, 0.22, "sine", 0.22, 0.15);
}

/** Short descending: call ended. */
export function playCallEndedTone(): void {
  playTone(440, 0.18, "sine", 0.20, 0);
  playTone(330, 0.28, "sine", 0.18, 0.22);
}

/** Pop: push notification received (background). */
export function playNotificationPop(): void {
  playTone(1200, 0.08, "sine", 0.20, 0);
  playTone(1000, 0.10, "sine", 0.18, 0.10);
}

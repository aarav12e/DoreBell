// Web Audio API synthesizer for Silent Doorbell audio feedback
let audioCtx = null;

function getAudioContext() {
  if (typeof window === "undefined") return null;
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return null;
  if (!audioCtx) {
    audioCtx = new AudioCtx();
  }
  if (audioCtx.state === "suspended") {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

export const SOUND_PRESETS = [
  { id: "ding-dong", name: "Classic Ding-Dong", desc: "Warm two-tone chime" },
  { id: "marimba", name: "Gentle Marimba", desc: "Soothing acoustic triad" },
  { id: "crystal", name: "Crystal Bell", desc: "Bright high-pitch sparkle" },
  { id: "pulsar", name: "Pulsar Synth", desc: "Modern tech pulse" },
  { id: "soft-beep", name: "Soft Beep", desc: "Subtle 880Hz reminder" },
  { id: "silent", name: "Pure Silent Mode", desc: "No audio (visuals & haptics only)" },
];

export function playChime(preset = "ding-dong", volume = 0.5) {
  if (preset === "silent" || volume <= 0) return;

  const ctx = getAudioContext();
  if (!ctx) return;

  const masterGain = ctx.createGain();
  masterGain.gain.setValueAtTime(Math.min(1, Math.max(0, volume)), ctx.currentTime);
  masterGain.connect(ctx.destination);

  const t0 = ctx.currentTime;

  if (preset === "ding-dong") {
    // Note 1: E5 (659.25Hz) + subtle octave
    playTone(ctx, masterGain, 659.25, t0, 0.45, 0.4);
    playTone(ctx, masterGain, 1318.5, t0, 0.35, 0.15);

    // Note 2: C5 (523.25Hz) + octave
    playTone(ctx, masterGain, 523.25, t0 + 0.38, 0.85, 0.5);
    playTone(ctx, masterGain, 1046.5, t0 + 0.38, 0.6, 0.15);
  } else if (preset === "marimba") {
    // Warm arpeggio: A4 (440Hz), C#5 (554.37Hz), E5 (659.25Hz)
    playTone(ctx, masterGain, 440, t0, 0.35, 0.4, "triangle");
    playTone(ctx, masterGain, 554.37, t0 + 0.12, 0.4, 0.4, "triangle");
    playTone(ctx, masterGain, 659.25, t0 + 0.24, 0.65, 0.5, "triangle");
  } else if (preset === "crystal") {
    // High bright shimmer
    playTone(ctx, masterGain, 1046.5, t0, 0.5, 0.35, "sine");
    playTone(ctx, masterGain, 1567.98, t0 + 0.08, 0.7, 0.3, "sine");
    playTone(ctx, masterGain, 2093.0, t0 + 0.16, 0.9, 0.2, "sine");
  } else if (preset === "pulsar") {
    // Tech pulse
    playTone(ctx, masterGain, 880, t0, 0.12, 0.4, "sawtooth");
    playTone(ctx, masterGain, 1174.66, t0 + 0.15, 0.2, 0.4, "sawtooth");
  } else {
    // soft beep
    playTone(ctx, masterGain, 880, t0, 0.4, 0.3, "sine");
  }
}

function playTone(ctx, destination, freq, startTime, duration, peakGain = 0.3, type = "sine") {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(freq, startTime);

  // Attack & exponential decay envelope
  gain.gain.setValueAtTime(0.0001, startTime);
  gain.gain.linearRampToValueAtTime(peakGain, startTime + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

  osc.connect(gain);
  gain.connect(destination);

  osc.start(startTime);
  osc.stop(startTime + duration + 0.05);
}

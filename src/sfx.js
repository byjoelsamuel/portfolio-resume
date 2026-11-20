// Click sounds, synthesized with Web Audio (no audio files).
// Nothing plays until the first click, and the sound toggle in the header is remembered.

const KEY = 'sanity-muted'

export const isMuted = () => {
  try {
    return localStorage.getItem(KEY) === '1'
  } catch {
    return false
  }
}

export const setMuted = (m) => {
  try {
    localStorage.setItem(KEY, m ? '1' : '0')
  } catch {
    /* storage blocked */
  }
}

// one pitch per title so each case sounds like itself (C5, E5, G5)
const NOTES = [523.25, 659.25, 783.99]

const noiseBuffers = new WeakMap()
const noiseFor = (ctx) => {
  let buf = noiseBuffers.get(ctx)
  if (!buf) {
    buf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate)
    const d = buf.getChannelData(0)
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1
    noiseBuffers.set(ctx, buf)
  }
  return buf
}

const envelope = (param, t, attack, dur, peak) => {
  param.setValueAtTime(0.0001, t)
  param.exponentialRampToValueAtTime(peak, t + attack)
  param.exponentialRampToValueAtTime(0.0001, t + dur)
}

function tone(ctx, out, { type = 'sine', f0, f1, t, dur, peak = 0.2, attack = 0.005 }) {
  const o = ctx.createOscillator()
  const g = ctx.createGain()
  o.type = type
  o.frequency.setValueAtTime(f0, t)
  if (f1) o.frequency.exponentialRampToValueAtTime(f1, t + dur)
  envelope(g.gain, t, attack, dur, peak)
  o.connect(g).connect(out)
  o.start(t)
  o.stop(t + dur + 0.05)
}

function hiss(ctx, out, { type = 'bandpass', f0, f1, q = 1, t, dur, peak = 0.2, attack = 0.004 }) {
  const s = ctx.createBufferSource()
  s.buffer = noiseFor(ctx)
  s.loop = true
  const f = ctx.createBiquadFilter()
  f.type = type
  f.Q.value = q
  f.frequency.setValueAtTime(f0, t)
  if (f1) f.frequency.exponentialRampToValueAtTime(f1, t + dur)
  const g = ctx.createGain()
  envelope(g.gain, t, attack, dur, peak)
  s.connect(f).connect(g).connect(out)
  s.start(t)
  s.stop(t + dur + 0.05)
}

// glassy bell: a sine plus a couple of quieter overtones that die faster
function ping(ctx, out, f, t, peak = 0.2, dur = 0.7) {
  tone(ctx, out, { f0: f, t, dur, peak })
  tone(ctx, out, { f0: f * 2.01, t, dur: dur * 0.55, peak: peak * 0.35 })
  tone(ctx, out, { f0: f * 3.98, t, dur: dur * 0.25, peak: peak * 0.12 })
}

// plastic case latch: short noise snap plus a low thump
function clack(ctx, out, t, peak = 0.32, pitch = 1) {
  hiss(ctx, out, { f0: 2000 * pitch, f1: 900 * pitch, q: 2, t, dur: 0.05, peak })
  tone(ctx, out, { type: 'square', f0: 150 * pitch, f1: 55, t, dur: 0.07, peak: peak * 0.5 })
}

// Each sound adds its nodes to `out` at time `t`. Works with a live or offline context.
export const SOUNDS = {
  // case clicked: latch, disc spins up as it swings out, bell when it lands
  open(ctx, out, t, { index = 0 } = {}) {
    const note = NOTES[index % NOTES.length]
    clack(ctx, out, t)
    tone(ctx, out, { type: 'triangle', f0: 220, f1: 1100, t: t + 0.05, dur: 0.6, peak: 0.07, attack: 0.05 })
    hiss(ctx, out, { type: 'highpass', f0: 500, f1: 3600, q: 0.7, t: t + 0.05, dur: 0.55, peak: 0.07, attack: 0.08 })
    ping(ctx, out, note, t + 0.3, 0.2, 0.8)
    ping(ctx, out, note * 1.5, t + 0.4, 0.1, 0.7)
  },
  // case closed (click again, Esc): disc spins down and drops back in, latch
  close(ctx, out, t, { index = 0 } = {}) {
    const note = NOTES[index % NOTES.length]
    tone(ctx, out, { type: 'triangle', f0: 900, f1: 170, t, dur: 0.38, peak: 0.07, attack: 0.02 })
    hiss(ctx, out, { type: 'lowpass', f0: 3200, f1: 350, q: 0.7, t, dur: 0.34, peak: 0.07, attack: 0.02 })
    ping(ctx, out, note / 2, t + 0.04, 0.1, 0.45)
    clack(ctx, out, t + 0.32, 0.28, 0.85)
  },
  // links out to GitHub: two quick rising blips
  link(ctx, out, t) {
    hiss(ctx, out, { f0: 3400, q: 3, t, dur: 0.02, peak: 0.12 })
    ping(ctx, out, 880, t, 0.14, 0.22)
    ping(ctx, out, 1318.51, t + 0.07, 0.14, 0.32)
  },
  // skipping the boot screen
  tick(ctx, out, t) {
    hiss(ctx, out, { f0: 3000, q: 4, t, dur: 0.03, peak: 0.25 })
    tone(ctx, out, { f0: 1200, f1: 700, t, dur: 0.05, peak: 0.12 })
  },
  // sound switched back on
  on(ctx, out, t) {
    ping(ctx, out, 659.25, t, 0.16, 0.3)
    ping(ctx, out, 987.77, t + 0.08, 0.16, 0.45)
  },
}

let ctx = null
let master = null

function ensure() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext
    if (!AC) return null
    ctx = new AC()
    const limiter = ctx.createDynamicsCompressor()
    master = ctx.createGain()
    master.gain.value = 0.8
    master.connect(limiter).connect(ctx.destination)
  }
  if (ctx.state === 'suspended') ctx.resume()
  return ctx
}

// call from a click/key handler (browsers only allow audio after a gesture)
export function play(name, opts) {
  if (isMuted() && name !== 'on') return
  const c = ensure()
  if (!c) return
  SOUNDS[name]?.(c, master, c.currentTime + 0.01, opts)
}

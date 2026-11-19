import { useEffect, useRef, useState } from 'react'
import { motion } from 'motion/react'
import { Emblem } from './Bits.jsx'

const PAL = [
  [22, 40, 120],
  [78, 128, 250],
  [172, 212, 252],
  [242, 248, 255],
]
const BAYER = [0, 32, 8, 40, 2, 34, 10, 42, 48, 16, 56, 24, 50, 18, 58, 26, 12, 44, 4, 36, 14, 46, 6, 38, 60, 28, 52, 20, 62, 30, 54, 22, 3, 35, 11, 43, 1, 33, 9, 41, 51, 19, 59, 27, 49, 17, 57, 25, 15, 47, 7, 39, 13, 45, 5, 37, 63, 31, 55, 23, 61, 29, 53, 21]

// Low-res animated plasma, ordered-dithered to the 4 blues.
function DitherField() {
  const ref = useRef(null)
  useEffect(() => {
    const canvas = ref.current
    const W = 160
    const H = 100
    canvas.width = W
    canvas.height = H
    const ctx = canvas.getContext('2d')
    const img = ctx.createImageData(W, H)
    const d = img.data
    let raf
    const t0 = performance.now()
    const frame = (now) => {
      const t = (now - t0) / 1000
      const fade = Math.min(1, t / 0.8)
      for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
          const nx = x / W - 0.5
          const ny = (y / H - 0.5) * 0.62
          const r = Math.hypot(nx, ny)
          let v =
            0.42 +
            0.22 * Math.sin(r * 18 - t * 2.4) +
            0.16 * Math.sin(nx * 7 + t * 1.1) * Math.cos(ny * 9 - t * 0.8)
          // fade from white haze into the rings, softer at the edges
          v = 1 - (1 - v) * (1 - r * 1.1) * fade
          v = Math.max(0, Math.min(0.999, v)) * 3
          const lo = v | 0
          const idx = lo + (v - lo > (BAYER[(y & 7) * 8 + (x & 7)] + 0.5) / 64 ? 1 : 0)
          const c = PAL[Math.min(3, idx)]
          const i = (y * W + x) * 4
          d[i] = c[0]
          d[i + 1] = c[1]
          d[i + 2] = c[2]
          d[i + 3] = 255
        }
      }
      ctx.putImageData(img, 0, 0)
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(raf)
  }, [])
  return <canvas ref={ref} className="boot-field" aria-hidden="true" />
}

const STEPS = [
  [0, 'SPIN UP'],
  [900, 'READING DISC'],
  [1900, '3 TITLES FOUND'],
]

export default function Boot({ onDone }) {
  const [line, setLine] = useState(STEPS[0][1])

  useEffect(() => {
    const timers = STEPS.map(([ms, text]) => setTimeout(() => setLine(text), ms))
    timers.push(setTimeout(onDone, 3300))
    const skip = () => onDone()
    window.addEventListener('keydown', skip)
    window.addEventListener('pointerdown', skip)
    return () => {
      timers.forEach(clearTimeout)
      window.removeEventListener('keydown', skip)
      window.removeEventListener('pointerdown', skip)
    }
  }, [onDone])

  return (
    <motion.div
      className="boot"
      role="presentation"
      exit={{ clipPath: 'inset(50% 0 50% 0)', filter: 'brightness(3)', transition: { duration: 0.45, ease: [0.7, 0, 0.3, 1] } }}
    >
      {/* CRT power-on: a thin line that opens into the picture */}
      <motion.div
        className="boot-screen"
        initial={{ clipPath: 'inset(49.6% 50% 49.6% 50%)' }}
        animate={{ clipPath: ['inset(49.6% 50% 49.6% 50%)', 'inset(49.6% 0% 49.6% 0%)', 'inset(0% 0% 0% 0%)'] }}
        transition={{ duration: 0.7, times: [0, 0.45, 1], ease: 'easeInOut' }}
      >
        <DitherField />
        <div className="boot-center">
          <motion.div
            className="boot-emblem"
            initial={{ scale: 0.4, opacity: 0, rotate: -90 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            transition={{ delay: 0.55, type: 'spring', stiffness: 140, damping: 14 }}
          >
            <Emblem />
          </motion.div>
          <div className="boot-word chrome">
            {'SANITY.MEDIA'.split('').map((ch, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, y: 12, filter: 'blur(6px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                transition={{ delay: 0.8 + i * 0.045, duration: 0.35 }}
              >
                {ch}
              </motion.span>
            ))}
          </div>
          <motion.p
            className="boot-line"
            key={line}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.15 }}
          >
            {line}
            <span className="blink">▮</span>
          </motion.p>
        </div>
        <div className="boot-corner boot-tl">VOL.01 · BYJOELSAMUEL</div>
        <div className="boot-corner boot-tr">ソフトウェア</div>
        <div className="boot-corner boot-bl">SNTY-00000</div>
        <div className="boot-corner boot-br">PRESS ANY KEY</div>
      </motion.div>
    </motion.div>
  )
}

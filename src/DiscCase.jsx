import { useEffect } from 'react'
import { motion, animate, useMotionValue, useTransform } from 'motion/react'
import { Emblem, Barcode, Rings } from './Bits.jsx'

const BASE = import.meta.env.BASE_URL

// The disc leaves the case along a quarter-ellipse (up, then swinging out to the
// right), measured in case-width units so it scales with the case.
const ARC_X = 24
const ARC_Y = 54
const SPIN_SECONDS = 3.2

export default function DiscCase({ title, index, selected, dimmed, onSelect, reduced }) {
  const version = title.version.replace(/^v/, '').split('.').slice(0, 2).join('.')

  const t = useMotionValue(reduced ? (selected ? 1 : 0) : 0) // 0 = in the case, 1 = out
  const spin = useMotionValue(0)
  const x = useTransform(t, (v) => `${ARC_X * (1 - Math.cos((v * Math.PI) / 2))}cqw`)
  const y = useTransform(t, (v) => `${-ARC_Y * Math.sin((v * Math.PI) / 2)}cqw`)
  const scale = useTransform(t, [0, 1], [0.94, 1])
  const opacity = useTransform(t, [0, 0.04], [0, 1])

  useEffect(() => {
    if (reduced) {
      t.set(selected ? 1 : 0)
      return
    }
    const controls = []
    if (selected) {
      controls.push(animate(t, 1, { type: 'spring', stiffness: 70, damping: 13, mass: 1.1 }))
      controls.push(
        animate(spin, spin.get() + 36000, { duration: SPIN_SECONDS * 100, ease: 'linear' }),
      )
    } else if (t.get() > 0) {
      controls.push(animate(t, 0, { duration: 0.5, ease: [0.55, 0, 0.8, 0.4] }))
      controls.push(animate(spin, spin.get() + 140, { duration: 0.5, ease: 'easeOut' }))
    }
    return () => controls.forEach((c) => c.stop())
  }, [selected, reduced, t, spin])

  return (
    <motion.button
      type="button"
      className={'case' + (selected ? ' is-selected' : '') + (dimmed ? ' is-dimmed' : '')}
      style={{ zIndex: selected ? 5 : 1 }}
      aria-pressed={selected}
      aria-controls="sheet"
      aria-label={`${title.name}: show details`}
      onClick={onSelect}
      initial={reduced ? false : { y: 80, opacity: 0, rotate: -4 }}
      animate={{
        y: selected ? -12 : 0,
        opacity: dimmed ? 0.5 : 1,
        rotate: 0,
        scale: selected ? 1.04 : 1,
      }}
      whileHover={selected ? undefined : { y: -8 }}
      whileTap={{ scale: 0.98 }}
      transition={{
        type: 'spring',
        stiffness: 260,
        damping: 24,
        delay: reduced ? 0 : 0.15 + index * 0.12,
        opacity: { duration: 0.25 },
      }}
    >
      {/* the disc: position follows the arc, rotation spins while the case is open */}
      <motion.span className="disc-path" aria-hidden="true" style={{ x, y, scale, opacity }}>
        <motion.span className="disc" style={{ rotate: spin }}>
          <span className="disc-label">{title.name}</span>
        </motion.span>
      </motion.span>

      <span className="shell">
        <span className="insert">
          <span className="topbar">
            <span className="brand">sanity.media</span>
            <span className="tag">{title.platforms[0]}</span>
          </span>

          <span className="spine">
            <span className="spine-emblem">
              <Emblem />
            </span>
            <span className="spine-stat">{title.stat}</span>
            <Rings className="spine-rings" />
            <span className="spine-rules" />
            <span className="spine-genres">
              {title.genres.map((g, i) => (
                <span key={g}>
                  {i > 0 && <i>•</i>}
                  {g}
                </span>
              ))}
            </span>
            <span className="spine-code">
              <Barcode value={title.code} className="barcode" />
              <span>{title.code}</span>
            </span>
          </span>

          <span className="strip">
            <span className="strip-top">sanity.media</span>
            <span className="strip-name">{title.name}</span>
          </span>

          <span className="art">
            <img src={BASE + title.cover} alt="" draggable="false" />
            <span className="art-halftone" />
            <span className="art-title" style={{ '--len': title.name.length }}>
              {title.name.toUpperCase()}
            </span>
            <span className="art-tag">{title.platforms[1]}</span>
            <span className="art-badge">
              <b>{version}</b>
              <small>github</small>
            </span>
          </span>
        </span>
        <span className="gloss" />
      </span>
    </motion.button>
  )
}

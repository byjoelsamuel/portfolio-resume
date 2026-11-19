import { motion } from 'motion/react'
import { Emblem, Barcode, Rings } from './Bits.jsx'

const BASE = import.meta.env.BASE_URL

export default function DiscCase({ title, index, selected, dimmed, onSelect, reduced }) {
  const version = title.version.replace(/^v/, '').split('.').slice(0, 2).join('.')

  return (
    <motion.button
      type="button"
      className={'case' + (selected ? ' is-selected' : '') + (dimmed ? ' is-dimmed' : '')}
      aria-pressed={selected}
      aria-controls="sheet"
      aria-label={`${title.name}: show details`}
      onClick={onSelect}
      initial={reduced ? false : { y: 80, opacity: 0, rotate: -4 }}
      animate={{
        y: selected ? -18 : 0,
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
      {/* the disc slides up out of the case when it's picked */}
      <motion.span
        className="disc"
        aria-hidden="true"
        initial={false}
        animate={selected ? { y: '-34%', rotate: 220, opacity: 1 } : { y: '0%', rotate: 0, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 120, damping: 18 }}
      >
        <span className="disc-label">{title.name}</span>
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
            <span className="art-title" style={{ '--len': title.name.length }}>{title.name.toUpperCase()}</span>
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

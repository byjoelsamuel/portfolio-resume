import { useEffect, useState } from 'react'
import { motion, animate } from 'motion/react'
import { useRepoStats, daysSince, shortDate, ago } from './useRepoStats.js'
import { Barcode } from './Bits.jsx'
import * as sfx from './sfx.js'

const BASE = import.meta.env.BASE_URL

const rise = {
  hidden: { opacity: 0, y: 14, clipPath: 'inset(0 0 100% 0)' },
  show: { opacity: 1, y: 0, clipPath: 'inset(0 0 0% 0)' },
}

function DayCounter({ to, reduced }) {
  const [n, setN] = useState(reduced ? to : 0)
  useEffect(() => {
    if (reduced) return setN(to)
    const c = animate(0, to, { duration: 1.1, ease: [0.2, 0.8, 0.2, 1], onUpdate: (v) => setN(Math.round(v)) })
    return () => c.stop()
  }, [to, reduced])
  return <span className="lcd-digits">{String(n).padStart(3, '0')}</span>
}

const cols = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } }

function Clip({ title, reduced }) {
  return (
    <video
      className="clip"
      poster={BASE + title.poster}
      autoPlay={!reduced}
      muted
      loop
      playsInline
      preload="auto"
      aria-label={`${title.name}: ${title.clipCaption}`}
    >
      <source src={BASE + title.clip} type="video/mp4" />
      <source src={BASE + title.clip.replace('.mp4', '.webm')} type="video/webm" />
    </video>
  )
}

export function Sheet({ title, reduced }) {
  const stats = useRepoStats(title)
  const day = daysSince(stats.started) + 1
  const url = 'https://github.com/' + title.repo

  return (
    <motion.article
      className="sheet"
      key={title.id}
      initial="hidden"
      animate="show"
      exit={{ opacity: 0, x: 24, transition: { duration: 0.15 } }}
      transition={{ staggerChildren: reduced ? 0 : 0.06 }}
    >
      {/* one sweep across the page each time you switch titles */}
      {!reduced && (
        <motion.span
          className="sweep"
          aria-hidden="true"
          initial={{ x: '-120%' }}
          animate={{ x: '120%' }}
          transition={{ duration: 0.75, ease: [0.65, 0, 0.35, 1] }}
        />
      )}

      <motion.header className="sheet-kicker" variants={rise}>
        <span>TITLE {title.no}/03</span>
        <span className="kana">{title.kana}</span>
        <span>{title.code}</span>
      </motion.header>

      <motion.h2 className="sheet-name chrome" variants={rise}>
        {title.name}
      </motion.h2>
      <motion.p className="sheet-deck" variants={rise}>
        {title.deck}
      </motion.p>

      <div className="sheet-grid">
        <motion.div className="sheet-col sheet-a" variants={cols}>
          <motion.figure className="sheet-clip" variants={rise}>
            <Clip title={title} reduced={reduced} />
            <figcaption>
              <span>FIG.{title.no}</span> {title.clipCaption}
            </figcaption>
          </motion.figure>

          <motion.div className="lcd" variants={rise} aria-label={`In service for ${day} days`}>
            <div className="lcd-main">
              <span className="lcd-label">IN SERVICE · DAY</span>
              <DayCounter to={day} reduced={reduced} />
            </div>
            <dl className="lcd-rows">
              <div>
                <dt>first commit</dt>
                <dd>{shortDate(stats.started)}</dd>
              </div>
              <div>
                <dt>last patch</dt>
                <dd>{ago(stats.pushed)}</dd>
              </div>
              <div>
                <dt>latest</dt>
                <dd>{stats.version}</dd>
              </div>
            </dl>
          </motion.div>

          <motion.dl className="sheet-specs" variants={rise}>
            {title.specs.map(([k, v]) => (
              <div key={k}>
                <dt>{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </motion.dl>
        </motion.div>

        <motion.div className="sheet-col sheet-b" variants={cols}>
          <motion.p className="sheet-body" variants={rise}>
            {title.body}
          </motion.p>
          <motion.ol className="sheet-tracks" variants={rise}>
            {title.tracks.map((t, i) => (
              <li key={t}>
                <span>{String(i + 1).padStart(2, '0')}</span>
                {t}
              </li>
            ))}
          </motion.ol>
          <motion.a
            className="repo"
            href={url}
            target="_blank"
            rel="noreferrer"
            variants={rise}
            onClick={() => sfx.play('link')}
          >
            <span className="repo-label">REPO</span>
            <span className="repo-url">{title.repo}</span>
            <span className="repo-arrow" aria-hidden="true">
              →
            </span>
          </motion.a>
        </motion.div>
      </div>
    </motion.article>
  )
}

export function EmptySheet({ titles, onPick }) {
  return (
    <motion.article
      className="sheet sheet-empty"
      key="empty"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.12 } }}
    >
      <p className="tray">
        NO DISC<span className="blink">_</span>
      </p>
      <p className="tray-hint">pick a case</p>
      <ol className="tray-index">
        {titles.map((t) => (
          <li key={t.id}>
            <button type="button" onClick={() => onPick(t.id)}>
              <span>{t.no}</span>
              {t.name}
              <i>{t.kana}</i>
            </button>
          </li>
        ))}
      </ol>
      <Barcode value="SANITY-MEDIA-VOL01" className="tray-barcode" />
    </motion.article>
  )
}

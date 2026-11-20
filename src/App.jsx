import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, MotionConfig } from 'motion/react'
import { TITLES } from './data.js'
import Boot from './Boot.jsx'
import DiscCase from './DiscCase.jsx'
import { Sheet, EmptySheet } from './Panel.jsx'
import { Emblem } from './Bits.jsx'
import FitBox from './FitBox.jsx'
import * as sfx from './sfx.js'

const MOTION_KEY = 'sanity-motion'

// Motion starts from the device's "reduce motion" setting, but the MOTION button
// in the header overrides it, and that choice is remembered.
function initialMotion() {
  try {
    const v = localStorage.getItem(MOTION_KEY)
    if (v === '1') return true
    if (v === '0') return false
  } catch {
    /* storage blocked */
  }
  return !window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

// Boot plays once per tab session, and only with motion on.
function shouldBoot(motion) {
  if (!motion) return false
  try {
    return !sessionStorage.getItem('booted')
  } catch {
    return true
  }
}

export default function App() {
  const [motion, setMotion] = useState(initialMotion)
  const reduced = !motion
  const [booting, setBooting] = useState(() => shouldBoot(motion))

  useEffect(() => {
    document.documentElement.dataset.motion = motion ? 'on' : 'off'
  }, [motion])

  const toggleMotion = () => {
    const next = !motion
    try {
      localStorage.setItem(MOTION_KEY, next ? '1' : '0')
    } catch {
      /* storage blocked */
    }
    setMotion(next)
    sfx.play(next ? 'on' : 'tick')
  }
  const [selectedId, setSelectedId] = useState(null)
  const panelRef = useRef(null)
  const selected = TITLES.find((t) => t.id === selectedId)

  const finishBoot = useCallback(() => {
    try {
      sessionStorage.setItem('booted', '1')
    } catch {
      /* storage blocked */
    }
    setBooting(false)
  }, [])

  const [muted, setMutedState] = useState(sfx.isMuted)
  const toggleSound = () => {
    const next = !muted
    sfx.setMuted(next)
    setMutedState(next)
    if (!next) sfx.play('on')
  }

  const pick = (id) => {
    const index = TITLES.findIndex((t) => t.id === id)
    const closing = selectedId === id
    sfx.play(closing ? 'close' : 'open', { index })
    setSelectedId(closing ? null : id)
    // on phones the panel is under the shelf, so bring it into view
    if (window.matchMedia('(max-width: 900px)').matches) {
      setTimeout(() => panelRef.current?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' }), 120)
    }
  }

  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== 'Escape' || !selectedId) return
      sfx.play('close', { index: TITLES.findIndex((t) => t.id === selectedId) })
      setSelectedId(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [selectedId])

  return (
    <MotionConfig reducedMotion={motion ? 'never' : 'always'}>
      <AnimatePresence>{booting && <Boot key="boot" onDone={finishBoot} />}</AnimatePresence>

      {!booting && (
        <div className="page">
          <header className="mast">
            <div className="mast-brand">
              <Emblem className="mast-emblem" />
              <span>SANITY.MEDIA</span>
            </div>
            <span className="mast-mid">SOFTWARE · VOL.01 · 2026</span>
            <div className="mast-right">
              <button
                type="button"
                className="mast-snd"
                aria-pressed={motion}
                aria-label={motion ? 'Turn animations off' : 'Turn animations on'}
                title="Animations. Starts from your device's reduce-motion setting."
                onClick={toggleMotion}
              >
                <span aria-hidden="true">{motion ? '▶' : '❚❚'}</span>
                <span className="lbl"> MOTION {motion ? 'ON' : 'OFF'}</span>
              </button>
              <button
                type="button"
                className="mast-snd"
                aria-pressed={!muted}
                aria-label={muted ? 'Turn sound on' : 'Turn sound off'}
                onClick={toggleSound}
              >
                <span aria-hidden="true">{muted ? '×' : '♪'}</span>
                <span className="lbl"> SOUND {muted ? 'OFF' : 'ON'}</span>
              </button>
              <a
                className="mast-gh"
                href="https://github.com/byjoelsamuel"
                target="_blank"
                rel="noreferrer"
                onClick={() => sfx.play('link')}
              >
                @byjoelsamuel
              </a>
            </div>
          </header>

          <div className="ticker" aria-hidden="true">
            <div className="ticker-track">
              {[0, 1, 2, 3, 4, 5].map((k) => (
                <span key={k}>
                  {TITLES.map((t) => (
                    <span key={t.id}>
                      {t.name.toUpperCase()} {t.version} <b>★</b>{' '}
                    </span>
                  ))}
                  ANDROID <b>★</b> ANDROID AUTO <b>★</b> WINDOWS <b>★</b> 3 TITLES ON THE SHELF <b>★</b>{' '}
                </span>
              ))}
            </div>
          </div>

          <main className="layout">
            <section className="left">
              <div className="hero">
                <p className="hero-kicker">
                  <span>WORKS</span>
                </p>
                <h1 className="hero-name chrome">
                  JOEL
                  <br />
                  SAMUEL
                </h1>
              </div>

              <div className="shelf" role="group" aria-label="Projects">
                {TITLES.map((t, i) => (
                  <DiscCase
                    key={t.id}
                    title={t}
                    index={i}
                    reduced={reduced}
                    selected={t.id === selectedId}
                    dimmed={selectedId !== null && t.id !== selectedId}
                    onSelect={() => pick(t.id)}
                  />
                ))}
              </div>
              <div className="ledge">
                <span>{String(TITLES.length).padStart(2, '0')} TITLES</span>
                <span>CLICK A CASE</span>
                <span>ESC TO EJECT</span>
              </div>
            </section>

            <aside className="right" id="sheet" ref={panelRef} aria-live="polite">
              <FitBox>
                <AnimatePresence mode="wait">
                  {selected ? (
                    <Sheet key={selected.id} title={selected} reduced={reduced} />
                  ) : (
                    <EmptySheet key="empty" titles={TITLES} onPick={pick} />
                  )}
                </AnimatePresence>
              </FitBox>
            </aside>
          </main>

          <footer className="foot">
            <span>© 2026 byjoelsamuel</span>
            <span>@byjoelsamuel on insta &amp; yt</span>
            <a
              href="https://github.com/byjoelsamuel"
              target="_blank"
              rel="noreferrer"
              onClick={() => sfx.play('link')}
            >
              github.com/byjoelsamuel
            </a>
          </footer>
        </div>
      )}
    </MotionConfig>
  )
}

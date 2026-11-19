import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, MotionConfig, useReducedMotion } from 'motion/react'
import { TITLES } from './data.js'
import Boot from './Boot.jsx'
import DiscCase from './DiscCase.jsx'
import { Sheet, EmptySheet } from './Panel.jsx'
import { Emblem } from './Bits.jsx'

// Boot plays once per tab session, never with reduced motion.
function shouldBoot() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false
  try {
    return !sessionStorage.getItem('booted')
  } catch {
    return true
  }
}

export default function App() {
  const reduced = useReducedMotion()
  const [booting, setBooting] = useState(shouldBoot)
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

  const pick = (id) => {
    setSelectedId((cur) => (cur === id ? null : id))
    // on phones the panel is under the shelf, so bring it into view
    if (window.matchMedia('(max-width: 900px)').matches) {
      setTimeout(() => panelRef.current?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' }), 120)
    }
  }

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && setSelectedId(null)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <MotionConfig reducedMotion="user">
      <AnimatePresence>{booting && <Boot key="boot" onDone={finishBoot} />}</AnimatePresence>

      {!booting && (
        <div className="page">
          <header className="mast">
            <div className="mast-brand">
              <Emblem className="mast-emblem" />
              <span>SANITY.MEDIA</span>
            </div>
            <span className="mast-mid">SOFTWARE · VOL.01 · 2026</span>
            <a className="mast-gh" href="https://github.com/byjoelsamuel" target="_blank" rel="noreferrer">
              @byjoelsamuel
            </a>
          </header>

          <div className="ticker" aria-hidden="true">
            <div className="ticker-track">
              {[0, 1].map((k) => (
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
                  <span className="kana">ジョエル・サミュエル</span>
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
              <AnimatePresence mode="wait">
                {selected ? (
                  <Sheet key={selected.id} title={selected} reduced={reduced} />
                ) : (
                  <EmptySheet key="empty" titles={TITLES} onPick={pick} />
                )}
              </AnimatePresence>
            </aside>
          </main>

          <footer className="foot">
            <span>© 2026 byjoelsamuel</span>
            <span>@byjoelsamuel on insta &amp; yt</span>
            <a href="https://github.com/byjoelsamuel" target="_blank" rel="noreferrer">
              github.com/byjoelsamuel
            </a>
          </footer>
        </div>
      )}
    </MotionConfig>
  )
}

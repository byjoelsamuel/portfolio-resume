import { useLayoutEffect, useRef } from 'react'

const MIN_SCALE = 0.6

// Scales its content down until it fits the box height (desktop only), so a
// page never needs a scrollbar for the last line. The content is laid out at
// width/scale so it still fills the box, then shrunk with a transform.
export default function FitBox({ children, className = '' }) {
  const box = useRef(null)
  const inner = useRef(null)

  useLayoutEffect(() => {
    const boxEl = box.current
    const el = inner.current
    const desktop = window.matchMedia('(min-width: 901px)')
    let raf = 0

    const apply = (s, w) => {
      el.style.width = w / s + 'px'
      el.style.transform = s === 1 ? '' : `scale(${s})`
    }

    const fit = () => {
      raf = 0
      const w = boxEl.clientWidth
      const h = boxEl.clientHeight - 2
      if (!desktop.matches || !w || h <= 0) {
        el.style.width = ''
        el.style.transform = ''
        return
      }
      apply(1, w)
      if (el.offsetHeight <= h) return
      apply(MIN_SCALE, w)
      if (el.offsetHeight * MIN_SCALE > h) return // even the smallest size is tight: keep it readable
      let lo = MIN_SCALE
      let hi = 1
      for (let i = 0; i < 7; i++) {
        const mid = (lo + hi) / 2
        apply(mid, w)
        if (el.offsetHeight * mid <= h) lo = mid
        else hi = mid
      }
      apply(lo, w)
    }

    const queue = () => {
      if (!raf) raf = requestAnimationFrame(fit)
    }

    const ro = new ResizeObserver(queue)
    ro.observe(boxEl)
    ro.observe(el)
    desktop.addEventListener('change', queue)
    document.fonts?.ready.then(queue)
    queue()
    return () => {
      ro.disconnect()
      desktop.removeEventListener('change', queue)
      cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <div ref={box} className={'fit ' + className}>
      <div ref={inner} className="fit-inner">
        {children}
      </div>
    </div>
  )
}

'use client'

import { useRef, useState, useEffect } from 'react'

interface Props {
  text: string
  className?: string
}

export default function GoldenText({ text, className = '' }: Props) {
  const letterRefs = useRef<(HTMLSpanElement | null)[]>([])
  const [intensities, setIntensities] = useState<number[]>(() =>
    new Array(text.length).fill(0)
  )

  useEffect(() => {
    const MAX_DIST = 110

    function onMouseMove(e: MouseEvent) {
      const mx = e.clientX
      const my = e.clientY

      setIntensities(
        letterRefs.current.map((el) => {
          if (!el) return 0
          const rect = el.getBoundingClientRect()
          const cx = rect.left + rect.width / 2
          const cy = rect.top + rect.height / 2
          const dist = Math.sqrt((mx - cx) ** 2 + (my - cy) ** 2)
          return Math.max(0, 1 - dist / MAX_DIST)
        })
      )
    }

    window.addEventListener('mousemove', onMouseMove)
    return () => window.removeEventListener('mousemove', onMouseMove)
  }, [text.length])

  return (
    <span className={className} style={{ cursor: 'default' }}>
      {text.split('').map((char, i) => {
        const t = intensities[i] ?? 0
        // Interpolate: slate-100 (#f1f5f9) → gold (#fbbf24)
        const r = Math.round(241 + (251 - 241) * t)
        const g = Math.round(245 + (191 - 245) * t)
        const b = Math.round(249 + (36  - 249) * t)

        return (
          <span
            key={i}
            ref={(el) => { letterRefs.current[i] = el }}
            style={{
              color: `rgb(${r},${g},${b})`,
              transition: 'color 0.35s ease',
              display: 'inline-block',
            }}
          >
            {char === ' ' ? '\u00A0' : char}
          </span>
        )
      })}
    </span>
  )
}

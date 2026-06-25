'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

export function useSwipeFeed(count: number) {
  const [activeIndex, setActiveIndex] = useState(0)
  const cardRefs = useRef<(HTMLDivElement | null)[]>([])

  // Keep refs array sized to count
  useEffect(() => {
    cardRefs.current = cardRefs.current.slice(0, count)
  }, [count])

  useEffect(() => {
    if (count === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const idx = cardRefs.current.indexOf(entry.target as HTMLDivElement)
            if (idx !== -1) setActiveIndex(idx)
          }
        }
      },
      { threshold: 0.6 }
    )

    cardRefs.current.forEach((ref) => {
      if (ref) observer.observe(ref)
    })

    return () => observer.disconnect()
  }, [count])

  const setCardRef = useCallback((index: number) => (el: HTMLDivElement | null) => {
    cardRefs.current[index] = el
  }, [])

  // Instant-jump (used after trimming from front to keep the visible card stable)
  const scrollTo = useCallback((index: number, behavior: ScrollBehavior = 'smooth') => {
    const target = cardRefs.current[Math.max(0, index)]
    if (target) target.scrollIntoView({ behavior, block: 'start' })
  }, [])

  const scrollToNext = useCallback(() => {
    const nextIndex = Math.min(activeIndex + 1, count - 1)
    cardRefs.current[nextIndex]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [activeIndex, count])

  const scrollToPrev = useCallback(() => {
    const prevIndex = Math.max(activeIndex - 1, 0)
    cardRefs.current[prevIndex]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [activeIndex])

  return { activeIndex, setCardRef, scrollTo, scrollToNext, scrollToPrev }
}

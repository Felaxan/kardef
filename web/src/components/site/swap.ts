/** Süzgeç değişince: görünenler solar, yeni liste sırayla alttan gelir (WAAPI). */
export function animateOut(els: HTMLElement[]): Promise<void> {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (reduce || !els.length) return Promise.resolve()
  els.forEach((el) =>
    el.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateY(10px) scale(.98)' }], {
      duration: 200, easing: 'ease-in', fill: 'forwards',
    }),
  )
  return new Promise((r) => setTimeout(r, 210))
}

export function animateIn(els: HTMLElement[]) {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  els.forEach((el, k) => {
    el.getAnimations().forEach((a) => a.cancel())
    if (reduce) return
    el.animate([{ opacity: 0, transform: 'translateY(22px)' }, { opacity: 1, transform: 'none' }], {
      duration: 700, easing: 'cubic-bezier(.16,1,.3,1)', delay: k * 75, fill: 'backwards',
    })
  })
}

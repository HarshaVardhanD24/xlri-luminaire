import { useEffect, useRef } from 'react';

/**
 * One rAF-driven scroll loop for the whole page.
 * Writes CSS variables so scroll-linked visuals update without React re-renders:
 *   :root --sp  overall page progress 0..1
 *   section --p progress through that section 0..1
 */
type Entry = { el: HTMLElement; mode: 'pin' | 'through'; cb?: (p: number) => void; last: number };
const entries = new Set<Entry>();
let ticking = false;
let started = false;

function update() {
  ticking = false;
  const vh = window.innerHeight;
  const doc = document.documentElement;
  const max = Math.max(1, doc.scrollHeight - vh);
  doc.style.setProperty('--sp', (window.scrollY / max).toFixed(4));
  for (const e of entries) {
    const r = e.el.getBoundingClientRect();
    const p =
      e.mode === 'pin'
        ? Math.min(1, Math.max(0, -r.top / Math.max(1, r.height - vh)))
        : Math.min(1, Math.max(0, (vh - r.top) / (vh + r.height)));
    if (Math.abs(p - e.last) < 0.0005) continue;
    e.last = p;
    e.el.style.setProperty('--p', p.toFixed(4));
    e.cb?.(p);
  }
}

export function requestScrollUpdate() {
  if (!ticking) {
    ticking = true;
    requestAnimationFrame(update);
  }
}

function start() {
  if (started) return;
  started = true;
  window.addEventListener('scroll', requestScrollUpdate, { passive: true });
  window.addEventListener('resize', requestScrollUpdate);
}

/** Attach to a section; `pin` = tall section with a sticky child, `through` = normal flow. */
export function useSectionProgress<T extends HTMLElement>(mode: 'pin' | 'through' = 'pin', cb?: (p: number) => void) {
  const ref = useRef<T>(null);
  const cbRef = useRef(cb);
  cbRef.current = cb;
  useEffect(() => {
    start();
    const el = ref.current;
    if (!el) return;
    const entry: Entry = { el, mode, cb: (p) => cbRef.current?.(p), last: -1 };
    entries.add(entry);
    requestScrollUpdate();
    return () => {
      entries.delete(entry);
    };
  }, [mode]);
  return ref;
}

/** Adds .is-in to every [data-reveal] element once it scrolls into view. */
export function useReveal(deps: unknown[] = []) {
  useEffect(() => {
    const els = document.querySelectorAll<HTMLElement>('[data-reveal]:not(.is-in)');
    if (!('IntersectionObserver' in window)) {
      els.forEach((el) => el.classList.add('is-in'));
      return;
    }
    const io = new IntersectionObserver(
      (items) =>
        items.forEach((it) => {
          if (it.isIntersecting) {
            it.target.classList.add('is-in');
            io.unobserve(it.target);
          }
        }),
      { rootMargin: '0px 0px -12% 0px', threshold: 0.05 },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

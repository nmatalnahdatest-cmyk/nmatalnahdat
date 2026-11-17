import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import gsap from 'gsap';

export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(() =>
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false
  );

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const listener = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener('change', listener);
    return () => mq.removeEventListener('change', listener);
  }, []);

  return reduced;
}

export function useStaggerEntrance(
  containerRef: React.RefObject<HTMLElement | null>,
  selector: string,
  deps: unknown[] = []
) {
  const reduced = usePrefersReducedMotion();

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    if (reduced) return;

    const ctx = gsap.context(() => {
      const targets = el.querySelectorAll(selector);
      if (!targets.length) return;
      gsap.fromTo(
        targets,
        { opacity: 0, y: 12 },
        {
          opacity: 1,
          y: 0,
          duration: 0.38,
          stagger: 0.045,
          ease: 'power3.out',
          clearProps: 'transform,opacity',
        }
      );
    }, containerRef);

    return () => ctx.revert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduced, ...deps]);
}

export function useCountUp(
  target: number,
  decimals = 0,
  duration = 0.65
): string {
  const reduced = usePrefersReducedMotion();
  const [display, setDisplay] = useState(target);
  const objRef = useRef({ val: target });

  useEffect(() => {
    if (reduced) {
      setDisplay(target);
      objRef.current.val = target;
      return;
    }

    const tween = gsap.to(objRef.current, {
      val: target,
      duration,
      ease: 'power3.out',
      onUpdate: () => {
        setDisplay(objRef.current.val);
      },
    });

    return () => {
      tween.kill();
    };
  }, [target, duration, reduced]);

  return display.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function useSlidingPill(
  containerRef: React.RefObject<HTMLElement | null>,
  indicatorRef: React.RefObject<HTMLElement | null>,
  activeSelector: string,
  deps: unknown[] = []
) {
  const reduced = usePrefersReducedMotion();

  useLayoutEffect(() => {
    const container = containerRef.current;
    const indicator = indicatorRef.current;
    if (!container || !indicator) return;

    const activeEl = container.querySelector<HTMLElement>(activeSelector);
    if (!activeEl) {
      gsap.set(indicator, { opacity: 0 });
      return;
    }

    const cRect = container.getBoundingClientRect();
    const aRect = activeEl.getBoundingClientRect();
    const x = aRect.left - cRect.left;
    const y = aRect.top - cRect.top;

    if (reduced) {
      gsap.set(indicator, {
        x,
        y,
        width: aRect.width,
        height: aRect.height,
        opacity: 1,
      });
      return;
    }

    gsap.to(indicator, {
      x,
      y,
      width: aRect.width,
      height: aRect.height,
      opacity: 1,
      duration: 0.34,
      ease: 'power3.out',
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduced, activeSelector, ...deps]);
}

const TACTILE_SELECTOR =
  'button:not(:disabled):not([data-no-tactile]), [role="button"]:not([aria-disabled="true"]):not([data-no-tactile]), a[data-tactile]';

export function useGlobalButtonTactile() {
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    if (reduced) return;

    let activeEl: HTMLElement | null = null;

    const press = (el: HTMLElement) => {
      if (activeEl && activeEl !== el) {
        release(activeEl);
      }
      activeEl = el;
      el.setAttribute('data-gsap-active', 'true');
      gsap.to(el, {
        scale: 0.97,
        y: 0,
        duration: 0.09,
        ease: 'power2.out',
        overwrite: 'auto',
      });
    };

    const release = (el: HTMLElement | null) => {
      if (!el) return;
      el.removeAttribute('data-gsap-active');
      if (activeEl === el) activeEl = null;

      const isHovered = el.matches(':hover');
      const isAnimatedBtn = el.hasAttribute('data-animated-btn');

      gsap.to(el, {
        scale: isHovered ? (isAnimatedBtn ? 1.025 : 1.02) : 1,
        y: isHovered && isAnimatedBtn ? -2 : 0,
        duration: 0.22,
        ease: 'power3.out',
        overwrite: 'auto',
        onComplete: () => {
          if (!el.matches(':hover') && !el.hasAttribute('data-gsap-active')) {
            gsap.set(el, { clearProps: 'transform' });
          }
        },
      });
    };

    const onPointerEnter = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return;
      const target = (e.target as Element | null)?.closest<HTMLElement>(TACTILE_SELECTOR);
      if (!target || target.hasAttribute('data-animated-btn') || target.hasAttribute('data-gsap-active')) {
        return;
      }
      gsap.to(target, {
        scale: 1.02,
        y: -1,
        duration: 0.18,
        ease: 'power3.out',
        overwrite: 'auto',
      });
    };

    const onPointerLeave = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return;
      const target = (e.target as Element | null)?.closest<HTMLElement>(TACTILE_SELECTOR);
      if (!target || target.hasAttribute('data-animated-btn') || target.hasAttribute('data-gsap-active')) {
        return;
      }
      gsap.to(target, {
        scale: 1,
        y: 0,
        duration: 0.2,
        ease: 'power3.out',
        overwrite: 'auto',
        onComplete: () => {
          if (!target.matches(':hover') && !target.hasAttribute('data-gsap-active')) {
            gsap.set(target, { clearProps: 'transform' });
          }
        },
      });
    };

    const onPointerDown = (e: PointerEvent) => {
      if (e.button !== 0 && e.pointerType === 'mouse') return;
      const target = (e.target as Element | null)?.closest<HTMLElement>(TACTILE_SELECTOR);
      if (target) press(target);
    };

    const onPointerUp = () => {
      if (activeEl) release(activeEl);
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      if (e.key !== 'Enter' && e.key !== ' ') return;
      const target = (e.target as Element | null)?.closest<HTMLElement>(TACTILE_SELECTOR);
      if (target) press(target);
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      if (activeEl) release(activeEl);
    };

    document.addEventListener('pointerenter', onPointerEnter, true);
    document.addEventListener('pointerleave', onPointerLeave, true);
    document.addEventListener('pointerdown', onPointerDown, true);
    window.addEventListener('pointerup', onPointerUp, true);
    window.addEventListener('pointercancel', onPointerUp, true);
    document.addEventListener('keydown', onKeyDown, true);
    document.addEventListener('keyup', onKeyUp, true);

    return () => {
      document.removeEventListener('pointerenter', onPointerEnter, true);
      document.removeEventListener('pointerleave', onPointerLeave, true);
      document.removeEventListener('pointerdown', onPointerDown, true);
      window.removeEventListener('pointerup', onPointerUp, true);
      window.removeEventListener('pointercancel', onPointerUp, true);
      document.removeEventListener('keydown', onKeyDown, true);
      document.removeEventListener('keyup', onKeyUp, true);
      if (activeEl) {
        gsap.killTweensOf(activeEl);
        gsap.set(activeEl, { clearProps: 'transform' });
      }
    };
  }, [reduced]);
}


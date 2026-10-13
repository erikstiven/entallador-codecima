import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';

export interface HeroMarqueeLabels {
  sublimation: string;
  dtf: string;
  laserCut: string;
  orderTag: string;
  orderStatus: string;
  orderClient: string;
  orderItem: string;
  orderQtyLabel: string;
  orderQtyValue: string;
  orderDueLabel: string;
  orderDueValue: string;
  usageTag: string;
  usageLabel: string;
  usageValue: string;
  usagePeriod: string;
  patternTag: string;
  patternPiece: string;
  patternSize: string;
  trackTag: string;
  trackSteps: string[];
  mixTag: string;
  mixLabel: string;
  mixTotalLabel: string;
  mixSlices: string[];
  productTag: string;
  productName: string;
  productParts: string;
}

const ROTATIONS = [-2, 1, -1, 2, -1.5, 1.5];
const LIFTS = [0, 20, 6, 32, 12, 26];

const CARD_SURFACE =
  'rounded-lg border border-black/10 bg-white shadow-[0_14px_30px_rgba(0,0,0,0.12)]';
const NARROW_CARD = `${CARD_SURFACE} flex h-[192px] flex-col justify-between px-2.5 pb-3 pt-3.5 md:h-[250px] md:px-3`;
const META_LABEL =
  'text-[8px] uppercase tracking-[0.09em] text-neutral-400 md:text-[9px]';
const NUM_VALUE = 'tabular-nums font-semibold text-neutral-900';

const USAGE_BARS = [38, 56, 30, 72, 48, 88, 62];
const MIX_PERCENTS = [52, 31, 17];
const MIX_OPACITIES = ['', 'opacity-50', 'opacity-[0.22]'];

const SIZE_CLASSES: Record<'sheet' | 'narrow' | 'wide', string> = {
  sheet: 'w-[130px] md:w-[170px]',
  narrow: 'w-[104px] md:w-[136px]',
  wide: 'w-[168px] md:w-[220px]',
};

const OrderCard: React.FC<{ l: HeroMarqueeLabels }> = ({ l }) => (
  <div className={NARROW_CARD}>
    <div className="flex flex-col gap-[7px]">
      <div className="flex items-center justify-between gap-1.5">
        <span className={`${META_LABEL} tabular-nums`}>#1042</span>
        <span className="shrink-0 whitespace-nowrap rounded-full bg-primary/10 px-1.5 py-[2px] text-[8px] font-bold leading-tight text-primary md:text-[9px]">
          {l.orderStatus}
        </span>
      </div>
      <p className="text-[11px] font-bold leading-tight tracking-tight text-neutral-900 md:text-[12px]">
        {l.orderClient}
      </p>
      <p className="text-[9px] leading-tight text-neutral-500 md:text-[10px]">
        {l.orderItem}
      </p>
    </div>
    <div className="flex flex-col gap-[7px]">
      <div className="h-px bg-neutral-100" />
      <div className="flex items-center justify-between gap-1.5">
        <span className={META_LABEL}>{l.orderQtyLabel}</span>
        <span className={`${NUM_VALUE} text-[15px] md:text-[18px]`}>
          {l.orderQtyValue}
        </span>
      </div>
      <div className="flex items-center justify-between gap-1.5">
        <span className={META_LABEL}>{l.orderDueLabel}</span>
        <span className={`${NUM_VALUE} text-[10px] md:text-[11px]`}>
          {l.orderDueValue}
        </span>
      </div>
    </div>
  </div>
);

const UsageCard: React.FC<{ l: HeroMarqueeLabels }> = ({ l }) => (
  <div className={NARROW_CARD}>
    <span className={META_LABEL}>{l.usageLabel}</span>
    <div className="my-2 flex flex-1 items-end gap-[3px]">
      {USAGE_BARS.map((heightPct, idx) => (
        <span
          key={idx}
          style={{ height: `${heightPct}%` }}
          className={`block flex-1 rounded-t-[2px] ${
            idx === 5 ? 'bg-primary' : 'bg-neutral-200'
          }`}
        />
      ))}
    </div>
    <div className="flex flex-col gap-[7px]">
      <div className="h-px bg-neutral-100" />
      <div className="flex items-baseline justify-between gap-1.5">
        <span className={`${NUM_VALUE} text-[15px] md:text-[18px]`}>
          {l.usageValue}
        </span>
        <span className={META_LABEL}>{l.usagePeriod}</span>
      </div>
    </div>
  </div>
);

const PatternCard: React.FC<{ l: HeroMarqueeLabels }> = ({ l }) => (
  <div className={`${CARD_SURFACE} relative px-3 pb-3 pt-3.5`}>
    <img
      src="/hero/hero-molde-frente.webp"
      alt=""
      draggable={false}
      className="w-full"
    />
    <div className="absolute inset-x-0 top-1/2 flex -translate-y-1/2 flex-col items-center">
      <span className="text-[13px] font-bold leading-none text-neutral-600 md:text-[15px]">
        {l.patternSize}
      </span>
      <span className="mt-[3px] text-[6px] uppercase tracking-[0.12em] text-neutral-400 md:text-[7px]">
        {l.patternPiece}
      </span>
    </div>
  </div>
);

const ProductCard: React.FC<{ l: HeroMarqueeLabels }> = ({ l }) => (
  <div
    className={`${CARD_SURFACE} flex flex-col gap-2 px-2.5 pb-2.5 pt-3.5 md:px-3 md:pb-3`}
  >
    <div className="rounded-md bg-neutral-50 px-2 py-2.5">
      <img
        src="/hero/hero-producto.webp"
        alt=""
        draggable={false}
        className="w-full"
      />
    </div>
    <div className="flex items-end justify-between gap-2">
      <div className="min-w-0">
        <p className="truncate text-[10px] font-bold leading-tight tracking-tight text-neutral-900 md:text-[11.5px]">
          {l.productName}
        </p>
        <p className="mt-[2px] truncate text-[8px] leading-tight text-neutral-500 md:text-[9px]">
          {l.productParts}
        </p>
      </div>
      <span className={`${NUM_VALUE} shrink-0 text-[12px] md:text-[14px]`}>
        {l.orderQtyValue}
      </span>
    </div>
  </div>
);

const TrackCard: React.FC<{ l: HeroMarqueeLabels }> = ({ l }) => (
  <div className={NARROW_CARD}>
    <span className={`${META_LABEL} mb-2 tabular-nums`}>#1042</span>
    <ol className="m-0 flex flex-1 list-none flex-col p-0">
      {l.trackSteps.map((step, idx) => {
        const isCompleted = idx < 2;
        const isActive = idx === 2;
        const isLast = idx === l.trackSteps.length - 1;
        return (
          <li key={idx} className={`flex gap-2 ${isLast ? '' : 'flex-1'}`}>
            <div className="flex flex-col items-center">
              {isActive ? (
                <span className="mt-[3px] flex h-[9px] w-[9px] shrink-0 items-center justify-center rounded-full border-2 border-primary bg-white">
                  <span className="block h-[3px] w-[3px] rounded-full bg-primary" />
                </span>
              ) : (
                <span
                  className={`mt-[3px] block h-[9px] w-[9px] shrink-0 rounded-full ${
                    isCompleted
                      ? 'bg-primary'
                      : 'border border-neutral-300 bg-white'
                  }`}
                />
              )}
              {!isLast && (
                <span
                  className={`block w-px flex-1 ${
                    isCompleted ? 'bg-primary/40' : 'bg-neutral-200'
                  }`}
                />
              )}
            </div>
            <span
              className={`pb-[9px] text-[9px] leading-tight md:text-[10px] ${
                isActive ? '-mt-[1px]' : ''
              } ${
                isActive
                  ? 'font-bold text-neutral-900'
                  : isCompleted
                  ? 'text-neutral-500'
                  : 'text-neutral-300'
              }`}
            >
              {step}
            </span>
          </li>
        );
      })}
    </ol>
  </div>
);

const MixCard: React.FC<{ l: HeroMarqueeLabels }> = ({ l }) => {
  let cumulative = 0;
  return (
    <div className={NARROW_CARD}>
      <span className={META_LABEL}>{l.mixLabel}</span>
      <div className="relative mx-auto w-[84px] py-1 md:w-[100px]">
        <svg viewBox="0 0 42 42" className="w-full -rotate-90">
          <circle
            cx="21"
            cy="21"
            r="15.9155"
            fill="none"
            className="stroke-neutral-100"
            strokeWidth="6"
          />
          {MIX_PERCENTS.map((pct, idx) => {
            const offset = 25 - cumulative;
            cumulative += pct;
            return (
              <circle
                key={idx}
                cx="21"
                cy="21"
                r="15.9155"
                fill="none"
                strokeWidth="6"
                strokeDasharray={`${pct} ${100 - pct}`}
                strokeDashoffset={offset}
                className={`stroke-primary ${MIX_OPACITIES[idx]}`}
              />
            );
          })}
        </svg>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className={`${NUM_VALUE} text-[16px] leading-none md:text-[19px]`}>
            37
          </span>
          <span className="mt-[2px] text-[6px] uppercase tracking-[0.08em] text-neutral-400 md:text-[7px]">
            {l.mixTotalLabel}
          </span>
        </div>
      </div>
      <ul className="m-0 flex list-none flex-col gap-[3px] p-0">
        {l.mixSlices.map((sliceName, idx) => (
          <li key={idx} className="flex items-center gap-1.5">
            <span
              className={`block h-[6px] w-[6px] shrink-0 rounded-full bg-primary ${MIX_OPACITIES[idx]}`}
            />
            <span className="truncate text-[8px] text-neutral-500 md:text-[9px]">
              {sliceName}
            </span>
            <span className={`ml-auto ${NUM_VALUE} text-[8px] md:text-[9px]`}>
              {MIX_PERCENTS[idx]}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};

interface CardDefinition {
  kind: 'image' | 'node';
  src?: string;
  tag: (l: HeroMarqueeLabels) => string;
  render?: (l: HeroMarqueeLabels) => React.ReactNode;
  size?: 'sheet' | 'narrow' | 'wide';
  lift?: number;
}

const HERO_CARDS: CardDefinition[] = [
  {
    kind: 'image',
    src: '/hero/hero-sublimacion.webp',
    tag: (l) => l.sublimation,
  },
  {
    kind: 'node',
    tag: (l) => l.orderTag,
    render: (l) => <OrderCard l={l} />,
    size: 'narrow',
  },
  {
    kind: 'image',
    src: '/hero/hero-dtf-sponsors.webp',
    tag: (l) => l.dtf,
  },
  {
    kind: 'node',
    tag: (l) => l.patternTag,
    render: (l) => <PatternCard l={l} />,
  },
  {
    kind: 'node',
    tag: (l) => l.productTag,
    render: (l) => <ProductCard l={l} />,
    size: 'wide',
    lift: 84,
  },
  {
    kind: 'image',
    src: '/hero/hero-dtf-cachimbas.webp',
    tag: (l) => l.dtf,
  },
  {
    kind: 'node',
    tag: (l) => l.trackTag,
    render: (l) => <TrackCard l={l} />,
    size: 'narrow',
  },
  {
    kind: 'image',
    src: '/hero/hero-corte.webp',
    tag: (l) => l.laserCut,
    lift: 76,
  },
  {
    kind: 'node',
    tag: (l) => l.usageTag,
    render: (l) => <UsageCard l={l} />,
    size: 'narrow',
  },
  {
    kind: 'node',
    tag: (l) => l.mixTag,
    render: (l) => <MixCard l={l} />,
    size: 'narrow',
  },
];

interface FigureMeta {
  el: HTMLElement;
  center: number;
  rot: number;
  left: boolean | null;
}

export const HeroCardMarquee: React.FC<{ labels: HeroMarqueeLabels }> = ({
  labels,
}) => {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const firstGroupRef = useRef<HTMLDivElement | null>(null);
  const [groupCount, setGroupCount] = useState(2);

  const groupWidthRef = useRef(0);
  const sectionTopRef = useRef(0);
  const smoothedScrollRef = useRef(0);
  const lastOffsetRef = useRef<number | null>(null);
  const dragOffsetRef = useRef(0);
  const velocityRef = useRef(0);
  const isDraggingRef = useRef(false);
  const pointerXRef = useRef(0);
  const pointerTimeRef = useRef(0);
  const figuresRef = useRef<FigureMeta[]>([]);

  useLayoutEffect(() => {
    if (typeof window === 'undefined') return;
    let resizeTimer: ReturnType<typeof setTimeout> | undefined;

    const measure = () => {
      const track = trackRef.current;
      const firstGroup = firstGroupRef.current;
      if (!track || !firstGroup) return;

      const colGap = parseFloat(window.getComputedStyle(track).columnGap) || 0;
      groupWidthRef.current = firstGroup.getBoundingClientRect().width + colGap;

      const sectionEl = track.closest('section');
      sectionTopRef.current =
        (sectionEl?.getBoundingClientRect().top ?? 0) + window.scrollY;

      if (groupWidthRef.current > 0) {
        const needed =
          Math.ceil((window.innerWidth + 300) / groupWidthRef.current) + 1;
        setGroupCount((prev) => (needed > prev ? needed : prev));
      }

      figuresRef.current = Array.from(track.querySelectorAll('figure')).map(
        (el) => ({
          el: el as HTMLElement,
          center: el.offsetLeft + el.offsetWidth / 2,
          rot: parseFloat(el.dataset.rot ?? '0'),
          left: null,
        })
      );

      smoothedScrollRef.current = Math.max(
        0,
        window.scrollY - sectionTopRef.current
      );
      lastOffsetRef.current = null;
    };

    measure();

    const handleResize = () => {
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(measure, 150);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      if (resizeTimer) clearTimeout(resizeTimer);
      window.removeEventListener('resize', handleResize);
    };
  }, [groupCount]);

  useEffect(() => {
    if (
      typeof window === 'undefined' ||
      typeof window.requestAnimationFrame !== 'function'
    ) {
      return;
    }

    const prefersReducedMotion =
      typeof window.matchMedia === 'function'
        ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
        : false;

    let rafId = 0;
    let prevTime = 0;

    const tick = (now: number) => {
      const track = trackRef.current;
      const groupWidth = groupWidthRef.current;

      if (track && groupWidth > 0) {
        const dt = prevTime ? Math.min((now - prevTime) / 1000, 0.05) : 1 / 60;
        const targetScroll = Math.max(
          0,
          window.scrollY - sectionTopRef.current
        );

        let baseOffset: number;
        if (prefersReducedMotion) {
          smoothedScrollRef.current = targetScroll;
          baseOffset = 0.2 * targetScroll;
        } else {
          smoothedScrollRef.current +=
            (targetScroll - smoothedScrollRef.current) *
            (1 - Math.pow(0.92, 60 * dt));
          baseOffset = 0.2 * smoothedScrollRef.current;
        }

        if (!isDraggingRef.current && velocityRef.current !== 0) {
          dragOffsetRef.current += velocityRef.current * dt;
          velocityRef.current *= Math.pow(0.0015, dt);
          if (Math.abs(velocityRef.current) < 12) {
            velocityRef.current = 0;
          }
        }

        const totalOffset = baseOffset + dragOffsetRef.current;
        const wrappedOffset =
          (((totalOffset % groupWidth) + groupWidth) % groupWidth) - groupWidth;

        if (wrappedOffset !== lastOffsetRef.current) {
          track.style.transform = `translate3d(${wrappedOffset.toFixed(2)}px,0,0)`;
          lastOffsetRef.current = wrappedOffset;
        }

        const viewportCenter = window.innerWidth / 2;
        for (const fig of figuresRef.current) {
          const isLeft = wrappedOffset + fig.center < viewportCenter;
          if (isLeft !== fig.left) {
            fig.left = isLeft;
            fig.el.style.setProperty(
              '--rot',
              `${isLeft ? -3 - Math.abs(fig.rot) : fig.rot}deg`
            );
          }
        }
      }

      prevTime = now;
      rafId = window.requestAnimationFrame(tick);
    };

    rafId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(rafId);
  }, []);

  const endDrag = (resetVelocity = false) => {
    if (isDraggingRef.current) {
      isDraggingRef.current = false;
      if (resetVelocity) {
        velocityRef.current = 0;
      }
    }
  };

  return (
    <div
      aria-hidden="true"
      onPointerDown={(e) => {
        if (e.pointerType !== 'mouse') {
          isDraggingRef.current = true;
          velocityRef.current = 0;
          pointerXRef.current = e.clientX;
          pointerTimeRef.current = e.timeStamp;
          try {
            e.currentTarget.setPointerCapture(e.pointerId);
          } catch {
            // Ignore pointer capture errors
          }
        }
      }}
      onPointerMove={(e) => {
        if (!isDraggingRef.current) return;
        const dx = e.clientX - pointerXRef.current;
        const dt = Math.max(e.timeStamp - pointerTimeRef.current, 1) / 1000;
        pointerXRef.current = e.clientX;
        pointerTimeRef.current = e.timeStamp;
        dragOffsetRef.current += dx;
        const nextVel = 0.7 * velocityRef.current + (dx / dt) * 0.3;
        velocityRef.current = Math.max(-2600, Math.min(2600, nextVel));
      }}
      onPointerUp={() => endDrag(false)}
      onPointerCancel={() => endDrag(true)}
      style={{ touchAction: 'pan-y' }}
      className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-[min(56vh,380px)] select-none overflow-hidden [contain:paint] [@media(pointer:coarse)]:pointer-events-auto"
    >
      <div
        ref={trackRef}
        style={{ transform: 'translate3d(0,0,0)' }}
        className="absolute bottom-[-34px] left-0 flex items-end gap-4 will-change-transform [backface-visibility:hidden] md:gap-6"
      >
        {Array.from({ length: groupCount }).map((_, groupIdx) => (
          <div
            key={groupIdx}
            ref={groupIdx === 0 ? firstGroupRef : undefined}
            className="flex items-end gap-4 md:gap-6"
          >
            {HERO_CARDS.map((card, cardIdx) => {
              const rot = ROTATIONS[cardIdx % ROTATIONS.length];
              const lift = card.lift ?? LIFTS[cardIdx % LIFTS.length];
              const sizeKey = card.size ?? 'sheet';
              return (
                <figure
                  key={cardIdx}
                  data-rot={rot}
                  className={`pointer-events-auto transition-transform duration-300 ease-out motion-reduce:transition-none [transform:rotate(var(--rot))_translateY(var(--lift))] hover:z-10 hover:[transform:rotate(calc(var(--rot)_+_4deg))_translateY(var(--lift))] relative m-0 shrink-0 ${SIZE_CLASSES[sizeKey]}`}
                  style={
                    {
                      '--rot': `${rot}deg`,
                      '--lift': `${-lift}px`,
                    } as React.CSSProperties
                  }
                >
                  {card.kind === 'image' ? (
                    <img
                      src={card.src}
                      alt=""
                      draggable={false}
                      className="w-full rounded-lg border border-black/10 shadow-[0_14px_30px_rgba(0,0,0,0.12)]"
                    />
                  ) : (
                    card.render?.(labels)
                  )}
                  <figcaption
                    className={`absolute -top-[11.5px] left-3 rounded-full border border-black/10 bg-white py-[2.3px] font-semibold text-neutral-600 shadow-[0_2px_8px_rgba(0,0,0,0.14)] ${
                      card.size === 'narrow'
                        ? 'px-2 text-[9.5px] md:px-[9px] md:text-[11px]'
                        : 'px-[11.5px] text-[12.65px]'
                    }`}
                  >
                    {card.tag(labels)}
                  </figcaption>
                </figure>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

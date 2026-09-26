import { useCallback, useEffect, useRef, useState } from "react";

import a1 from "@/assets/achievement-1.jpg.asset.json";
import a2 from "@/assets/achievement-2.jpg.asset.json";
import a3 from "@/assets/achievement-3.jpg.asset.json";
import a4 from "@/assets/achievement-4.jpg.asset.json";
import a5 from "@/assets/achievement-5.jpg.asset.json";

type Slide = {
  src: string;
  alt: string;
  tag: string;
  title: string;
  text: string;
};

const slides: Slide[] = [
  {
    src: a1.url,
    alt: "A spread of certificates and awards laid out on fabric",
    tag: "The Collection",
    title: "A Wall of Honours",
    text: "Published author, spell-bee merits, library honours and creativity awards — a growing shelf of firsts.",
  },
  {
    src: a3.url,
    alt: "Silver medal resting beside a certificate of merit",
    tag: "International Spelling Competition 2024–25",
    title: "Silver Medal & Merit",
    text: "School rank 2, national rank 60 — a silver medal from Humming Bird Education at the international level.",
  },
  {
    src: a2.url,
    alt: "Certificate of Excellence for English creative writing",
    tag: "Top 10 World's Best School Prizes · 2026",
    title: "Excellence in Creative Writing",
    text: "Recognised for consistent achievement in English creative writing, session 2025–26.",
  },
  {
    src: a4.url,
    alt: "Gold trophy and medals on yellow ribbons",
    tag: "Music",
    title: "Dedicated to Music",
    text: "A trophy and a row of medals for being regular and dedicated to music, year after year.",
  },
  {
    src: a5.url,
    alt: "Merit list with school ranks",
    tag: "Interschool Merit List",
    title: "On the Leaderboard",
    text: "Representing Seth M. R. Jaipuria School, Gomti Nagar among the top ranks across campuses.",
  },
];

function ChevronLeft() {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth={2} stroke="currentColor" className="size-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
    </svg>
  );
}

function ChevronRight() {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth={2} stroke="currentColor" className="size-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
    </svg>
  );
}

function Close() {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth={2} stroke="currentColor" className="size-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

export function AchievementCarousel() {
  const [index, setIndex] = useState(0);
  const [dragDx, setDragDx] = useState(0);
  const [lightbox, setLightbox] = useState<number | null>(null);

  const viewportRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);
  const capturedRef = useRef(false);
  const startXRef = useRef(0);
  const movedRef = useRef(false);
  const dxRef = useRef(0);
  const hoveredRef = useRef(false);
  const lightboxRef = useRef<number | null>(null);
  lightboxRef.current = lightbox;

  const count = slides.length;
  const activeSlide = lightbox === null ? undefined : slides[lightbox];
  const clamp = (i: number) => Math.min(count - 1, Math.max(0, i));
  const goTo = useCallback((i: number) => setIndex(clamp(i)), [count]);
  const step = useCallback((dir: number) => setIndex((i) => clamp(i + dir)), [count]);

  // Keyboard navigation (also powers the lightbox)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (lightboxRef.current !== null) {
        if (e.key === "Escape") setLightbox(null);
        if (e.key === "ArrowRight") setLightbox((v) => (v === null ? v : (v + 1) % count));
        if (e.key === "ArrowLeft")
          setLightbox((v) => (v === null ? v : (v - 1 + count) % count));
        return;
      }
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [count, step]);

  // Gentle autoplay — pauses while dragging, hovering, or viewing the lightbox
  useEffect(() => {
    const t = window.setInterval(() => {
      if (draggingRef.current || hoveredRef.current || lightboxRef.current !== null) return;
      setIndex((i) => (i + 1) % count);
    }, 6500);
    return () => window.clearInterval(t);
  }, [count]);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    draggingRef.current = true;
    capturedRef.current = false;
    startXRef.current = e.clientX;
    movedRef.current = false;
    dxRef.current = 0;
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return;
    const dx = e.clientX - startXRef.current;
    if (!capturedRef.current && Math.abs(dx) > 8) {
      // Capture only once a real drag starts so simple taps still reach buttons
      capturedRef.current = true;
      movedRef.current = true;
      e.currentTarget.setPointerCapture(e.pointerId);
    }
    dxRef.current = dx;
    setDragDx(dx);
  };

  const endDrag = () => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    const dx = dxRef.current;
    dxRef.current = 0;
    setDragDx(0);
    const w = viewportRef.current?.clientWidth ?? 1;
    if (Math.abs(dx) > Math.min(90, w * 0.16)) {
      step(dx < 0 ? 1 : -1);
    }
  };

  const openLightboxIfTap = () => {
    if (!movedRef.current) setLightbox(index);
  };

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-background spotlight-bg font-sans text-foreground">
      {/* Header */}
      <header className="mx-auto w-full max-w-4xl px-6 pt-10 text-center sm:pt-14">
        <div className="mb-5 inline-block border-b-2 border-gold px-4 pb-1">
          <span className="text-[11px] font-semibold uppercase tracking-[0.3em] text-gold">
            Academic Excellence
          </span>
        </div>
        <h1 className="font-display text-4xl font-medium italic md:text-5xl">
          Achievement Portfolio
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
          A curated collection of accolades in creative writing, international
          spelling, and publication.
        </p>
      </header>

      {/* Carousel */}
      <main className="relative mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center px-4 py-8 sm:px-8">
        <div
          ref={viewportRef}
          role="region"
          aria-roledescription="carousel"
          aria-label="Achievements"
          className="relative cursor-grab touch-pan-y select-none overflow-hidden active:cursor-grabbing"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onMouseEnter={() => (hoveredRef.current = true)}
          onMouseLeave={() => (hoveredRef.current = false)}
        >
          <div
            className="flex"
            style={{
              transform: `translate3d(calc(${-index * 100}% + ${dragDx}px), 0, 0)`,
              transition: draggingRef.current
                ? "none"
                : "transform 650ms cubic-bezier(0.22, 1, 0.36, 1)",
            }}
          >
            {slides.map((slide, i) => {
              const distance = Math.abs(i - index);
              const active = distance === 0;
              return (
                <div key={i} className="w-full shrink-0 px-2 sm:px-8" aria-hidden={!active}>
                  <div
                    className="mx-auto w-full max-w-md"
                    style={{
                      transform: `scale(${active ? 1 : 0.9})`,
                      opacity: active ? 1 : 0.35,
                      transition: draggingRef.current
                        ? "none"
                        : "transform 650ms cubic-bezier(0.22, 1, 0.36, 1), opacity 650ms ease",
                    }}
                  >
                    <div
                      className="group rounded-xl border border-border bg-card/70 p-3 shadow-[0_30px_80px_-30px_oklch(0_0_0/85%)] backdrop-blur-sm"
                      onClick={openLightboxIfTap}
                    >
                      <div className="relative aspect-[4/5] overflow-hidden rounded-lg bg-muted">
                        <img
                          src={slide.src}
                          alt={slide.alt}
                          draggable={false}
                          className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                        />
                        <div className="pointer-events-none absolute inset-0 rounded-lg gold-frame" />
                        <div className="pointer-events-none absolute inset-0 rounded-lg bg-gradient-to-t from-black/45 via-transparent to-transparent" />
                      </div>
                      <div className="px-3 pb-3 pt-5 text-center">
                        <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.25em] text-gold">
                          {slide.tag}
                        </p>
                        <h3 className="font-display text-xl italic md:text-2xl">{slide.title}</h3>
                        <p className="mx-auto mt-2 max-w-[44ch] text-xs leading-relaxed text-muted-foreground sm:text-sm">
                          {slide.text}
                        </p>
                        <button
                          type="button"
                          className="mt-4 inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.25em] text-gold-soft transition-colors hover:text-gold"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!movedRef.current) setLightbox(i);
                          }}
                        >
                          View
                          <span aria-hidden className="h-px w-6 bg-gold/60" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Controls */}
        <div className="mt-8 flex items-center justify-center gap-4">
          <button
            type="button"
            aria-label="Previous achievement"
            onClick={() => step(-1)}
            className="flex size-10 items-center justify-center rounded-full border border-border bg-card/70 text-foreground/70 transition-all hover:border-gold/50 hover:text-gold active:scale-95"
          >
            <ChevronLeft />
          </button>

          <div className="flex items-center gap-2">
            {slides.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Go to slide ${i + 1}`}
                aria-current={i === index}
                onClick={() => goTo(i)}
                className={`h-1 rounded-full transition-all duration-500 ${
                  i === index ? "w-8 bg-gold" : "w-3 bg-foreground/20 hover:bg-foreground/40"
                }`}
              />
            ))}
          </div>

          <button
            type="button"
            aria-label="Next achievement"
            onClick={() => step(1)}
            className="flex size-10 items-center justify-center rounded-full border border-gold/40 bg-gold/10 text-gold transition-all hover:bg-gold hover:text-primary-foreground active:scale-95"
          >
            <ChevronRight />
          </button>
        </div>

        <p className="mt-4 text-center font-mono text-[10px] uppercase tracking-[0.35em] text-muted-foreground">
          {String(index + 1).padStart(2, "0")} — {String(count).padStart(2, "0")}
          <span className="mx-3 text-gold/60">·</span>
          Swipe or tap to explore
        </p>
      </main>

      {/* Footer */}
      <footer className="mx-auto w-full max-w-2xl px-6 pb-8 text-center">
        <div className="gold-rule mx-auto mb-5 h-px w-16" />
        <p className="font-display text-base italic text-foreground/80">
          &ldquo;Words are the wings that allow the mind to fly.&rdquo;
        </p>
        <p className="mt-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70">
          Shubhang Mishra · Academic Year 2024–2026
        </p>
      </footer>

      {/* Lightbox */}
      {lightbox !== null && activeSlide && (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/95 p-4 backdrop-blur-md"
          role="dialog"
          aria-modal="true"
          aria-label={activeSlide.title}
          onClick={() => setLightbox(null)}
        >
          <button
            type="button"
            aria-label="Close"
            onClick={() => setLightbox(null)}
            className="absolute right-4 top-4 flex size-10 items-center justify-center rounded-full border border-border bg-card/70 text-foreground/80 transition-colors hover:border-gold/50 hover:text-gold"
          >
            <Close />
          </button>

          <button
            type="button"
            aria-label="Previous"
            onClick={(e) => {
              e.stopPropagation();
              setLightbox((v) => (v === null ? v : (v - 1 + count) % count));
            }}
            className="absolute left-3 top-1/2 flex size-10 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-card/70 text-foreground/80 transition-colors hover:border-gold/50 hover:text-gold sm:left-8"
          >
            <ChevronLeft />
          </button>
          <button
            type="button"
            aria-label="Next"
            onClick={(e) => {
              e.stopPropagation();
              setLightbox((v) => (v === null ? v : (v + 1) % count));
            }}
            className="absolute right-3 top-1/2 flex size-10 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-card/70 text-foreground/80 transition-colors hover:border-gold/50 hover:text-gold sm:right-8"
          >
            <ChevronRight />
          </button>

          <div className="max-h-[72vh] max-w-3xl" onClick={(e) => e.stopPropagation()}>
            <img
              src={activeSlide.src}
              alt={activeSlide.alt}
              className="max-h-[62vh] w-auto rounded-lg object-contain shadow-[0_40px_120px_-30px_oklch(0_0_0/90%)] ring-1 ring-gold/30"
            />
            <div className="mt-4 text-center">
              <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-gold">
                {activeSlide.tag}
              </p>
              <h3 className="mt-1 font-display text-xl italic">{activeSlide.title}</h3>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

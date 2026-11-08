import { useEffect, useRef, useState } from "react";
import { mediaUrl } from "@/lib/api";
import { preloadImage } from "@/lib/preload-image";

const LIVE_SLIDE_MS = 8000;

export function LiveSlideBackground({
  slides,
  fallbackSrc,
}: {
  slides: { id: number; url: string }[];
  fallbackSrc: string;
}) {
  const [index, setIndex] = useState(0);
  const [readyUrls, setReadyUrls] = useState<Set<string>>(() => new Set());
  const lastShownIndexRef = useRef(0);

  const slideKey = slides.map((s) => s.id).join(",");
  const urls = slides.map((s) => mediaUrl(s.url));

  useEffect(() => {
    setIndex(0);
    lastShownIndexRef.current = 0;
  }, [slideKey]);

  useEffect(() => {
    let cancelled = false;
    for (const url of urls) {
      preloadImage(url)
        .then(() => {
          if (cancelled) return;
          setReadyUrls((prev) => {
            if (prev.has(url)) return prev;
            const next = new Set(prev);
            next.add(url);
            return next;
          });
        })
        .catch(() => undefined);
    }
    return () => {
      cancelled = true;
    };
  }, [slideKey, urls.join("|")]);

  useEffect(() => {
    if (slides.length < 2) return;
    const id = setInterval(() => {
      setIndex((i) => {
        const next = (i + 1) % slides.length;
        const nextUrl = mediaUrl(slides[next]!.url);
        if (!readyUrls.has(nextUrl)) return i;
        return next;
      });
    }, LIVE_SLIDE_MS);
    return () => clearInterval(id);
  }, [slides, readyUrls]);

  const showIndex = (() => {
    const currentUrl = urls[index];
    if (currentUrl && readyUrls.has(currentUrl)) {
      lastShownIndexRef.current = index;
      return index;
    }
    const last = lastShownIndexRef.current;
    const lastUrl = urls[last];
    if (lastUrl && readyUrls.has(lastUrl)) return last;
    return -1;
  })();

  const showFallback = slides.length === 0 || showIndex < 0;

  return (
    <>
      <img
        src={fallbackSrc}
        alt=""
        aria-hidden
        className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-[1200ms] ease-in-out ${
          showFallback ? "opacity-70" : "opacity-0"
        }`}
      />
      {slides.map((slide, i) => {
        const src = mediaUrl(slide.url);
        const loaded = readyUrls.has(src);
        const visible = i === showIndex && loaded;
        return (
          <img
            key={slide.id}
            src={src}
            alt=""
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-[1200ms] ease-in-out ${
              visible ? "opacity-70" : "opacity-0"
            }`}
          />
        );
      })}
    </>
  );
}

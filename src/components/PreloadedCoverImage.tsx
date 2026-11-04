import { useEffect, useState } from "react";
import { preloadImage } from "@/lib/preload-image";

type PreloadedCoverImageProps = {
  src: string;
  alt?: string;
  className?: string;
  visibleClassName?: string;
  hiddenClassName?: string;
};

/** Só aplica `visibleClassName` depois de `src` estar carregada. */
export function PreloadedCoverImage({
  src,
  alt = "",
  className = "absolute inset-0 h-full w-full object-cover",
  visibleClassName = "opacity-70",
  hiddenClassName = "opacity-0",
}: PreloadedCoverImageProps) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(false);
    let cancelled = false;
    preloadImage(src)
      .then(() => {
        if (!cancelled) setReady(true);
      })
      .catch(() => {
        if (!cancelled) setReady(false);
      });
    return () => {
      cancelled = true;
    };
  }, [src]);

  return (
    <img
      src={src}
      alt={alt}
      className={`${className} transition-opacity duration-[1200ms] ease-in-out ${ready ? visibleClassName : hiddenClassName}`}
    />
  );
}

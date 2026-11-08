import j2 from "@/assets/journey-2.jpg";
import { LiveSlideBackground } from "@/components/LiveSlideBackground";
import { PreloadedCoverImage } from "@/components/PreloadedCoverImage";
import { mediaUrl, type ScreenMode } from "@/lib/api";

type TelaScreenBackdropProps = {
  mode: ScreenMode;
  liveSlides: { id: number; url: string }[];
  activeMedia: { url: string; media_type: string } | null | undefined;
  fallbackSrc?: string;
};

/** Fundo da tela gigante — mesma lógica que `/tela` (estado da API). */
export function TelaScreenBackdrop({
  mode,
  liveSlides,
  activeMedia,
  fallbackSrc = j2,
}: TelaScreenBackdropProps) {
  const bg = activeMedia?.url ? mediaUrl(activeMedia.url) : fallbackSrc;
  const isVideo = mode !== "live" && activeMedia?.media_type === "video";

  return (
    <>
      {mode === "live" ? (
        <LiveSlideBackground slides={liveSlides} fallbackSrc={fallbackSrc} />
      ) : isVideo ? (
        <video
          src={bg}
          className="absolute inset-0 h-full w-full object-cover opacity-70"
          autoPlay
          muted
          loop
          playsInline
        />
      ) : (
        <PreloadedCoverImage src={bg} />
      )}
      <div className="bg-veil absolute inset-0" />
    </>
  );
}

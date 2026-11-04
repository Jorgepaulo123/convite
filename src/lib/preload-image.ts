/** Carrega a imagem em memória antes de a mostrar no ecrã. */
export function preloadImage(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!src) {
      reject(new Error("empty src"));
      return;
    }
    const img = new Image();
    img.decoding = "async";
    img.onload = () => resolve();
    img.onerror = () => reject(new Error("failed to load image"));
    img.src = src;
  });
}

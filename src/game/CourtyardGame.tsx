import { useEffect, useRef } from "react";

export default function CourtyardGame({ onReady }: { onReady: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let game: import("phaser").Game | undefined;
    let cancelled = false;
    let observer: ResizeObserver | undefined;
    (async () => {
      const Phaser = (await import("phaser")).default;
      const { CourtyardScene, W, H } = await import("./CourtyardScene");
      if (cancelled || !ref.current) return;
      const host = ref.current;
      const density = Math.min(window.devicePixelRatio || 1, 2);
      game = new Phaser.Game({
        type: Phaser.AUTO, parent: host, width: host.clientWidth * density || W, height: host.clientHeight * density || H,
        transparent: true,
        render: { antialias: true, antialiasGL: true, roundPixels: false },
        scale: { mode: Phaser.Scale.NONE },
        callbacks: { postBoot: (instance) => {
          instance.canvas.style.width = "100%";
          instance.canvas.style.height = "100%";
          instance.canvas.style.display = "block";
          instance.events.once("postrender", onReady);
        } },
        scene: [CourtyardScene],
      });
      observer = new ResizeObserver(() => {
        if (host.clientWidth && host.clientHeight) game?.scale.resize(host.clientWidth * density, host.clientHeight * density);
      });
      observer.observe(host);
    })();
    return () => { cancelled = true; observer?.disconnect(); game?.destroy(true); };
  }, [onReady]);
  return <div ref={ref} className="h-full w-full" />;
}

import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense, useCallback, useEffect, useState } from "react";

const CourtyardGame = lazy(() => import("@/game/CourtyardGame"));

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Moonlit Violet Courtyard — Night Scene" },
      {
        name: "description",
        content: "A layered 2D royal courtyard at night, rendered in Phaser 3.",
      },
      { property: "og:title", content: "Moonlit Violet Courtyard — Night Scene" },
      {
        property: "og:description",
        content: "A layered 2D royal courtyard at night, rendered in Phaser 3.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const [ready, setReady] = useState(false);
  const [painted, setPainted] = useState(false);
  const onReady = useCallback(() => setPainted(true), []);

  useEffect(() => setReady(true), []);

  return (
    <main className="fixed inset-0 overflow-hidden bg-background">
      {ready && (
        <Suspense fallback={null}>
          <CourtyardGame onReady={onReady} />
        </Suspense>
      )}
      {!painted && (
        <div
          className="courtyard-loading absolute inset-0 flex items-center justify-center bg-background"
          role="status"
          aria-label="Loading the courtyard"
        >
          <span className="courtyard-loader" />
        </div>
      )}
    </main>
  );
}

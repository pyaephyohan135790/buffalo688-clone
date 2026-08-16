/**
 * Original Buffalo688 Vue site — hosted copy at /original.
 *
 * The legacy Vue bundle cannot be served as a top-level static page because
 * the platform's visual editor injects mutation scripts that break its mount.
 * Instead we host the bundle inside a blob-URL iframe (opaque origin,
 * editor-proof). All bundle assets are absolute manus-storage URLs so they
 * load inside the blob document (relative URLs would resolve to the blob
 * origin and fail).
 *
 * STYLE: N/A — this page is a transparent host; the embedded document keeps
 * the original site's look 1:1.
 */
import { useEffect, useState } from "react";

const FRAME_PATH = "/original-site-frame.html";

export default function OriginalSite() {
  const [blobUrl, setBlobUrl] = useState<string>("");

  useEffect(() => {
    let cancelled = false;
    fetch(FRAME_PATH)
      .then((r) => (r.ok ? r.text() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((html) => {
        if (cancelled) return;
        const blob = new Blob([html], { type: "text/html" });
        setBlobUrl(URL.createObjectURL(blob));
      })
      .catch((e) => console.error("[original-site] frame fetch failed", e));
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      const data = event.data;
      if (typeof data === "string" && data.startsWith("FRAME-")) {
        console.log("[original-frame]", data);
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-white">
      {blobUrl ? (
        <iframe
          src={blobUrl}
          title="Buffalo688 Original Site"
          className="h-full w-full border-0"
        />
      ) : (
        <div className="flex h-full items-center justify-center text-sm text-gray-500">
          Loading original site…
        </div>
      )}
    </div>
  );
}

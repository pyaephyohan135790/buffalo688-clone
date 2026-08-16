/**
 * Buffalo688 — serves the ORIGINAL site's own HTML/CSS/JS (patched: no app install).
 * The original Vue SPA needs its own document (self-referencing script paths,
 * hash router), so it is hosted full-screen in an isolated iframe.
 * Deep links (e.g. /auth/register) are forwarded as ?route= so the Vue router
 * lands on the right page instead of /. See original-site.html patch.
 */
export default function OriginalHome() {
  const route = typeof window !== "undefined" ? window.location.pathname + window.location.search : "/";
  return (
    <iframe
        src={`/original-site.html?route=${encodeURIComponent(route)}`}
        title="Buffalo688"
        style={{
          width: "100%",
          height: "100vh",
          border: "none",
          display: "block",
        }}
      />
  );
}

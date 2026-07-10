// Global safety nets, registered before the app module evaluates.

function fatal(root: HTMLElement, err: unknown) {
  const msg = err instanceof Error ? err.stack || err.message : String(err);
  const safe = msg.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c] ?? c);
  root.innerHTML =
    '<div style="display:flex;flex-direction:column;gap:12px;height:100vh;box-sizing:border-box;padding:32px;color:#ececf5;background:#07070d;font:13px/1.6 ui-monospace,Consolas,monospace">' +
    '<div style="font:600 16px system-ui">Nyx hit a problem starting up</div>' +
    '<pre style="margin:0;white-space:pre-wrap;word-break:break-word;color:#ff9ec2">' +
    safe +
    "</pre></div>";
}

// Only take over the screen if the app never mounted (blank root).
window.addEventListener("error", (e) => {
  const root = document.getElementById("root");
  if (root && root.childElementCount === 0 && e.error) fatal(root, e.error);
});
window.addEventListener("unhandledrejection", (e) => {
  const root = document.getElementById("root");
  if (root && root.childElementCount === 0) fatal(root, e.reason);
});

// Native feel: suppress the browser context menu everywhere except text fields.
window.addEventListener("contextmenu", (e) => {
  const t = e.target as HTMLElement | null;
  if (!t || !t.closest("input, textarea, [contenteditable='true']")) e.preventDefault();
});

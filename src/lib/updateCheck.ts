import { APP_VERSION, REPO } from "./version";

function isNewer(remote: string, local: string): boolean {
  const a = remote.replace(/^v/, "").split(".").map((n) => parseInt(n, 10) || 0);
  const b = local.replace(/^v/, "").split(".").map((n) => parseInt(n, 10) || 0);
  for (let i = 0; i < 3; i++) {
    if ((a[i] ?? 0) > (b[i] ?? 0)) return true;
    if ((a[i] ?? 0) < (b[i] ?? 0)) return false;
  }
  return false;
}

/** Returns the latest version string if a newer release exists, else null. */
export async function checkForUpdate(): Promise<string | null> {
  try {
    const res = await fetch(`https://api.github.com/repos/${REPO}/releases/latest`, {
      headers: { Accept: "application/vnd.github+json" },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { tag_name?: string };
    const tag = (data.tag_name ?? "").replace(/^v/, "");
    return tag && isNewer(tag, APP_VERSION) ? tag : null;
  } catch {
    return null;
  }
}

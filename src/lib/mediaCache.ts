/**
 * Device-side media store. Photos, files and voice notes live HERE, on this
 * machine — the server only relays them and is scrubbed after delivery, so
 * media never becomes part of the recoverable cloud history.
 */

const DB_NAME = "nyx-media";
const STORE = "blobs";

let dbPromise: Promise<IDBDatabase> | null = null;

function db(): Promise<IDBDatabase> {
  dbPromise ??= new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

export async function saveMedia(id: string, blob: Blob): Promise<void> {
  const d = await db();
  await new Promise<void>((resolve, reject) => {
    const tx = d.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(blob, id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getMedia(id: string): Promise<Blob | null> {
  const d = await db();
  return new Promise((resolve, reject) => {
    const req = d.transaction(STORE, "readonly").objectStore(STORE).get(id);
    req.onsuccess = () => resolve((req.result as Blob) ?? null);
    req.onerror = () => reject(req.error);
  });
}

const urlCache = new Map<string, string>();

/** Resolve a message's media to a local object URL (null = not on this device). */
export async function getMediaUrl(id: string): Promise<string | null> {
  const hit = urlCache.get(id);
  if (hit) return hit;
  const blob = await getMedia(id).catch(() => null);
  if (!blob) return null;
  const url = URL.createObjectURL(blob);
  urlCache.set(id, url);
  return url;
}

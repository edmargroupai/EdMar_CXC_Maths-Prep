const DB_NAME = "edmar-web";
const DB_VERSION = 1;
const CONTENT_STORE = "content-cache";

type ContentRecord = {
  key: string;
  value: unknown;
  cachedAt: string;
};

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(CONTENT_STORE)) {
        db.createObjectStore(CONTENT_STORE, { keyPath: "key" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("idb open failed"));
  });
}

export async function idbGet<T>(key: string): Promise<T | null> {
  if (typeof indexedDB === "undefined") return null;
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(CONTENT_STORE, "readonly");
    const store = tx.objectStore(CONTENT_STORE);
    const request = store.get(key);
    request.onsuccess = () => {
      const row = request.result as ContentRecord | undefined;
      resolve((row?.value as T | undefined) ?? null);
    };
    request.onerror = () => reject(request.error ?? new Error("idb get failed"));
  });
}

export async function idbSet(key: string, value: unknown): Promise<void> {
  if (typeof indexedDB === "undefined") return;
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(CONTENT_STORE, "readwrite");
    const store = tx.objectStore(CONTENT_STORE);
    const request = store.put({
      key,
      value,
      cachedAt: new Date().toISOString(),
    } satisfies ContentRecord);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error ?? new Error("idb set failed"));
  });
}

export async function idbDelete(key: string): Promise<void> {
  if (typeof indexedDB === "undefined") return;
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(CONTENT_STORE, "readwrite");
    const store = tx.objectStore(CONTENT_STORE);
    const request = store.delete(key);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error ?? new Error("idb delete failed"));
  });
}

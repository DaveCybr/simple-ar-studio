/**
 * AR Cache Manager - IndexedDB-based caching system for AR assets
 * Caches videos, images, mind files to improve load times for return visitors
 */

const DB_NAME = 'ar-cache';
const DB_VERSION = 1;
const STORE_NAME = 'assets';
const CACHE_EXPIRY_DAYS = 7;
const MAX_CACHE_SIZE_MB = 100;

interface CachedAsset {
  url: string;
  blob: Blob;
  type: string;
  size: number;
  timestamp: number;
  expiresAt: number;
}

let db: IDBDatabase | null = null;

const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (db) {
      resolve(db);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.warn('IndexedDB not available, caching disabled');
      reject(new Error('IndexedDB not available'));
    };

    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        const store = database.createObjectStore(STORE_NAME, { keyPath: 'url' });
        store.createIndex('timestamp', 'timestamp', { unique: false });
        store.createIndex('expiresAt', 'expiresAt', { unique: false });
      }
    };
  });
};

export const getCachedAsset = async (url: string): Promise<Blob | null> => {
  try {
    const database = await initDB();
    return new Promise((resolve) => {
      const transaction = database.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(url);

      request.onsuccess = () => {
        const result = request.result as CachedAsset | undefined;
        if (result && result.expiresAt > Date.now()) {
          console.log(`[Cache] HIT: ${url.slice(0, 50)}...`);
          resolve(result.blob);
        } else {
          if (result) {
            // Expired, delete it
            deleteAsset(url);
          }
          console.log(`[Cache] MISS: ${url.slice(0, 50)}...`);
          resolve(null);
        }
      };

      request.onerror = () => {
        resolve(null);
      };
    });
  } catch {
    return null;
  }
};

export const cacheAsset = async (url: string, blob: Blob, type: string): Promise<void> => {
  try {
    const database = await initDB();
    
    // Check cache size before adding
    await cleanupCacheIfNeeded();

    const asset: CachedAsset = {
      url,
      blob,
      type,
      size: blob.size,
      timestamp: Date.now(),
      expiresAt: Date.now() + CACHE_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
    };

    return new Promise((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(asset);

      request.onsuccess = () => {
        console.log(`[Cache] STORED: ${url.slice(0, 50)}... (${(blob.size / 1024 / 1024).toFixed(2)}MB)`);
        resolve();
      };

      request.onerror = () => {
        reject(new Error('Failed to cache asset'));
      };
    });
  } catch (error) {
    console.warn('[Cache] Failed to store:', error);
  }
};

const deleteAsset = async (url: string): Promise<void> => {
  try {
    const database = await initDB();
    return new Promise((resolve) => {
      const transaction = database.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      store.delete(url);
      resolve();
    });
  } catch {
    // Ignore errors
  }
};

const getCacheSize = async (): Promise<number> => {
  try {
    const database = await initDB();
    return new Promise((resolve) => {
      const transaction = database.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        const assets = request.result as CachedAsset[];
        const totalSize = assets.reduce((sum, asset) => sum + asset.size, 0);
        resolve(totalSize);
      };

      request.onerror = () => resolve(0);
    });
  } catch {
    return 0;
  }
};

const cleanupCacheIfNeeded = async (): Promise<void> => {
  try {
    const database = await initDB();
    const currentSize = await getCacheSize();
    const maxSize = MAX_CACHE_SIZE_MB * 1024 * 1024;

    if (currentSize < maxSize * 0.8) return; // Only cleanup if > 80% full

    console.log(`[Cache] Cleanup needed: ${(currentSize / 1024 / 1024).toFixed(2)}MB / ${MAX_CACHE_SIZE_MB}MB`);

    return new Promise((resolve) => {
      const transaction = database.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index('timestamp');
      const request = index.openCursor();

      let deletedSize = 0;
      const targetDeleteSize = currentSize - maxSize * 0.5; // Delete until 50% full

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
        if (cursor && deletedSize < targetDeleteSize) {
          const asset = cursor.value as CachedAsset;
          deletedSize += asset.size;
          cursor.delete();
          cursor.continue();
        } else {
          console.log(`[Cache] Cleaned up ${(deletedSize / 1024 / 1024).toFixed(2)}MB`);
          resolve();
        }
      };

      request.onerror = () => resolve();
    });
  } catch {
    // Ignore cleanup errors
  }
};

export const clearExpiredCache = async (): Promise<void> => {
  try {
    const database = await initDB();
    const now = Date.now();

    return new Promise((resolve) => {
      const transaction = database.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index('expiresAt');
      const range = IDBKeyRange.upperBound(now);
      const request = index.openCursor(range);

      let count = 0;

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
        if (cursor) {
          cursor.delete();
          count++;
          cursor.continue();
        } else {
          if (count > 0) {
            console.log(`[Cache] Cleared ${count} expired items`);
          }
          resolve();
        }
      };

      request.onerror = () => resolve();
    });
  } catch {
    // Ignore errors
  }
};

export const fetchWithCache = async (
  url: string,
  type: 'video' | 'image' | 'mind',
  onProgress?: (progress: number) => void
): Promise<string> => {
  // Try cache first
  const cached = await getCachedAsset(url);
  if (cached) {
    onProgress?.(100);
    return URL.createObjectURL(cached);
  }

  // Fetch from network with progress
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const contentLength = response.headers.get('content-length');
    const total = contentLength ? parseInt(contentLength, 10) : 0;

    if (!response.body) {
      const blob = await response.blob();
      await cacheAsset(url, blob, type);
      onProgress?.(100);
      return URL.createObjectURL(blob);
    }

    const reader = response.body.getReader();
    const chunks: ArrayBuffer[] = [];
    let received = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      // Convert Uint8Array to ArrayBuffer for compatibility
      chunks.push(value.buffer.slice(value.byteOffset, value.byteOffset + value.byteLength));
      received += value.length;

      if (total > 0) {
        onProgress?.(Math.round((received / total) * 100));
      }
    }

    const blob = new Blob(chunks, { type: response.headers.get('content-type') || undefined });
    await cacheAsset(url, blob, type);
    onProgress?.(100);
    return URL.createObjectURL(blob);
  } catch (error) {
    console.warn('[Cache] Fetch failed, using direct URL:', error);
    onProgress?.(100);
    return url; // Fallback to direct URL
  }
};

export const getCacheStats = async (): Promise<{ count: number; size: number }> => {
  try {
    const database = await initDB();
    return new Promise((resolve) => {
      const transaction = database.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        const assets = request.result as CachedAsset[];
        resolve({
          count: assets.length,
          size: assets.reduce((sum, a) => sum + a.size, 0),
        });
      };

      request.onerror = () => resolve({ count: 0, size: 0 });
    });
  } catch {
    return { count: 0, size: 0 };
  }
};

export type QueueStatus = "pending" | "failed" | "synced";

export type OfflineQueueActionType =
  | "create_task"
  | "update_task"
  | "visit_checkin"
  | "visit_checkout"
  | "log_activity";

export type OfflineQueueItem = {
  id: string;
  actionType: OfflineQueueActionType;
  payload: Record<string, unknown>;
  entityId?: string | null;
  status: QueueStatus;
  retries: number;
  createdAt: string;
  updatedAt: string;
  nextRetryAt?: string | null;
  lastError?: string | null;
};

const DB_NAME = "onrol-task-offline-db";
const DB_VERSION = 1;
const STORE_NAME = "task_sync_queue";

const BACKOFF_MINUTES = [1, 3, 10, 30];

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
        store.createIndex("status", "status", { unique: false });
        store.createIndex("updatedAt", "updatedAt", { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function txRequest<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function enqueueOfflineAction(
  item: Omit<OfflineQueueItem, "id" | "status" | "retries" | "createdAt" | "updatedAt" | "nextRetryAt" | "lastError">,
): Promise<OfflineQueueItem> {
  const db = await openDb();
  const now = new Date().toISOString();
  const queueItem: OfflineQueueItem = {
    id: `q_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    actionType: item.actionType,
    payload: item.payload,
    entityId: item.entityId ?? null,
    status: "pending",
    retries: 0,
    createdAt: now,
    updatedAt: now,
    nextRetryAt: null,
    lastError: null,
  };

  const tx = db.transaction(STORE_NAME, "readwrite");
  await txRequest(tx.objectStore(STORE_NAME).add(queueItem));
  await new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
  return queueItem;
}

export async function getOfflineQueueItems(): Promise<OfflineQueueItem[]> {
  const db = await openDb();
  const tx = db.transaction(STORE_NAME, "readonly");
  const rows = (await txRequest(tx.objectStore(STORE_NAME).getAll())) as OfflineQueueItem[];
  db.close();
  return rows.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export async function updateQueueItem(item: OfflineQueueItem): Promise<void> {
  const db = await openDb();
  const tx = db.transaction(STORE_NAME, "readwrite");
  await txRequest(tx.objectStore(STORE_NAME).put(item));
  await new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

export async function removeQueueItem(id: string): Promise<void> {
  const db = await openDb();
  const tx = db.transaction(STORE_NAME, "readwrite");
  await txRequest(tx.objectStore(STORE_NAME).delete(id));
  await new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

export function nextRetryAtIso(retries: number): string {
  const minutes = BACKOFF_MINUTES[Math.min(retries, BACKOFF_MINUTES.length - 1)];
  return new Date(Date.now() + minutes * 60 * 1000).toISOString();
}


const DB_NAME = "EnViOffline";
const DB_VERSION = 1;

type OfflineQuestion = {
  id: string;
  topicId: string;
  level: string;
  question: string;
  sampleAnswer?: string;
  keywords?: string[];
  updatedAt: number;
};

type OfflineSession = {
  id: string;
  topic: string;
  topicId: string;
  level: string;
  questionIndex: number;
  step: number;
  userAnswers: Array<{ question: string; answer: string; score?: number }>;
  createdAt: number;
  updatedAt: number;
  synced: boolean;
};

type SyncQueueItem = {
  id: string;
  type: "speaking_turn" | "xp" | "activity";
  payload: unknown;
  createdAt: number;
  retries: number;
};

let dbPromise: Promise<IDBDatabase> | null = null;

function txDone(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(req.result);
    req.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains("questions")) {
        const qs = db.createObjectStore("questions", { keyPath: "id" });
        qs.createIndex("topicId", "topicId", { unique: false });
        qs.createIndex("level", "level", { unique: false });
      }
      if (!db.objectStoreNames.contains("sessions")) {
        const ss = db.createObjectStore("sessions", { keyPath: "id" });
        ss.createIndex("synced", "synced", { unique: false });
      }
      if (!db.objectStoreNames.contains("syncQueue")) {
        db.createObjectStore("syncQueue", { keyPath: "id", autoIncrement: true });
      }
    };
  });
  return dbPromise;
}

export async function cacheQuestions(
  questions: Array<{
    id: string;
    topicId: string;
    level: string;
    question: string;
    sampleAnswer?: string;
    keywords?: string[];
  }>,
): Promise<void> {
  const db = await openDB();
  const tx = db.transaction("questions", "readwrite");
  const store = tx.objectStore("questions");
  const now = Date.now();
  for (const q of questions) {
    store.put({ ...q, updatedAt: now });
  }
  await txDone(tx);
}

export async function getCachedQuestions(
  topicId: string,
  level: string,
): Promise<OfflineQuestion[]> {
  const db = await openDB();
  const tx = db.transaction("questions", "readonly");
  const store = tx.objectStore("questions");
  const index = store.index("topicId");
  return new Promise((resolve, reject) => {
    const req = index.getAll(IDBKeyRange.only(topicId));
    req.onsuccess = () => {
      const all = req.result as OfflineQuestion[];
      resolve(all.filter((q) => q.level === level));
    };
    req.onerror = () => reject(req.error);
  });
}

export async function saveOfflineSession(session: OfflineSession): Promise<void> {
  const db = await openDB();
  const tx = db.transaction("sessions", "readwrite");
  const store = tx.objectStore("sessions");
  store.put({ ...session, updatedAt: Date.now(), synced: false });
  await txDone(tx);
}

export async function getUnsyncedSessions(): Promise<OfflineSession[]> {
  const db = await openDB();
  const tx = db.transaction("sessions", "readonly");
  const store = tx.objectStore("sessions");
  const index = store.index("synced");
  return new Promise((resolve, reject) => {
    const req = index.getAll(0);
    req.onsuccess = () => resolve(req.result as OfflineSession[]);
    req.onerror = () => reject(req.error);
  });
}

export async function markSessionSynced(id: string): Promise<void> {
  const db = await openDB();
  const tx = db.transaction("sessions", "readwrite");
  const store = tx.objectStore("sessions");
  const session = await new Promise<OfflineSession | undefined>((resolve, reject) => {
    const req = store.get(id);
    req.onsuccess = () => resolve(req.result as OfflineSession | undefined);
    req.onerror = () => reject(req.error);
  });
  if (session) {
    session.synced = true;
    store.put(session);
  }
  await txDone(tx);
}

export async function enqueueSync(item: Omit<
  SyncQueueItem,
  "id" | "createdAt" | "retries"
>): Promise<void> {
  const db = await openDB();
  const tx = db.transaction("syncQueue", "readwrite");
  const store = tx.objectStore("syncQueue");
  store.add({ ...item, createdAt: Date.now(), retries: 0 });
  await txDone(tx);
}

export async function getSyncQueue(): Promise<SyncQueueItem[]> {
  const db = await openDB();
  const tx = db.transaction("syncQueue", "readonly");
  const store = tx.objectStore("syncQueue");
  return new Promise((resolve, reject) => {
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result as SyncQueueItem[]);
    req.onerror = () => reject(req.error);
  });
}

export async function removeFromSyncQueue(id: number): Promise<void> {
  const db = await openDB();
  const tx = db.transaction("syncQueue", "readwrite");
  const store = tx.objectStore("syncQueue");
  store.delete(id);
  await txDone(tx);
}

export function scoreOfflineAnswer(
  userAnswer: string,
  sampleAnswer: string,
  keywords: string[],
): { score: number; matchedKeywords: string[] } {
  const normalize = (t: string) =>
    t.toLowerCase().replace(/[^a-z0-9'\s]/g, " ").replace(/\s+/g, " ").trim();

  const userWords = normalize(userAnswer).split(" ").filter(Boolean);
  const sampleWords = normalize(sampleAnswer).split(" ").filter(Boolean);

  const matchedKeywords = keywords.filter((kw) =>
    userWords.includes(normalize(kw)),
  );

  const keywordScore = matchedKeywords.length / Math.max(keywords.length, 1);
  const lexicalOverlap =
    sampleWords.length > 0
      ? userWords.filter((w) => sampleWords.includes(w)).length / sampleWords.length
      : 0;

  const score = Math.min(1, 0.6 * lexicalOverlap + 0.4 * keywordScore);

  return { score, matchedKeywords };
}

export function isOnline(): boolean {
  return typeof navigator !== "undefined" && navigator.onLine;
}

const DB_NAME = "auslan-training";
const DB_VERSION = 1;

export interface TrainingSample {
  id?: number;
  stage: 1 | 2 | 3;
  label: string;
  frames: Float32Array;
  recordedAt: number;
}

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains("samples")) {
        const store = db.createObjectStore("samples", {
          keyPath: "id",
          autoIncrement: true,
        });
        store.createIndex("by_stage", "stage");
        store.createIndex("by_stage_label", ["stage", "label"]);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

export async function saveSample(
  stage: 1 | 2 | 3,
  label: string,
  frames: Float32Array
): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("samples", "readwrite");
    const sample: TrainingSample = { stage, label, frames, recordedAt: Date.now() };
    const req = tx.objectStore("samples").add(sample);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function getSamplesForStage(stage: 1 | 2 | 3): Promise<TrainingSample[]> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("samples", "readonly");
    const index = tx.objectStore("samples").index("by_stage");
    const req = index.getAll(stage);
    req.onsuccess = () => resolve(req.result as TrainingSample[]);
    req.onerror = () => reject(req.error);
  });
}

export async function countByLabelForStage(
  stage: 1 | 2 | 3
): Promise<Map<string, number>> {
  const samples = await getSamplesForStage(stage);
  const counts = new Map<string, number>();
  for (const s of samples) {
    counts.set(s.label, (counts.get(s.label) ?? 0) + 1);
  }
  return counts;
}

export async function deleteSamplesForStage(
  stage: 1 | 2 | 3,
  label?: string
): Promise<void> {
  const db = await openDb();
  const samples = await getSamplesForStage(stage);
  const toDelete = label ? samples.filter((s) => s.label === label) : samples;
  return new Promise((resolve, reject) => {
    const tx = db.transaction("samples", "readwrite");
    const store = tx.objectStore("samples");
    let pending = toDelete.length;
    if (pending === 0) { resolve(); return; }
    for (const s of toDelete) {
      const req = store.delete(s.id!);
      req.onsuccess = () => { if (--pending === 0) resolve(); };
      req.onerror = () => reject(req.error);
    }
  });
}

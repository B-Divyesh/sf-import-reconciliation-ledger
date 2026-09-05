import type { Project } from './types';

const DB_NAME = 'reconciliation-ledger';
const STORE = 'projects';

export type StorageScope = 'real' | 'demo';

function databaseName(scope: StorageScope): string {
  return scope === 'demo' ? `${DB_NAME}-demo` : DB_NAME;
}

function openDb(scope: StorageScope = 'real'): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(databaseName(scope), 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE, { keyPath: 'id' });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveProject(project: Project, scope: StorageScope = 'real'): Promise<void> {
  const db = await openDb(scope);
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(project);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

export async function loadProject(id: string, scope: StorageScope = 'real'): Promise<Project | undefined> {
  const db = await openDb(scope);
  const result = await new Promise<Project | undefined>((resolve, reject) => {
    const request = db.transaction(STORE).objectStore(STORE).get(id);
    request.onsuccess = () => resolve(request.result as Project | undefined);
    request.onerror = () => reject(request.error);
  });
  db.close();
  return result;
}

export async function listProjects(scope: StorageScope = 'real'): Promise<Project[]> {
  const db = await openDb(scope);
  const result = await new Promise<Project[]>((resolve, reject) => {
    const request = db.transaction(STORE).objectStore(STORE).getAll();
    request.onsuccess = () => resolve(request.result as Project[]);
    request.onerror = () => reject(request.error);
  });
  db.close();
  return result.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function deleteProject(id: string, scope: StorageScope = 'real'): Promise<void> {
  const db = await openDb(scope);
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

export async function clearProjects(scope: StorageScope): Promise<void> {
  const db = await openDb(scope);
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

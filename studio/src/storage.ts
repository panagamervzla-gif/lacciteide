import { openDB, type DBSchema } from 'idb';
import type { ProjectFile, ProjectRecord, TextureMappingRecord } from './types';

interface TextureWorkbenchDB extends DBSchema {
  projects: { key: string; value: ProjectRecord };
  files: { key: [string, string]; value: ProjectFile; indexes: { 'by-project': string } };
  textureMappings: { key: [string, string]; value: TextureMappingRecord; indexes: { 'by-project': string } };
}

const database = openDB<TextureWorkbenchDB>('texture-workbench', 2, {
  upgrade(db) {
    if (!db.objectStoreNames.contains('projects')) db.createObjectStore('projects', { keyPath: 'id' });
    if (!db.objectStoreNames.contains('files')) db.createObjectStore('files', { keyPath: ['projectId', 'path'] }).createIndex('by-project', 'projectId');
    if (!db.objectStoreNames.contains('textureMappings')) {
      db.createObjectStore('textureMappings', { keyPath: ['projectId', 'id'] }).createIndex('by-project', 'projectId');
    }
  }
});

export interface TextureMappingChanges {
  upsert?: TextureMappingRecord[];
  removeIds?: string[];
}

export async function listProjects(): Promise<ProjectRecord[]> {
  const db = await database;
  return (await db.getAll('projects')).sort((left, right) => right.updatedAt - left.updatedAt);
}

export async function getProject(projectId: string): Promise<ProjectRecord | undefined> {
  return (await database).get('projects', projectId);
}

export async function deleteProjectCompletely(projectId: string): Promise<void> {
  const db = await database;
  const transaction = db.transaction(['projects', 'files', 'textureMappings'], 'readwrite');
  const fileStore = transaction.objectStore('files');
  const mappingStore = transaction.objectStore('textureMappings');
  const [fileKeys, mappingKeys] = await Promise.all([
    fileStore.index('by-project').getAllKeys(projectId),
    mappingStore.index('by-project').getAllKeys(projectId)
  ]);
  const deletions: Promise<unknown>[] = [];
  for (const key of fileKeys) deletions.push(fileStore.delete(key));
  for (const key of mappingKeys) deletions.push(mappingStore.delete(key));
  deletions.push(transaction.objectStore('projects').delete(projectId));
  await Promise.all(deletions);
  await transaction.done;
}

export async function getProjectFiles(projectId: string): Promise<ProjectFile[]> {
  const db = await database;
  return (await db.getAllFromIndex('files', 'by-project', projectId)).sort((left, right) => left.path.localeCompare(right.path));
}

export async function getProjectTextureMappings(projectId: string): Promise<TextureMappingRecord[]> {
  const db = await database;
  return (await db.getAllFromIndex('textureMappings', 'by-project', projectId)).sort((left, right) => left.order - right.order);
}

export async function createProject(project: ProjectRecord, files: ProjectFile[], mappings: TextureMappingRecord[] = []): Promise<void> {
  const db = await database;
  const transaction = db.transaction(['projects', 'files', 'textureMappings'], 'readwrite');
  const writes: Promise<unknown>[] = [transaction.objectStore('projects').put(project)];
  const fileStore = transaction.objectStore('files');
  const mappingStore = transaction.objectStore('textureMappings');
  for (const file of files) writes.push(fileStore.put(file));
  for (const mapping of mappings) writes.push(mappingStore.put(mapping));
  await Promise.all(writes);
  await transaction.done;
}

export async function saveProject(project: ProjectRecord): Promise<void> {
  await (await database).put('projects', { ...project, updatedAt: Date.now() });
}

export async function saveProjectFiles(project: ProjectRecord, files: ProjectFile[]): Promise<void> {
  const db = await database;
  const transaction = db.transaction(['projects', 'files'], 'readwrite');
  const fileStore = transaction.objectStore('files');
  const writes: Promise<unknown>[] = [transaction.objectStore('projects').put({ ...project, updatedAt: Date.now() })];
  for (const file of files) writes.push(fileStore.put(file));
  await Promise.all(writes);
  await transaction.done;
}

export async function saveProjectResources(
  project: ProjectRecord,
  files: ProjectFile[],
  removedPaths: string[] = [],
  mappingChanges?: TextureMappingChanges
): Promise<void> {
  const db = await database;
  const transaction = db.transaction(['projects', 'files', 'textureMappings'], 'readwrite');
  const fileStore = transaction.objectStore('files');
  const mappingStore = transaction.objectStore('textureMappings');
  const writes: Promise<unknown>[] = [transaction.objectStore('projects').put({ ...project, updatedAt: Date.now() })];
  for (const path of removedPaths) writes.push(fileStore.delete([project.id, path]));
  for (const file of files) writes.push(fileStore.put(file));
  for (const id of mappingChanges?.removeIds ?? []) writes.push(mappingStore.delete([project.id, id]));
  for (const mapping of mappingChanges?.upsert ?? []) writes.push(mappingStore.put(mapping));
  if (writes.length > 1) {
    await Promise.all(writes);
  } else {
    await writes[0];
  }
  await transaction.done;
}

export async function saveProjectFile(project: ProjectRecord, file: ProjectFile): Promise<void> {
  const db = await database;
  const transaction = db.transaction(['projects', 'files'], 'readwrite');
  await transaction.objectStore('files').put(file);
  await transaction.objectStore('projects').put({ ...project, updatedAt: Date.now() });
  await transaction.done;
}
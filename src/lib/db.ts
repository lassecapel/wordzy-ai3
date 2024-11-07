import { openDB, DBSchema, IDBPDatabase } from 'idb';
import type { WordList, TestResult } from '../types';

interface WordzyDB extends DBSchema {
  wordLists: {
    key: string;
    value: WordList;
  };
  testResults: {
    key: string;
    value: TestResult;
    indexes: { 'by-list': string };
  };
  pendingSync: {
    key: string;
    value: {
      type: 'testResult';
      data: TestResult;
      timestamp: number;
    };
  };
}

let db: IDBPDatabase<WordzyDB>;

export async function initDB() {
  db = await openDB<WordzyDB>('wordzy', 1, {
    upgrade(db) {
      db.createObjectStore('wordLists', { keyPath: 'id' });
      
      const testResults = db.createObjectStore('testResults', { keyPath: 'id' });
      testResults.createIndex('by-list', 'wordListId');
      
      db.createObjectStore('pendingSync', { keyPath: 'id', autoIncrement: true });
    },
  });
}

export async function saveWordList(list: WordList) {
  await db.put('wordLists', list);
}

export async function getWordList(id: string): Promise<WordList | undefined> {
  return db.get('wordLists', id);
}

export async function getAllWordLists(): Promise<WordList[]> {
  return db.getAll('wordLists');
}

export async function saveTestResult(result: TestResult) {
  await db.put('testResults', result);
  
  // Add to pending sync if offline
  if (!navigator.onLine) {
    await db.add('pendingSync', {
      type: 'testResult',
      data: result,
      timestamp: Date.now(),
    });
  }
}

export async function getTestResults(wordListId?: string): Promise<TestResult[]> {
  if (wordListId) {
    return db.getAllFromIndex('testResults', 'by-list', wordListId);
  }
  return db.getAll('testResults');
}

export async function getPendingSyncs() {
  return db.getAll('pendingSync');
}

export async function removePendingSync(id: string) {
  await db.delete('pendingSync', id);
}
import { getPendingSyncs, removePendingSync } from './db';
import { api } from './api';

export async function syncPendingData() {
  const pendingSyncs = await getPendingSyncs();

  for (const sync of pendingSyncs) {
    try {
      switch (sync.type) {
        case 'testResult':
          await api.saveTestResult(sync.data);
          break;
      }
      await removePendingSync(sync.id);
    } catch (error) {
      console.error('Failed to sync:', error);
    }
  }
}
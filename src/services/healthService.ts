import { storageService } from './storageService';
import { HealthRecord } from '../types';

export const healthService = {
  getAll(): HealthRecord[] {
    return storageService.getHealthRecords();
  },

  getByAnimalId(animalId: string): HealthRecord[] {
    return storageService.getHealthRecords().filter((h) => h.animalId === animalId);
  },

  create(record: Omit<HealthRecord, 'id'>): HealthRecord {
    const records = storageService.getHealthRecords();
    const newRecord: HealthRecord = {
      ...record,
      id: `hlth-${Date.now()}`,
    };
    records.unshift(newRecord);
    storageService.saveHealthRecords(records);
    return newRecord;
  },

  update(id: string, updates: Partial<HealthRecord>): HealthRecord | undefined {
    const records = storageService.getHealthRecords();
    const idx = records.findIndex((r) => r.id === id);
    if (idx === -1) return undefined;
    const updated = { ...records[idx], ...updates };
    records[idx] = updated;
    storageService.saveHealthRecords(records);
    return updated;
  },

  delete(id: string): boolean {
    const records = storageService.getHealthRecords();
    const filtered = records.filter((r) => r.id !== id);
    if (filtered.length !== records.length) {
      storageService.saveHealthRecords(filtered);
      return true;
    }
    return false;
  },
};

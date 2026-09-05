import { storageService } from './storageService';
import { MilkRecord } from '../types';

export const milkService = {
  getAll(): MilkRecord[] {
    return storageService.getMilkRecords();
  },

  getByAnimalId(animalId: string): MilkRecord[] {
    return storageService.getMilkRecords().filter((r) => r.animalId === animalId);
  },

  create(record: Omit<MilkRecord, 'id'>): MilkRecord {
    const records = storageService.getMilkRecords();
    const newRecord: MilkRecord = {
      ...record,
      id: `rec-m-${Date.now()}`,
    };
    records.unshift(newRecord);
    storageService.saveMilkRecords(records);
    return newRecord;
  },

  update(id: string, updates: Partial<MilkRecord>): MilkRecord | undefined {
    const records = storageService.getMilkRecords();
    const idx = records.findIndex((r) => r.id === id);
    if (idx === -1) return undefined;
    const updated = { ...records[idx], ...updates };
    records[idx] = updated;
    storageService.saveMilkRecords(records);
    return updated;
  },

  delete(id: string): boolean {
    const records = storageService.getMilkRecords();
    const filtered = records.filter((r) => r.id !== id);
    if (filtered.length !== records.length) {
      storageService.saveMilkRecords(filtered);
      return true;
    }
    return false;
  },

  filter(params: { animalId?: string; startDate?: string; endDate?: string; searchQuery?: string }): MilkRecord[] {
    let result = storageService.getMilkRecords();
    if (params.animalId && params.animalId !== 'all') {
      result = result.filter((r) => r.animalId === params.animalId);
    }
    if (params.searchQuery && params.searchQuery.trim() !== '') {
      const q = params.searchQuery.toLowerCase();
      result = result.filter(
        (r) =>
          (r.animalTag && r.animalTag.toLowerCase().includes(q)) ||
          (r.notes && r.notes.toLowerCase().includes(q))
      );
    }
    return result;
  },
};

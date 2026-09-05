import { storageService } from './storageService';
import { CMTRecord, CMTQuarterResult } from '../types';

export const cmtService = {
  getAll(): CMTRecord[] {
    return storageService.getCMTRecords();
  },

  getByAnimalId(animalId: string): CMTRecord[] {
    return storageService.getCMTRecords().filter((r) => r.animalId === animalId);
  },

  calculateOverallResult(quarters: {
    lf: CMTQuarterResult;
    rf: CMTQuarterResult;
    lr: CMTQuarterResult;
    rr: CMTQuarterResult;
  }): 'Negative' | 'Trace' | 'Subclinical Suspect (1+ / 2+)' | 'Strong Clinical (3+)' {
    const list = [quarters.lf, quarters.rf, quarters.lr, quarters.rr];
    if (list.includes('3+')) {
      return 'Strong Clinical (3+)';
    }
    if (list.includes('2+') || list.filter((q) => q === '1+').length >= 1) {
      return 'Subclinical Suspect (1+ / 2+)';
    }
    if (list.includes('trace')) {
      return 'Trace';
    }
    return 'Negative';
  },

  create(record: Omit<CMTRecord, 'id' | 'overallResult'>): CMTRecord {
    const records = storageService.getCMTRecords();
    const overall = this.calculateOverallResult({
      lf: record.leftFront,
      rf: record.rightFront,
      lr: record.leftRear,
      rr: record.rightRear,
    });

    const newRecord: CMTRecord = {
      ...record,
      id: `cmt-${Date.now()}`,
      overallResult: overall,
    };
    records.unshift(newRecord);
    storageService.saveCMTRecords(records);
    return newRecord;
  },

  update(id: string, updates: Partial<CMTRecord>): CMTRecord | undefined {
    const records = storageService.getCMTRecords();
    const idx = records.findIndex((r) => r.id === id);
    if (idx === -1) return undefined;
    const merged = { ...records[idx], ...updates };
    merged.overallResult = this.calculateOverallResult({
      lf: merged.leftFront,
      rf: merged.rightFront,
      lr: merged.leftRear,
      rr: merged.rightRear,
    });
    records[idx] = merged;
    storageService.saveCMTRecords(records);
    return merged;
  },

  delete(id: string): boolean {
    const records = storageService.getCMTRecords();
    const filtered = records.filter((r) => r.id !== id);
    if (filtered.length !== records.length) {
      storageService.saveCMTRecords(filtered);
      return true;
    }
    return false;
  },
};

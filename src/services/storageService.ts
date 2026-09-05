import {
  INITIAL_ANIMALS,
  INITIAL_MILK_RECORDS,
  INITIAL_CMT_RECORDS,
  INITIAL_HEALTH_RECORDS,
  INITIAL_DEVICES,
  INITIAL_ALERTS,
  DEMO_FARM_LOCATIONS,
} from '../data/mockData';
import { Animal, MilkRecord, CMTRecord, HealthRecord, Device, Alert, FarmLocation } from '../types';

const KEYS = {
  ANIMALS: 'innovx_animals',
  MILK: 'innovx_milk',
  CMT: 'innovx_cmt',
  HEALTH: 'innovx_health',
  DEVICES: 'innovx_devices',
  ALERTS: 'innovx_alerts',
  FARMS: 'innovx_farms',
};

export const storageService = {
  getAnimals(): Animal[] {
    const raw = localStorage.getItem(KEYS.ANIMALS);
    if (!raw) {
      localStorage.setItem(KEYS.ANIMALS, JSON.stringify(INITIAL_ANIMALS));
      return INITIAL_ANIMALS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_ANIMALS;
    }
  },

  saveAnimals(data: Animal[]): void {
    localStorage.setItem(KEYS.ANIMALS, JSON.stringify(data));
  },

  getMilkRecords(): MilkRecord[] {
    const raw = localStorage.getItem(KEYS.MILK);
    if (!raw) {
      localStorage.setItem(KEYS.MILK, JSON.stringify(INITIAL_MILK_RECORDS));
      return INITIAL_MILK_RECORDS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_MILK_RECORDS;
    }
  },

  saveMilkRecords(data: MilkRecord[]): void {
    localStorage.setItem(KEYS.MILK, JSON.stringify(data));
  },

  getCMTRecords(): CMTRecord[] {
    const raw = localStorage.getItem(KEYS.CMT);
    if (!raw) {
      localStorage.setItem(KEYS.CMT, JSON.stringify(INITIAL_CMT_RECORDS));
      return INITIAL_CMT_RECORDS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_CMT_RECORDS;
    }
  },

  saveCMTRecords(data: CMTRecord[]): void {
    localStorage.setItem(KEYS.CMT, JSON.stringify(data));
  },

  getHealthRecords(): HealthRecord[] {
    const raw = localStorage.getItem(KEYS.HEALTH);
    if (!raw) {
      localStorage.setItem(KEYS.HEALTH, JSON.stringify(INITIAL_HEALTH_RECORDS));
      return INITIAL_HEALTH_RECORDS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_HEALTH_RECORDS;
    }
  },

  saveHealthRecords(data: HealthRecord[]): void {
    localStorage.setItem(KEYS.HEALTH, JSON.stringify(data));
  },

  getDevices(): Device[] {
    const raw = localStorage.getItem(KEYS.DEVICES);
    if (!raw) {
      localStorage.setItem(KEYS.DEVICES, JSON.stringify(INITIAL_DEVICES));
      return INITIAL_DEVICES;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_DEVICES;
    }
  },

  saveDevices(data: Device[]): void {
    localStorage.setItem(KEYS.DEVICES, JSON.stringify(data));
  },

  getAlerts(): Alert[] {
    const raw = localStorage.getItem(KEYS.ALERTS);
    if (!raw) {
      localStorage.setItem(KEYS.ALERTS, JSON.stringify(INITIAL_ALERTS));
      return INITIAL_ALERTS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_ALERTS;
    }
  },

  saveAlerts(data: Alert[]): void {
    localStorage.setItem(KEYS.ALERTS, JSON.stringify(data));
  },

  getFarmLocations(): FarmLocation[] {
    const raw = localStorage.getItem(KEYS.FARMS);
    if (!raw) {
      localStorage.setItem(KEYS.FARMS, JSON.stringify(DEMO_FARM_LOCATIONS));
      return DEMO_FARM_LOCATIONS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return DEMO_FARM_LOCATIONS;
    }
  },

  resetDemoData(): void {
    localStorage.setItem(KEYS.ANIMALS, JSON.stringify(INITIAL_ANIMALS));
    localStorage.setItem(KEYS.MILK, JSON.stringify(INITIAL_MILK_RECORDS));
    localStorage.setItem(KEYS.CMT, JSON.stringify(INITIAL_CMT_RECORDS));
    localStorage.setItem(KEYS.HEALTH, JSON.stringify(INITIAL_HEALTH_RECORDS));
    localStorage.setItem(KEYS.DEVICES, JSON.stringify(INITIAL_DEVICES));
    localStorage.setItem(KEYS.ALERTS, JSON.stringify(INITIAL_ALERTS));
    localStorage.setItem(KEYS.FARMS, JSON.stringify(DEMO_FARM_LOCATIONS));
  },
};

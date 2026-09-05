import { storageService } from './storageService';
import { Device } from '../types';

export const deviceService = {
  getAll(): Device[] {
    return storageService.getDevices();
  },

  getById(id: string): Device | undefined {
    return storageService.getDevices().find((d) => d.id === id);
  },

  create(deviceData: Omit<Device, 'id'>): Device {
    const devices = storageService.getDevices();
    const newDevice: Device = {
      ...deviceData,
      id: `DEV-${Date.now().toString().slice(-6)}`,
    };
    devices.push(newDevice);
    storageService.saveDevices(devices);
    return newDevice;
  },

  update(id: string, updates: Partial<Device>): Device | undefined {
    const devices = storageService.getDevices();
    const idx = devices.findIndex((d) => d.id === id);
    if (idx === -1) return undefined;
    const updated = { ...devices[idx], ...updates };
    devices[idx] = updated;
    storageService.saveDevices(devices);
    return updated;
  },

  assignToAnimal(deviceId: string, animalId: string, animalName: string): Device | undefined {
    return this.update(deviceId, {
      assignedAnimalId: animalId,
      assignedAnimalName: animalName,
      lastSync: 'Just now',
    });
  },

  ping(id: string): Device | undefined {
    return this.update(id, {
      lastSync: 'Just now',
    });
  },

  updateStatus(id: string, status: any): Device | undefined {
    return this.update(id, {
      connectionStatus: status,
      lastSync: 'Just now',
    });
  },

  delete(id: string): boolean {
    const devices = storageService.getDevices();
    const filtered = devices.filter((d) => d.id !== id);
    if (filtered.length !== devices.length) {
      storageService.saveDevices(filtered);
      return true;
    }
    return false;
  },
};

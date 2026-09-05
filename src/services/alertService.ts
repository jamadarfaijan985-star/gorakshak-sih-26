import { storageService } from './storageService';
import { Alert, AlertPriority, AlertType } from '../types';

export const alertService = {
  getAll(): Alert[] {
    return storageService.getAlerts();
  },

  getActive(): Alert[] {
    return storageService.getAlerts().filter((a) => a.status === 'active' || a.status === 'acknowledged' || a.status === 'in_review');
  },

  getById(id: string): Alert | undefined {
    return storageService.getAlerts().find((a) => a.id === id);
  },

  acknowledge(id: string): Alert | undefined {
    const alerts = storageService.getAlerts();
    const idx = alerts.findIndex((a) => a.id === id);
    if (idx === -1) return undefined;
    alerts[idx].status = 'acknowledged';
    alerts[idx].actionNotes = 'Acknowledged by dairy staff member.';
    storageService.saveAlerts(alerts);
    return alerts[idx];
  },

  review(id: string, notes?: string): Alert | undefined {
    const alerts = storageService.getAlerts();
    const idx = alerts.findIndex((a) => a.id === id);
    if (idx === -1) return undefined;
    alerts[idx].status = 'in_review';
    alerts[idx].actionNotes = notes || 'Under clinical observation and physical quarter check.';
    storageService.saveAlerts(alerts);
    return alerts[idx];
  },

  inReview(id: string, notes?: string): Alert | undefined {
    return this.review(id, notes);
  },

  resolve(id: string, notes?: string): Alert | undefined {
    const alerts = storageService.getAlerts();
    const idx = alerts.findIndex((a) => a.id === id);
    if (idx === -1) return undefined;
    alerts[idx].status = 'resolved';
    alerts[idx].resolvedAt = new Date().toISOString();
    alerts[idx].actionNotes = notes || 'Issue addressed, veterinary or physical check complete.';
    storageService.saveAlerts(alerts);
    return alerts[idx];
  },

  create(alertData: Omit<Alert, 'id' | 'status'>): Alert {
    const alerts = storageService.getAlerts();
    const newAlert: Alert = {
      ...alertData,
      id: `alt-${Date.now()}`,
      status: 'active',
    };
    alerts.unshift(newAlert);
    storageService.saveAlerts(alerts);
    return newAlert;
  },

  filter(params: {
    priority?: 'all' | AlertPriority;
    type?: 'all' | AlertType;
    status?: 'all' | 'active' | 'acknowledged' | 'in_review' | 'resolved';
    searchQuery?: string;
  }): Alert[] {
    let result = storageService.getAlerts();

    if (params.priority && params.priority !== 'all') {
      result = result.filter((a) => a.priority === params.priority);
    }
    if (params.type && params.type !== 'all') {
      result = result.filter((a) => a.type === params.type);
    }
    if (params.status && params.status !== 'all') {
      result = result.filter((a) => a.status === params.status);
    }
    if (params.searchQuery && params.searchQuery.trim() !== '') {
      const q = params.searchQuery.toLowerCase();
      result = result.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          a.message.toLowerCase().includes(q) ||
          (a.animalTag && a.animalTag.toLowerCase().includes(q)) ||
          (a.animalName && a.animalName.toLowerCase().includes(q))
      );
    }

    return result;
  },
};

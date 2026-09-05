import { storageService } from './storageService';
import { Animal, RiskLevel, Species, HealthStatus } from '../types';

export const animalService = {
  getAll(): Animal[] {
    return storageService.getAnimals();
  },

  getById(id: string): Animal | undefined {
    return storageService.getAnimals().find((a) => a.id === id);
  },

  create(animalData: Omit<Animal, 'id' | 'lastUpdated'>): Animal {
    const animals = storageService.getAnimals();
    const newAnimal: Animal = {
      ...animalData,
      id: `ani-${Date.now()}`,
      lastUpdated: 'Just now',
    };
    animals.unshift(newAnimal);
    storageService.saveAnimals(animals);
    return newAnimal;
  },

  update(id: string, updates: Partial<Animal>): Animal | undefined {
    const animals = storageService.getAnimals();
    const index = animals.findIndex((a) => a.id === id);
    if (index === -1) return undefined;
    const updated: Animal = {
      ...animals[index],
      ...updates,
      lastUpdated: 'Just now',
    };
    animals[index] = updated;
    storageService.saveAnimals(animals);
    return updated;
  },

  delete(id: string): boolean {
    const animals = storageService.getAnimals();
    const filtered = animals.filter((a) => a.id !== id);
    if (filtered.length !== animals.length) {
      storageService.saveAnimals(filtered);
      return true;
    }
    return false;
  },

  filter(params: {
    species?: 'all' | Species;
    riskLevel?: 'all' | RiskLevel;
    healthStatus?: 'all' | HealthStatus;
    farm?: string;
    searchQuery?: string;
    sortBy?: 'risk_desc' | 'risk_asc' | 'yield_desc' | 'name_asc';
  }): Animal[] {
    let result = storageService.getAnimals();

    if (params.species && params.species !== 'all') {
      result = result.filter((a) => a.species === params.species);
    }

    if (params.riskLevel && params.riskLevel !== 'all') {
      result = result.filter((a) => a.riskLevel === params.riskLevel);
    }

    if (params.healthStatus && params.healthStatus !== 'all') {
      result = result.filter((a) => a.healthStatus === params.healthStatus);
    }

    if (params.farm && params.farm !== 'all') {
      result = result.filter((a) => a.farm === params.farm);
    }

    if (params.searchQuery && params.searchQuery.trim() !== '') {
      const q = params.searchQuery.toLowerCase();
      result = result.filter(
        (a) =>
          a.tag.toLowerCase().includes(q) ||
          a.name.toLowerCase().includes(q) ||
          a.breed.toLowerCase().includes(q) ||
          a.farm.toLowerCase().includes(q)
      );
    }

    if (params.sortBy) {
      switch (params.sortBy) {
        case 'risk_desc':
          result.sort((a, b) => b.riskScore - a.riskScore);
          break;
        case 'risk_asc':
          result.sort((a, b) => a.riskScore - b.riskScore);
          break;
        case 'yield_desc':
          result.sort((a, b) => b.avgDailyYieldLiters - a.avgDailyYieldLiters);
          break;
        case 'name_asc':
          result.sort((a, b) => a.name.localeCompare(b.name));
          break;
      }
    }

    return result;
  },

  getHerdStats() {
    const animals = storageService.getAnimals();
    const total = animals.length;
    const cows = animals.filter((a) => a.species === 'cow').length;
    const buffaloes = animals.filter((a) => a.species === 'buffalo').length;
    const highRisk = animals.filter((a) => a.riskLevel === 'high').length;
    const moderateRisk = animals.filter((a) => a.riskLevel === 'moderate').length;
    const lowRisk = animals.filter((a) => a.riskLevel === 'low').length;
    const noRisk = animals.filter((a) => a.riskLevel === 'no_risk').length;

    const avgRisk = total > 0 ? Math.round(animals.reduce((s, a) => s + a.riskScore, 0) / total) : 0;
    const avgYield = total > 0 ? (animals.reduce((s, a) => s + a.avgDailyYieldLiters, 0) / total).toFixed(1) : '0.0';

    return {
      total,
      cows,
      buffaloes,
      highRisk,
      moderateRisk,
      lowRisk,
      noRisk,
      avgRisk,
      avgYield,
    };
  },
};

export interface Salesperson {
  id: string;
  name: string;
  email: string;
}

const STORAGE_KEY = 'salespersons';

class SalespersonService {
  private salespersons: Salesperson[] = [
    { id: '1', name: 'Zaheer', email: 'mohd.zaheer@gmail.com' },
    { id: '2', name: 'Rahul Kumar', email: 'rahul@gmail.com' },
    { id: '3', name: 'Priya Sharma', email: 'priya@gmail.com' }
  ];

  constructor() {
    // Load from localStorage on initialization
    this.loadFromStorage();
  }

  private loadFromStorage() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        this.salespersons = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error loading salespersons:', error);
    }
  }

  private saveToStorage() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.salespersons));
    } catch (error) {
      console.error('Error saving salespersons:', error);
    }
  }

  getAllSalespersons(): Salesperson[] {
    return [...this.salespersons];
  }

  getSalespersonById(id: string): Salesperson | undefined {
    return this.salespersons.find(sp => sp.id === id);
  }

  addSalesperson(salesperson: Omit<Salesperson, 'id'>): Salesperson {
    const newId = (this.salespersons.length + 1).toString();
    const newSalesperson: Salesperson = {
      id: newId,
      ...salesperson
    };
    this.salespersons.push(newSalesperson);
    this.saveToStorage();
    return newSalesperson;
  }

  updateSalesperson(id: string, updates: Partial<Omit<Salesperson, 'id'>>): Salesperson | null {
    const index = this.salespersons.findIndex(sp => sp.id === id);
    if (index === -1) return null;

    this.salespersons[index] = {
      ...this.salespersons[index],
      ...updates
    };
    this.saveToStorage();
    return this.salespersons[index];
  }

  deleteSalesperson(id: string): boolean {
    const index = this.salespersons.findIndex(sp => sp.id === id);
    if (index === -1) return false;

    this.salespersons.splice(index, 1);
    this.saveToStorage();
    return true;
  }
}

// Export a singleton instance
export const salespersonService = new SalespersonService();

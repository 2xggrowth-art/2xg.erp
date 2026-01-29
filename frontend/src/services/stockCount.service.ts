export interface StockCountItem {
  id: string;
  name: string;
  sku: string;
  currentStock: number;
  countedQuantity?: number;
}

export interface StockCount {
  id: string;
  stockCountNumber: string;
  description: string;
  location: string;
  assignTo: string;
  items: StockCountItem[];
  status: 'Draft' | 'In Progress' | 'Completed';
  createdAt: string;
  updatedAt?: string;
}

export interface CreateStockCountData {
  description: string;
  location: string;
  assignTo: string;
  items: StockCountItem[];
}

// For now, we'll use localStorage, but this service can be extended to use API calls
export const stockCountService = {
  getAllStockCounts: (): Promise<StockCount[]> => {
    return new Promise((resolve) => {
      const storedCounts = localStorage.getItem('stockCounts');
      if (storedCounts) {
        resolve(JSON.parse(storedCounts));
      } else {
        resolve([]);
      }
    });
  },

  getStockCountById: (id: string): Promise<StockCount | null> => {
    return new Promise((resolve) => {
      const storedCounts = localStorage.getItem('stockCounts');
      if (storedCounts) {
        const counts: StockCount[] = JSON.parse(storedCounts);
        const count = counts.find(c => c.id === id);
        resolve(count || null);
      } else {
        resolve(null);
      }
    });
  },

  createStockCount: (data: CreateStockCountData): Promise<StockCount> => {
    return new Promise((resolve) => {
      const storedCounts = localStorage.getItem('stockCounts');
      const counts: StockCount[] = storedCounts ? JSON.parse(storedCounts) : [];

      // Generate stock count number
      const stockCountNumber = `SC-${String(counts.length + 1).padStart(5, '0')}`;

      const newStockCount: StockCount = {
        id: `sc-${Date.now()}`,
        stockCountNumber,
        description: data.description,
        location: data.location,
        assignTo: data.assignTo,
        items: data.items,
        status: 'Draft',
        createdAt: new Date().toISOString(),
      };

      counts.push(newStockCount);
      localStorage.setItem('stockCounts', JSON.stringify(counts));
      resolve(newStockCount);
    });
  },

  updateStockCount: (id: string, data: Partial<CreateStockCountData>): Promise<StockCount | null> => {
    return new Promise((resolve) => {
      const storedCounts = localStorage.getItem('stockCounts');
      if (storedCounts) {
        const counts: StockCount[] = JSON.parse(storedCounts);
        const index = counts.findIndex(c => c.id === id);

        if (index !== -1) {
          counts[index] = {
            ...counts[index],
            ...data,
            updatedAt: new Date().toISOString(),
          };
          localStorage.setItem('stockCounts', JSON.stringify(counts));
          resolve(counts[index]);
        } else {
          resolve(null);
        }
      } else {
        resolve(null);
      }
    });
  },

  deleteStockCount: (id: string): Promise<boolean> => {
    return new Promise((resolve) => {
      const storedCounts = localStorage.getItem('stockCounts');
      if (storedCounts) {
        const counts: StockCount[] = JSON.parse(storedCounts);
        const filteredCounts = counts.filter(c => c.id !== id);
        localStorage.setItem('stockCounts', JSON.stringify(filteredCounts));
        resolve(true);
      } else {
        resolve(false);
      }
    });
  },

  updateStatus: (id: string, status: StockCount['status']): Promise<StockCount | null> => {
    return new Promise((resolve) => {
      const storedCounts = localStorage.getItem('stockCounts');
      if (storedCounts) {
        const counts: StockCount[] = JSON.parse(storedCounts);
        const index = counts.findIndex(c => c.id === id);

        if (index !== -1) {
          counts[index].status = status;
          counts[index].updatedAt = new Date().toISOString();
          localStorage.setItem('stockCounts', JSON.stringify(counts));
          resolve(counts[index]);
        } else {
          resolve(null);
        }
      } else {
        resolve(null);
      }
    });
  }
};

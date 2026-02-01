
export enum BarType {
  CASH = 'Cash Bar',
  OPEN = 'Open Bar',
  NONE = 'None'
}

export enum FoodSource {
  CATERED = 'Catered (In-house)',
  BYO = 'Bring Your Own'
}

export enum FoodServiceType {
  BUFFET = 'Buffet',
  PASSED = 'Passed Apps',
  FULL_SERVICE = 'Full-Service'
}

// EventType enum removed as it's now a free-form string

export interface EventRecord {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  eventType: string; // Changed to string for free-form typing
  dateRequested: string;
  time: string;      // Start Time
  endTime: string;   // New field for specific end time
  duration?: number; // Kept for legacy compatibility if needed
  guests: number;
  totalAmount: number;
  depositAmount: number;
  depositPaid: boolean;
  balancePaid: boolean;
  contacted: boolean;
  barType: BarType;
  beerWineOffered: boolean;
  hasFood: boolean;
  foodSource?: FoodSource;
  foodServiceType?: FoodServiceType;
  addParking: boolean;
  hasTasting: boolean;
  hasTour: boolean;
  notes: string;
}

export interface DashboardStats {
  totalEvents: number;
  totalRevenue: number;
  newRequests: number;
  pendingDeposits: number;
}

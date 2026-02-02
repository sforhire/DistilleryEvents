
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

export interface EventRecord {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  eventType: string;
  dateRequested: string;
  time: string;      
  endTime: string;   
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
  // Sync Status
  pushedToCalendar?: boolean;
  calendarPushedAt?: string;
  googleEventId?: string;
}

export interface DashboardStats {
  totalEvents: number;
  totalRevenue: number;
  newRequests: number;
  pendingDeposits: number;
}
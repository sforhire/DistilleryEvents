
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

export enum EventType {
  WEDDING = 'Wedding',
  CORPORATE = 'Corporate',
  BIRTHDAY = 'Birthday',
  GALA = 'Gala',
  PRIVATE_DINING = 'Private Dining',
  TASTING_ROOM = 'Tasting Room Takeover',
  OTHER = 'Other'
}

export interface EventRecord {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  eventType: EventType;
  dateRequested: string;
  time: string;
  duration: number;
  guests: number;
  totalAmount: number;
  depositAmount: number;
  depositPaid: boolean;
  balancePaid: boolean;
  contacted: boolean;
  barType: BarType;
  beerWineOffered: boolean; // true = offered for fee, false = uncorking fee
  hasFood: boolean;
  foodSource?: FoodSource;
  foodServiceType?: FoodServiceType;
  addParking: boolean; // $500 fee
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

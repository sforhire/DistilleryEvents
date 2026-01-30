
import { EventRecord, EventType, BarType, FoodSource, FoodServiceType } from './types';

export const DEFAULT_EVENT: Partial<EventRecord> = {
  eventType: EventType.TASTING_ROOM,
  guests: 10,
  duration: 2,
  barType: BarType.CASH,
  beerWineOffered: true,
  hasFood: false,
  addParking: false,
  hasTasting: false,
  hasTour: false,
  depositPaid: false,
  balancePaid: false,
  contacted: false,
  totalAmount: 0,
  depositAmount: 0
};

export const MOCK_EVENTS: EventRecord[] = [
  {
    id: '1',
    firstName: 'Alice',
    lastName: 'Johnson',
    email: 'alice@example.com',
    phone: '555-0101',
    eventType: EventType.WEDDING,
    dateRequested: '2024-06-15',
    time: '18:00',
    duration: 5,
    guests: 120,
    totalAmount: 15500,
    depositAmount: 3000,
    depositPaid: true,
    balancePaid: false,
    contacted: true,
    barType: BarType.OPEN,
    beerWineOffered: true,
    hasFood: true,
    foodSource: FoodSource.CATERED,
    foodServiceType: FoodServiceType.FULL_SERVICE,
    addParking: true,
    hasTasting: true,
    hasTour: true,
    notes: 'Bride requested specific white lilies. Parking fee paid.'
  },
  {
    id: '2',
    firstName: 'Bob',
    lastName: 'Smith',
    email: 'bob@techcorp.com',
    phone: '555-0202',
    eventType: EventType.CORPORATE,
    dateRequested: '2024-05-20',
    time: '12:00',
    duration: 3,
    guests: 45,
    totalAmount: 5000,
    depositAmount: 1000,
    depositPaid: true,
    balancePaid: true,
    contacted: true,
    barType: BarType.CASH,
    beerWineOffered: false,
    hasFood: true,
    foodSource: FoodSource.BYO,
    foodServiceType: FoodServiceType.BUFFET,
    addParking: false,
    hasTasting: false,
    hasTour: false,
    notes: 'Needs HDMI connectivity and screen. Client bringing own wine.'
  }
];

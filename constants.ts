
import { EventRecord, BarType, FoodSource, FoodServiceType } from './types';

export const DEFAULT_EVENT: Partial<EventRecord> = {
  eventType: 'Tasting Room Takeover',
  guests: 10,
  time: '12:00',
  endTime: '14:00',
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

// Mock events removed to prioritize cloud synchronization.
export const MOCK_EVENTS: EventRecord[] = [];

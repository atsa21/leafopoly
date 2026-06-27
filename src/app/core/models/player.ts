import { RoomItem } from './room-item';

export interface Player {
  name: string;
  color: string;
  init: string; // 'R' / 'S'
  leaves: number;
  pos: number; // 0..23
  coupons: number[]; // discount percentages held
  room: RoomItem[];
  skip: boolean;
}

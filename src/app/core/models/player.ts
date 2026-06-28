import { RoomItem } from './room-item';

export interface Player {
  name: string;
  color: string;
  init: string;
  leaves: number;
  pos: number;
  coupons: number[]; 
  room: RoomItem[];
  skip: boolean;
}

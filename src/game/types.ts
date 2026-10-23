/**
 * Core type definitions for Kolej Blanice Dormitory Horror
 */

export type GameState = 'title' | 'playing' | 'paused' | 'gameover' | 'victory';

export type InventoryItemId = 
  | 'BATTERY_9V'
  | 'ISIC_CARD'
  | 'STUDY_KEY'
  | 'LAUNDRY_TOKEN'
  | 'MASTER_FUSE'
  | 'ELEVATOR_CHIP';

export type FloorLocation = 'outside' | 'lobby' | 'menza' | 'gym' | 'pool' | 'elevator' | 'dorm_floor';

export interface DialogueChoice {
  text: string;
  nextNodeId: string | 'close';
  action?: 'get_elevator_chip' | 'unlock_elevator' | 'joke_reaction';
}

export interface DialogueNode {
  id: string;
  speaker: string;
  role: string;
  text: string;
  choices: DialogueChoice[];
}

export interface DormInteractable {
  id: string;
  type: 'pickup' | 'door' | 'terminal' | 'radio' | 'fusebox' | 'wardrobe' | 'noticeboard' | 'dialogue' | 'elevator';
  name: string;
  nameCs: string;
  prompt: string;
  position: any;
  radius: number;
  mesh: any;
  data?: any;
}

export interface ClassmateMessage {
  id: string;
  sender: string;
  room: string;
  text: string;
  timestamp: string;
  type: 'radio' | 'alert' | 'clue';
}

export interface PeerPlayer {
  id: string;
  name: string;
  x: number;
  y: number;
  z: number;
  rotationY: number;
  flashlightOn: boolean;
  lastSeen: number;
}

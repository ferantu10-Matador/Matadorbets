import { ReactNode } from 'react';

export interface GroundingChunk {
  web?: {
    uri: string;
    title: string;
  };
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
  isError?: boolean;
  groundingChunks?: GroundingChunk[];
  customContent?: ReactNode;
}

export interface ChatState {
  messages: Message[];
  isLoading: boolean;
}

export interface HistoryItem {
  id: string;
  timestamp: number; // Stored as timestamp for easier serialization
  matchTitle: string;
  summary: string;
  fullContent: string;
  groundingChunks?: GroundingChunk[];
}

export interface Match {
  home: string;
  away: string;
  time?: string; // Legacy fallback
  utc_timestamp?: string; // New strict time field
  league: string;
  fact: string;
  analysis?: string; // Stores the AI analysis locally
  groundingChunks?: GroundingChunk[]; // Stores sources
}

export interface BetSelection {
  id: string;
  event: string;
  odds: number;
}

export type BetMarket = '1X2' | 'GOALS' | 'BTTS' | 'HANDICAP' | 'CORNERS_CARDS' | 'PARLAY' | 'OTHER';

export interface Bet {
  id: string;
  date: number; // Timestamp
  event: string; // For simple bets, the event name. For combined, a summary title.
  type: 'simple' | 'combined'; // New field
  selections?: BetSelection[]; // New field for combined bets
  sport?: string; 
  market?: BetMarket; // New field for Football Markets
  stake: number;
  odds: number;
  result: 'pending' | 'won' | 'lost';
}

export interface Lesson {
  id: number;
  level: string;
  title: string;
  concept: string;
  example: string;
  tip: string;
}

export interface UserProfile {
  id?: string;
  username: string;
  secret_pin: string;
  backup_data: any;
  updated_at?: string;
}

export type ViewType = 'chat' | 'matches' | 'stats' | 'settings' | 'academy';
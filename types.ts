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
  time: string;
  league: string;
  fact: string;
  analysis?: string; // Stores the AI analysis locally
  groundingChunks?: GroundingChunk[]; // Stores sources
}

export interface Bet {
  id: string;
  date: number; // Timestamp
  event: string;
  stake: number;
  odds: number;
  result: 'pending' | 'won' | 'lost';
}

export type ViewType = 'chat' | 'matches' | 'stats';
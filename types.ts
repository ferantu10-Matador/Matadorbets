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
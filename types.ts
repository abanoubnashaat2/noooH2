
export enum View {
  AUTH = 'AUTH',
  HOME = 'HOME',
  LIVE_QUIZ = 'LIVE_QUIZ',
  QR_HUNT = 'QR_HUNT',
  LEADERBOARD = 'LEADERBOARD',
  ADMIN = 'ADMIN'
}

export interface User {
  id: string;
  name: string;
  phone: string;
  avatarId: number;
  score: number;
  isAdmin: boolean;
  tripCode: string;
}

export enum QuestionType {
  TEXT = 'TEXT',
  AUDIO = 'AUDIO',
  VERSE = 'VERSE',
  INPUT = 'INPUT', // New: User types the answer
  EMOJI = 'EMOJI'  // New: Question text is displayed as large Emojis
}

export interface Question {
  id: string;
  text: string;
  options: string[]; // For INPUT type, options[0] will hold the correct text answer
  correctIndex: number;
  type: QuestionType;
  mediaUrl?: string; // For audio
  points: number;
  difficulty?: string; // Added field
  context?: string; // Added field for "Context/To Whom"
  triggeredAt?: number; // Added field to force refresh on client
}

export interface LeaderboardEntry {
  userId: string;
  name: string;
  avatarId: number;
  score: number;
}

export interface AdminMessage {
  id: string;
  senderName: string;
  text: string;
  timestamp: number;
}

export interface AdminCommand {
  text: string;
  timestamp: number;
  type: 'alert' | 'judgment'; 
}

export type Priority = 'low' | 'medium' | 'high' | 'critical';
export type GoalStatus = 'active' | 'completed' | 'archived';

export interface UserProfile {
  uid: string;
  displayName: string | null;
  email: string | null;
  xp: number;
  streak: number;
  level: number;
  credits: number;
  freeChatsToday: number;
  lastLoginDate: string;
  lastActive: string;
  createdAt: string;
}

export interface Transaction {
  id: string;
  userId: string;
  amount: number;
  credits: number;
  razorpayOrderId: string;
  razorpayPaymentId?: string;
  status: 'pending' | 'completed' | 'failed';
  createdAt: string;
}

export interface Goal {
  id: string;
  userId: string;
  title: string;
  description: string;
  deadline: string;
  priority: Priority;
  category: string;
  progress: number;
  status: GoalStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  goalId: string;
  userId: string;
  title: string;
  completed: boolean;
  estimatedMinutes?: number;
  createdAt: string;
}

export interface AIResponse {
  subtasks: { title: string; estimatedMinutes: number }[];
  motivation: string;
  timelineEstimate: string;
}

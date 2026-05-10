import type { AIResponse, Goal, Task, UserProfile, Transaction } from '../types';

// All requests go to the deployed backend.
// Set VITE_API_URL in .env (or Vercel env vars) — no trailing slash.
// Leave it empty only if you want Vite's dev proxy to localhost:8000.
const BASE = (import.meta.env.VITE_API_URL ?? '') + '/api';
export const TOKEN_KEY = 'neurogoals_token';

function getHeaders(): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: getHeaders(),
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (res.status === 204) return undefined as T;
  const data = await res.json().catch(() => ({ detail: res.statusText }));
  if (!res.ok) throw new Error(data.detail || data.error || res.statusText);
  return data as T;
}

const get = <T>(path: string) => request<T>('GET', path);
const post = <T>(path: string, body: unknown) => request<T>('POST', path, body);
const patch = <T>(path: string, body: unknown) => request<T>('PATCH', path, body);
const del = (path: string) => request<void>('DELETE', path);

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------
interface AuthResponse {
  token: string;
  user: UserProfile;
}

export const register = (email: string, password: string, displayName: string) =>
  post<AuthResponse>('/auth/register', { email, password, displayName });

export const login = (email: string, password: string) =>
  post<AuthResponse>('/auth/login', { email, password });

export const getMe = () => get<UserProfile>('/auth/me');

export const updateMe = (updates: Partial<UserProfile>) =>
  patch<UserProfile>('/auth/me', updates);

// ---------------------------------------------------------------------------
// Goals
// ---------------------------------------------------------------------------
export const getGoals = () => get<Goal[]>('/goals');

export const createGoal = (goal: Partial<Goal>) => post<Goal>('/goals', goal);

export const updateGoal = (id: string, updates: Partial<Goal>) =>
  patch<Goal>(`/goals/${id}`, updates);

export const deleteGoal = (id: string) => del(`/goals/${id}`);

// ---------------------------------------------------------------------------
// Tasks
// ---------------------------------------------------------------------------
export const getTasks = (goalId: string) => get<Task[]>(`/goals/${goalId}/tasks`);

export const createTask = (goalId: string, task: Partial<Task>) =>
  post<Task>(`/goals/${goalId}/tasks`, task);

export const batchCreateTasks = (goalId: string, tasks: Array<{ title: string; estimatedMinutes: number }>) =>
  post<Task[]>(`/goals/${goalId}/tasks/batch`, { tasks });

export const updateTask = (goalId: string, taskId: string, updates: Partial<Task>) =>
  patch<Task>(`/goals/${goalId}/tasks/${taskId}`, updates);

export const deleteTask = (goalId: string, taskId: string) =>
  del(`/goals/${goalId}/tasks/${taskId}`);

// ---------------------------------------------------------------------------
// Transactions
// ---------------------------------------------------------------------------
export const getTransactions = () => get<Transaction[]>('/transactions');

// ---------------------------------------------------------------------------
// AI
// ---------------------------------------------------------------------------
export async function generateSubtasks(
  goalTitle: string,
  goalDescription: string,
): Promise<AIResponse> {
  return post<AIResponse>('/ai/subtasks', { goalTitle, goalDescription });
}

export async function getAIChatResponse(
  message: string,
  context: string,
): Promise<{ response: string; freeChatsToday: number; credits: number }> {
  return post('/ai/chat', { message, context });
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

export const getChatHistory = () => get<ChatMessage[]>('/ai/history');

export const clearChatHistory = () => request<{ status: string }>('DELETE', '/ai/history');

// ---------------------------------------------------------------------------
// Payment
// ---------------------------------------------------------------------------
export async function createPaymentOrder(amount: number, currency = 'INR') {
  return post<{ id: string; amount: number; currency: string }>(
    '/payment/order',
    { amount, currency },
  );
}

export async function verifyPayment(payload: {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  credits: number;
  amount: number;
}) {
  return post<{ status: string }>('/payment/verify', payload);
}

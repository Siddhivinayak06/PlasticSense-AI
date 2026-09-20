import { api } from '@/lib/api';

export interface NGOModel {
  id: string;
  name: string;
  city: string;
  state: string;
  contact_person: string;
  email: string;
  phone: string;
  team_size: number;
  active_assignments: number;
  completed_cleanups: number;
  availability: 'available' | 'busy' | 'unavailable';
  current_workload: 'light' | 'moderate' | 'heavy' | 'overloaded';
  performance_score: number;
  avg_completion_days: number;
  specializations: string[];
}

export async function fetchNGOs(): Promise<NGOModel[]> {
  const { data } = await api.get<NGOModel[]>('/ngos');
  return data;
}

export async function fetchNGO(id: string): Promise<NGOModel> {
  const { data } = await api.get<NGOModel>(`/ngos/${id}`);
  return data;
}

export async function createNGO(payload: Partial<NGOModel>): Promise<NGOModel> {
  const { data } = await api.post<NGOModel>('/ngos', payload);
  return data;
}

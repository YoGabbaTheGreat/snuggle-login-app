
export type ClickFrequency = 'daily' | 'weekly' | 'monthly';

export interface Click {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  created_by: string;
  schedule_frequency: ClickFrequency | null;
  schedule_day: number | null;
  schedule_time: string | null;
  updated_at: string;
}

export interface ClickMember {
  click_id: string;
  user_id: string;
  role: 'admin' | 'member';
  joined_at: string;
}

export interface CreateClickInput {
  name: string;
  description?: string;
  schedule_frequency?: ClickFrequency;
  schedule_day?: number;
  schedule_time?: string;
}

import { vkService } from './vkUtils';

const API_URL = 'https://functions.poehali.dev/6893d44d-52dc-40c5-840c-c8ca52207831';

export interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps: number;
  weight: number;
  notes: string;
}

export interface Workout {
  id: string;
  name: string;
  date: string;
  exercises: Exercise[];
}

class ApiService {
  private async makeRequest(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<any> {
    try {
      const headers = {
        ...vkService.getHeaders(),
        ...options.headers
      };

      const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  async getWorkouts(): Promise<Workout[]> {
    const result = await this.makeRequest('/');
    return result.workouts || [];
  }

  async getWorkout(date: string): Promise<Workout | null> {
    const result = await this.makeRequest(`/?date=${date}`);
    return result.workout || null;
  }

  async saveWorkout(workout: Omit<Workout, 'id'>): Promise<{ success: boolean; workout_id: number }> {
    return await this.makeRequest('/', {
      method: 'POST',
      body: JSON.stringify(workout)
    });
  }

  async updateWorkout(workout: Workout): Promise<{ success: boolean; workout_id: number }> {
    return await this.makeRequest('/', {
      method: 'PUT',
      body: JSON.stringify(workout)
    });
  }
}

export const apiService = new ApiService();
// Types for Onboarding API
export interface OnboardingFlow {
  id: number;
  name: string;
  description: string;
  department: string;
  createdBy: number;
  createdAt: string;
  updatedAt: string;
  tasks: OnboardingTask[];
}

export interface OnboardingTask {
  id: number;
  flowId: number;
  title: string;
  type: 'form' | 'document' | 'video' | 'quiz' | 'meeting' | 'system';
  description: string;
  required: boolean;
  order: number;
  estimatedTime?: number;
  createdAt: string;
  updatedAt: string;
}

export interface OnboardingProgress {
  id: number;
  flowId: number;
  employeeId: number;
  progress: number;
  status: 'in_progress' | 'completed' | 'paused';
  startDate: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
  flow?: OnboardingFlow;
  tasks?: OnboardingTaskWithProgress[];
}

export interface OnboardingTaskWithProgress extends OnboardingTask {
  status: 'pending' | 'in_progress' | 'completed';
  completedAt?: string;
  notes?: string;
}

export interface CreateOnboardingFlowRequest {
  name: string;
  description: string;
  department: string;
  tasks: {
    title: string;
    type: 'form' | 'document' | 'video' | 'quiz' | 'meeting' | 'system';
    description: string;
    required?: boolean;
    estimatedTime?: number;
  }[];
}

export interface UpdateTaskProgressRequest {
  taskId: number;
  status: 'in_progress' | 'completed';
  notes?: string;
}

class OnboardingApiService {
  private readonly baseUrl = '/api/onboarding';

  async getOnboardingFlows(): Promise<OnboardingFlow[]> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      throw new Error('Unable to fetch onboarding flows. Please try again later.');
    }
  }

  async getOnboardingFlow(id: number): Promise<OnboardingFlow> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      throw new Error('Unable to fetch onboarding flow details. Please try again later.');
    }
  }

  async createOnboardingFlow(data: CreateOnboardingFlowRequest): Promise<OnboardingFlow> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      throw new Error('Unable to create onboarding flow. Please try again later.');
    }
  }

  async updateOnboardingFlow(id: number, data: Partial<CreateOnboardingFlowRequest>): Promise<OnboardingFlow> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      throw new Error('Unable to update onboarding flow. Please try again later.');
    }
  }

  async deleteOnboardingFlow(id: number): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      throw new Error('Unable to delete onboarding flow. Please try again later.');
    }
  }

  async getOnboardingProgress(): Promise<OnboardingProgress[]> {
    try {
      const response = await fetch(`${this.baseUrl}/progress`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      throw new Error('Unable to fetch onboarding progress. Please try again later.');
    }
  }

  async getOnboardingProgressById(id: number): Promise<OnboardingProgress> {
    try {
      const response = await fetch(`${this.baseUrl}/progress/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      throw new Error('Unable to fetch onboarding progress details. Please try again later.');
    }
  }

  async startOnboarding(flowId: number, employeeId: number): Promise<OnboardingProgress> {
    try {
      const response = await fetch(`${this.baseUrl}/progress/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ flowId, employeeId }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      throw new Error('Unable to start onboarding. Please try again later.');
    }
  }

  async updateTaskProgress(progressId: number, data: UpdateTaskProgressRequest): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/progress/${progressId}/tasks`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      throw new Error('Unable to update task progress. Please try again later.');
    }
  }
}

export const onboardingApi = new OnboardingApiService(); 
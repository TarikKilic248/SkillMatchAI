/**
 * API Client - Backend ile iletişim için utility sınıf
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

interface APIResponse<T = any> {
  data?: T;
  error?: string;
  success?: boolean;
}

class APIClient {
  private baseURL: string;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  /**
   * Generic HTTP request method
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  /**
   * GET request
   */
  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  /**
   * POST request
   */
  async post<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * PUT request
   */
  async put<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  /**
   * DELETE request
   */
  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  // ===== Specific API Methods =====

  /**
   * Generate learning plan
   */
  async generatePlan(userData: {
    learningGoal: string;
    dailyTime: string;
    duration: string;
    learningStyle: string;
    targetLevel: string;
  }) {
    return this.post('/api/generate-plan', userData);
  }

  /**
   * Regenerate plan based on feedback
   */
  async regeneratePlan(data: {
    userData: {
      learningGoal: string;
      dailyTime: string;
      duration: string;
      learningStyle: string;
      targetLevel: string;
    };
    feedbacks: Array<{
      moduleId: string;
      feedback: string;
      timestamp?: string;
    }>;
    completedModules: string[];
  }) {
    return this.post('/api/regenerate-plan', data);
  }

  /**
   * Save user feedback
   */
  async saveFeedback(feedbackData: {
    moduleId: string;
    feedback: string;
    userId?: string;
    timestamp: string;
  }): Promise<{ success: boolean; message: string; sentimentScore?: number }> {
    return this.post('/api/save-feedback', feedbackData);
  }

  /**
   * Get user statistics
   */
  async getUserStats(userId: string) {
    return this.get(`/api/user-stats/${userId}`);
  }

  /**
   * Get system analytics
   */
  async getAnalytics() {
    return this.get('/api/analytics');
  }

  /**
   * Health check
   */
  async healthCheck() {
    return this.get('/health');
  }
}

// Export singleton instance
export const apiClient = new APIClient();

// Export class for custom instances if needed
export { APIClient };

// Export types for TypeScript support
export type { APIResponse }; 
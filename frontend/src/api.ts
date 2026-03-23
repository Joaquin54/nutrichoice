// src/api.ts
// Ensure API_BASE doesn't have a trailing slash to avoid double slashes
const API_BASE = (import.meta.env.VITE_API_URL ?? "http://localhost:8000").replace(/\/$/, '');

export type FoodEntry = {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  created_at?: string;
};

// Auth token management
const getAuthToken = (): string | null => {
  return localStorage.getItem('auth_token');
};

const setAuthToken = (token: string | null): void => {
  if (token) {
    localStorage.setItem('auth_token', token);
  } else {
    localStorage.removeItem('auth_token');
  }
};

// Helper function to make authenticated requests
const authenticatedFetch = async (
  url: string,
  options: RequestInit = {}
): Promise<Response> => {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Token ${token}` }),
    ...options.headers,
  };

  return fetch(url, {
    ...options,
    headers,
  });
};

// User types
export type UserProfile = {
  id?: number;
  bio: string;
  profile_picture: string;
  diet_type: Record<string, boolean>;
  daily_calorie_goal?: number;
  daily_protein_goal?: number;
  date_created?: string;
  date_updated?: string;
};

export type User = {
  public_id: string;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  date_created: string;
  profile?: UserProfile | null;
};

export type LoginResponse = {
  token: string;
  user: User;
};

export type RegisterRequest = {
  username: string;
  email: string;
  password: string;
  password_confirm: string;
  first_name?: string;
  last_name?: string;
};

// Helper function to format API errors
function formatApiError(error: any): string {
  if (typeof error === 'string') {
    return error;
  }
  
  // Handle validation errors
  if (error.password) {
    if (Array.isArray(error.password)) {
      return `Password: ${error.password.join(', ')}`;
    }
    return `Password: ${error.password}`;
  }
  
  if (error.username) {
    if (Array.isArray(error.username)) {
      return `Username: ${error.username.join(', ')}`;
    }
    return `Username: ${error.username}`;
  }
  
  if (error.email) {
    if (Array.isArray(error.email)) {
      return `Email: ${error.email.join(', ')}`;
    }
    return `Email: ${error.email}`;
  }
  
  // Handle detail field (common in DRF)
  if (error.detail) {
    return error.detail;
  }
  
  // Handle non_field_errors
  if (error.non_field_errors) {
    if (Array.isArray(error.non_field_errors)) {
      return error.non_field_errors.join(', ');
    }
    return error.non_field_errors;
  }
  
  // Fallback to stringified error
  return JSON.stringify(error);
}

// Authentication API functions
export async function register(data: RegisterRequest): Promise<User> {
  const response = await fetch(`${API_BASE}/api/auth/register/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    let error;
    try {
      error = await response.json();
    } catch (e) {
      throw new Error(`Registration failed: ${response.status} ${response.statusText}`);
    }
    throw new Error(formatApiError(error));
  }

  return response.json();
}

export async function login(username: string, password: string): Promise<LoginResponse> {
  const response = await fetch(`${API_BASE}/api/auth/login/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username, password }),
  });

  if (!response.ok) {
    let error;
    try {
      error = await response.json();
    } catch (e) {
      throw new Error(`Login failed: ${response.status} ${response.statusText}`);
    }
    throw new Error(formatApiError(error));
  }

  const data: LoginResponse = await response.json();
  setAuthToken(data.token);
  return data;
}

export async function logout(): Promise<void> {
  const response = await authenticatedFetch(`${API_BASE}/api/auth/logout/`, {
    method: 'POST',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || JSON.stringify(error));
  }

  setAuthToken(null);
}

export async function getCurrentUser(): Promise<User> {
  const token = getAuthToken();
  if (!token) {
    throw new Error('No authentication token found. Please log in again.');
  }

  const response = await authenticatedFetch(`${API_BASE}/api/auth/me/`);

  if (!response.ok) {
    let error;
    try {
      error = await response.json();
    } catch (e) {
      throw new Error(`Failed to get user data: ${response.status} ${response.statusText}`);
    }
    throw new Error(error.detail || error.message || formatApiError(error));
  }

  return response.json();
}

export type UpdateUserData = {
  first_name?: string;
  last_name?: string;
  username?: string;
  email?: string;
};

export async function updateUser(publicId: string, data: UpdateUserData): Promise<User> {
  const response = await authenticatedFetch(`${API_BASE}/api/users/${publicId}/`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(formatApiError(error));
  }

  return response.json();
}

export type UpdateProfileData = {
  bio?: string;
  profile_picture?: string;
  diet_type?: Record<string, boolean>;
  daily_calorie_goal?: number;
  daily_protein_goal?: number;
};

export async function updateUserProfile(data: UpdateProfileData): Promise<UserProfile> {
  const response = await authenticatedFetch(`${API_BASE}/api/user-profiles/me/`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(formatApiError(error));
  }

  return response.json();
}

export async function requestPasswordReset(email: string): Promise<{ message: string; reset_link?: string }> {
  const response = await fetch(`${API_BASE}/api/auth/password-reset-request/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || JSON.stringify(error));
  }

  return response.json();
}

export async function changePassword(oldPassword: string, newPassword: string, newPasswordConfirm: string): Promise<{ message: string }> {
  const response = await authenticatedFetch(`${API_BASE}/api/auth/password-change/`, {
    method: 'POST',
    body: JSON.stringify({
      old_password: oldPassword,
      new_password: newPassword,
      new_password_confirm: newPasswordConfirm,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || JSON.stringify(error));
  }

  return response.json();
}

export async function confirmPasswordReset(
  token: string,
  user_id: string,
  newPassword: string,
  newPasswordConfirm: string
): Promise<{ message: string }> {
  const response = await fetch(`${API_BASE}/api/auth/password-reset-confirm/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      token,
      user_id,
      new_password: newPassword,
      new_password_confirm: newPasswordConfirm,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || JSON.stringify(error));
  }

  return response.json();
}

export async function refreshToken(): Promise<LoginResponse> {
  const response = await authenticatedFetch(`${API_BASE}/api/auth/token-refresh/`, {
    method: 'POST',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || JSON.stringify(error));
  }

  const data: LoginResponse = await response.json();
  setAuthToken(data.token);
  return data;
}

// Export token management functions
export { getAuthToken, setAuthToken };

// Existing functions
export async function ping(): Promise<{ status: string }> {
  const r = await fetch(`${API_BASE}/api/health/`);
  return r.json();
}

export async function getFoods(): Promise<FoodEntry[]> {
  const r = await authenticatedFetch(`${API_BASE}/api/ingredients/`);
  return r.json();
}


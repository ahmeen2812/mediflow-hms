export type AuthMode = 'signin' | 'register_request';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterRequestCredentials {
  full_name: string;
  email: string;
  requested_role: string;
  department: string;
  reason: string;
}
import type { User } from '../main/database/schema';

export interface LoginCredentials {
	email: string;
	password: string;
}

export interface RegisterData {
	email: string;
	username: string;
	password: string;
	firstName?: string;
	lastName?: string;
}

export interface AuthResult {
	success: boolean;
	user?: User;
	error?: string;
}

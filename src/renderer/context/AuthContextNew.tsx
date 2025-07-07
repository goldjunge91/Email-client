/* eslint-disable no-console */
import React, {
	createContext,
	useContext,
	useState,
	useEffect,
	ReactNode,
	useCallback,
	useMemo,
} from 'react';

// Types for user data (no database imports in renderer)
import type { User, LoginCredentials, RegisterData } from '@/types/auth';

interface AuthContextType {
	user: User | null;
	isInitialized: boolean;
	login: (credentials: LoginCredentials) => Promise<User>;
	register: (data: RegisterData) => Promise<User>;
	logout: () => Promise<void>;
	updateProfile: (data: Partial<User>) => Promise<User>;
	changePassword: (
		currentPassword: string,
		newPassword: string,
	) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
	children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
	const [user, setUser] = useState<User | null>(null);
	const [isInitialized, setIsInitialized] = useState(false);

	// Initialize auth state from localStorage
	useEffect(() => {
		const initializeAuth = async () => {
			try {
				const storedUser = localStorage.getItem('user');
				if (storedUser) {
					const userData = JSON.parse(storedUser);
					// Verify user is still valid with backend
					const result = await window.electron.ipcRenderer.invoke(
						'auth:get-user',
						userData.id,
					);
					console.log(window.electron);
					if (result.success) {
						setUser(result.user);
					} else {
						localStorage.removeItem('user');
					}
				}
			} catch (error) {
				console.error('Failed to initialize auth:', error);
				localStorage.removeItem('user');
			} finally {
				setIsInitialized(true);
			}
		};

		initializeAuth();
	}, []);

	const login = useCallback(
		async (credentials: LoginCredentials): Promise<User> => {
			const result = await window.electron.ipcRenderer.invoke(
				'auth:login',
				credentials,
			);
			if (result.success) {
				setUser(result.user);
				localStorage.setItem('user', JSON.stringify(result.user));
				return result.user;
			}
			throw new Error(result.error || 'Login failed');
		},
		[],
	);

	const register = useCallback(async (data: RegisterData): Promise<User> => {
		const result = await window.electron.ipcRenderer.invoke(
			'auth:register',
			data,
		);
		if (result.success) {
			setUser(result.user);
			localStorage.setItem('user', JSON.stringify(result.user));
			return result.user;
		}
		throw new Error(result.error || 'Registration failed');
	}, []);

	const logout = useCallback(async (): Promise<void> => {
		setUser(null);
		localStorage.removeItem('user');
	}, []);

	const updateProfile = useCallback(
		async (data: Partial<User>): Promise<User> => {
			if (!user) throw new Error('No user logged in');

			const result = await window.electron.ipcRenderer.invoke(
				'auth:update-profile',
				{
					userId: user.id,
					...data,
				},
			);

			if (result.success) {
				const updatedUser = { ...user, ...result.user };
				setUser(updatedUser);
				localStorage.setItem('user', JSON.stringify(updatedUser));
				return updatedUser;
			}
			throw new Error(result.error || 'Profile update failed');
		},
		[user],
	);

	const changePassword = useCallback(
		async (currentPassword: string, newPassword: string): Promise<void> => {
			if (!user) throw new Error('No user logged in');

			const result = await window.electron.ipcRenderer.invoke(
				'auth:change-password',
				{
					userId: user.id,
					currentPassword,
					newPassword,
				},
			);

			if (!result.success) {
				throw new Error(result.error || 'Password change failed');
			}
		},
		[user],
	);

	const contextValue = useMemo(
		() => ({
			user,
			isInitialized,
			login,
			register,
			logout,
			updateProfile,
			changePassword,
		}),
		[
			user,
			isInitialized,
			login,
			register,
			logout,
			updateProfile,
			changePassword,
		],
	);

	return (
		<AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
	);
}

export const useAuth = (): AuthContextType => {
	const context = useContext(AuthContext);
	if (!context) {
		throw new Error('useAuth must be used within an AuthProvider');
	}
	return context;
};

export type { User, LoginCredentials, RegisterData };

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
import type { User } from '@/database/schema';
import {
	authService,
	LoginCredentials,
	RegisterData,
	AuthResult,
} from '@/database/services/authService';

interface AuthContextType {
	user: User | null;
	isAuthenticated: boolean;
	isLoading: boolean;
	login: (credentials: LoginCredentials) => Promise<AuthResult>;
	register: (data: RegisterData) => Promise<AuthResult>;
	logout: () => void;
	updateUser: (user: User) => void;
	updateUserSettings: (
		settings: Partial<NonNullable<User['settings']>>,
	) => Promise<boolean>;
	changePassword: (
		currentPassword: string,
		newPassword: string,
	) => Promise<AuthResult>;
	updateProfile: (profile: {
		firstName?: string;
		lastName?: string;
		username?: string;
	}) => Promise<AuthResult>;
}

const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
	children: ReactNode;
}

const STORAGE_KEY = 'mail-app-user';

export function AuthProvider({ children }: AuthProviderProps) {
	const [user, setUser] = useState<User | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	// Benutzer aus LocalStorage laden
	useEffect(() => {
		const loadUser = async () => {
			try {
				const savedUser = localStorage.getItem(STORAGE_KEY);
				if (savedUser) {
					const parsedUser = JSON.parse(savedUser);
					// Benutzer-Daten aus Datenbank aktualisieren
					const currentUser = await authService.getUserById(parsedUser.id);
					if (currentUser) {
						setUser(currentUser);
					} else {
						// Benutzer existiert nicht mehr, aus LocalStorage entfernen
						localStorage.removeItem(STORAGE_KEY);
					}
				}
			} catch (error) {
				console.error('Fehler beim Laden des Benutzers:', error);
				localStorage.removeItem(STORAGE_KEY);
			} finally {
				setIsLoading(false);
			}
		};

		loadUser();
	}, []);

	// Benutzer in LocalStorage speichern
	const saveUser = useCallback((userData: User) => {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
		setUser(userData);
	}, []);

	// Benutzer aus LocalStorage entfernen
	const removeUser = useCallback(() => {
		localStorage.removeItem(STORAGE_KEY);
		setUser(null);
	}, []);

	const login = useCallback(
		async (credentials: LoginCredentials): Promise<AuthResult> => {
			const result = await authService.login(credentials);
			if (result.success && result.user) {
				saveUser(result.user);
			}
			return result;
		},
		[saveUser],
	);

	const register = useCallback(
		async (data: RegisterData): Promise<AuthResult> => {
			const result = await authService.register(data);
			if (result.success && result.user) {
				saveUser(result.user);
			}
			return result;
		},
		[saveUser],
	);

	const logout = useCallback(() => {
		removeUser();
	}, [removeUser]);

	const updateUser = useCallback(
		(userData: User) => {
			saveUser(userData);
		},
		[saveUser],
	);

	const updateUserSettings = useCallback(
		async (
			settings: Partial<NonNullable<User['settings']>>,
		): Promise<boolean> => {
			if (!user) return false;

			const success = await authService.updateUserSettings(user.id, settings);
			if (success) {
				// Benutzer-Daten aktualisieren
				const updatedUser = await authService.getUserById(user.id);
				if (updatedUser) {
					saveUser(updatedUser);
				}
			}
			return success;
		},
		[user, saveUser],
	);

	const changePassword = useCallback(
		async (
			currentPassword: string,
			newPassword: string,
		): Promise<AuthResult> => {
			if (!user) return { success: false, error: 'Nicht angemeldet' };

			return authService.changePassword(user.id, currentPassword, newPassword);
		},
		[user],
	);

	const updateProfile = useCallback(
		async (profile: {
			firstName?: string;
			lastName?: string;
			username?: string;
		}): Promise<AuthResult> => {
			if (!user) return { success: false, error: 'Nicht angemeldet' };

			const result = await authService.updateProfile(user.id, profile);
			if (result.success && result.user) {
				saveUser(result.user);
			}
			return result;
		},
		[user, saveUser],
	);

	const value: AuthContextType = useMemo(
		() => ({
			user,
			isAuthenticated: !!user,
			isLoading,
			login,
			register,
			logout,
			updateUser,
			updateUserSettings,
			changePassword,
			updateProfile,
		}),
		[
			user,
			isLoading,
			login,
			register,
			logout,
			updateUser,
			updateUserSettings,
			changePassword,
			updateProfile,
		],
	);

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
	const context = useContext(AuthContext);
	if (!context) {
		throw new Error('useAuth must be used within an AuthProvider');
	}
	return context;
};

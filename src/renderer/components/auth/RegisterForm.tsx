import React, { useState } from 'react';
import { Button } from '@/renderer/components/ui/button';
import { Input } from '@/renderer/components/ui/input';
import { Label } from '@/renderer/components/ui/label';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/renderer/components/ui/card';
import { Loader2, Mail, Lock, User } from 'lucide-react';
import { useAuth } from '@/renderer/context/AuthContextNew';

interface RegisterFormProps {
	onSwitchToLogin: () => void;
	onSuccess?: () => void;
}

export function RegisterForm({
	onSwitchToLogin,
	onSuccess,
}: RegisterFormProps) {
	const { register } = useAuth();
	const [formData, setFormData] = useState({
		email: '',
		username: '',
		password: '',
		confirmPassword: '',
		firstName: '',
		lastName: '',
	});
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target;
		setFormData((prev) => ({
			...prev,
			[name]: value,
		}));
		// Fehler zurücksetzen wenn User tippt
		if (error) {
			setError(null);
		}
	};

	const validateForm = (): string | null => {
		if (formData.password !== formData.confirmPassword) {
			return 'Passwörter stimmen nicht überein';
		}
		if (formData.password.length < 6) {
			return 'Passwort muss mindestens 6 Zeichen lang sein';
		}
		if (!formData.email.includes('@')) {
			return 'Bitte geben Sie eine gültige E-Mail-Adresse ein';
		}
		if (formData.username.length < 3) {
			return 'Benutzername muss mindestens 3 Zeichen lang sein';
		}
		return null;
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsLoading(true);
		setError(null);

		const validationError = validateForm();
		if (validationError) {
			setIsLoading(false);
			setError(validationError);
			return;
		}

		try {
			const result = await register({
				email: formData.email,
				username: formData.username,
				password: formData.password,
				firstName: formData.firstName,
				lastName: formData.lastName,
			});
			if (result && result.success) {
				if (onSuccess) onSuccess();
			} else {
				setError(result?.error || 'Registrierung fehlgeschlagen.');
			}
		} catch (err: any) {
			setError(
				err?.message ||
					err?.response?.data?.error ||
					'Ein unerwarteter Fehler ist aufgetreten. Bitte versuche es erneut.',
			);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<Card className="w-full max-w-md">
			<CardHeader className="space-y-1">
				<CardTitle className="text-2xl font-bold">Registrieren</CardTitle>
				<CardDescription>Erstellen Sie ein neues Konto</CardDescription>
			</CardHeader>
			<CardContent>
				<form onSubmit={handleSubmit} className="space-y-4">
					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label htmlFor="firstName">Vorname</Label>
							<Input
								id="firstName"
								name="firstName"
								type="text"
								placeholder="Vorname"
								value={formData.firstName}
								onChange={handleChange}
								disabled={isLoading}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="lastName">Nachname</Label>
							<Input
								id="lastName"
								name="lastName"
								type="text"
								placeholder="Nachname"
								value={formData.lastName}
								onChange={handleChange}
								disabled={isLoading}
							/>
						</div>
					</div>

					<div className="space-y-2">
						<Label htmlFor="email">E-Mail-Adresse *</Label>
						<div className="relative">
							<Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
							<Input
								id="email"
								name="email"
								type="email"
								placeholder="ihre@email.com"
								value={formData.email}
								onChange={handleChange}
								className="pl-10"
								required
								disabled={isLoading}
							/>
						</div>
					</div>

					<div className="space-y-2">
						<Label htmlFor="username">Benutzername *</Label>
						<div className="relative">
							<User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
							<Input
								id="username"
								name="username"
								type="text"
								placeholder="benutzername"
								value={formData.username}
								onChange={handleChange}
								className="pl-10"
								required
								disabled={isLoading}
							/>
						</div>
					</div>

					<div className="space-y-2">
						<Label htmlFor="password">Passwort *</Label>
						<div className="relative">
							<Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
							<Input
								id="password"
								name="password"
								type="password"
								placeholder="Mindestens 6 Zeichen"
								value={formData.password}
								onChange={handleChange}
								className="pl-10"
								required
								disabled={isLoading}
							/>
						</div>
					</div>

					<div className="space-y-2">
						<Label htmlFor="confirmPassword">Passwort bestätigen *</Label>
						<div className="relative">
							<Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
							<Input
								id="confirmPassword"
								name="confirmPassword"
								type="password"
								placeholder="Passwort wiederholen"
								value={formData.confirmPassword}
								onChange={handleChange}
								className="pl-10"
								required
								disabled={isLoading}
							/>
						</div>
					</div>

					{error && (
						<p className="text-red-500 text-sm mt-2" role="alert">
							{error}
						</p>
					)}

					<Button type="submit" className="w-full" disabled={isLoading}>
						{isLoading ? (
							<>
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								Registrierung läuft...
							</>
						) : (
							'Registrieren'
						)}
					</Button>
				</form>

				<div className="mt-4 text-center text-sm">
					<span className="text-muted-foreground">Bereits ein Konto? </span>
					<Button
						variant="link"
						className="p-0 h-auto font-semibold"
						onClick={onSwitchToLogin}
						disabled={isLoading}
					>
						Jetzt anmelden
					</Button>
				</div>
			</CardContent>
		</Card>
	);
}

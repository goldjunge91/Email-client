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
import { Alert, AlertDescription } from '@/renderer/components/ui/alert';
import { Loader2, Mail, Lock, AlertCircle } from 'lucide-react';
import { useAuth } from '@/renderer/context/AuthContextNew';

interface LoginFormProps {
	onSwitchToRegister: () => void;
	onSuccess?: () => void;
}

export function LoginForm({ onSwitchToRegister, onSuccess }: LoginFormProps) {
	const { login } = useAuth();
	const [formData, setFormData] = useState({
		email: '',
		password: '',
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

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsLoading(true);
		setError(null);

		try {
			const result = await login(formData);
			if (result.success) {
				onSuccess?.();
			} else {
				setError(result.error || 'Anmeldung fehlgeschlagen');
			}
		} catch {
			setError('Ein unerwarteter Fehler ist aufgetreten');
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<Card className="w-full max-w-md">
			<CardHeader className="space-y-1">
				<CardTitle className="text-2xl font-bold">Anmelden</CardTitle>
				<CardDescription>
					Melden Sie sich mit Ihren Zugangsdaten an
				</CardDescription>
			</CardHeader>
			<CardContent>
				<form onSubmit={handleSubmit} className="space-y-4">
					{error && (
						<Alert variant="destructive">
							<AlertCircle className="h-4 w-4" />
							<AlertDescription>{error}</AlertDescription>
						</Alert>
					)}

					<div className="space-y-2">
						<Label htmlFor="email">E-Mail-Adresse</Label>
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
						<Label htmlFor="password">Passwort</Label>
						<div className="relative">
							<Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
							<Input
								id="password"
								name="password"
								type="password"
								placeholder="Ihr Passwort"
								value={formData.password}
								onChange={handleChange}
								className="pl-10"
								required
								disabled={isLoading}
							/>
						</div>
					</div>

					<Button type="submit" className="w-full" disabled={isLoading}>
						{isLoading ? (
							<>
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								Anmeldung läuft...
							</>
						) : (
							'Anmelden'
						)}
					</Button>
				</form>

				<div className="mt-4 text-center text-sm">
					<span className="text-muted-foreground">Noch kein Konto? </span>
					<Button
						variant="link"
						className="p-0 h-auto font-semibold"
						onClick={onSwitchToRegister}
						disabled={isLoading}
					>
						Jetzt registrieren
					</Button>
				</div>
			</CardContent>
		</Card>
	);
}

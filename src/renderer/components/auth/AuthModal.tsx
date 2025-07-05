import React, { useState } from 'react';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from '@/renderer/components/ui/dialog';
import { LoginForm } from './LoginForm';
import { RegisterForm } from './RegisterForm';

interface AuthModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	defaultMode?: 'login' | 'register';
}

export function AuthModal({
	open,
	onOpenChange,
	defaultMode = 'login',
}: AuthModalProps) {
	const [mode, setMode] = useState<'login' | 'register'>(defaultMode);

	const handleSuccess = () => {
		onOpenChange(false);
	};

	const handleSwitchToRegister = () => {
		setMode('register');
	};

	const handleSwitchToLogin = () => {
		setMode('login');
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader className="sr-only">
					<DialogTitle>
						{mode === 'login' ? 'Anmelden' : 'Registrieren'}
					</DialogTitle>
				</DialogHeader>
				<div className="flex justify-center">
					{mode === 'login' ? (
						<LoginForm
							onSwitchToRegister={handleSwitchToRegister}
							onSuccess={handleSuccess}
						/>
					) : (
						<RegisterForm
							onSwitchToLogin={handleSwitchToLogin}
							onSuccess={handleSuccess}
						/>
					)}
				</div>
			</DialogContent>
		</Dialog>
	);
}

import React, { useState } from 'react';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from '@/renderer/components/ui/dialog';
import { Button } from '@/renderer/components/ui/button';
import { Input } from '@/renderer/components/ui/input';
import { Label } from '@/renderer/components/ui/label';
import { useAuth } from '@/renderer/context/AuthContextNew';
import { Loader2 } from 'lucide-react';

interface ProfileEditModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function ProfileEditModal({
	open,
	onOpenChange,
}: ProfileEditModalProps) {
	const { user, updateProfile } = useAuth();
	const [formData, setFormData] = useState({
		name: user?.name || '',
		email: user?.email || '',
	});
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState('');

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsLoading(true);
		setError('');

		try {
			await updateProfile(formData);
			onOpenChange(false);
		} catch (err) {
			setError(
				err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten',
			);
		} finally {
			setIsLoading(false);
		}
	};

	const handleChange = (field: string, value: string) => {
		setFormData((prev) => ({
			...prev,
			[field]: value,
		}));
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-md">
				<DialogHeader>
					<DialogTitle>Profil bearbeiten</DialogTitle>
				</DialogHeader>
				<form onSubmit={handleSubmit} className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor="name">Name</Label>
						<Input
							id="name"
							value={formData.name}
							onChange={(e) => handleChange('name', e.target.value)}
							placeholder="Ihr Name"
						/>
					</div>

					<div className="space-y-2">
						<Label htmlFor="email">E-Mail</Label>
						<Input
							id="email"
							type="email"
							value={formData.email}
							onChange={(e) => handleChange('email', e.target.value)}
							placeholder="ihre@email.com"
						/>
					</div>

					{error && (
						<div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
							{error}
						</div>
					)}

					<div className="flex justify-end space-x-2">
						<Button
							type="button"
							variant="outline"
							onClick={() => onOpenChange(false)}
							disabled={isLoading}
						>
							Abbrechen
						</Button>
						<Button type="submit" disabled={isLoading}>
							{isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
							Speichern
						</Button>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	);
}

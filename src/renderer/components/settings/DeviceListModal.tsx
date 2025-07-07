import React, { useEffect, useState } from 'react';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Device } from '@/main/database/schema';
import { useAuth } from '@/renderer/context/AuthContextNew';

interface DeviceListModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function DeviceListModal({ open, onOpenChange }: DeviceListModalProps) {
	const { user } = useAuth();
	const [devices, setDevices] = useState<Device[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (!open || !user) return;
		setLoading(true);
		setError(null);
		// IPC call to main process to fetch devices for the user
		// eslint-disable-next-line promise/catch-or-return
		window.electron
			.invoke('device:get-user-devices', user.id)
			.then((result: { devices: Device[] }) => {
				setDevices(result.devices);
			})
			.catch(() => setError('Geräte konnten nicht geladen werden.'))
			.finally(() => setLoading(false));
	}, [open, user]);

	const handleLogoutDevice = async (deviceId: number) => {
		setLoading(true);
		setError(null);
		try {
			await window.electron.invoke('device:logout-device', deviceId);
			setDevices((prev) => prev.filter((d) => d.id !== deviceId));
		} catch {
			setError('Gerät konnte nicht abgemeldet werden.');
		} finally {
			setLoading(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-lg">
				<DialogHeader>
					<DialogTitle>Angemeldete Geräte</DialogTitle>
					<DialogDescription>
						Hier siehst du alle Geräte, die mit deinem Account verbunden sind.
						Du kannst einzelne Geräte abmelden.
					</DialogDescription>
				</DialogHeader>
				{loading && <div className="py-8 text-center">Lade Geräte ...</div>}
				{!loading && error && (
					<div className="py-8 text-red-500 text-center">{error}</div>
				)}
				{!loading && !error && (
					<div className="space-y-4">
						{devices.length === 0 ? (
							<div className="text-center text-muted-foreground">
								Keine Geräte gefunden.
							</div>
						) : (
							<ul className="divide-y divide-border">
								{devices.map((device) => (
									<li
										key={device.id}
										className="flex items-center justify-between py-2"
									>
										<div>
											<div className="font-medium">{device.name}</div>
											<div className="text-xs text-muted-foreground">
												{device.type} &bull; Zuletzt aktiv:{' '}
												{new Date(device.lastUsedAt).toLocaleString()}
											</div>
										</div>
										<Button
											variant="destructive"
											size="sm"
											onClick={() => handleLogoutDevice(device.id)}
										>
											Abmelden
										</Button>
									</li>
								))}
							</ul>
						)}
					</div>
				)}
			</DialogContent>
		</Dialog>
	);
}

export default DeviceListModal;

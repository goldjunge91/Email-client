import React from 'react';
import { useAuth } from '@/renderer/context/AuthContextNew';
import { AuthModal } from '@/renderer/components/auth/AuthModal';
import { MailStoreProvider } from '../../../context/MailStoreProvider';
import MailView from '../../views/MailView';
import '@/renderer/styles/globals.scss';

export default function MailApp() {
	const { user, isInitialized } = useAuth();
	const [authModalOpen, setAuthModalOpen] = React.useState(false);

	React.useEffect(() => {
		if (isInitialized && !user) {
			setAuthModalOpen(true);
		} else {
			setAuthModalOpen(false);
		}
	}, [user, isInitialized]);

	if (!isInitialized) {
		return (
			<div className="h-screen w-screen flex items-center justify-center bg-background">
				<span className="text-muted-foreground">Lade...</span>
			</div>
		);
	}

	return (
		<MailStoreProvider>
			<>
				<AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} />
				{user && (
					<div className="h-screen w-screen bg-background">
						<MailView />
					</div>
				)}
			</>
		</MailStoreProvider>
	);
}

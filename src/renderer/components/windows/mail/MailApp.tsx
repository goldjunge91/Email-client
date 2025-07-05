import React from 'react';
import { MailStoreProvider } from '../../../context/MailStoreProvider';
import MailView from '../../views/MailView';
import '@/renderer/styles/globals.scss';

export default function MailApp() {
	return (
		<MailStoreProvider>
			<div className="h-screen w-screen bg-background">
				<MailView />
			</div>
		</MailStoreProvider>
	);
}

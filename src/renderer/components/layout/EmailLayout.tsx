import React from 'react';
import {
	ResizableHandle,
	ResizablePanel,
	ResizablePanelGroup,
} from '@/renderer/components/ui/resizable';
import { MailList } from '@/renderer/components/mail/MailList';
import { useMailStoreContext } from '@/renderer/context/MailStoreProvider';
import { SidebarProvider } from '@/renderer/context/SidebarContext';
import { EmailSidebar } from '../mail/email-sidebar';
import { Sidebar } from './Sidebar';

export function EmailLayout({ children }: { children: React.ReactNode }) {
	const { filteredMails } = useMailStoreContext();

	return (
		<SidebarProvider defaultOpen>
			<div className="flex h-full max-h-screen">
				{/* Sidebar mit Toggle-Funktionalität */}
				<Sidebar className="flex-shrink-0">
					<EmailSidebar />
				</Sidebar>

				{/* Hauptbereich mit Resizable Panels */}
				<div className="flex-1 min-w-0">
					<ResizablePanelGroup
						direction="horizontal"
						onLayout={(sizes: number[]) => {
							document.cookie = `react-resizable-panels:layout=${JSON.stringify(
								sizes,
							)}`;
						}}
						className="h-full items-stretch"
					>
						<ResizablePanel defaultSize={40} minSize={30}>
							<MailList items={filteredMails} />
						</ResizablePanel>
						<ResizableHandle withHandle />
						<ResizablePanel defaultSize={60}>
							<div className="p-4 h-full overflow-y-auto">{children}</div>
						</ResizablePanel>
					</ResizablePanelGroup>
				</div>
			</div>
		</SidebarProvider>
	);
}

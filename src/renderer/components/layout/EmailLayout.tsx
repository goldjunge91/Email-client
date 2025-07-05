import React, { useContext } from 'react';
import {
	ResizableHandle,
	ResizablePanel,
	ResizablePanelGroup,
} from '@/renderer/components/ui/resizable';
import { MailList } from '@/renderer/components/mail/MailList';
import { GlobalContext } from '@/renderer/context/global-context';
import { cn } from '@/lib/utils';
import { EmailSidebar } from '../mail/email-sidebar';

export function EmailLayout({ children }: { children: React.ReactNode }) {
	const { state } = useContext(GlobalContext);
	const { accounts, pinnedFolders, mails } = state;
	const [isCollapsed, setIsCollapsed] = React.useState(false);

	return (
		<ResizablePanelGroup
			direction="horizontal"
			onLayout={(sizes: number[]) => {
				document.cookie = `react-resizable-panels:layout=${JSON.stringify(
					sizes,
				)}`;
			}}
			className="h-full max-h-screen items-stretch"
		>
			<ResizablePanel
				defaultSize={20}
				minSize={15}
				maxSize={25}
				collapsible
				collapsedSize={4}
				onCollapse={() => setIsCollapsed(true)}
				onExpand={() => setIsCollapsed(false)}
				className={cn(
					isCollapsed && 'min-w-[50px] transition-all duration-300 ease-in-out',
				)}
			>
				<EmailSidebar
					accounts={accounts}
					pinnedFolders={pinnedFolders}
					isCollapsed={isCollapsed}
				/>
			</ResizablePanel>
			<ResizableHandle withHandle />
			<ResizablePanel defaultSize={30} minSize={25}>
				<MailList items={mails} />
			</ResizablePanel>
			<ResizableHandle withHandle />
			<ResizablePanel defaultSize={50}>
				<div className="p-4 h-full overflow-y-auto">{children}</div>
			</ResizablePanel>
		</ResizablePanelGroup>
	);
}

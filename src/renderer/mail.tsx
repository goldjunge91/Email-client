// import { Layout } from '@/renderer/components/layout/Layout';
import MailApp from '@/renderer/components/windows/mail/MailApp';
import { createRoot } from 'react-dom/client';
import { Toaster } from '@/components/ui/sonner';
import { AuthProvider } from './context/AuthContextNew';
import { MailStoreProvider } from './context/MailStoreProvider';
// import { EmailLayout } from './components/layout/EmailLayout';
import { ThemeProvider } from './context/theme-context';
import { GlobalContextProvider } from './context/global-context';
import { Layout } from './components/layout/Layout';

const container = document.getElementById('root') as HTMLElement;
const root = createRoot(container);
root.render(
	<AuthProvider>
		<GlobalContextProvider>
			<ThemeProvider>
				<MailStoreProvider>
					<Layout>
						{/* <EmailLayout> */}
						<MailApp />
						<Toaster />
						{/* </EmailLayout> */}
					</Layout>
				</MailStoreProvider>
			</ThemeProvider>
		</GlobalContextProvider>
	</AuthProvider>,
);

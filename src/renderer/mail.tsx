// import { Layout } from '@/renderer/components/layout/Layout';
import MailApp from '@/renderer/components/windows/mail/MailApp';
import { createRoot } from 'react-dom/client';
import { AuthProvider } from '@/renderer/context/AuthContextNew';
import { MailStoreProvider } from './context/MailStoreProvider';
import { Layout } from './components/layout/Layout';

const container = document.getElementById('root') as HTMLElement;
const root = createRoot(container);
root.render(
	<AuthProvider>
		<MailStoreProvider>
			<Layout>
				{/* <EmailLayout> */}
				<MailApp />
			</Layout>
			{/* </EmailLayout> */}
		</MailStoreProvider>
	</AuthProvider>,
);

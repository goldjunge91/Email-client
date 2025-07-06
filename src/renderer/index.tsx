import { Layout } from '@/renderer/components/layout/Layout';
import App from '@/renderer/components/windows/main/App';
import { createRoot } from 'react-dom/client';
import { MailStoreProvider } from '@/renderer/context/MailStoreProvider';
import { AuthProvider } from './context/AuthContextNew';

const container = document.getElementById('root') as HTMLElement;
const root = createRoot(container);
root.render(
	// <AuthProvider>
	<MailStoreProvider>
		<Layout>
			<App />
		</Layout>
	</MailStoreProvider>,
	// </AuthProvider>,
);

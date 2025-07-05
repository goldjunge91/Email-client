import { Layout } from '@/renderer/components/layout/Layout';
import MailApp from '@/renderer/components/windows/mail/MailApp';
import { createRoot } from 'react-dom/client';

const container = document.getElementById('root') as HTMLElement;
const root = createRoot(container);
root.render(
	<Layout>
		<MailApp />
	</Layout>,
);

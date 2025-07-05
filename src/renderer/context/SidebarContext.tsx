import React, {
	createContext,
	useContext,
	useState,
	useCallback,
	useMemo,
} from 'react';

interface SidebarContextType {
	isOpen: boolean;
	toggle: () => void;
	open: () => void;
	close: () => void;
}

const SidebarContext = createContext<SidebarContextType | null>(null);

export const useSidebar = () => {
	const context = useContext(SidebarContext);
	if (!context) {
		throw new Error('useSidebar must be used within a SidebarProvider');
	}
	return context;
};

interface SidebarProviderProps {
	children: React.ReactNode;
	defaultOpen?: boolean;
}

export function SidebarProvider({
	children,
	defaultOpen = true,
}: SidebarProviderProps) {
	const [isOpen, setIsOpen] = useState(defaultOpen);

	const toggle = useCallback(() => {
		setIsOpen((prev) => !prev);
	}, []);

	const open = useCallback(() => {
		setIsOpen(true);
	}, []);

	const close = useCallback(() => {
		setIsOpen(false);
	}, []);

	const value = useMemo(
		() => ({ isOpen, toggle, open, close }),
		[isOpen, toggle, open, close],
	);

	return (
		<SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>
	);
}

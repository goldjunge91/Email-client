import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useSidebar } from '@/renderer/context/SidebarContext';

interface SidebarProps {
	children: React.ReactNode;
	className?: string;
	collapsedWidth?: number;
	expandedWidth?: number;
}

export function Sidebar({
	children,
	className,
	collapsedWidth = 60,
	expandedWidth = 256,
}: SidebarProps) {
	const { isOpen, toggle } = useSidebar();

	return (
		<div
			className={cn(
				'relative border-r border-border bg-card transition-all duration-300 ease-in-out',
				className,
			)}
			style={{
				width: isOpen ? `${expandedWidth}px` : `${collapsedWidth}px`,
			}}
		>
			{/* Toggle Button */}
			<Button
				variant="ghost"
				size="sm"
				className="absolute -right-3 top-4 z-10 h-6 w-6 rounded-full border border-border bg-background p-0 shadow-sm hover:bg-accent"
				onClick={toggle}
			>
				{isOpen ? (
					<ChevronLeft className="h-3 w-3" />
				) : (
					<ChevronRight className="h-3 w-3" />
				)}
			</Button>

			{/* Sidebar Content */}
			<div className="h-full overflow-hidden">{children}</div>
		</div>
	);
}

interface SidebarContentProps {
	children: React.ReactNode;
	className?: string;
}

export function SidebarContent({ children, className }: SidebarContentProps) {
	const { isOpen } = useSidebar();

	return (
		<div className={cn('h-full', className)}>
			{isOpen ? (
				<div className="p-4">{children}</div>
			) : (
				<div className="p-2 flex flex-col items-center">{children}</div>
			)}
		</div>
	);
}

interface SidebarHeaderProps {
	children: React.ReactNode;
	className?: string;
}

export function SidebarHeader({ children, className }: SidebarHeaderProps) {
	const { isOpen } = useSidebar();

	return (
		<div className={cn('mb-4', className)}>{isOpen ? children : null}</div>
	);
}

interface SidebarItemProps {
	children: React.ReactNode;
	icon?: React.ReactNode;
	onClick?: () => void;
	active?: boolean;
	className?: string;
}

export function SidebarItem({
	children,
	icon,
	onClick,
	active,
	className,
}: SidebarItemProps) {
	const { isOpen } = useSidebar();

	return (
		<Button
			variant={active ? 'secondary' : 'ghost'}
			className={cn(
				'w-full justify-start h-auto p-2 mb-1',
				!isOpen && 'justify-center px-0',
				className,
			)}
			onClick={onClick}
		>
			{icon && <div className={cn('shrink-0', isOpen && 'mr-2')}>{icon}</div>}
			{isOpen && <div className="flex-1 text-left truncate">{children}</div>}
		</Button>
	);
}

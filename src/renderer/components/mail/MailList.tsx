import React from 'react';
import { Mail } from '@/types/mail';
import { cn } from '@/lib/utils';
import { Badge } from '@/renderer/components/ui/badge';

interface MailListProps {
	items: Mail[];
}

export function MailList({ items }: MailListProps) {
	return (
		<div className="flex flex-col gap-2 p-4 pt-0">
			{items.map((item) => (
				<button
					key={item.id}
					className={cn(
						'flex flex-col items-start gap-2 rounded-lg border p-3 text-left text-sm transition-all hover:bg-accent',
						'bg-card',
					)}
				>
					<div className="flex w-full flex-col gap-1">
						<div className="flex items-center">
							<div className="flex items-center gap-2">
								<div className="font-semibold">{item.name}</div>
								{!item.read && (
									<span className="flex h-2 w-2 rounded-full bg-blue-600" />
								)}
							</div>
							<div className={cn('ml-auto text-xs', 'text-muted-foreground')}>
								{item.date}
							</div>
						</div>
						<div className="text-xs font-medium">{item.subject}</div>
					</div>
					<div className="line-clamp-2 text-xs text-muted-foreground">
						{item.text.substring(0, 100)}
					</div>
					{item.labels.length ? (
						<div className="flex items-center gap-2">
							{item.labels.map((label) => (
								<Badge key={label} variant="outline">
									{label}
								</Badge>
							))}
						</div>
					) : null}
				</button>
			))}
		</div>
	);
}

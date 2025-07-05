import nodemailer from 'nodemailer';
import Mail from 'nodemailer/lib/mailer';
import { EventEmitter } from 'events';
import { MailAddress, MailAttachment } from '../../types/mail';

export interface SmtpConnectionOptions {
	host: string;
	port: number;
	secure: boolean;
	auth: {
		user: string;
		pass: string;
	};
	tls?: {
		rejectUnauthorized?: boolean;
	};
}

export interface SendMailOptions {
	from?: MailAddress;
	to: MailAddress[];
	cc?: MailAddress[];
	bcc?: MailAddress[];
	replyTo?: MailAddress;
	subject: string;
	text?: string;
	html?: string;
	attachments?: MailAttachment[];
	inReplyTo?: string;
	references?: string[];
	priority?: 'high' | 'normal' | 'low';
	headers?: Record<string, string>;
}

export class SmtpClient extends EventEmitter {
	private transporter: Mail | null = null;

	private accountId: string;

	private defaultFrom?: MailAddress;

	constructor(accountId: string) {
		super();
		this.accountId = accountId;
	}

	// Connection Management
	async connect(
		options: SmtpConnectionOptions,
		defaultFrom?: MailAddress,
	): Promise<void> {
		try {
			this.defaultFrom = defaultFrom;

			this.transporter = nodemailer.createTransport({
				host: options.host,
				port: options.port,
				secure: options.secure,
				auth: options.auth,
				tls: options.tls || {
					rejectUnauthorized: false,
				},
				logger: false,
				debug: false,
			});

			// Verify connection
			await this.transporter.verify();
			this.emit('connected');
		} catch (error) {
			this.emit('error', error);
			throw error;
		}
	}

	disconnect(): void {
		if (this.transporter) {
			this.transporter.close();
			this.transporter = null;
			this.emit('disconnected');
		}
	}

	// Send Mail
	async sendMail(options: SendMailOptions): Promise<string> {
		if (!this.transporter) {
			throw new Error('SMTP client not connected');
		}

		try {
			// Prepare mail options
			const mailOptions: Mail.Options = {
				from: SmtpClient.formatAddress(options.from || this.defaultFrom),
				to: SmtpClient.formatAddresses(options.to),
				cc: options.cc ? SmtpClient.formatAddresses(options.cc) : undefined,
				bcc: options.bcc ? SmtpClient.formatAddresses(options.bcc) : undefined,
				replyTo: options.replyTo
					? SmtpClient.formatAddress(options.replyTo)
					: undefined,
				subject: options.subject,
				text: options.text,
				html: options.html,
				attachments: SmtpClient.formatAttachments(options.attachments),
				inReplyTo: options.inReplyTo,
				references: options.references,
				priority: options.priority,
				headers: options.headers,
			};

			// Send mail
			const info = await this.transporter.sendMail(mailOptions);

			this.emit('mail:sent', {
				messageId: info.messageId,
				accepted: info.accepted,
				rejected: info.rejected,
				response: info.response,
			});

			return info.messageId;
		} catch (error) {
			this.emit('error', error);
			throw error;
		}
	}

	// Send draft
	async saveDraft(options: SendMailOptions): Promise<string> {
		// In a real implementation, this would save to IMAP Drafts folder
		// For now, we'll just create a message ID
		const messageId = this.generateMessageId();

		this.emit('draft:saved', {
			messageId,
			draft: options,
		});

		return messageId;
	}

	// Reply to mail
	async replyToMail(
		originalMail: {
			messageId: string;
			subject: string;
			from: MailAddress[];
			to: MailAddress[];
			cc?: MailAddress[];
			references?: string[];
		},
		reply: {
			text?: string;
			html?: string;
			attachments?: MailAttachment[];
			replyAll?: boolean;
		},
	): Promise<string> {
		const replyOptions: SendMailOptions = {
			to: originalMail.from,
			subject: originalMail.subject.startsWith('Re:')
				? originalMail.subject
				: `Re: ${originalMail.subject}`,
			text: reply.text,
			html: reply.html,
			attachments: reply.attachments,
			inReplyTo: originalMail.messageId,
			references: [...(originalMail.references || []), originalMail.messageId],
		};

		// Include CC recipients if reply all
		if (reply.replyAll && originalMail.cc) {
			replyOptions.cc = originalMail.cc;
		}

		return this.sendMail(replyOptions);
	}

	// Forward mail
	async forwardMail(
		originalMail: {
			messageId: string;
			subject: string;
			from: MailAddress[];
			date: Date;
			text?: string;
			html?: string;
			attachments?: MailAttachment[];
		},
		forward: {
			to: MailAddress[];
			cc?: MailAddress[];
			bcc?: MailAddress[];
			text?: string;
			includeAttachments?: boolean;
		},
	): Promise<string> {
		// Build forward content
		const forwardHeader = `
From: ${SmtpClient.formatAddress(originalMail.from[0])}
Date: ${originalMail.date.toLocaleString()}
Subject: ${originalMail.subject}

`;

		const forwardOptions: SendMailOptions = {
			to: forward.to,
			cc: forward.cc,
			bcc: forward.bcc,
			subject: originalMail.subject.startsWith('Fwd:')
				? originalMail.subject
				: `Fwd: ${originalMail.subject}`,
			text: forward.text
				? `${forward.text}\n\n${forwardHeader}${originalMail.text || ''}`
				: `${forwardHeader}${originalMail.text || ''}`,
			html: originalMail.html,
			attachments: forward.includeAttachments
				? originalMail.attachments
				: undefined,
		};

		return this.sendMail(forwardOptions);
	}

	// Utility methods
	private static formatAddress(address?: MailAddress): string {
		if (!address) return '';
		return address.name
			? `"${address.name}" <${address.address}>`
			: address.address;
	}

	private static formatAddresses(addresses: MailAddress[]): string[] {
		return addresses.map((addr) => SmtpClient.formatAddress(addr));
	}

	private static formatAttachments(
		attachments?: MailAttachment[],
	): Mail.Attachment[] {
		if (!attachments) return [];

		return attachments.map((att) => ({
			filename: att.filename,
			contentType: att.contentType,
			contentDisposition: att.contentDisposition as 'attachment' | 'inline',
			cid: att.contentId,
			content: att.content,
			path: att.path,
			href: att.href,
			raw: att.raw,
		}));
	}

	private generateMessageId(): string {
		const timestamp = Date.now();
		const random = Math.random().toString(36).substring(2, 15);
		const domain = this.defaultFrom?.address.split('@')[1] || 'localhost';
		return `<${timestamp}.${random}@${domain}>`;
	}

	// Test connection
	async testConnection(): Promise<boolean> {
		if (!this.transporter) {
			throw new Error('SMTP client not connected');
		}

		try {
			await this.transporter.verify();
			return true;
		} catch {
			return false;
		}
	}

	// Get account ID
	getAccountId(): string {
		return this.accountId;
	}
}

// Export verification function
export const verifySmtpConnection = async (
	options: SmtpConnectionOptions,
): Promise<void> => {
	const client = new SmtpClient('test');

	try {
		await client.connect(options);
		await client.testConnection();
	} finally {
		client.disconnect();
	}
};

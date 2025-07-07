/* eslint-disable jsx-a11y/label-has-associated-control */
/* eslint-disable react/button-has-type */
import React, { useState } from 'react';
import {
	Mail,
	Lock,
	Server,
	Globe,
	AlertCircle,
	CheckCircle,
	Loader2,
	Eye,
	EyeOff,
	Zap,
} from 'lucide-react';

interface AccountFormData {
	accountName: string;
	email: string;

	// Incoming Server
	incomingProtocol: 'imap' | 'pop3';
	incomingHost: string;
	incomingPort: number;
	incomingSecurity: 'none' | 'ssl' | 'starttls';
	incomingUsername: string;
	incomingPassword: string;

	// Outgoing Server
	outgoingHost: string;
	outgoingPort: number;
	outgoingSecurity: 'none' | 'ssl' | 'starttls';
	outgoingUsername: string;
	outgoingPassword: string;
	useIncomingCredentials: boolean;
}

const defaultPorts = {
	imap: { none: 143, ssl: 993, starttls: 143 },
	pop3: { none: 110, ssl: 995, starttls: 110 },
	smtp: { none: 25, ssl: 465, starttls: 587 },
};

const commonProviders = [
	{
		name: 'Gmail',
		icon: '📧',
		settings: {
			incomingHost: 'imap.gmail.com',
			incomingPort: 993,
			incomingSecurity: 'ssl' as const,
			outgoingHost: 'smtp.gmail.com',
			outgoingPort: 587,
			outgoingSecurity: 'starttls' as const,
		},
	},
	{
		name: 'Outlook',
		icon: '📮',
		settings: {
			incomingHost: 'outlook.office365.com',
			incomingPort: 993,
			incomingSecurity: 'ssl' as const,
			outgoingHost: 'smtp-mail.outlook.com',
			outgoingPort: 587,
			outgoingSecurity: 'starttls' as const,
		},
	},
	{
		name: 'Yahoo',
		icon: '📪',
		settings: {
			incomingHost: 'imap.mail.yahoo.com',
			incomingPort: 993,
			incomingSecurity: 'ssl' as const,
			outgoingHost: 'smtp.mail.yahoo.com',
			outgoingPort: 587,
			outgoingSecurity: 'starttls' as const,
		},
	},
];

export default function ModernAccountForm({
	onClose,
	onSave,
}: {
	onClose: () => void;
	onSave: (data: AccountFormData) => void;
}) {
	const [formData, setFormData] = useState<AccountFormData>({
		accountName: '',
		email: '',
		incomingProtocol: 'imap',
		incomingHost: '',
		incomingPort: 993,
		incomingSecurity: 'ssl',
		incomingUsername: '',
		incomingPassword: '',
		outgoingHost: '',
		outgoingPort: 587,
		outgoingSecurity: 'starttls',
		outgoingUsername: '',
		outgoingPassword: '',
		useIncomingCredentials: true,
	});

	const [showPassword, setShowPassword] = useState(false);
	const [showOutgoingPassword, setShowOutgoingPassword] = useState(false);
	const [isVerifying, setIsVerifying] = useState(false);
	const [verificationStatus, setVerificationStatus] = useState<
		'idle' | 'success' | 'error'
	>('idle');
	const [verificationMessage, setVerificationMessage] = useState('');
	const [activeTab, setActiveTab] = useState<'basic' | 'incoming' | 'outgoing'>(
		'basic',
	);

	const handleProviderSelect = (provider: (typeof commonProviders)[0]) => {
		setFormData((prev) => ({
			...prev,
			...provider.settings,
			incomingUsername: prev.email,
			outgoingUsername: prev.email,
		}));
	};

	const handleSecurityChange = (
		type: 'incoming' | 'outgoing',
		security: 'none' | 'ssl' | 'starttls',
	) => {
		if (type === 'incoming') {
			const protocol = formData.incomingProtocol;
			setFormData((prev) => ({
				...prev,
				incomingSecurity: security,
				incomingPort: defaultPorts[protocol][security],
			}));
		} else {
			setFormData((prev) => ({
				...prev,
				outgoingSecurity: security,
				outgoingPort: defaultPorts.smtp[security],
			}));
		}
	};

	const handleVerify = async () => {
		setIsVerifying(true);
		setVerificationStatus('idle');

		try {
			// Simulate verification process
			await new Promise((resolve) => {
				setTimeout(resolve, 2000);
			});

			// In real implementation, call the electron API here
			// const result = await window.electron.verifyAccount(formData);

			setVerificationStatus('success');
			setVerificationMessage('Account successfully verified!');
		} catch {
			setVerificationStatus('error');
			setVerificationMessage(
				'Failed to verify account. Please check your settings.',
			);
		} finally {
			setIsVerifying(false);
		}
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (verificationStatus !== 'success') {
			await handleVerify();
		}

		if (verificationStatus === 'success') {
			onSave(formData);
		}
	};

	return (
		<div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
			<div className="bg-zinc-900 rounded-lg shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden flex flex-col">
				{/* Header */}
				<div className="border-b border-zinc-800 px-6 py-4">
					<div className="flex items-center justify-between">
						<h2 className="text-xl font-semibold">Add Email Account</h2>
						<button
							type="button"
							onClick={onClose}
							className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
							aria-label="Close"
						>
							<svg
								className="w-5 h-5"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M6 18L18 6M6 6l12 12"
								/>
							</svg>
						</button>
					</div>
				</div>

				{/* Tabs */}
				<div className="border-b border-zinc-800">
					<div className="flex">
						<button
							onClick={() => setActiveTab('basic')}
							className={`px-6 py-3 text-sm font-medium transition-colors relative ${
								activeTab === 'basic'
									? 'text-blue-400'
									: 'text-zinc-400 hover:text-zinc-300'
							}`}
						>
							Basic Info
							{activeTab === 'basic' && (
								<div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-400" />
							)}
						</button>
						<button
							onClick={() => setActiveTab('incoming')}
							className={`px-6 py-3 text-sm font-medium transition-colors relative ${
								activeTab === 'incoming'
									? 'text-blue-400'
									: 'text-zinc-400 hover:text-zinc-300'
							}`}
						>
							Incoming Server
							{activeTab === 'incoming' && (
								<div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-400" />
							)}
						</button>
						<button
							onClick={() => setActiveTab('outgoing')}
							className={`px-6 py-3 text-sm font-medium transition-colors relative ${
								activeTab === 'outgoing'
									? 'text-blue-400'
									: 'text-zinc-400 hover:text-zinc-300'
							}`}
						>
							Outgoing Server
							{activeTab === 'outgoing' && (
								<div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-400" />
							)}
						</button>
					</div>
				</div>

				{/* Form Content */}
				<form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
					<div className="p-6 space-y-6">
						{/* Basic Info Tab */}
						{activeTab === 'basic' && (
							<div className="space-y-6">
								{/* Quick Setup */}
								<div>
									<h3 className="text-sm font-medium text-zinc-300 mb-3">
										Quick Setup
									</h3>
									<div className="grid grid-cols-3 gap-3">
										{commonProviders.map((provider) => (
											<button
												key={provider.name}
												type="button"
												onClick={() => handleProviderSelect(provider)}
												className="p-4 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors text-center"
											>
												<div className="text-2xl mb-1">{provider.icon}</div>
												<div className="text-sm">{provider.name}</div>
											</button>
										))}
									</div>
								</div>

								{/* Account Details */}
								<div className="space-y-4">
									<div>
										<label className="block text-sm font-medium text-zinc-300 mb-2">
											Account Name
										</label>
										<input
											type="text"
											value={formData.accountName}
											onChange={(e) =>
												setFormData((prev) => ({
													...prev,
													accountName: e.target.value,
												}))
											}
											placeholder="Personal, Work, etc."
											className="w-full px-3 py-2 bg-zinc-800 rounded-lg text-sm placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
											required
										/>
									</div>

									<div>
										<label className="block text-sm font-medium text-zinc-300 mb-2">
											Email Address
										</label>
										<div className="relative">
											<Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
											<input
												type="email"
												value={formData.email}
												onChange={(e) =>
													setFormData((prev) => ({
														...prev,
														email: e.target.value,
														incomingUsername: e.target.value,
														outgoingUsername: prev.useIncomingCredentials
															? e.target.value
															: prev.outgoingUsername,
													}))
												}
												placeholder="your@email.com"
												className="w-full pl-10 pr-3 py-2 bg-zinc-800 rounded-lg text-sm placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
												required
											/>
										</div>
									</div>

									<div>
										<label className="block text-sm font-medium text-zinc-300 mb-2">
											Password
										</label>
										<div className="relative">
											<Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
											<input
												type={showPassword ? 'text' : 'password'}
												value={formData.incomingPassword}
												onChange={(e) =>
													setFormData((prev) => ({
														...prev,
														incomingPassword: e.target.value,
														outgoingPassword: prev.useIncomingCredentials
															? e.target.value
															: prev.outgoingPassword,
													}))
												}
												placeholder="Password"
												className="w-full pl-10 pr-10 py-2 bg-zinc-800 rounded-lg text-sm placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
												required
											/>
											<button
												type="button"
												onClick={() => setShowPassword(!showPassword)}
												className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
											>
												{showPassword ? (
													<EyeOff className="w-4 h-4" />
												) : (
													<Eye className="w-4 h-4" />
												)}
											</button>
										</div>
									</div>
								</div>
							</div>
						)}

						{/* Incoming Server Tab */}
						{activeTab === 'incoming' && (
							<div className="space-y-4">
								<div>
									<label className="block text-sm font-medium text-zinc-300 mb-2">
										Protocol
									</label>
									<div className="flex gap-3">
										<button
											type="button"
											onClick={() =>
												setFormData((prev) => ({
													...prev,
													incomingProtocol: 'imap',
												}))
											}
											className={`flex-1 py-2 px-4 rounded-lg transition-colors ${
												formData.incomingProtocol === 'imap'
													? 'bg-blue-600 text-white'
													: 'bg-zinc-800 hover:bg-zinc-700'
											}`}
										>
											IMAP
										</button>
										<button
											type="button"
											onClick={() =>
												setFormData((prev) => ({
													...prev,
													incomingProtocol: 'pop3',
												}))
											}
											className={`flex-1 py-2 px-4 rounded-lg transition-colors ${
												formData.incomingProtocol === 'pop3'
													? 'bg-blue-600 text-white'
													: 'bg-zinc-800 hover:bg-zinc-700'
											}`}
										>
											POP3
										</button>
									</div>
								</div>

								<div>
									<label className="block text-sm font-medium text-zinc-300 mb-2">
										Server Address
									</label>
									<div className="relative">
										<Server className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
										<input
											type="text"
											value={formData.incomingHost}
											onChange={(e) =>
												setFormData((prev) => ({
													...prev,
													incomingHost: e.target.value,
												}))
											}
											placeholder="imap.example.com"
											className="w-full pl-10 pr-3 py-2 bg-zinc-800 rounded-lg text-sm placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
											required
										/>
									</div>
								</div>

								<div className="grid grid-cols-2 gap-4">
									<div>
										<label className="block text-sm font-medium text-zinc-300 mb-2">
											Port
										</label>
										<input
											type="number"
											value={formData.incomingPort}
											onChange={(e) =>
												setFormData((prev) => ({
													...prev,
													incomingPort: parseInt(e.target.value, 10),
												}))
											}
											className="w-full px-3 py-2 bg-zinc-800 rounded-lg text-sm placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
											required
										/>
									</div>

									<div>
										<label className="block text-sm font-medium text-zinc-300 mb-2">
											Security
										</label>
										<select
											value={formData.incomingSecurity}
											onChange={(e) =>
												handleSecurityChange('incoming', e.target.value as any)
											}
											className="w-full px-3 py-2 bg-zinc-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
										>
											<option value="none">None</option>
											<option value="ssl">SSL/TLS</option>
											<option value="starttls">STARTTLS</option>
										</select>
									</div>
								</div>

								<div>
									<label className="block text-sm font-medium text-zinc-300 mb-2">
										Username
									</label>
									<input
										type="text"
										value={formData.incomingUsername}
										onChange={(e) =>
											setFormData((prev) => ({
												...prev,
												incomingUsername: e.target.value,
											}))
										}
										placeholder="Usually your email address"
										className="w-full px-3 py-2 bg-zinc-800 rounded-lg text-sm placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
										required
									/>
								</div>
							</div>
						)}

						{/* Outgoing Server Tab */}
						{activeTab === 'outgoing' && (
							<div className="space-y-4">
								<div>
									<label className="block text-sm font-medium text-zinc-300 mb-2">
										SMTP Server Address
									</label>
									<div className="relative">
										<Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
										<input
											type="text"
											value={formData.outgoingHost}
											onChange={(e) =>
												setFormData((prev) => ({
													...prev,
													outgoingHost: e.target.value,
												}))
											}
											placeholder="smtp.example.com"
											className="w-full pl-10 pr-3 py-2 bg-zinc-800 rounded-lg text-sm placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
											required
										/>
									</div>
								</div>

								<div className="grid grid-cols-2 gap-4">
									<div>
										<label className="block text-sm font-medium text-zinc-300 mb-2">
											Port
										</label>
										<input
											type="number"
											value={formData.outgoingPort}
											onChange={(e) =>
												setFormData((prev) => ({
													...prev,
													outgoingPort: parseInt(e.target.value, 10),
												}))
											}
											className="w-full px-3 py-2 bg-zinc-800 rounded-lg text-sm placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
											required
										/>
									</div>

									<div>
										<label className="block text-sm font-medium text-zinc-300 mb-2">
											Security
										</label>
										<select
											value={formData.outgoingSecurity}
											onChange={(e) =>
												handleSecurityChange('outgoing', e.target.value as any)
											}
											className="w-full px-3 py-2 bg-zinc-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
										>
											<option value="none">None</option>
											<option value="ssl">SSL/TLS</option>
											<option value="starttls">STARTTLS</option>
										</select>
									</div>
								</div>

								<div className="bg-zinc-800 rounded-lg p-3">
									<label className="flex items-center gap-3 cursor-pointer">
										<input
											type="checkbox"
											checked={formData.useIncomingCredentials}
											onChange={(e) =>
												setFormData((prev) => ({
													...prev,
													useIncomingCredentials: e.target.checked,
													outgoingUsername: e.target.checked
														? prev.incomingUsername
														: prev.outgoingUsername,
													outgoingPassword: e.target.checked
														? prev.incomingPassword
														: prev.outgoingPassword,
												}))
											}
											className="w-4 h-4 rounded bg-zinc-700 border-zinc-600 text-blue-600 focus:ring-blue-500/50"
										/>
										<span className="text-sm">
											Use same credentials as incoming server
										</span>
									</label>
								</div>

								{!formData.useIncomingCredentials && (
									<>
										<div>
											<label className="block text-sm font-medium text-zinc-300 mb-2">
												Username
											</label>
											<input
												type="text"
												value={formData.outgoingUsername}
												onChange={(e) =>
													setFormData((prev) => ({
														...prev,
														outgoingUsername: e.target.value,
													}))
												}
												placeholder="SMTP username"
												className="w-full px-3 py-2 bg-zinc-800 rounded-lg text-sm placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
												required
											/>
										</div>

										<div>
											<label className="block text-sm font-medium text-zinc-300 mb-2">
												Password
											</label>
											<div className="relative">
												<Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
												<input
													type={showOutgoingPassword ? 'text' : 'password'}
													value={formData.outgoingPassword}
													onChange={(e) =>
														setFormData((prev) => ({
															...prev,
															outgoingPassword: e.target.value,
														}))
													}
													placeholder="SMTP password"
													className="w-full pl-10 pr-10 py-2 bg-zinc-800 rounded-lg text-sm placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
													required
												/>
												<button
													type="button"
													onClick={() =>
														setShowOutgoingPassword(!showOutgoingPassword)
													}
													className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
												>
													{showOutgoingPassword ? (
														<EyeOff className="w-4 h-4" />
													) : (
														<Eye className="w-4 h-4" />
													)}
												</button>
											</div>
										</div>
									</>
								)}
							</div>
						)}

						{/* Verification Status */}
						{verificationStatus !== 'idle' && (
							<div
								className={`p-4 rounded-lg flex items-center gap-3 ${
									verificationStatus === 'success'
										? 'bg-green-900/20 text-green-400'
										: 'bg-red-900/20 text-red-400'
								}`}
							>
								{verificationStatus === 'success' ? (
									<CheckCircle className="w-5 h-5" />
								) : (
									<AlertCircle className="w-5 h-5" />
								)}
								<span className="text-sm">{verificationMessage}</span>
							</div>
						)}
					</div>
				</form>

				{/* Footer */}
				<div className="border-t border-zinc-800 px-6 py-4">
					<div className="flex items-center justify-between">
						<button
							type="button"
							onClick={handleVerify}
							disabled={isVerifying}
							className="px-4 py-2 text-sm text-zinc-400 hover:text-zinc-300 transition-colors flex items-center gap-2"
						>
							{isVerifying ? (
								<>
									<Loader2 className="w-4 h-4 animate-spin" />
									Verifying...
								</>
							) : (
								<>
									<Zap className="w-4 h-4" />
									Test Connection
								</>
							)}
						</button>

						<div className="flex items-center gap-3">
							<button
								type="button"
								onClick={onClose}
								className="px-4 py-2 text-sm text-zinc-400 hover:text-zinc-300 transition-colors"
							>
								Cancel
							</button>
							<button
								onClick={handleSubmit}
								disabled={isVerifying}
								className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white text-sm rounded-lg transition-colors"
							>
								Add Account
							</button>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

import { BrowserWindow, session } from 'electron';
import { OAuth2Client } from 'google-auth-library';
import { URL } from 'url';

// Google OAuth2 Configuration
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || 'YOUR_CLIENT_ID';
const GOOGLE_CLIENT_SECRET =
	process.env.GOOGLE_CLIENT_SECRET || 'YOUR_CLIENT_SECRET';
const REDIRECT_URI = 'http://localhost:3000/auth/google/callback';

// Gmail OAuth2 scopes
const SCOPES = [
	'https://www.googleapis.com/auth/userinfo.email',
	'https://www.googleapis.com/auth/userinfo.profile',
	'https://mail.google.com/',
	'https://www.googleapis.com/auth/gmail.readonly',
	'https://www.googleapis.com/auth/gmail.send',
	'https://www.googleapis.com/auth/gmail.compose',
	'https://www.googleapis.com/auth/gmail.modify',
];

export class GoogleAuth {
	private oauth2Client: OAuth2Client;

	constructor() {
		this.oauth2Client = new OAuth2Client(
			GOOGLE_CLIENT_ID,
			GOOGLE_CLIENT_SECRET,
			REDIRECT_URI,
		);
	}

	/**
	 * Get Google OAuth2 authorization URL
	 */
	getAuthUrl(): string {
		return this.oauth2Client.generateAuthUrl({
			access_type: 'offline',
			scope: SCOPES,
			prompt: 'consent',
		});
	}

	/**
	 * Exchange authorization code for tokens
	 */
	async getTokens(code: string) {
		const { tokens } = await this.oauth2Client.getToken(code);
		this.oauth2Client.setCredentials(tokens);
		return tokens;
	}

	/**
	 * Get user info from Google
	 */
	async getUserInfo(accessToken: string) {
		this.oauth2Client.setCredentials({ access_token: accessToken });

		const response = await fetch(
			'https://www.googleapis.com/oauth2/v2/userinfo',
			{
				headers: {
					Authorization: `Bearer ${accessToken}`,
				},
			},
		);

		if (!response.ok) {
			throw new Error('Failed to get user info');
		}

		return response.json();
	}

	/**
	 * Refresh access token using refresh token
	 */
	async refreshAccessToken(refreshToken: string) {
		this.oauth2Client.setCredentials({ refresh_token: refreshToken });
		const { credentials } = await this.oauth2Client.refreshAccessToken();
		return credentials;
	}

	/**
	 * Open Google authentication window
	 */
	async authenticate(): Promise<{ tokens: any; userInfo: any }> {
		return new Promise((resolve, reject) => {
			const authUrl = this.getAuthUrl();

			// Create a new window for authentication
			const authWindow = new BrowserWindow({
				width: 500,
				height: 600,
				webPreferences: {
					nodeIntegration: false,
					contextIsolation: true,
				},
			});

			authWindow.loadURL(authUrl);

			// Handle the redirect
			authWindow.webContents.on('will-redirect', async (event, url) => {
				if (url.startsWith(REDIRECT_URI)) {
					event.preventDefault();

					const urlParts = new URL(url);
					const code = urlParts.searchParams.get('code');

					if (code) {
						try {
							// Exchange code for tokens
							const tokens = await this.getTokens(code);

							// Get user info
							const userInfo = await this.getUserInfo(tokens.access_token!);

							authWindow.close();
							resolve({ tokens, userInfo });
						} catch (error) {
							authWindow.close();
							reject(error);
						}
					} else {
						authWindow.close();
						reject(new Error('No authorization code received'));
					}
				}
			});

			// Handle window closed
			authWindow.on('closed', () => {
				reject(new Error('Authentication window was closed'));
			});
		});
	}

	/**
	 * Validate and refresh token if needed
	 */
	async validateToken(
		accessToken: string,
		refreshToken: string,
	): Promise<string> {
		try {
			// Try to use the access token
			await this.getUserInfo(accessToken);
			return accessToken;
		} catch (error) {
			// Token might be expired, try to refresh
			if (refreshToken) {
				const credentials = await this.refreshAccessToken(refreshToken);
				return credentials.access_token!;
			}
			throw new Error('Token validation failed');
		}
	}
}

export const googleAuth = new GoogleAuth();

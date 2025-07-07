import { ipcMain } from 'electron';
import { googleAuth } from '../auth/googleAuth';
import { db } from '../database/connection';
import { users, mailAccounts } from '../database/schema';
import { googleAuthProviders } from '../database/googleAuth.schema';
import { eq } from 'drizzle-orm';

export const setupGoogleAuthHandlers = () => {
  // Authenticate with Google
  ipcMain.handle('google:authenticate', async () => {
    try {
      const { tokens, userInfo } = await googleAuth.authenticate();
      return { success: true, data: { tokens, userInfo } };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // Link Google account to user
  ipcMain.handle('google:link-account', async (_, { userId, tokens, userInfo }) => {
    try {
      // Save Google auth provider info
      await db.insert(googleAuthProviders).values({
        userId,
        googleId: userInfo.id,
        email: userInfo.email,
        name: userInfo.name,
        picture: userInfo.picture,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        tokenExpiry: new Date(Date.now() + tokens.expiry_date),
      }).onConflictDoUpdate({
        target: googleAuthProviders.userId,
        set: {
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          tokenExpiry: new Date(Date.now() + tokens.expiry_date),
          updatedAt: new Date(),
        },
      });

      // Create mail account for Gmail
      await db.insert(mailAccounts).values({
        userId: parseInt(userId),
        name: `Gmail - ${userInfo.email}`,
        email: userInfo.email,
        provider: 'gmail',
        imapHost: 'imap.gmail.com',
        imapPort: 993,
        imapSecure: true,
        smtpHost: 'smtp.gmail.com',
        smtpPort: 587,
        smtpSecure: true,
        username: userInfo.email,
        password: '', // Not needed for OAuth
        oauthAccessToken: tokens.access_token,
        oauthRefreshToken: tokens.refresh_token,
        oauthTokenExpiry: new Date(Date.now() + tokens.expiry_date),
      });

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // Get linked Google accounts
  ipcMain.handle('google:get-linked-accounts', async (_, userId) => {
    try {
      const accounts = await db.select()
        .from(mailAccounts)
        .where(eq(mailAccounts.userId, userId))
        .where(eq(mailAccounts.provider, 'gmail'));

      return { success: true, data: accounts };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // Refresh Google token
  ipcMain.handle('google:refresh-token', async (_, accountId) => {
    try {
      const account = await db.select()
        .from(mailAccounts)
        .where(eq(mailAccounts.id, accountId))
        .limit(1);

      if (!account[0] || !account[0].oauthRefreshToken) {
        throw new Error('Account not found or no refresh token');
      }

      const newTokens = await googleAuth.refreshAccessToken(account[0].oauthRefreshToken);
      
      await db.update(mailAccounts)
        .set({
          oauthAccessToken: newTokens.access_token,
          oauthTokenExpiry: new Date(Date.now() + newTokens.expiry_date!),
          updatedAt: new Date(),
        })
        .where(eq(mailAccounts.id, accountId));

      return { success: true, data: newTokens };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });
};

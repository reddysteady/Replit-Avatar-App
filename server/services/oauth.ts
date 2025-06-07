/**
 * OAuth service for handling Instagram authentication
 */
import axios from 'axios';
import { storage } from '../storage';
import { log } from '../logger';

interface InstagramTokenResponse {
  access_token: string;
  user_id: string;
}

interface InstagramUserProfileResponse {
  id: string;
  username: string;
  account_type: string;
  media_count: number;
  name?: string;
  profile_picture_url?: string;
}

export class OAuthService {
  private instagramOAuthUrl = 'https://api.instagram.com/oauth/access_token';
  private instagramGraphUrl = 'https://graph.instagram.com';
  
  /**
   * Exchange authorization code for access token (Instagram)
   */
  async exchangeInstagramCode(code: string, redirectUri: string, clientId: string, clientSecret: string): Promise<InstagramTokenResponse> {
    try {
      log('Exchanging Instagram authorization code for access token');
      
      const formData = new URLSearchParams();
      formData.append('client_id', clientId);
      formData.append('client_secret', clientSecret);
      formData.append('grant_type', 'authorization_code');
      formData.append('redirect_uri', redirectUri);
      formData.append('code', code);
      
      const response = await axios.post(this.instagramOAuthUrl, formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });
      
      log('Instagram token exchange successful');
      
      return {
        access_token: response.data.access_token,
        user_id: response.data.user_id
      };
    } catch (error: any) {
      console.error('Error exchanging Instagram code for token:', error.message);
      throw new Error(`Failed to exchange Instagram authorization code: ${error.message}`);
    }
  }
  
  /**
   * Exchange short-lived token for long-lived token (Instagram)
   */
  async getLongLivedToken(shortLivedToken: string, clientSecret: string): Promise<string> {
    try {
      log('Exchanging short-lived token for long-lived token');
      
      const response = await axios.get(
        `${this.instagramGraphUrl}/access_token?grant_type=ig_exchange_token&client_secret=${clientSecret}&access_token=${shortLivedToken}`
      );
      
      log('Successfully exchanged for long-lived token');
      return response.data.access_token;
    } catch (error: any) {
      console.error('Error getting long-lived Instagram token:', error.message);
      throw new Error(`Failed to get long-lived Instagram token: ${error.message}`);
    }
  }
  
  /**
   * Get Instagram user profile information
   */
  async getInstagramUserProfile(accessToken: string): Promise<InstagramUserProfileResponse> {
    try {
      log('Getting Instagram user profile');
      
      const response = await axios.get(
        `${this.instagramGraphUrl}/me?fields=id,username,account_type,media_count&access_token=${accessToken}`
      );
      
      log('Successfully retrieved Instagram profile');
      return response.data;
    } catch (error: any) {
      console.error('Error getting Instagram user profile:', error.message);
      throw new Error(`Failed to get Instagram user profile: ${error.message}`);
    }
  }
  
  /**
   * Complete Instagram authentication flow and save credentials
   */
  async completeInstagramAuth(
    code: string, 
    redirectUri: string, 
    clientId: string, 
    clientSecret: string,
    userId: number
  ) {
    try {
      // Exchange code for token
      const tokenData = await this.exchangeInstagramCode(
        code, 
        redirectUri, 
        clientId, 
        clientSecret
      );
      
      // Get long-lived token
      const longLivedToken = await this.getLongLivedToken(
        tokenData.access_token, 
        clientSecret
      );
      
      // Get user profile
      const profile = await this.getInstagramUserProfile(longLivedToken);
      
      // Get current settings
      const settings = await storage.getSettings(userId);
      
      // Update settings with Instagram credentials
      const updatedSettings = await storage.updateSettings(userId, {
        apiKeys: {
          ...(settings.apiKeys as any),
          instagram: longLivedToken,
          instagramUserId: profile.id,
        }
      });
      
      return {
        success: true,
        profile,
        settings: updatedSettings
      };
    } catch (error: any) {
      console.error('Error completing Instagram auth flow:', error.message);
      throw new Error(`Authentication failed: ${error.message}`);
    }
  }
}

export const oauthService = new OAuthService();

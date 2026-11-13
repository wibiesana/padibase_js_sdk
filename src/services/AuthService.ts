import { BaseService } from './BaseService.js';
import type { SendOptions, RecordAuthResponse, RecordModel } from '../types.js';

/**
 * AuthService provides convenient shortcuts to PadiBase default auth endpoints (/api/auth/*)
 * which operate on the default 'users' collection.
 */
export class AuthService extends BaseService {
  /**
   * Log in with email/username and password.
   * On success, the token and user record are automatically stored in padi.authStore.
   */
  async login<T = RecordModel>(
    identity: string,
    password: string,
    options: SendOptions = {}
  ): Promise<RecordAuthResponse<T>> {
    const res = await this.client.send<RecordAuthResponse<T>>('/api/auth/login', {
      method: 'POST',
      body: {
        identity,
        email: identity,
        username: identity,
        password,
      },
      ...options,
    });

    if (res && res.token) {
      this.client.authStore.save(res.token, res.record);
    }

    return res;
  }

  /**
   * Register a new user account.
   */
  async register<T = RecordModel>(
    data: Record<string, any>,
    options: SendOptions = {}
  ): Promise<RecordAuthResponse<T> | T> {
    const res = await this.client.send<any>('/api/auth/register', {
      method: 'POST',
      body: data,
      ...options,
    });

    if (res && res.token && res.record) {
      this.client.authStore.save(res.token, res.record);
    }

    return res;
  }

  /**
   * Get the current authenticated user's profile.
   */
  async getProfile<T = RecordModel>(options: SendOptions = {}): Promise<T> {
    const res = await this.client.send<any>('/api/auth/me', {
      method: 'GET',
      ...options,
    });
    return res.record || res;
  }

  /**
   * Update the current authenticated user's profile.
   */
  async updateProfile<T = RecordModel>(
    data: Record<string, any>,
    options: SendOptions = {}
  ): Promise<T> {
    const res = await this.client.send<any>('/api/auth/me', {
      method: 'PATCH',
      body: data,
      ...options,
    });
    const updated = res.record || res;
    if (this.client.authStore.isValid && updated) {
      this.client.authStore.save(this.client.authStore.token, updated);
    }
    return updated;
  }

  /**
   * Refresh the active session token and user profile.
   */
  async refresh<T = RecordModel>(options: SendOptions = {}): Promise<RecordAuthResponse<T>> {
    const res = await this.client.send<RecordAuthResponse<T>>('/api/auth/refresh', {
      method: 'POST',
      ...options,
    });

    if (res && res.token) {
      this.client.authStore.save(res.token, res.record);
    }

    return res;
  }

  /**
   * Change password for the current authenticated user.
   */
  async changePassword(
    oldPassword: string,
    newPassword: string,
    passwordConfirm?: string,
    options: SendOptions = {}
  ): Promise<any> {
    return this.client.send('/api/auth/change-password', {
      method: 'POST',
      body: {
        oldPassword,
        newPassword,
        passwordConfirm: passwordConfirm || newPassword,
      },
      ...options,
    });
  }

  /**
   * Request password reset email.
   */
  async requestPasswordReset(email: string, options: SendOptions = {}): Promise<any> {
    return this.client.send('/api/auth/forgot-password', {
      method: 'POST',
      body: { email, identity: email },
      ...options,
    });
  }

  /**
   * Confirm password reset with token.
   */
  async confirmPasswordReset(
    token: string,
    password: string,
    passwordConfirm?: string,
    options: SendOptions = {}
  ): Promise<any> {
    return this.client.send('/api/auth/reset-password', {
      method: 'POST',
      body: {
        token,
        password,
        newPassword: password,
        passwordConfirm: passwordConfirm || password,
      },
      ...options,
    });
  }

  /**
   * Request verification email.
   */
  async requestVerification(email: string, options: SendOptions = {}): Promise<any> {
    return this.client.send('/api/auth/request-verification', {
      method: 'POST',
      body: { email, identity: email },
      ...options,
    });
  }

  /**
   * Confirm email verification with token.
   */
  async confirmVerification(token: string, options: SendOptions = {}): Promise<any> {
    return this.client.send('/api/auth/confirm-verification', {
      method: 'POST',
      body: { token },
      ...options,
    });
  }

  /**
   * Log out the current user and clear local auth store.
   */
  async logout(options: SendOptions = {}): Promise<void> {
    try {
      await this.client.send('/api/auth/logout', {
        method: 'POST',
        ...options,
      });
    } catch {
      // Best effort
    } finally {
      this.client.authStore.clear();
    }
  }
}


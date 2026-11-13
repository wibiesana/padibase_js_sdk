import { BaseService } from './BaseService.js';
import type { SendOptions, AdminAuthResponse, AdminModel } from '../types.js';

export class AdminService extends BaseService {
  /**
   * Check if any administrator accounts exist in the system.
   */
  async hasAdmins(options: SendOptions = {}): Promise<boolean> {
    const res = await this.client.send<{ hasAdmins: boolean }>('/api/admins/has-admins', {
      method: 'GET',
      ...options,
    });
    return !!res?.hasAdmins;
  }

  /**
   * Authenticate as an administrator.
   * On success, the admin token is saved into client.authStore.
   */
  async authWithPassword(
    identity: string,
    password: string,
    options: SendOptions = {}
  ): Promise<AdminAuthResponse> {
    const res = await this.client.send<AdminAuthResponse>('/api/admins/auth-with-password', {
      method: 'POST',
      body: { identity, password },
      ...options,
    });

    if (res && res.token) {
      this.client.authStore.save(res.token, res.admin);
    }

    return res;
  }

  /**
   * List all administrator accounts (Superuser only).
   */
  async list(options: SendOptions = {}): Promise<{ items: AdminModel[]; totalItems: number }> {
    return this.client.send('/api/admins', {
      method: 'GET',
      ...options,
    });
  }

  /**
   * Create a new administrator account (Superuser only, or first run bootstrap).
   */
  async create(email: string, password: string, options: SendOptions = {}): Promise<AdminModel> {
    return this.client.send<AdminModel>('/api/admins', {
      method: 'POST',
      body: { email, password },
      ...options,
    });
  }

  /**
   * Delete an administrator account by ID.
   */
  async delete(id: string, options: SendOptions = {}): Promise<boolean> {
    await this.client.send(`/api/admins/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      ...options,
    });
    return true;
  }

  /**
   * Get system settings (Superuser only).
   */
  async getSettings(options: SendOptions = {}): Promise<Record<string, any>> {
    return this.client.send('/api/settings', {
      method: 'GET',
      ...options,
    });
  }

  /**
   * Update system settings (Superuser only).
   */
  async updateSettings(settings: Record<string, any>, options: SendOptions = {}): Promise<any> {
    return this.client.send('/api/settings', {
      method: 'PATCH',
      body: settings,
      ...options,
    });
  }

  /**
   * Send a test email using configured SMTP settings.
   */
  async testEmail(to: string, options: SendOptions = {}): Promise<any> {
    return this.client.send('/api/settings/test-email', {
      method: 'POST',
      body: { to },
      ...options,
    });
  }
}


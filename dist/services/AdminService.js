import { BaseService } from './BaseService.js';
export class AdminService extends BaseService {
    /**
     * Check if any administrator accounts exist in the system.
     */
    async hasAdmins(options = {}) {
        const res = await this.client.send('/api/admins/has-admins', {
            method: 'GET',
            ...options,
        });
        return !!res?.hasAdmins;
    }
    /**
     * Authenticate as an administrator.
     * On success, the admin token is saved into client.authStore.
     */
    async authWithPassword(identity, password, options = {}) {
        const res = await this.client.send('/api/admins/auth-with-password', {
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
    async list(options = {}) {
        return this.client.send('/api/admins', {
            method: 'GET',
            ...options,
        });
    }
    /**
     * Create a new administrator account (Superuser only, or first run bootstrap).
     */
    async create(email, password, options = {}) {
        return this.client.send('/api/admins', {
            method: 'POST',
            body: { email, password },
            ...options,
        });
    }
    /**
     * Delete an administrator account by ID.
     */
    async delete(id, options = {}) {
        await this.client.send(`/api/admins/${encodeURIComponent(id)}`, {
            method: 'DELETE',
            ...options,
        });
        return true;
    }
    /**
     * Get system settings (Superuser only).
     */
    async getSettings(options = {}) {
        return this.client.send('/api/settings', {
            method: 'GET',
            ...options,
        });
    }
    /**
     * Update system settings (Superuser only).
     */
    async updateSettings(settings, options = {}) {
        return this.client.send('/api/settings', {
            method: 'PATCH',
            body: settings,
            ...options,
        });
    }
    /**
     * Send a test email using configured SMTP settings.
     */
    async testEmail(to, options = {}) {
        return this.client.send('/api/settings/test-email', {
            method: 'POST',
            body: { to },
            ...options,
        });
    }
}
//# sourceMappingURL=AdminService.js.map
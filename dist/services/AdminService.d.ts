import { BaseService } from './BaseService.js';
import type { SendOptions, AdminAuthResponse, AdminModel } from '../types.js';
export declare class AdminService extends BaseService {
    /**
     * Check if any administrator accounts exist in the system.
     */
    hasAdmins(options?: SendOptions): Promise<boolean>;
    /**
     * Authenticate as an administrator.
     * On success, the admin token is saved into client.authStore.
     */
    authWithPassword(identity: string, password: string, options?: SendOptions): Promise<AdminAuthResponse>;
    /**
     * List all administrator accounts (Superuser only).
     */
    list(options?: SendOptions): Promise<{
        items: AdminModel[];
        totalItems: number;
    }>;
    /**
     * Create a new administrator account (Superuser only, or first run bootstrap).
     */
    create(email: string, password: string, options?: SendOptions): Promise<AdminModel>;
    /**
     * Delete an administrator account by ID.
     */
    delete(id: string, options?: SendOptions): Promise<boolean>;
    /**
     * Get system settings (Superuser only).
     */
    getSettings(options?: SendOptions): Promise<Record<string, any>>;
    /**
     * Update system settings (Superuser only).
     */
    updateSettings(settings: Record<string, any>, options?: SendOptions): Promise<any>;
    /**
     * Send a test email using configured SMTP settings.
     */
    testEmail(to: string, options?: SendOptions): Promise<any>;
}
//# sourceMappingURL=AdminService.d.ts.map
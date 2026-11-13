import { BaseService } from './BaseService.js';
import type { SendOptions, RecordAuthResponse, RecordModel } from '../types.js';
/**
 * AuthService provides convenient shortcuts to PadiBase default auth endpoints (/api/auth/*)
 * which operate on the default 'users' collection.
 */
export declare class AuthService extends BaseService {
    /**
     * Log in with email/username and password.
     * On success, the token and user record are automatically stored in padi.authStore.
     */
    login<T = RecordModel>(identity: string, password: string, options?: SendOptions): Promise<RecordAuthResponse<T>>;
    /**
     * Register a new user account.
     */
    register<T = RecordModel>(data: Record<string, any>, options?: SendOptions): Promise<RecordAuthResponse<T> | T>;
    /**
     * Get the current authenticated user's profile.
     */
    getProfile<T = RecordModel>(options?: SendOptions): Promise<T>;
    /**
     * Update the current authenticated user's profile.
     */
    updateProfile<T = RecordModel>(data: Record<string, any>, options?: SendOptions): Promise<T>;
    /**
     * Refresh the active session token and user profile.
     */
    refresh<T = RecordModel>(options?: SendOptions): Promise<RecordAuthResponse<T>>;
    /**
     * Change password for the current authenticated user.
     */
    changePassword(oldPassword: string, newPassword: string, passwordConfirm?: string, options?: SendOptions): Promise<any>;
    /**
     * Request password reset email.
     */
    requestPasswordReset(email: string, options?: SendOptions): Promise<any>;
    /**
     * Confirm password reset with token.
     */
    confirmPasswordReset(token: string, password: string, passwordConfirm?: string, options?: SendOptions): Promise<any>;
    /**
     * Request verification email.
     */
    requestVerification(email: string, options?: SendOptions): Promise<any>;
    /**
     * Confirm email verification with token.
     */
    confirmVerification(token: string, options?: SendOptions): Promise<any>;
    /**
     * Log out the current user and clear local auth store.
     */
    logout(options?: SendOptions): Promise<void>;
}
//# sourceMappingURL=AuthService.d.ts.map
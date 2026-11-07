/**
 * Custom error thrown on failed HTTP requests in PadiBase SDK
 */
export declare class ClientResponseError extends Error {
    readonly url: string;
    readonly status: number;
    readonly response: any;
    readonly data: any;
    readonly isAbort: boolean;
    readonly originalError?: any;
    constructor(errData?: any);
    toJSON(): {
        url: string;
        status: number;
        data: any;
        response: any;
        message: string;
        isAbort: boolean;
    };
}
//# sourceMappingURL=ClientResponseError.d.ts.map
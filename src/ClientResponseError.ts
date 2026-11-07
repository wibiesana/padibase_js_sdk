/**
 * Custom error thrown on failed HTTP requests in PadiBase SDK
 */
export class ClientResponseError extends Error {
  readonly url: string;
  readonly status: number;
  readonly response: any;
  readonly data: any;
  readonly isAbort: boolean;
  readonly originalError?: any;

  constructor(errData?: any) {
    let message = 'Something went wrong while processing the request.';

    if (errData?.message) {
      message = errData.message;
    } else if (errData?.data?.message) {
      message = errData.data.message;
    } else if (typeof errData?.originalError?.message === 'string') {
      message = errData.originalError.message;
    }

    super(message);
    this.name = 'ClientResponseError';
    this.url = errData?.url || '';
    this.status = errData?.status || 0;
    this.response = errData?.response || {};
    this.data = errData?.data || (errData?.response && typeof errData.response === 'object' ? errData.response : {});
    this.isAbort = !!errData?.isAbort;
    this.originalError = errData?.originalError;

    // Maintain proper prototype chain
    Object.setPrototypeOf(this, ClientResponseError.prototype);
  }

  toJSON() {
    return {
      url: this.url,
      status: this.status,
      data: this.data,
      response: this.response,
      message: this.message,
      isAbort: this.isAbort,
    };
  }
}

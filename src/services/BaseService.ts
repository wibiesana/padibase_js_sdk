import type { PadiBase } from '../PadiBase.js';

export abstract class BaseService {
  readonly client: PadiBase;

  constructor(client: PadiBase) {
    this.client = client;
  }
}

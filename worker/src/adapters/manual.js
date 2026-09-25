// ============================================================
// beacon121 - Manual Adapter
// Accepts a listing provided directly by a user.
// ============================================================

import { BaseAdapter } from './base.js';

export class ManualAdapter extends BaseAdapter {
  constructor() {
    super('manual');
  }

  /**
   * Validation specific to manual entry.
   * At minimum we need an address and a source_listing_id.
   */
  validate(input) {
    super.validate(input);
    if (!input.address_full) throw new Error('address_full is required');
    if (!input.source_listing_id) throw new Error('source_listing_id is required');
    return true;
  }

  /**
   * Return the raw listing. For manual input, no fetching is needed.
   * We only add the source_key and a timestamp.
   */
  async fetchOne(input) {
    this.validate(input);
    return {
      ...input,
      source_key: this.key,
      listed_at: input.listed_at || new Date().toISOString(),
    };
  }
}
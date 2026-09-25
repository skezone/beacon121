// ============================================================
// beacon121 - Base Adapter
// Every listing source adapter must implement this interface.
// ============================================================

/**
 * BaseAdapter defines the contract for all listing sources.
 * Do not instantiate directly. Extend or follow the same shape.
 *
 * Required:
 *   key         - the source_key (must match sources table)
 *   fetchOne()  - returns one raw listing object, or null
 *
 * Optional:
 *   validate()  - checks raw input before normalization
 */
export class BaseAdapter {
  constructor(key) {
    if (!key) throw new Error('Adapter requires a source_key');
    this.key = key;
  }

  /**
   * Return one raw listing. Adapters that fetch from an API should
   * implement their own logic here. Manual adapter receives input.
   */
  async fetchOne(_input) {
    throw new Error(`Adapter "${this.key}" did not implement fetchOne()`);
  }

  /**
   * Validate raw input. Default: input must be an object.
   */
  validate(input) {
    if (!input || typeof input !== 'object') {
      throw new Error('Input must be an object');
    }
    return true;
  }
}
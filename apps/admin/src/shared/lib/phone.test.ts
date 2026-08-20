import { describe, expect, it } from 'vitest';

import { formatPhoneForDisplay, normalizePhone } from '@/shared/lib/phone';

describe('phone formatting', () => {
  it('normalizes separators and Persian digits to the canonical stored value', () => {
    expect(normalizePhone(' ۰۹۱۲-۳۴۱ ۵۶۷۸ ')).toBe('09123415678');
  });

  it('formats an Iranian mobile without changing its canonical value', () => {
    const phone = '09123415678';
    expect(formatPhoneForDisplay(phone)).toBe('0912-341-5678');
    expect(phone).toBe('09123415678');
  });
});

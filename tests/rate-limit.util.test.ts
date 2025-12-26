/**
 * Unit Tests for Rate Limiting Utility Functions
 * Tests the helper functions without making actual Redis calls
 */

import { describe, it, expect } from 'vitest';
import { getClientIp, formatTimeRemaining } from '@/lib/rate-limit';

describe('Rate Limit Utility Functions', () => {
  describe('getClientIp', () => {
    it('should extract IP from x-forwarded-for header', () => {
      const mockRequest = {
        headers: {
          get: (key: string) => {
            if (key === 'x-forwarded-for') return '192.168.1.1, 10.0.0.1';
            return null;
          },
        },
      } as unknown as Request;

      const ip = getClientIp(mockRequest);
      expect(ip).toBe('192.168.1.1');
    });

    it('should extract IP from cf-connecting-ip header when x-forwarded-for is not available', () => {
      const mockRequest = {
        headers: {
          get: (key: string) => {
            if (key === 'cf-connecting-ip') return '192.168.1.2';
            return null;
          },
        },
      } as unknown as Request;

      const ip = getClientIp(mockRequest);
      expect(ip).toBe('192.168.1.2');
    });

    it('should extract IP from x-real-ip header when others are not available', () => {
      const mockRequest = {
        headers: {
          get: (key: string) => {
            if (key === 'x-real-ip') return '192.168.1.3';
            return null;
          },
        },
      } as unknown as Request;

      const ip = getClientIp(mockRequest);
      expect(ip).toBe('192.168.1.3');
    });

    it('should return "unknown" when no IP headers are present', () => {
      const mockRequest = {
        headers: {
          get: () => null,
        },
      } as unknown as Request;

      const ip = getClientIp(mockRequest);
      expect(ip).toBe('unknown');
    });

    it('should handle multiple IPs in x-forwarded-for and take the first one', () => {
      const mockRequest = {
        headers: {
          get: (key: string) => {
            if (key === 'x-forwarded-for') return '  203.0.113.1  , 198.51.100.1, 192.0.2.1';
            return null;
          },
        },
      } as unknown as Request;

      const ip = getClientIp(mockRequest);
      expect(ip).toBe('203.0.113.1');
    });
  });

  describe('formatTimeRemaining', () => {
    it('should format seconds correctly (singular)', () => {
      expect(formatTimeRemaining(1000)).toBe('1 second');
    });

    it('should format seconds correctly (plural)', () => {
      expect(formatTimeRemaining(5000)).toBe('5 seconds');
      expect(formatTimeRemaining(30000)).toBe('30 seconds');
    });

    it('should round up partial seconds', () => {
      expect(formatTimeRemaining(1500)).toBe('2 seconds');
      expect(formatTimeRemaining(1100)).toBe('2 seconds');
    });

    it('should format minutes correctly (singular)', () => {
      expect(formatTimeRemaining(60000)).toBe('1 minute');
    });

    it('should format minutes correctly (plural)', () => {
      expect(formatTimeRemaining(120000)).toBe('2 minutes');
      expect(formatTimeRemaining(300000)).toBe('5 minutes');
    });

    it('should round up to minutes when >= 60 seconds', () => {
      expect(formatTimeRemaining(90000)).toBe('2 minutes'); // 1.5 minutes -> 2 minutes
      expect(formatTimeRemaining(61000)).toBe('2 minutes'); // 1.01 minutes -> 2 minutes
    });

    it('should handle 15 minutes (auth rate limit window)', () => {
      expect(formatTimeRemaining(900000)).toBe('15 minutes');
    });

    it('should handle very small values', () => {
      expect(formatTimeRemaining(1)).toBe('1 second');
      expect(formatTimeRemaining(100)).toBe('1 second');
      expect(formatTimeRemaining(999)).toBe('1 second');
    });
  });
});


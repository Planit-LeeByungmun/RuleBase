import { hashPassword, comparePassword, validatePassword } from './password';

describe('password utils', () => {
  describe('validatePassword', () => {
    it('accepts valid password with letters, digits, and special chars', () => {
      expect(validatePassword('Password1!')).toBe(true);
    });

    it('rejects password without digits', () => {
      expect(validatePassword('Password!')).toBe(false);
    });

    it('rejects password without letters', () => {
      expect(validatePassword('12345678!')).toBe(false);
    });

    it('rejects password without special characters', () => {
      expect(validatePassword('Password1')).toBe(false);
    });

    it('rejects password shorter than 8 characters', () => {
      expect(validatePassword('Pa1!')).toBe(false);
    });

    it('accepts minimum valid password', () => {
      expect(validatePassword('Abcdef1!')).toBe(true);
    });
  });

  describe('hashPassword / comparePassword', () => {
    it('hashes and correctly compares password', async () => {
      const hash = await hashPassword('TestPass1!');
      expect(hash).not.toBe('TestPass1!');
      expect(await comparePassword('TestPass1!', hash)).toBe(true);
    });

    it('rejects wrong password', async () => {
      const hash = await hashPassword('TestPass1!');
      expect(await comparePassword('WrongPass1!', hash)).toBe(false);
    });
  });
});

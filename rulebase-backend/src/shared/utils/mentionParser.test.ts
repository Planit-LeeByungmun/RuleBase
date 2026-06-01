import { extractMentions } from './mentionParser';

describe('extractMentions', () => {
  it('extracts single mention', () => {
    expect(extractMentions('Hello @john')).toEqual(['john']);
  });

  it('extracts multiple mentions', () => {
    expect(extractMentions('@alice and @bob')).toEqual(['alice', 'bob']);
  });

  it('returns empty array when no mentions', () => {
    expect(extractMentions('no mentions here')).toEqual([]);
  });

  it('deduplicates mentions', () => {
    expect(extractMentions('@alice @bob @alice')).toEqual(['alice', 'bob']);
  });

  it('handles underscores in usernames', () => {
    expect(extractMentions('@user_name')).toEqual(['user_name']);
  });

  it('handles mentions with numbers', () => {
    expect(extractMentions('@user123')).toEqual(['user123']);
  });

  it('returns empty array for empty string', () => {
    expect(extractMentions('')).toEqual([]);
  });

  it('handles @ at start of text', () => {
    expect(extractMentions('@admin please check')).toEqual(['admin']);
  });
});

import { describe, it, expect } from 'vitest';
import { TESTS, STAGE_GROUPS } from '../../src/stages/index.js';

describe('stages registry', () => {
  it('every stage exposes id, icon, name, instruction, and run()', () => {
    TESTS.forEach((t) => {
      expect(typeof t.id).toBe('string');
      expect(typeof t.icon).toBe('string');
      expect(typeof t.name).toBe('string');
      expect(typeof t.instruction).toBe('string');
      expect(typeof t.run).toBe('function');
    });
  });

  it('stage ids are unique', () => {
    const ids = TESTS.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every id referenced by STAGE_GROUPS exists in TESTS', () => {
    const knownIds = new Set(TESTS.map((t) => t.id));
    STAGE_GROUPS.flatMap((g) => g.ids).forEach((id) => {
      expect(knownIds, `unknown id in STAGE_GROUPS: ${id}`).toContain(id);
    });
  });

  it('every TESTS id appears in some STAGE_GROUPS entry', () => {
    const groupIds = new Set(STAGE_GROUPS.flatMap((g) => g.ids));
    TESTS.forEach((t) => {
      expect(groupIds, `${t.id} is missing from STAGE_GROUPS`).toContain(t.id);
    });
  });

  it('STAGE_GROUPS flattens to the same order as TESTS', () => {
    const flatGroupIds = STAGE_GROUPS.flatMap((g) => g.ids);
    expect(flatGroupIds).toEqual(TESTS.map((t) => t.id));
  });
});

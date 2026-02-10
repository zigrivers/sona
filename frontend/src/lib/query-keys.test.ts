import { describe, expect, it } from 'vitest';

import { queryKeys } from './query-keys';

describe('queryKeys.clones', () => {
  it('list() returns clones list key', () => {
    expect(queryKeys.clones.list()).toEqual(['clones', 'list', undefined]);
  });

  it('list(filters) includes filters in key', () => {
    const filters = { search: 'test' };
    expect(queryKeys.clones.list(filters)).toEqual(['clones', 'list', filters]);
  });

  it('detail(id) returns clones detail key', () => {
    expect(queryKeys.clones.detail('abc')).toEqual(['clones', 'detail', 'abc']);
  });
});

describe('queryKeys.content', () => {
  it('list() returns content list key', () => {
    expect(queryKeys.content.list()).toEqual(['content', 'list', undefined]);
  });

  it('detail(id) returns content detail key', () => {
    expect(queryKeys.content.detail('xyz')).toEqual(['content', 'detail', 'xyz']);
  });
});

describe('queryKeys.samples', () => {
  it('list(cloneId) returns samples list key with clone scope', () => {
    expect(queryKeys.samples.list('clone-1')).toEqual(['samples', 'list', 'clone-1']);
  });
});

describe('queryKeys.dna', () => {
  it('detail(cloneId) returns dna detail key', () => {
    expect(queryKeys.dna.detail('clone-1')).toEqual(['dna', 'detail', 'clone-1']);
  });
});

describe('queryKeys.methodology', () => {
  it('all() returns methodology base key', () => {
    expect(queryKeys.methodology.all()).toEqual(['methodology']);
  });

  it('section(key) returns methodology section key', () => {
    expect(queryKeys.methodology.section('voice_cloning')).toEqual([
      'methodology',
      'voice_cloning',
    ]);
  });

  it('versions(key) returns methodology versions key', () => {
    expect(queryKeys.methodology.versions('voice_cloning')).toEqual([
      'methodology',
      'voice_cloning',
      'versions',
    ]);
  });
});

describe('queryKeys.providers', () => {
  it('all() returns providers base key', () => {
    expect(queryKeys.providers.all()).toEqual(['providers']);
  });
});

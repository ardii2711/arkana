import { describe, expect, it } from 'vitest';

import {
  MAX_FOLDER_LEVEL,
  descendantIds,
  folderLevel,
  subtreeHeight,
} from '../../src/modules/archive/archive-folders.rules';

// root -> anak -> cucu -> cicit
const folders = [
  { id: 'root', parentId: null },
  { id: 'anak', parentId: 'root' },
  { id: 'cucu', parentId: 'anak' },
  { id: 'cicit', parentId: 'cucu' },
];

describe('folderLevel', () => {
  it('menghitung level folder dari akar', () => {
    expect(folderLevel(folders, 'root')).toBe(1);
    expect(folderLevel(folders, 'anak')).toBe(2);
    expect(folderLevel(folders, 'cucu')).toBe(3);
  });

  it('mengembalikan 0 untuk arsip utama', () => {
    expect(folderLevel(folders, null)).toBe(0);
  });

  it('mengembalikan null untuk folder yang tidak dikenal', () => {
    expect(folderLevel(folders, 'hilang')).toBeNull();
  });

  it('memakai batas kedalaman 3 level', () => {
    expect(MAX_FOLDER_LEVEL).toBe(3);
    expect(folderLevel(folders, 'cicit')).toBe(4);
    expect(folderLevel(folders, 'cicit')!).toBeGreaterThan(MAX_FOLDER_LEVEL);
  });
});

describe('descendantIds', () => {
  it('memuat folder itu sendiri beserta seluruh turunannya', () => {
    expect(descendantIds(folders, 'root').sort()).toEqual(['anak', 'cicit', 'cucu', 'root']);
    expect(descendantIds(folders, 'cucu').sort()).toEqual(['cicit', 'cucu']);
  });

  it('mengembalikan hanya folder itu sendiri bila tidak punya anak', () => {
    expect(descendantIds(folders, 'cicit')).toEqual(['cicit']);
  });
});

describe('subtreeHeight', () => {
  it('mengukur tinggi subtree dari folder terpilih', () => {
    expect(subtreeHeight(folders, 'root')).toBe(4);
    expect(subtreeHeight(folders, 'anak')).toBe(3);
    expect(subtreeHeight(folders, 'cicit')).toBe(1);
  });
});

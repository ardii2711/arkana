import assert from 'node:assert/strict';

import {
  MAX_FOLDER_LEVEL,
  descendantIds,
  folderLevel,
  subtreeHeight,
  type FolderNode,
} from '../src/modules/archive/archive-folders.rules.js';

const folders: FolderNode[] = [
  { id: 'a', parentId: null },
  { id: 'b', parentId: 'a' },
  { id: 'c', parentId: 'b' },
  { id: 'x', parentId: null },
];

assert.equal(MAX_FOLDER_LEVEL, 3);

assert.equal(folderLevel(folders, null), 0);
assert.equal(folderLevel(folders, 'a'), 1);
assert.equal(folderLevel(folders, 'c'), 3);
assert.equal(folderLevel(folders, 'missing'), null);

assert.equal(subtreeHeight(folders, 'a'), 3);
assert.equal(subtreeHeight(folders, 'b'), 2);
assert.equal(subtreeHeight(folders, 'x'), 1);

assert.deepEqual(descendantIds(folders, 'a').sort(), ['a', 'b', 'c']);
assert.deepEqual(descendantIds(folders, 'x'), ['x']);

const levelOfNewChild = folderLevel(folders, 'c')! + 1;
assert.equal(levelOfNewChild > MAX_FOLDER_LEVEL, true);

const movingSubtree = folderLevel(folders, 'x')! + subtreeHeight(folders, 'a');
assert.equal(movingSubtree > MAX_FOLDER_LEVEL, true);

assert.equal(descendantIds(folders, 'a').includes('c'), true);
assert.equal(descendantIds(folders, 'x').includes('a'), false);

console.log('archive folder rules: OK');

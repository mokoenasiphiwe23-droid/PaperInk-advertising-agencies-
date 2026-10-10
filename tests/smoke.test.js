import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';

const requiredPaths = [
  'README.md',
  'LICENSE',
  '.gitignore',
  'docs',
  'src',
  'tests'
];

test('initial project structure exists', () => {
  for (const path of requiredPaths) {
    assert.equal(existsSync(path), true, `${path} should exist`);
  }
});

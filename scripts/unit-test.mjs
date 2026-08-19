import assert from 'node:assert/strict';
import test from 'node:test';

function parseSetsReps(raw) {
  const trimmed = raw?.trim() ?? '';
  if (!trimmed || trimmed === '*') return { sets: '', reps: '' };
  const star = trimmed.indexOf('*');
  if (star >= 0) {
    return {
      sets: digits(trimmed.slice(0, star)),
      reps: digits(trimmed.slice(star + 1)),
    };
  }
  const crossed = trimmed.match(/^(\d+)\s*[xX×]\s*(.+)$/);
  if (crossed) return { sets: crossed[1], reps: digits(crossed[2]) };
  return { sets: '', reps: digits(trimmed) };
}

function digits(value) {
  return value.match(/\d+/)?.[0] ?? '';
}

test('parseSetsReps understands 3*10', () => {
  assert.deepEqual(parseSetsReps('3*10'), { sets: '3', reps: '10' });
});

test('parseSetsReps understands 4x8', () => {
  assert.deepEqual(parseSetsReps('4x8'), { sets: '4', reps: '8' });
});

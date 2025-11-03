/*
  Disable all console methods globally to prevent logs from appearing in DevTools
  in any environment. This is a hard block and will affect debugging.
*/
const noop = () => {};

const consoleMethods = [
  'log',
  'debug',
  'info',
  'warn',
  'error',
  'trace',
  'group',
  'groupCollapsed',
  'groupEnd',
  'time',
  'timeEnd',
  'timeLog',
  'table',
  'profile',
  'profileEnd',
  'dir',
  'dirxml',
  'assert',
  'count',
  'countReset',
  'clear'
];

for (const method of consoleMethods) {
  try {
    // eslint-disable-next-line no-console
    console[method] = noop;
  } catch (_) {
    // ignore if console method is read-only in some environments
  }
}



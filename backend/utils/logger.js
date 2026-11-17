export const logger = {
  info: (msg, meta = '') => {
    console.log(`\x1b[32m[INFO]\x1b[0m [${new Date().toLocaleTimeString()}] ${msg}`, meta ? meta : '');
  },
  warn: (msg, meta = '') => {
    console.warn(`\x1b[33m[WARN]\x1b[0m [${new Date().toLocaleTimeString()}] ${msg}`, meta ? meta : '');
  },
  error: (msg, error = '') => {
    console.error(`\x1b[31m[ERROR]\x1b[0m [${new Date().toLocaleTimeString()}] ${msg}`, error ? (error.stack || error) : '');
  },
  db: (msg) => {
    console.log(`\x1b[36m[DATABASE]\x1b[0m ${msg}`);
  },
  socket: (msg) => {
    console.log(`\x1b[35m[SOCKET.IO]\x1b[0m ${msg}`);
  }
};

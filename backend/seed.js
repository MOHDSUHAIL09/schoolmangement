import { seedDatabase } from './seed/seedDatabase.js';
import { connectDB } from './config/db.js';

export { seedDatabase };

if (process.argv[1] && process.argv[1].endsWith('seed.js')) {
  (async () => {
    try {
      await connectDB();
      await seedDatabase();
      process.exit(0);
    } catch (err) {
      console.error(err);
      process.exit(1);
    }
  })();
}

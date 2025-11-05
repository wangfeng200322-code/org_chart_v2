import app from './app.js';
import { initDatabase, closeDatabase } from './config/database.js';
import cacheService from './services/cacheService.js';

const PORT = process.env.PORT || 3000;

initDatabase()
  .then(() => {
    const server = app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
    
    // Graceful shutdown
    const shutdown = async () => {
      console.log('Shutting down gracefully...');
      try {
        await closeDatabase();
        await cacheService.close();
        server.close(() => {
          console.log('Server closed');
          process.exit(0);
        });
      } catch (err) {
        console.error('Error during shutdown', err);
        process.exit(1);
      }
    };
    
    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  })
  .catch((err) => {
    console.error('Failed to initialize database', err);
    process.exit(1);
  });
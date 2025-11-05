import app from './app.js';
import { initDatabase, closeDatabase } from './config/database.js';
import cacheService from './services/cacheService.js';
import logger from './utils/logger.js';

const PORT = process.env.PORT || 3000;

initDatabase()
  .then(() => {
    const server = app.listen(PORT, () => logger.info(`Server listening on port ${PORT}`));
    
    // Graceful shutdown
    const shutdown = async () => {
      logger.info('Shutting down gracefully...');
      try {
        await closeDatabase();
        await cacheService.close();
        server.close(() => {
          logger.info('Server closed');
          process.exit(0);
        });
      } catch (err) {
        logger.error('Error during shutdown', err);
        process.exit(1);
      }
    };
    
    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  })
  .catch((err) => {
    logger.error('Failed to initialize database', err);
    process.exit(1);
  });
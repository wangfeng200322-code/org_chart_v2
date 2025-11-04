import app from './app.js';
import { initDatabase } from './config/database.js';

const PORT = process.env.PORT || 3000;

initDatabase()
  .then(() => {
    app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
  })
  .catch((err) => {
    console.error('Failed to initialize database', err);
    process.exit(1);
  });



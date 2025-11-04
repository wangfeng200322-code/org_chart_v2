import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import bodyParser from 'body-parser';
import employeeRoutes from './routes/employeeRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import healthRoutes from './routes/healthRoutes.js';
import { apiKeyAuth } from './middleware/apiKeyAuth.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();

app.use(helmet());
app.use(cors());
app.use(bodyParser.json());

app.use('/api', apiKeyAuth, employeeRoutes);
app.use('/api', apiKeyAuth, uploadRoutes);
app.use('/health', healthRoutes);

// Error handler should be the last middleware
app.use(errorHandler);

export default app;

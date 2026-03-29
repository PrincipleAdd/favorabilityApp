/**
 * Express 应用配置
 * 挂载路由与错误处理中间件
 */
import express from 'express';
import characterRoutes from './routes/characterRoutes.js';
import affinityRoutes from './routes/affinityRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();

app.use(express.json());

app.use('/api/characters', characterRoutes);
app.use('/api/characters/:id', affinityRoutes);

app.use(errorHandler);

export default app;

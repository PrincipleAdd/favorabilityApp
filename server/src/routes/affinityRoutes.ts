/**
 * 好感度相关 API 路由
 * 挂载在 /api/characters/:id/ 下
 */
import { Router } from 'express';
import * as affinityController from '../controllers/affinityController.js';

const router = Router({ mergeParams: true });

router.post('/affinity', affinityController.adjustAffinity);
router.get('/events', affinityController.getAffinityEvents);

export default router;

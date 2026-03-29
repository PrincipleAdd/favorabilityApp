/**
 * 人物相关 API 路由
 */
import { Router } from 'express';
import * as characterController from '../controllers/characterController.js';

const router = Router();

router.get('/', characterController.listCharacters);
router.post('/', characterController.createCharacter);
router.get('/:id', characterController.getCharacter);
router.put('/:id', characterController.updateCharacter);
router.delete('/:id', characterController.deleteCharacter);

export default router;

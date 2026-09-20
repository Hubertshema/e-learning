import { Router } from 'express';
import { PlacementController } from '../controllers/placement.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate);

// Student Placement Test
router.get('/placement-test', PlacementController.getStudentPlacementTest);
router.get('/placements', PlacementController.getAvailablePlacements);
router.post('/placement-test', PlacementController.submitStudentPlacementTest);

export default router;

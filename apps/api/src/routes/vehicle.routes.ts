import { Router, type IRouter } from 'express';

import { vehicleController } from '../controllers';
import { authenticate } from '../middleware/auth';
import { validateBody, validateParams, validateQuery } from '../middleware/validation';
import {
  addVehicleSchema,
  updateVehicleSchema,
  vehicleIdParamSchema,
  addMaintenanceRecordSchema,
  listVehiclesQuerySchema,
} from '@myautowhiz/shared';

const router: IRouter = Router();

// All routes require authentication
router.use(authenticate);

// Vehicle CRUD
router.get('/', validateQuery(listVehiclesQuerySchema), vehicleController.listVehicles);
router.post('/', validateBody(addVehicleSchema), vehicleController.addVehicle);
router.get('/:id', validateParams(vehicleIdParamSchema), vehicleController.getVehicle);
router.patch('/:id', validateParams(vehicleIdParamSchema), validateBody(updateVehicleSchema), vehicleController.updateVehicle);
router.delete('/:id', validateParams(vehicleIdParamSchema), vehicleController.deleteVehicle);

// Vehicle data
router.get('/:id/recalls', validateParams(vehicleIdParamSchema), vehicleController.getRecalls);
router.post('/:id/recalls/refresh', validateParams(vehicleIdParamSchema), vehicleController.refreshRecalls);
router.get('/:id/safety', validateParams(vehicleIdParamSchema), vehicleController.getSafetyRatings);

// Maintenance records
router.get('/:id/maintenance', validateParams(vehicleIdParamSchema), vehicleController.getMaintenanceRecords);
router.post(
  '/:id/maintenance',
  validateParams(vehicleIdParamSchema),
  validateBody(addMaintenanceRecordSchema),
  vehicleController.addMaintenanceRecord
);
router.delete(
  '/:id/maintenance/:recordId',
  validateParams(vehicleIdParamSchema),
  vehicleController.deleteMaintenanceRecord
);

export default router;

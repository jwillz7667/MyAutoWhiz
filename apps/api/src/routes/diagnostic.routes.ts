import { Router, type IRouter } from 'express';
import multer from 'multer';

import { diagnosticController } from '../controllers';
import { authenticate } from '../middleware/auth';
import { validateBody, validateParams, validateQuery } from '../middleware/validation';
import {
  createDiagnosticSchema,
  updateDiagnosticSchema,
  diagnosticIdParamSchema,
  listDiagnosticsQuerySchema,
  addDiagnosticImageSchema,
  resolveDiagnosticSchema,
} from '@myautowhiz/shared';

const router: IRouter = Router();

// Configure multer for diagnostic image uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 15 * 1024 * 1024, // 15MB max file size for diagnostic images
    files: 10, // Max 10 files per request
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.'));
    }
  },
});

// All routes require authentication
router.use(authenticate);

// Diagnostic CRUD
router.get('/', validateQuery(listDiagnosticsQuerySchema), diagnosticController.listDiagnostics);
router.post('/', validateBody(createDiagnosticSchema), diagnosticController.createDiagnostic);
router.get('/:id', validateParams(diagnosticIdParamSchema), diagnosticController.getDiagnostic);
router.patch('/:id', validateParams(diagnosticIdParamSchema), validateBody(updateDiagnosticSchema), diagnosticController.updateDiagnostic);
router.delete('/:id', validateParams(diagnosticIdParamSchema), diagnosticController.deleteDiagnostic);

// Diagnostic actions
router.post('/:id/images', validateParams(diagnosticIdParamSchema), validateBody(addDiagnosticImageSchema), diagnosticController.addImage);
router.post('/:id/analyze', validateParams(diagnosticIdParamSchema), diagnosticController.analyze);
router.post('/:id/resolve', validateParams(diagnosticIdParamSchema), validateBody(resolveDiagnosticSchema), diagnosticController.resolveDiagnostic);

// Image upload (multipart/form-data)
router.post(
  '/:id/upload-images',
  validateParams(diagnosticIdParamSchema),
  upload.array('images', 10),
  diagnosticController.uploadImages
);

export default router;

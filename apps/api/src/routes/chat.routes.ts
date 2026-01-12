import { Router, type IRouter } from 'express';
import multer from 'multer';

import { chatController } from '../controllers';
import { authenticate } from '../middleware/auth';
import { validateBody, validateParams, validateQuery } from '../middleware/validation';
import {
  createChatSessionSchema,
  updateChatSessionSchema,
  chatSessionIdParamSchema,
  listChatSessionsQuerySchema,
} from '@myautowhiz/shared';

const router: IRouter = Router();

// Configure multer for image uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
    files: 5, // Max 5 files per request
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

// Chat session routes
router.get('/sessions', validateQuery(listChatSessionsQuerySchema), chatController.listSessions);
router.post('/sessions', validateBody(createChatSessionSchema), chatController.createSession);
router.get('/sessions/:id', validateParams(chatSessionIdParamSchema), chatController.getSession);
router.patch('/sessions/:id', validateParams(chatSessionIdParamSchema), validateBody(updateChatSessionSchema), chatController.updateSession);
router.delete('/sessions/:id', validateParams(chatSessionIdParamSchema), chatController.deleteSession);

// Message routes
router.get('/sessions/:id/messages', validateParams(chatSessionIdParamSchema), chatController.getMessages);

// Streaming message endpoint (SSE)
router.post(
  '/sessions/:id/messages',
  validateParams(chatSessionIdParamSchema),
  upload.array('images', 5),
  chatController.sendMessage
);

export default router;

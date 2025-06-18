import express from 'express';
import { errorHandler, routNotFound } from '../handlers/exception.handler';
import { authenticateToken } from '../middlewares/auth.middlewares';
import { authRoutes } from './auth.routes';
import { documentsRoutes } from './documents.routes';
import { searchRoutes } from './search.routes';

const router = express.Router();

router.use('/api/auth', authRoutes);
router.use('/api/documents', authenticateToken, documentsRoutes);
router.use('/api/search', authenticateToken, searchRoutes);

router.get('/api/dashboard', authenticateToken, (req, res, next) => { res.status(200).json({ data: "success!" }) });


router.use(routNotFound);
router.use(errorHandler);

export default router;

import express from 'express';
import { login, refreshToken, register } from '../controllers/auth.controller';
import { registrationSchema, tokenRefreshSchema } from '../middlewares/schemas';
import { validateRequest } from '../middlewares/validator.middlewares';


export const authRoutes = express.Router();

authRoutes.post('/register', validateRequest(registrationSchema), register);
authRoutes.post('/login', login);
authRoutes.post('/refresh-token', validateRequest(tokenRefreshSchema),  refreshToken);

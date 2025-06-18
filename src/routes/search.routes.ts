import { searchQueryHandler } from "../controllers/search.controller";
import express from 'express';


export const searchRoutes = express.Router();

searchRoutes.get('', searchQueryHandler);  
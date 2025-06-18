import { NextFunction, Request, Response } from 'express';
import { ErrorWithStatus } from '../types/interfaces';

export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction): void => {
    console.error(err.stack);

    const status = err instanceof ErrorWithStatus ? err.status : 500;

    res.status(status || 500).json({
        message: err.message || 'Internal Server Error',
    });
};

export const routNotFound = (req: Request, res: Response) => {
    res.status(404).json({
        message: 'Route not found',
    });
};

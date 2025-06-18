import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError, infer as Infer } from "zod";
import { ErrorWithStatus } from "../types/interfaces";

export const validateRequest = <T extends ZodSchema>(schema: T) => (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        req.body = schema.parse(req.body);
        next();
    } catch (error) {
        if (error instanceof ZodError) {
            next(new ErrorWithStatus(error.message, 400))
        }
        next(new ErrorWithStatus("Internal server error", 500))
    }
};

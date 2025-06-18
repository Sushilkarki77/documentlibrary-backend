import { Request, Response, NextFunction, RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import { findUserByEmail, User, UserModel } from '../models/user.model';
import { ErrorWithStatus, TokenPayload } from '../types/interfaces';

export const authenticateToken: RequestHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const token = req.header('Authorization')?.split(' ')[1];

        if (!token) {
            throw new ErrorWithStatus("Access Denied", 401);
        }

        if (!process.env.SECRET_KEY) {
            throw new ErrorWithStatus("Internal server error", 500);
        }

        const verified: TokenPayload = jwt.verify(token, process.env.SECRET_KEY) as TokenPayload;

        const user = await findUserByEmail(verified.email);

        if(!user){
            throw new ErrorWithStatus("User Does not Exist", 401);
        }

        req.user = verified;
        next();
    } catch (error) {
        if (error instanceof ErrorWithStatus) {
            next(error);
        } else {
            next(new ErrorWithStatus("Invalid Token", 401))
        }
    }
};
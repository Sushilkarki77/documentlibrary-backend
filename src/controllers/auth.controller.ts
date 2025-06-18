import { RequestHandler } from "express";
import { createUser, findUserByEmail, User } from "../models/user.model";
import { AuthRequestBody, ErrorWithStatus, ResponseItem, TokenPayload } from "../types/interfaces";
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';


export const register: RequestHandler<unknown, ResponseItem<{ email: string | null | undefined, fullname: string | null | undefined }>, User> = async (req, res, next) => {

    try {
        const user = req.body;
        if (!user?.email || !user?.password) {
            throw new ErrorWithStatus("email and password are required", 400);
        }

        if (user.password.length < 6) {
            throw new ErrorWithStatus("password must be of length 6", 401);
        }

        const existingUser = await findUserByEmail(user.email);

        if (existingUser) {
            throw new ErrorWithStatus("User already exists", 400);
        }

        const { email, fullname } = await createUser(user);

        res.status(201).json({
            message: "user created successfully!",
            data: { email, fullname }
        })

    } catch (error) {
        next(error)
    }
}




export const login: RequestHandler<unknown, ResponseItem<{ accessToken: string, refreshToken: string }>, AuthRequestBody> = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            throw new ErrorWithStatus("email and password are required", 400);
        }

        const user = await findUserByEmail(email);


        if (!user || !user.email) {
            throw new ErrorWithStatus("User Does not exists", 401);
        }

        if (!user.password) {
            throw new ErrorWithStatus("User is not active", 401);
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            throw new ErrorWithStatus("Invalid credentials", 401);
        }

        const tokenPayload: TokenPayload = {
            _id: user._id,
            fullname: user.fullname,
            email: user.email,

        };

        if (!process.env.SECRET_KEY || !process.env.SECRET_KEY_REFRESH) throw new ErrorWithStatus("Internal server Error!", 500);

        const accessToken = getAccessToken(tokenPayload, process.env.SECRET_KEY);
        const refreshToken = getRefreshToken(tokenPayload, process.env.SECRET_KEY_REFRESH);

        res.json({
            message: "Login Successful!",
            data: { accessToken, refreshToken }
        });
    } catch (error) {
        return next(error);
    }
};




export const refreshToken: RequestHandler<unknown, ResponseItem<{ accessToken: string, refreshToken: string }>, { refreshToken: string }> = async (req, res, next) => {
    try {
        const refreshToken = req.body.refreshToken;

        if (!refreshToken) {
            throw new ErrorWithStatus("Refresh token is required", 400);
        }
        if (!process.env.SECRET_KEY || !process.env.SECRET_KEY_REFRESH) throw new ErrorWithStatus("Internal server Error!", 500);


        const claim: TokenPayload = jwt.verify(refreshToken, process.env.SECRET_KEY_REFRESH) as TokenPayload;


        const user = await findUserByEmail(claim.email);

        if (!user || !user.email || !user.isActive) {
            throw new ErrorWithStatus("User Does not exists", 401);
        }


        const tokenPayload: TokenPayload = {
            _id: user._id,
            fullname: user.fullname,
            email: user.email,
        };

        const accessToken = getAccessToken(tokenPayload, process.env.SECRET_KEY);

        res.json({
            message: "Token refreshed",
            data: { accessToken, refreshToken }
        });
    } catch (error) {
          next(new ErrorWithStatus("Token expired", 401))
    }
};


const getAccessToken = (tokenPayload: { _id: string, fullname: string, email: string }, secret: string) => jwt.sign(tokenPayload, secret, { expiresIn: '1h' });

const getRefreshToken = (tokenPayload: { _id: string, fullname: string, email: string }, secret: string) => jwt.sign(tokenPayload, secret, { expiresIn: '1d' });
import { z } from "zod";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB


export const registrationSchema = z.object({
    fullname: z.string(),
    email: z.string(),
    password: z.string(),
    isActive: z.boolean().optional()
});

export const tokenRefreshSchema = z.object({
    refreshToken: z.string(),
});


export const documentSchema = z.object({
    documentName: z.string()
});
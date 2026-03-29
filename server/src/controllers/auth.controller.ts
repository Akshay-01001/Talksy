import bcrypt from 'bcrypt';
import { refreshTokensTable, usersTable } from '../db/schema.ts';
import { loginSchema, registerSchema } from '../lib/validateSchema.ts';
import type { Request, Response } from 'express';
import { db } from '../db/index.ts';
import { eq, or } from 'drizzle-orm';
import { generateAccessToken, generateRefreshToken } from '../lib/common.ts';

export const register = async (req: Request, res: Response) => {
    try {
        const data = req.body;

        const { error, value } = registerSchema.validate(data);

        if (error) {
            return res.status(400).json({
                message: error.details[0]?.message ?? 'Validation error'
            });
        }

        const existingUser = await db.select().from(usersTable).
            where(or(eq(usersTable.email, value.email), eq(usersTable.username, value.username)));

        if (existingUser?.length > 0) {
            return res.status(409).json({
                message: "User already exists"
            });
        }

        const hashedPassword = await bcrypt.hash(value.password, 10);
        const newUser = {
            username: value.username,
            email: value.email,
            password: hashedPassword,
            avatar_url: value.avatar_url,
            bio: value.bio
        }

        await db.insert(usersTable).values(newUser);

        return res.status(201).json({
            message: "User registered successfully",
            user: value
        });

    } catch (error) {
        res.status(500).json({
            message: "Internal server error"
        });
    }
};

export const login = async (req: Request, res: Response) => {
    try {
    
        const { error, value } = loginSchema.validate(req.body);

        if (error) {
            return res.status(400).json({
                message: error.details[0]?.message ?? 'Validation error'
            });
        }

        const { email, password } = value;

        const user = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        const isMatch = await bcrypt.compare(password, user[0]?.password!);

        if (!isMatch) {
            return res.status(401).json({
                message: "Invalid credentials"
            });
        }

        const accessToken = generateAccessToken({ id: user[0]?.id!, username: user[0]?.username! });
        const refreshToken = generateRefreshToken({ id: user[0]?.id!, username: user[0]?.username! });

        await db.insert(refreshTokensTable).values({
            user_id: user[0]?.id!,
            token_hash: await bcrypt.hash(refreshToken, 10),
            device_name: req.headers['user-agent'] || 'Unknown',
            device_os: 'Unknown',
            user_agent: req.headers['user-agent'] || 'Unknown',
            ip_address: req.ip
        });

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        res.cookie('accessToken', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 60 * 60 * 1000 // 1 hour
        });

        return res.status(200).json({
            message: "Login successful",
            user: {
                id: user[0]?.id,
                username: user[0]?.username,
                email: user[0]?.email,
                avatar_url: user[0]?.avatar_url,
                bio: user[0]?.bio
            }
        });

    } catch(error) {
        console.error("Login error:", error);
        return res.status(500).json({
            message: "Internal server error"
        });
    }
}

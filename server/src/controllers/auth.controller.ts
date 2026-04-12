import bcrypt from 'bcrypt';
import { refreshTokensTable, usersTable } from '../db/schema.ts';
import { loginSchema, registerSchema } from '../lib/validateSchema.ts';
import type { Request, Response } from 'express';
import { db } from '../db/index.ts';
import { eq, or } from 'drizzle-orm';
import { generateAccessToken, generateRefreshToken } from '../lib/common.ts';
import type { AuthRequest } from '../types/index.d.ts';

export const register = async (req: Request, res: Response) => {
    try {
        const data = req?.body;

        // validate the data
        const { error, value } = registerSchema.validate(data);

        if (error) {
            return res.status(400).json({
                message: error.details[0]?.message ?? 'Validation error'
            });
        }

        // check if user already exists or not
        const existingUser = await db.select().from(usersTable).
            where(or(eq(usersTable.email, value.email), eq(usersTable.username, value.username)));

        if (existingUser?.length > 0) {
            return res.status(400).json({
                message: "User already exists"
            });
        }

        // hash the password and create a newUser object
        const hashedPassword = await bcrypt.hash(value.password, 10);
        const newUser = {
            username: value.username,
            email: value.email,
            password: hashedPassword,
            avatar_url: value.avatar_url,
            bio: value.bio
        }

        // create a new user in the table
        const user = await db.insert(usersTable).values(newUser).returning();

        // generate access and refresh token
        const accessToken = generateAccessToken({ id: user[0]?.id!, username: user[0]?.username! });
        const refreshToken = generateRefreshToken({ id: user[0]?.id!, username: user[0]?.username! });

        // insert refresh token in the table
        await db.insert(refreshTokensTable).values({
            user_id: user[0]?.id!,
            token_hash: await bcrypt.hash(refreshToken, 10),
            device_name: req?.headers['user-agent'] || 'Unknown',
            device_os: 'Unknown',
            user_agent: req?.headers['user-agent'] || 'Unknown',
            ip_address: req?.ip
        });

        // set the cookies
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        res.cookie('accessToken', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 60 * 60 * 1000
        });

        // send the success response
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
    
        // validate the data
        const { error, value } = loginSchema.validate(req?.body);

        if (error) {
            return res.status(400).json({
                message: error.details[0]?.message ?? 'Validation error'
            });
        }

        const { email, password } = value;

        // get the user details from database
        const user = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);

        // if not user found send error response
        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        // check if password is matched
        const isMatch = await bcrypt.compare(password, user[0]?.password!);

        // send eroor on password mismatch
        if (!isMatch) {
            return res.status(401).json({
                message: "Invalid credentials"
            });
        }

        // generate tokens
        const accessToken = generateAccessToken({ id: user[0]?.id!, username: user[0]?.username! });
        const refreshToken = generateRefreshToken({ id: user[0]?.id!, username: user[0]?.username! });

        // insert refresh token in table
        await db.insert(refreshTokensTable).values({
            user_id: user[0]?.id!,
            token_hash: await bcrypt.hash(refreshToken, 10),
            device_name: req?.headers['user-agent'] || 'Unknown',
            device_os: 'Unknown',
            user_agent: req?.headers['user-agent'] || 'Unknown',
            ip_address: req?.ip
        });

        // set the cookies
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
            maxAge: 60 * 60 * 1000
        });

        // send the success response
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

export const generateNewAccessToken = async (req: AuthRequest, res: Response) => {
    try {
        
        // if no user found in req send error reponse
        if (!req?.user) {
            return res.status(401).json({
                message: "Unauthorized"
            });
        }

        // generate access token from user object
        const accessToken = generateAccessToken(req.user);
        
        // set che access token in cookies
        res.cookie('accessToken', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 60 * 60 * 1000
        });

        // send success message
        return res.status(200).json({
            message: "New access token generated"
        });

    } catch (error) {
        console.error("Error generating new access token:", error);
        return res.status(500).json({
            message: "Internal server error"
        });
    }
}

export const logout = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const refreshToken = req?.cookies?.refreshToken;

        if (!refreshToken) {
            // still clear cookies and return success
            res.clearCookie('refreshToken', {
                httpOnly: true,
                secure: true,
                sameSite: 'strict',
            });
            res.clearCookie('accessToken', {
                httpOnly: true,
                secure: true,
                sameSite: 'strict',
            });
            return res.status(200).json({ message: "Logout successful" });
        }

        const userId = req.user.id;

        // get all tokens of user
        const tokens = await db.select().from(refreshTokensTable).where(eq(refreshTokensTable.user_id, userId));

        // find matching token
        let matchedToken = null;

        for (const tokenRecord of tokens) {
            const isMatch = await bcrypt.compare(refreshToken, tokenRecord.token_hash);

            if (isMatch) {
                matchedToken = tokenRecord;
                break;
            }
        }

        console.log("Matched token record:", matchedToken);

        if (matchedToken) {
            await db.delete(refreshTokensTable)
                .where(eq(refreshTokensTable.id, matchedToken.id));
        }

        res.clearCookie('refreshToken', {
            httpOnly: true,
            secure: true,
            sameSite: 'strict',
        });

        res.clearCookie('accessToken', {
            httpOnly: true,
            secure: true,
            sameSite: 'strict',
        });

        return res.status(200).json({ message: "Logout successful" });

    } catch (error) {
        console.error("Logout error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

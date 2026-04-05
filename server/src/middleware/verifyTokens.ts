import jwt, { type JwtPayload } from 'jsonwebtoken';
import type { Response, NextFunction } from 'express';
import type { AuthRequest } from '../types/index.js';

export const verifyAcceessToken = (req : AuthRequest, res: Response, next: NextFunction) => {
    const authHeader = req.cookies['access_token'];
    if (!authHeader) {
        return res.status(401).json({ message: 'Access token is missing' });
    }

    jwt.verify(authHeader, process.env.ACCESS_TOKEN_SECRET as string, (err: Error | null, decoded: string | JwtPayload | undefined): Response | void => {
        if (err || !decoded || typeof decoded === 'string') {
            return res.status(403).json({ message: 'Invalid access token' });
        }
        req.user = decoded as JwtPayload;
        next();
    });
};

export const verifyRefreshToken = (req : AuthRequest, res: Response, next: NextFunction) => {
    const refreshToken = req.cookies['refresh_token'];
    if (!refreshToken) {
        return res.status(403).json({ message: 'Refresh token is missing' });
    }

    jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET as string, (err: Error | null, decoded: string | JwtPayload | undefined): Response | void => {
        if (err || !decoded || typeof decoded === 'string') {
            return res.status(403).json({ message: 'Invalid refresh token' });
        }
        req.user = decoded as JwtPayload;
        next();
    });
};


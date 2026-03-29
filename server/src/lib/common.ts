import jwt from 'jsonwebtoken';

export const generateAccessToken = (user: { id: string, username: string }) => {
    return jwt.sign({ userId: user.id, username: user.username }, process.env.ACCESS_TOKEN_SECRET!, { expiresIn: '1h' });
};

export const generateRefreshToken = (user: { id: string, username: string }) => {
    return jwt.sign({ userId: user.id, username: user.username }, process.env.REFRESH_TOKEN_SECRET!, { expiresIn: '7d' });
};

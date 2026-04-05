import jwt, {type JwtPayload} from 'jsonwebtoken';

export const generateAccessToken = (user: JwtPayload) => {
    return jwt.sign({ userId: user.id, username: user.username }, process.env.ACCESS_TOKEN_SECRET!, { expiresIn: '10m' });
};

export const generateRefreshToken = (user: JwtPayload) => {
    return jwt.sign({ userId: user.id, username: user.username }, process.env.REFRESH_TOKEN_SECRET!, { expiresIn: '7d' });
};

import jwt, {type JwtPayload} from 'jsonwebtoken';

export const ACCESS_TOKEN_EXPIRY = '1h'
export const REFRESH_TOKEN_EXPITY = '7d'

export const generateAccessToken = (user: JwtPayload) => {
    return jwt.sign({ id: user.id, username: user.username }, process.env.ACCESS_TOKEN_SECRET!, { expiresIn: ACCESS_TOKEN_EXPIRY });
};

export const generateRefreshToken = (user: JwtPayload) => {
    return jwt.sign({ id: user.id, username: user.username }, process.env.REFRESH_TOKEN_SECRET!, { expiresIn: REFRESH_TOKEN_EXPITY});
};

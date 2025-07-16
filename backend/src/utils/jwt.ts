import jwt, { JwtPayload } from 'jsonwebtoken';

export const JWT_SECRET = process.env.JWT_SECRET || 'default_secret';

export const generateToken = (userId: string) => {
    const token = jwt.sign({ userId }, JWT_SECRET, { expiresIn: '1h' });
    return token;
};

export interface DecodedToken extends JwtPayload {
    userId: string;
}


export const verifyToken = (token: string): DecodedToken => {
    const userId = jwt.verify(token, JWT_SECRET) as DecodedToken;
    return userId;
};
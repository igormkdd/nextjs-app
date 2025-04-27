import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET

// Sign a JWT token
export function signToken(payload: object) {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
}

// Verify a JWT token
export function verifyToken(token: string) {
    return jwt.verify(token, JWT_SECRET);
}

// Hash a password
export async function hashPassword(password: string) {
    return await bcrypt.hash(password, 10);
}

// Compare password with hash
export async function verifyPassword(password: string, hash: string) {
    return await bcrypt.compare(password, hash);
}

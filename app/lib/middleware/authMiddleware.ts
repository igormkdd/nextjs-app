import { NextApiRequest, NextApiResponse } from 'next';
import { verifyToken } from '../auth';

export function withAuth(handler: Function) {
    return async (req: NextApiRequest, res: NextApiResponse) => {
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return res.status(401).json({ message: 'Missing Authorization header' });
        }

        const token = authHeader.split(' ')[1];

        try {
            const decoded = verifyToken(token);
            (req as any).user = decoded; // attach user to request
            return handler(req, res);
        } catch (error) {
            return res.status(401).json({ message: `Invalid or expired token. Error: ${error}` });
        }
    };
}

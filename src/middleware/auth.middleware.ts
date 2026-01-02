import { Request, Response, NextFunction } from 'express';
import admin from '../config/firebase.js';
import { AuthenticatedUser } from '../types/index.js';

/**
 * Extend Express Request to include authenticated user
 */
declare global {
    namespace Express {
        interface Request {
            user?: AuthenticatedUser;
        }
    }
}

/**
 * Middleware to verify Firebase authentication token
 * Expects: Authorization: Bearer <token>
 */
export async function authMiddleware(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        // Extract token from Authorization header
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({
                success: false,
                error: 'No se proporcionó un token de autenticación',
            });
            return;
        }

        const token = authHeader.split('Bearer ')[1];

        // Verify token with Firebase Admin
        const decodedToken = await admin.auth().verifyIdToken(token);

        // Attach user info to request
        req.user = {
            uid: decodedToken.uid,
            email: decodedToken.email,
            displayName: decodedToken.name,
        };

        next();
    } catch (error) {
        console.error('Authentication error:', error);
        res.status(401).json({
            success: false,
            error: 'Token de autenticación inválido o expirado',
        });
    }
}

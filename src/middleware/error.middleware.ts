import { Request, Response, NextFunction } from 'express';
import { MulterError } from 'multer';
import { ZodError } from 'zod';

/**
 * Global error handling middleware
 * Must be the last middleware in the chain
 */
export function errorMiddleware(
    error: Error,
    _req: Request,
    res: Response,
    _next: NextFunction
): void {
    console.error('Error occurred:', error);

    // Multer file upload errors
    if (error instanceof MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            res.status(413).json({
                success: false,
                error: 'El archivo es demasiado grande. Tamaño máximo: 8MB',
            });
            return;
        }

        res.status(400).json({
            success: false,
            error: `Error al subir el archivo: ${error.message}`,
        });
        return;
    }

    // Zod validation errors
    if (error instanceof ZodError) {
        res.status(400).json({
            success: false,
            error: 'Datos de entrada inválidos',
            details: error.errors,
        });
        return;
    }

    // File type validation error
    if (error.message.includes('Tipo de archivo no permitido')) {
        res.status(400).json({
            success: false,
            error: error.message,
        });
        return;
    }

    // Generic server error
    res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
    });
}

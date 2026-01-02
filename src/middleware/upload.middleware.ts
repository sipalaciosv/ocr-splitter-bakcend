import multer from 'multer';
import { ALLOWED_MIME_TYPES, MAX_FILE_SIZE } from '../schemas/ocr.schema.js';
import { Request } from 'express';

/**
 * File filter to validate file types
 */
const fileFilter = (
    _req: Request,
    file: Express.Multer.File,
    cb: multer.FileFilterCallback
) => {
    // Check if MIME type is allowed
    if (ALLOWED_MIME_TYPES.includes(file.mimetype as any)) {
        cb(null, true);
    } else {
        cb(new Error(`Tipo de archivo no permitido. Solo se aceptan: ${ALLOWED_MIME_TYPES.join(', ')}`));
    }
};

/**
 * Multer configuration for file uploads
 * - Memory storage (buffer) for processing without disk I/O
 * - File type validation
 * - File size limit: 8MB
 */
export const uploadMiddleware = multer({
    storage: multer.memoryStorage(),
    fileFilter,
    limits: {
        fileSize: MAX_FILE_SIZE,
    },
});

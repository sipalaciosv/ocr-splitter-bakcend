import { z } from 'zod';

/**
 * Schema for OCR item validation
 */
export const ocrItemSchema = z.object({
    id: z.string().uuid(),
    name: z.string().min(1),
    price: z.number().positive(),
    qty: z.number().int().positive().default(1),
});

/**
 * Schema for OCR response validation
 */
export const ocrResponseSchema = z.object({
    success: z.boolean(),
    items: z.array(ocrItemSchema).optional(),
    error: z.string().optional(),
});

/**
 * Allowed file MIME types for upload
 */
export const ALLOWED_MIME_TYPES = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'application/pdf',
] as const;

/**
 * Maximum file size (8MB)
 */
export const MAX_FILE_SIZE = 8 * 1024 * 1024; // 8MB in bytes

import { Router, Request, Response } from 'express';
import { uploadMiddleware } from '../middleware/upload.middleware.js';
import { processOCR } from '../services/ocr.service.js';

const router = Router();

/**
 * POST /api/ocr/process
 * Process receipt image and extract items
 * 
 * @body file - Image or PDF file (multipart/form-data)
 * @returns OcrResponse with extracted items
 */
router.post('/process', uploadMiddleware.single('file'), async (req: Request, res: Response) => {
    try {
        // Validate file was uploaded
        if (!req.file) {
            res.status(400).json({
                success: false,
                error: 'No se proporcionó ningún archivo. Usa el campo "file" en el body.',
            });
            return;
        }

        console.log(`Processing file: ${req.file.originalname} (${req.file.size} bytes)`);

        // Process OCR
        const result = await processOCR(req.file.buffer);

        // Return result (success or error)
        const statusCode = result.success ? 200 : 400;
        res.status(statusCode).json(result);
    } catch (error) {
        console.error('Error in OCR route:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno al procesar la boleta',
        });
    }
});

export default router;

import { visionClient } from '../config/google-vision.js';
import { OcrItem, OcrResponse } from '../types/index.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * Extract text from image using Google Cloud Vision API
 */
async function extractTextFromImage(imageBuffer: Buffer): Promise<string> {
    try {
        console.log('📸 Iniciando detección de texto con Google Vision API...');
        console.log('Tamaño del buffer:', imageBuffer.length, 'bytes');

        const [result] = await visionClient.textDetection(imageBuffer);
        const detections = result.textAnnotations;

        console.log('✅ Respuesta de Vision API recibida');
        console.log('Número de detecciones:', detections?.length || 0);

        if (!detections || detections.length === 0) {
            throw new Error('No se detectó texto en la imagen');
        }

        const fullText = detections[0].description || '';
        console.log('📝 Texto extraído:', fullText.substring(0, 100) + '...');
        return fullText;
    } catch (error) {
        console.error('❌ ERROR DETALLADO en extractTextFromImage:');
        console.error('Tipo de error:', (error as any)?.constructor?.name);
        console.error('Mensaje:', (error as any)?.message);

        throw new Error(`Error al procesar la imagen con Google Vision API: ${(error as any)?.message || 'Error desconocido'}`);
    }
}

/**
 * Parse receipt items from extracted text
 * Optimized for PRE-CUENTA format (Fudo POS system)
 * 
 * Format:
 * Qty  PRODUCT NAME              $PRICE
 * 1    MISTRAL 35               $8.490
 * 2    HAPPY CALAFATE SCHOP     $19.600
 */
function parseReceiptItems(text: string): OcrItem[] {
    const lines = text.split('\n').map((line) => line.trim()).filter(Boolean);
    const items: OcrItem[] = [];

    // Regex for prices: $8.490, $20.000, or just 90.000 (without $)
    const pricePattern = /^\$?(\d{1,3}(?:[.,]\d{3})+)$/;

    // Skip patterns
    const skipPatterns = [
        /^(pre-cuenta|fre-cuenta|mesa|personas|fecha|garz|subtotal|propina|total|comprobante|boleta|fudo|software|valido|aqui|usamos)/i,
        /^id:|^\d{2}\/\d{2}\/\d{2}/, // ID or dates
    ];

    for (let i = 0; i < lines.length; i++) {
        const currentLine = lines[i];

        // Skip metadata
        if (skipPatterns.some(pattern => pattern.test(currentLine))) {
            continue;
        }

        // Check if current line is a price
        const priceMatch = currentLine.match(pricePattern);

        if (priceMatch && i > 0) {
            const price = parseInt(priceMatch[1].replace(/[.,]/g, ''), 10);

            // Validate price range
            if (price < 500 || price > 200000) {
                continue;
            }

            // Look back for product name and quantity
            let productName = '';
            let qty = 1;

            // Previous line should be product name or quantity
            const prevLine = lines[i - 1]?.trim();

            if (!prevLine || skipPatterns.some(p => p.test(prevLine))) {
                continue;
            }

            // Check if previous line is just a number (quantity on separate line)
            const prevIsQty = /^\d{1,2}$/.test(prevLine);

            if (prevIsQty && i > 1) {
                // Format: Name (i-2) → Qty (i-1) → Price (i)
                // This is wrong! Actually it should be: Qty (i-2) → Name (i-1) → Price (i)
                // But let's check: if i-1 is a qty, then i-2 should be name
                productName = lines[i - 2]?.trim() || '';
                qty = parseInt(prevLine, 10);

                // Validate: if i-2 is ALSO a number, then we have the wrong structure
                // In that case, prevLine is actually the product name after all
                if (/^\d{1,2}$/.test(productName)) {
                    // i-2 is also a number, so structure is different
                    // Maybe: Qty (i-2) → Name (i-1 which we thought was qty) → Price (i)
                    qty = parseInt(productName, 10);
                    productName = prevLine; // What we thought was qty is actually the name
                }
            } else {
                // Previous line is not just a quantity number
                // Check if it starts with "Qty Name" format
                const qtyNameMatch = prevLine.match(/^(\d{1,2})\s+(.+)$/);

                if (qtyNameMatch) {
                    // Format: "Qty Name" (i-1) → Price (i)
                    qty = parseInt(qtyNameMatch[1], 10);
                    productName = qtyNameMatch[2];
                } else {
                    // Format: Name (i-1) → Price (i)
                    productName = prevLine;
                    qty = 1;

                    // But check if i-2 is a standalone quantity
                    if (i > 1) {
                        const twoLinesBack = lines[i - 2]?.trim();
                        if (twoLinesBack && /^\d{1,2}$/.test(twoLinesBack)) {
                            // Format: Qty (i-2) → Name (i-1) → Price (i)
                            qty = parseInt(twoLinesBack, 10);
                        }
                    }
                }
            }

            // Validate product name
            if (productName.length < 2) {
                continue;
            }

            // Skip if product name looks like metadata
            if (skipPatterns.some(p => p.test(productName))) {
                continue;
            }

            // Add item
            // Note: The extracted price is the TOTAL (unit price × qty already multiplied in the receipt)
            // So we need to divide by qty to get the unit price for the frontend
            const unitPrice = Math.round(price / qty);

            items.push({
                id: uuidv4(),
                name: productName,
                price: unitPrice,  // Unit price (not total)
                qty: qty,
            });
        }
    }

    return items;
}

/**
 * Main OCR processing function
 */
export async function processOCR(fileBuffer: Buffer): Promise<OcrResponse> {
    try {
        const extractedText = await extractTextFromImage(fileBuffer);

        console.log('='.repeat(80));
        console.log('📄 TEXTO COMPLETO EXTRAÍDO:');
        console.log('='.repeat(80));
        console.log(extractedText);
        console.log('='.repeat(80));

        const items = parseReceiptItems(extractedText);

        // Detectar si la boleta tiene propina sugerida
        const hasSuggestedTip = /propina\s+sugerida/i.test(extractedText);

        if (hasSuggestedTip) {
            console.log('💵 Propina sugerida detectada en la boleta');
        }

        console.log(`\n✅ Parseados ${items.length} items`);
        items.forEach(item => {
            console.log(`  ${item.qty}x ${item.name} → $${item.price.toLocaleString()}`);
        });

        if (items.length === 0) {
            return {
                success: false,
                error: 'No se pudieron detectar items en la boleta. Intenta con una imagen más clara.',
            };
        }

        return {
            success: true,
            items,
            hasSuggestedTip,
        };
    } catch (error) {
        console.error('OCR processing error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Error desconocido al procesar OCR',
        };
    }
}

import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * OCR Service
 *
 * Uses Google Gemini API to detect license plate text from a photo URI.
 * Called by the security gate-entry screen when the guard taps the camera scan button.
 */

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;

// uriToBase64 removed: base64 string is now provided directly by Expo Camera.

/**
 * License plate pattern — matches common Pakistani formats:
 *  - ABC-1234  (city code + digits)
 *  - LEA-1234
 *  - ABC 1234
 * Adjust the regex if your society uses a different format.
 */
const PLATE_REGEX = /\b([A-Z]{2,4}[-\s]?\d{1,4})\b/i;

/**
 * Detect a license plate in a photo.
 *
 * @param base64Image  Base64 string of the captured photo
 * @returns The detected plate string (e.g. "ABC-1234"), or null if none found
 */
export async function detectLicensePlate(base64Image: string): Promise<string | null> {
    try {
        if (!genAI) {
            console.warn('[OCR] EXPO_PUBLIC_GEMINI_API_KEY is not set — skipping OCR');
            return null;
        }
        const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });

        const prompt = "Extract the license plate number from this image. Return ONLY the alphanumeric characters of the license plate (e.g. ABC123). Do NOT include any hyphens, spaces, or other special characters. If there is no license plate or it is unreadable, return 'NONE'. Do not include any other text like vehicle model or make.";

        const imageParts = [
            {
                inlineData: {
                    data: base64Image,
                    mimeType: 'image/jpeg'
                }
            }
        ];

        const result = await model.generateContent([prompt, ...imageParts]);
        const response = await result.response;
        const text = response.text().trim();

        console.log('[OCR] Gemini response text:', text);

        if (!text || text === 'NONE' || text === '') {
            console.log('[OCR] No text found in image');
            return null;
        }

        // Try to find a plate-like pattern in the text
        const match = text.match(PLATE_REGEX);
        if (match) {
            const plate = match[1].replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
            console.log('[OCR] Plate detected:', plate);
            return plate;
        }

        // Fallback: if text is short and looks alphanumeric, return it as-is
        const trimmed = text.replace(/[^a-zA-Z0-9]/g, '');
        if (trimmed.length >= 3 && trimmed.length <= 12 && /^[A-Z0-9]+$/i.test(trimmed)) {
            console.log('[OCR] Fallback plate text:', trimmed.toUpperCase());
            return trimmed.toUpperCase();
        }

        console.log('[OCR] No plate pattern matched');
        return null;
    } catch (error) {
        console.error('[OCR] detectLicensePlate error:', error);
        return null;
    }
}

/**
 * OCR Service
 *
 * Uses Google Cloud Vision API to detect license plate text from a photo URI.
 * Called by the security gate-entry screen when the guard taps the camera scan button.
 *
 * Flow:
 *  1. Convert the photo URI to a base64 string
 *  2. POST to Vision API TEXT_DETECTION endpoint
 *  3. Parse the response and return the best plate candidate or null
 */

const VISION_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_VISION_API_KEY;
const VISION_API_URL = `https://vision.googleapis.com/v1/images:annotate?key=${VISION_API_KEY}`;

/**
 * Convert a local file URI to a base64-encoded string.
 * Works on both React Native (fetch blob) and web.
 */
async function uriToBase64(uri: string): Promise<string> {
    const response = await fetch(uri);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const result = reader.result as string;
            // Strip the data URL prefix (e.g. "data:image/jpeg;base64,")
            resolve(result.split(',')[1]);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

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
 * @param photoUri  Local URI of the captured photo (from expo-camera)
 * @returns The detected plate string (e.g. "ABC-1234"), or null if none found
 */
export async function detectLicensePlate(photoUri: string): Promise<string | null> {
    try {
        if (!VISION_API_KEY) {
            console.warn('[OCR] EXPO_PUBLIC_GOOGLE_VISION_API_KEY is not set — skipping OCR');
            return null;
        }

        const base64Image = await uriToBase64(photoUri);

        const requestBody = {
            requests: [
                {
                    image: { content: base64Image },
                    features: [{ type: 'TEXT_DETECTION', maxResults: 10 }],
                    imageContext: {
                        languageHints: ['en'],
                    },
                },
            ],
        };

        const response = await fetch(VISION_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
            const errBody = await response.text();
            if (response.status === 403) {
                console.error(
                    '[OCR] Vision API 403 Forbidden — the Cloud Vision API may not be enabled for this key.\n' +
                    'Fix: https://console.cloud.google.com/apis/library/vision.googleapis.com\n' +
                    'Also check API key restrictions under APIs & Services → Credentials.',
                    errBody
                );
            } else {
                console.error('[OCR] Vision API error:', response.status, errBody);
            }
            return null;
        }

        const data = await response.json();
        const annotations = data?.responses?.[0]?.textAnnotations;

        if (!annotations || annotations.length === 0) {
            console.log('[OCR] No text found in image');
            return null;
        }

        // The first annotation is the full detected text block
        const fullText: string = annotations[0].description ?? '';
        console.log('[OCR] Raw Vision text:', fullText);

        // Try to find a plate-like pattern in the text
        const match = fullText.match(PLATE_REGEX);
        if (match) {
            const plate = match[1].toUpperCase().replace(/\s+/, '-');
            console.log('[OCR] Plate detected:', plate);
            return plate;
        }

        // Fallback: if text is short and looks alphanumeric, return it as-is
        const trimmed = fullText.trim().replace(/\n/g, ' ');
        if (trimmed.length >= 4 && trimmed.length <= 12 && /^[A-Z0-9\-\s]+$/i.test(trimmed)) {
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


import { GoogleGenAI } from "@google/genai";
import type { VercelRequest, VercelResponse } from '@vercel/node';

export const config = {
    api: {
        bodyParser: {
            sizeLimit: '4mb', // Limit payload size
        },
    },
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // Ensure CORS headers
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { imageBase64, mimeType, apiKey: userApiKey } = req.body;

    if (!imageBase64 || !mimeType) {
        return res.status(400).json({ error: 'Missing image data.' });
    }

    // Determine API Key: Use user provided key first, otherwise fallback to server env var
    let apiKey = userApiKey;
    if (!apiKey) {
        apiKey = process.env.API_KEY;
    }

    if (!apiKey) {
        console.error("Error: API Key is missing (neither in request nor env).");
        return res.status(500).json({ 
            error: 'Configuration Error', 
            details: 'Chưa cấu hình API Key. Vui lòng thêm biến môi trường API_KEY trong cài đặt Vercel hoặc nhập trực tiếp vào ô API Key trên giao diện.' 
        });
    }

    try {
        const ai = new GoogleGenAI({ apiKey });
        
        // Using gemini-2.5-flash for fast and efficient multimodal tasks
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: {
                parts: [
                    {
                        inlineData: {
                            mimeType: mimeType,
                            data: imageBase64
                        }
                    },
                    {
                        text: "Bạn là một công cụ OCR chuyên nghiệp. Hãy trích xuất toàn bộ văn bản có trong hình ảnh này. Giữ nguyên định dạng gốc, xuống dòng nếu cần thiết. Chỉ trả về nội dung văn bản, không thêm bất kỳ lời dẫn hay giải thích nào."
                    }
                ]
            }
        });

        const text = response.text || "Không trích xuất được văn bản (AI trả về rỗng).";

        return res.status(200).json({ text });

    } catch (error) {
        console.error("AI Generation Error:", error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown AI error';
        return res.status(500).json({ error: 'Failed to process image.', details: errorMessage });
    }
}

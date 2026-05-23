const { GoogleGenAI } = require('@google/genai');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

const SYSTEM_INSTRUCTION = `Eres AURA, la asistente inteligente de SIRA (Sistema Inteligente de Recuperación Activa).
SIRA es una plataforma de permanencia estudiantil y recuperación financiera para instituciones educativas.
Tu rol es ayudar a administradores financieros y a estudiantes de forma empática y orientada a soluciones.
Responde en español, de forma concisa y útil.`;

let client = null;
if (GEMINI_API_KEY) {
  client = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
}

/**
 * Send a user message to AURA and return the assistant's reply.
 * @param {string} message - User input.
 * @returns {Promise<{ reply: string, mocked: boolean }>}
 */
const chat = async (message) => {
  if (!client) {
    return {
      reply:
        'AURA aún no está conectada (falta configurar GEMINI_API_KEY en el backend). ' +
        'Mientras tanto, puedo mostrar respuestas de ejemplo en la UI.',
      mocked: true,
    };
  }

  const response = await client.models.generateContent({
    model: MODEL,
    contents: message,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
    },
  });

  return {
    reply: response.text ?? '',
    mocked: false,
  };
};

module.exports = {
  chat,
};

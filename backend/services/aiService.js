import axios from 'axios';

/**
 * Génère une réponse de l'IA en utilisant le modèle LLaMA 3.1
 * @param {string} prompt - Le prompt à envoyer à l'IA
 * @returns {Promise<Object>} La réponse de l'IA
 */
export const generateAIResponse = async (prompt) => {
  try {
    const OLLAMA_URL = 'https://blue-oranges-kiss.loca.lt/v1/chat/completions';
    
    const response = await axios.post(
      OLLAMA_URL,
      { "model": "llama3.1", "messages": [{ "role": "user", "content": prompt }] },
      {
        headers: {
          'Authorization': 'Bearer ollama',
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data;
  } catch (error) {
    console.error('Erreur lors de la génération de la réponse AI:', error);
    throw error;
  }
};

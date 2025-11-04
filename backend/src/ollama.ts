import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';

export async function categorizeTags(noteContent: string): Promise<string[]> {
  try {
    const prompt = `Analyze the following note and suggest 1-5 relevant tags/categories.
Return ONLY the tags as a comma-separated list, no explanations or additional text.
The tags should be single words or short phrases (2-3 words max), lowercase.

Note: "${noteContent}"

Tags:`;

    const response = await axios.post(
      `${OLLAMA_BASE_URL}/api/generate`,
      {
        model: 'gpt-oss:120b-cloud',
        prompt,
        stream: false,
        options: {
          temperature: 0.3,
          top_p: 0.9,
        },
      },
      {
        timeout: 60000, // 60 seconds for cloud model
      }
    );

    const generatedText = response.data.response.trim();

    // Parse comma-separated tags
    const tags = generatedText
      .split(',')
      .map((tag: string) => tag.trim().toLowerCase())
      .filter((tag: string) => tag.length > 0 && tag.length < 50)
      .slice(0, 5); // Maximum 5 tags

    return tags.length > 0 ? tags : ['uncategorized'];
  } catch (error) {
    console.error('Error calling Ollama:', error);
    // Fallback to basic keyword extraction
    return extractSimpleTags(noteContent);
  }
}

function extractSimpleTags(content: string): string[] {
  const commonWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'as']);

  const words = content
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 3 && !commonWords.has(word));

  const uniqueWords = [...new Set(words)].slice(0, 3);

  return uniqueWords.length > 0 ? uniqueWords : ['note'];
}

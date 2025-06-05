import { apiRequest } from './queryClient';

export interface GenerateAIReplyParams {
  messageId: number;
  content: string;
  senderName: string;
  source: 'instagram' | 'youtube';
}

export async function generateAIReply(params: GenerateAIReplyParams): Promise<string> {
  try {
    const response = await apiRequest('POST', '/api/ai/generate-reply', params);
    const data = await response.json();
    return data.reply;
  } catch (error) {
    console.error('Error generating AI reply:', error);
    throw new Error('Failed to generate AI reply');
  }
}

export async function classifyMessageIntent(text: string): Promise<{
  isHighIntent: boolean;
  confidence: number;
  category: string;
}> {
  try {
    const response = await apiRequest('POST', '/api/ai/classify-intent', { text });
    return await response.json();
  } catch (error) {
    console.error('Error classifying message intent:', error);
    throw new Error('Failed to classify message intent');
  }
}

export async function detectSensitiveContent(text: string): Promise<{
  isSensitive: boolean;
  confidence: number;
  category: string;
}> {
  try {
    const response = await apiRequest('POST', '/api/ai/detect-sensitive', { text });
    return await response.json();
  } catch (error) {
    console.error('Error detecting sensitive content:', error);
    throw new Error('Failed to detect sensitive content');
  }
}

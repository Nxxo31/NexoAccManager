import axios from 'axios';

export async function solveCaptcha(imageBase64: string, apiKey?: string): Promise<string> {
  if (!apiKey) throw new Error('Nopecha API key not configured');
  const response = await axios.post('https://api.nopecha.com/task', {
    type: 'image',
    key: apiKey,
    image: imageBase64,
  });
  if (response.data.status === 'ready') return response.data.solution;
  throw new Error('CAPTCHA solving failed');
}
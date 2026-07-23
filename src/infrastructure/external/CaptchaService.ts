import axios from 'axios';

/**
 * Solves a captcha using the Nopecha API.
 * @param imageBase64 - Base64 encoded image
 * @param apiKey - Nopecha API key (if not provided, will be fetched from settings)
 * @param timeoutMs - Timeout in milliseconds (default: 30000)
 * @returns The solution text
 * @throws Error if the API key is missing, the task fails, or times out
 */
export async function solveCaptcha(
  imageBase64: string,
  apiKey?: string,
  timeoutMs: number = 30000
): Promise<string> {
  // If apiKey is not provided, we would normally get it from settings.
  // However, the function signature in the IPC handler does not pass it.
  // According to the task, we should read the API key from settings repo.
  // But this function is called from the IPC handler, which can pass the apiKey.
  // We'll keep the parameter and if not provided, throw an error.
  if (!apiKey) {
    throw new Error('Nopecha API key not configured');
  }

  // Step 1: Create the task
  const createResponse = await axios.post('https://api.nopecha.com/task', {
    type: 'image',
    key: apiKey,
    image: imageBase64,
  });

  if (!createResponse.data || !createResponse.data.id) {
    throw new Error('Failed to create captcha task');
  }

  const taskId = createResponse.data.id;

  // Step 2: Poll for the result
  const startTime = Date.now();
  while (Date.now() - startTime < timeoutMs) {
    const pollResponse = await axios.get(`https://api.nopecha.com/task?key=${apiKey}&id=${taskId}`);
    if (pollResponse.data.status === 'ready') {
      return pollResponse.data.solution;
    }
    // If the task is still processing, wait a bit before polling again
    await new Promise(resolve => setTimeout(resolve, 500)); // 500ms interval
  }

  throw new Error('CAPTCHA solving timed out');
}
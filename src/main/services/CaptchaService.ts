export class CaptchaService {
  private apiKey: string = '';

  /**
   * Set the API key for the captcha solving service.
   * @param key API key string
   */
  setApiKey(key: string): void {
    this.apiKey = key;
  }

  /**
   * Solve a captcha from a base64-encoded image.
   * This is a stub implementation.
   * @param imageBase64 Base64 encoded image data
   * @param apiKey Optional API key (if not set, uses the one set via setApiKey)
   * @returns The solved captcha text (empty string in this stub)
   */
  async solveCaptcha(imageBase64: string, apiKey?: string): Promise<string> {
    const key = apiKey ?? this.apiKey;
    if (!key) {
      // No API key configured, return empty string as per stub requirement
      return '';
    }
    // In a real implementation, we would call an external captcha solving service here.
    // For now, we just return an empty string to indicate no solution.
    return '';
  }
}
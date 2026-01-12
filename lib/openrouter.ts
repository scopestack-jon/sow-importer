type Message = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

type CompletionOptions = {
  model?: string;
  temperature?: number;
  maxTokens?: number;
};

type OpenRouterResponse = {
  id: string;
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
};

const DEFAULT_MODEL = 'anthropic/claude-3.5-sonnet';
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

export class OpenRouterClient {
  private apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.OPENROUTER_API_KEY || '';
    
    if (!this.apiKey) {
      throw new Error('OPENROUTER_API_KEY is required');
    }
  }

  async chat(
    messages: Message[],
    options: CompletionOptions = {}
  ): Promise<string> {
    const {
      model = DEFAULT_MODEL,
      temperature = 0.3,
      maxTokens = 4096,
    } = options;

    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        'X-Title': 'SOW Importer',
      },
      body: JSON.stringify({
        model,
        messages,
        temperature,
        max_tokens: maxTokens,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`OpenRouter API error: ${response.status} - ${errorBody}`);
    }

    const data: OpenRouterResponse = await response.json();
    
    if (!data.choices || data.choices.length === 0) {
      throw new Error('No response from OpenRouter');
    }

    return data.choices[0].message.content;
  }

  async chatJson<T>(
    messages: Message[],
    options: CompletionOptions = {}
  ): Promise<T> {
    const content = await this.chat(messages, options);
    
    // Extract JSON from response (may be wrapped in markdown code blocks)
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/) || 
                      content.match(/(\{[\s\S]*\})/);
    
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    try {
      return JSON.parse(jsonMatch[1].trim()) as T;
    } catch {
      throw new Error(`Failed to parse JSON response: ${content.substring(0, 200)}`);
    }
  }
}

let clientInstance: OpenRouterClient | null = null;

export function getOpenRouterClient(): OpenRouterClient {
  if (!clientInstance) {
    clientInstance = new OpenRouterClient();
  }
  return clientInstance;
}

/* Ambient declarations to satisfy TypeScript in the Vite build for Deno Edge Functions */

// Global Deno env accessor (used only in Edge Functions)
declare const Deno: {
  env: {
    get(name: string): string | undefined;
  };
};

// Ambient module declaration for Deno's HTTP server import by URL
declare module "https://deno.land/std@0.190.0/http/server.ts" {
  export function serve(
    handler: (req: Request) => Response | Promise<Response>
  ): void;
}

// Ambient module declaration for OpenAI npm import in Deno
declare module "npm:openai@4" {
  type ChatCompletionChunk = {
    choices: Array<{
      delta?: {
        content?: string;
      };
    }>;
  };

  type ChatCompletionResponse = {
    choices: Array<{
      message?: {
        content?: string;
      };
    }>;
  };

  type StreamingResponse = AsyncIterable<ChatCompletionChunk>;

  export default class OpenAI {
    constructor(config: { apiKey: string | undefined });
    chat: {
      completions: {
        create(params: {
          model: string;
          messages: Array<{ role: string; content: string }>;
          temperature?: number;
          stream: true;
        }): Promise<StreamingResponse>;
        create(params: {
          model: string;
          messages: Array<{ role: string; content: string }>;
          temperature?: number;
          stream?: false;
        }): Promise<ChatCompletionResponse>;
      };
    };
  }
}
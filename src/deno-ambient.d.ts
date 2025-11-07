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

// Ambient module declaration for Deno std@0.224.0
declare module "https://deno.land/std@0.224.0/http/server.ts" {
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

  type Thread = {
    id: string;
    object: string;
    created_at: number;
  };

  type Message = {
    id: string;
    object: string;
    created_at: number;
    thread_id: string;
    role: string;
    content: Array<{
      type: string;
      text?: { value: string };
    }>;
  };

  type Run = {
    id: string;
    object: string;
    created_at: number;
    thread_id: string;
    assistant_id: string;
    status: string;
  };

  type RunStep = {
    id: string;
    object: string;
    type: string;
    status: string;
  };

  type AssistantStreamEvent = {
    event: string;
    data: any;
  };

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
    beta: {
      threads: {
        create(): Promise<Thread>;
        messages: {
          create(
            threadId: string,
            params: { role: string; content: string }
          ): Promise<Message>;
          list(threadId: string): Promise<{ data: Message[] }>;
        };
        runs: {
          create(
            threadId: string,
            params: { assistant_id: string }
          ): Promise<Run>;
          retrieve(threadId: string, runId: string): Promise<Run>;
          stream(
            threadId: string,
            params: { assistant_id: string }
          ): Promise<AsyncIterable<AssistantStreamEvent>>;
        };
      };
    };
  }
}
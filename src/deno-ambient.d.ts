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
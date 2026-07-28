declare interface Fetcher { fetch(input: Request | URL | string, init?: RequestInit): Promise<Response>; }
declare type D1Database = { readonly __d1Binding?: never };
declare module "cloudflare:workers" { export const env: { DB?: D1Database }; }

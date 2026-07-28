import vinext from "vinext";
import { defineConfig } from "vite";
import hostingConfig from "./.openai/hosting.json";
import { sites } from "./build/sites-vite-plugin";

const SITE_CREATOR_PLACEHOLDER_DATABASE_ID =
  "00000000-0000-4000-8000-000000000000";

const { d1, r2 } = hostingConfig;
const useCloudflareRuntime = process.env.LOCAL_VITE !== "1";

// macOS Seatbelt blocks FSEvents, so Codex previews need polling for HMR.
const isCodexSeatbeltSandbox = process.env.CODEX_SANDBOX === "seatbelt";

const localBindingConfig = {
  main: "./worker/index.ts",
  compatibility_flags: ["nodejs_compat"],
  d1_databases: d1
    ? [
        {
          binding: d1,
          database_name: "site-creator-d1",
          database_id: SITE_CREATOR_PLACEHOLDER_DATABASE_ID,
        },
      ]
    : [],
  r2_buckets: r2
    ? [
        {
          binding: r2,
          bucket_name: "site-creator-r2",
        },
      ]
    : [],
};

export default defineConfig(async () => {
  // Keep Wrangler and Miniflare state project-local. These are non-secret tool
  // settings; application environment belongs in ignored `.env*` files.
  process.env.WRANGLER_WRITE_LOGS ??= "false";
  process.env.WRANGLER_LOG_PATH ??= ".wrangler/logs";
  process.env.MINIFLARE_REGISTRY_PATH ??= ".wrangler/registry";

  // The Cloudflare plugin opens an internal inspector port during development.
  // Local Vite mode deliberately omits it so `pnpm dev` works without a
  // Cloudflare runtime; production builds continue to use the plugin.
  const cloudflarePlugin = useCloudflareRuntime
    ? (await import("@cloudflare/vite-plugin")).cloudflare({
        viteEnvironment: { name: "rsc", childEnvironments: ["ssr"] },
        config: localBindingConfig,
      })
    : null;

  return {
    server: isCodexSeatbeltSandbox
      ? { watch: { useFsEvents: false, usePolling: true } }
      : undefined,
    plugins: [
      vinext(),
      sites(),
      ...(cloudflarePlugin ? [cloudflarePlugin] : []),
    ],
    // @prisma/client's generated runtime resolves its native query-engine
    // binary and schema.prisma relative to its own __dirname/eval("__dirname").
    // Bundling it into vinext's ESM server output breaks that (Node ESM has no
    // __dirname), so keep it external and let Node load it normally from
    // node_modules at runtime instead. Only applies to the plain-Node build
    // (LOCAL_VITE=1); the Cloudflare Workers build path is unaffected.
    ...(!useCloudflareRuntime
      ? {
          ssr: {
            external: ["@prisma/client", ".prisma/client"],
          },
        }
      : {}),
  };
});

import { defineCloudflareConfig } from "@opennextjs/cloudflare";

// Alle Seiten sind pro Person dynamisch. Kein ISR, darum kein Incremental Cache.
export default defineCloudflareConfig({});

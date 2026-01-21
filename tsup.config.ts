import { defineConfig } from "tsup";
import { readFileSync } from "fs";

const pkg = JSON.parse(readFileSync("./package.json", "utf-8"));

export default defineConfig({
  entry: { cli: "src/cli/index.ts" },
  format: ["esm"],
  dts: true,
  clean: true,
  target: "node20",
  shims: true,
  banner: {
    js: "#!/usr/bin/env node",
  },
  define: {
    __PKG_NAME__: JSON.stringify(pkg.name),
    __PKG_VERSION__: JSON.stringify(pkg.version),
  },
});

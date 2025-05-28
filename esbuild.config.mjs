import { build } from "esbuild";
import { execSync } from "node:child_process";

const watch = process.argv.includes("--watch");

const buildPlugin = () =>
  build({
	entryPoints: ["src/main.ts"],
	bundle: true,
	minify: !watch,
	outfile: "dist/main.js",
	format: "cjs",          // ← CommonJS 推奨
	target: "es2018",
	platform: "node",       // Obsidian は Node/Electron 上で動く
	external: ["obsidian", "electron"], // ★ ここがポイント
	logLevel: "info",
  }).catch(() => process.exit(1));

buildPlugin().then(() => {
  if (watch) {
    console.log("Watching for changes...");
  } else {
    // manifest & styles を dist へコピー
    execSync("cp manifest.json styles.css dist/", { stdio: "inherit" });
  }
});

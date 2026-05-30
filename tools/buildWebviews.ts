import { execFileSync } from "node:child_process";
import { resolve } from "node:path";
import { build } from "esbuild";
import { workspaceRoot } from "./lib/paths";

const webviewRoot = resolve(workspaceRoot, "src", "webviews");
const webviewCssInput = resolve(workspaceRoot, "src", "webviews", "globals.css");
const webviewCssOutput = resolve(workspaceRoot, "assets", "webviews", "webviewApp.css");
const webviewEntries = [
    {
        entryPoint: resolve(workspaceRoot, "src", "webviews", "App.tsx"),
        outfile: resolve(workspaceRoot, "assets", "webviews", "webviewApp.js"),
    },
] as const;

async function main(): Promise<void> {
    execFileSync(
        "bunx",
        ["tailwindcss", "-i", webviewCssInput, "-o", webviewCssOutput, "--minify"],
        {
            cwd: workspaceRoot,
            shell: process.platform === "win32",
            stdio: "inherit",
        },
    );

    for (const entry of webviewEntries) {
        await build({
            bundle: true,
            entryPoints: [entry.entryPoint],
            format: "iife",
            minify: true,
            outfile: entry.outfile,
            platform: "browser",
            sourcemap: false,
            target: "chrome120",
            alias: {
                "@": webviewRoot,
            },
        });
    }

    console.log(`Built ${webviewEntries.length} webview bundle(s).`);
}

void main();

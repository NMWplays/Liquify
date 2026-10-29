import { build, context } from "esbuild";
import { resolve } from "node:path";

const watch = process.argv.includes("--watch");
const reactShim = resolve("src/settings/react-shim.ts");

const options = {
  entryPoints: ["src/theme.ts"],
  outfile: "dist/theme.js",
  bundle: true,
  format: "iife",
  target: ["chrome98"],
  platform: "browser",
  loader: {
    ".png": "dataurl",
  },
  jsxFactory: "React.createElement",
  jsxFragment: "React.Fragment",
  plugins: [
    {
      name: "spotikit-react-shim",
      setup(build) {
        build.onResolve({ filter: /^react$/ }, () => ({ path: reactShim }));
      },
    },
  ],
};

if (watch) {
  const ctx = await context(options);
  await ctx.watch();
  console.log("Watching src/theme.ts -> dist/theme.js");
} else {
  await build(options);
}

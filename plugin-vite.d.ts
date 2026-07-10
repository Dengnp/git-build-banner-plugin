import type { Plugin } from "vite";
import type { BuildInfoPluginOptions } from "./plugin-webpack";

declare function buildInfoVitePlugin(options?: BuildInfoPluginOptions): Plugin;

export = buildInfoVitePlugin;

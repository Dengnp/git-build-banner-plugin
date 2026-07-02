const { collectInfo, printTerminal, generateBanner } = require("./index");

/**
 * BuildInfoPlugin — Vite 版
 *
 * 通过 transformIndexHtml 钩子注入构建信息到 HTML 页面，
 * 开发模式（vite dev）和生产模式（vite build）均生效。
 *
 * @param {Object} options  同 index.collectInfo 的配置
 *
 * @example
 * // vite.config.js
 * import buildInfoPlugin from "build-info-webpack-plugin/vite";
 * export default {
 *   plugins: [buildInfoPlugin()]
 * };
 */
function buildInfoVitePlugin(options = {}) {
  // 插件加载时采集信息（每个进程只执行一次）
  const info = collectInfo(options);

  if (options.printTerminal !== false) {
    printTerminal(info);
  }

  const bannerCode = generateBanner(info);

  return {
    name: "build-info",

    /**
     * 在 HTML 中注入 <script> 标签
     * Vite dev 模式每次请求都会调用，build 模式只调用一次
     */
    transformIndexHtml(html) {
      return {
        html,
        tags: [
          {
            tag: "script",
            children: bannerCode,
            injectTo: "head-prepend",
          },
        ],
      };
    },
  };
}

module.exports = buildInfoVitePlugin;

const webpack = require("webpack");
const { collectInfo, printTerminal, generateBanner } = require("./index");

/**
 * BuildInfoPlugin — Webpack 版
 *
 * 只往 HTML 产物注入 <script> 注册 __buildInfo() 命令，
 * 不污染 JS/CSS 等 bundle 文件。
 *
 * @param {Object} options  同 index.collectInfo 的配置
 */
class BuildInfoWebpackPlugin {
  constructor(options = {}) {
    this.options = options;
  }

  apply(compiler) {
    const info = collectInfo(this.options);

    if (this.options.printTerminal !== false) {
      printTerminal(info);
    }

    if (this.options.printBrowser !== false) {
      const bannerCode = generateBanner(info);
      const scriptTag = "<script>" + bannerCode + "</script>";

      compiler.hooks.compilation.tap("BuildInfoWebpackPlugin", (compilation) => {
        // 只处理主 compilation，跳过子编译（如 HtmlWebpackPlugin 内部编译）
        if (compilation.compiler !== compiler) return;

        // HtmlWebpackPlugin v5 专用：通过其 beforeEmit 钩子精确注入
        try {
          const HWP = require("html-webpack-plugin");
          if (HWP && typeof HWP.getHooks === "function") {
            HWP.getHooks(compilation).beforeEmit.tapAsync(
              "BuildInfoWebpackPlugin",
              (data, cb) => {
                data.html = _injectScript(data.html, scriptTag);
                cb(null, data);
              }
            );
            return; // 走 HWP 专用通道，不再走通用 asset 逻辑
          }
        } catch (_) {
          // html-webpack-plugin 未安装，走下面的通用 asset 逻辑
        }

        // 通用路径：没有 HtmlWebpackPlugin 时，直接修改 HTML asset
        const { hooks } = compilation;
        const hook = hooks.processAssets
          ? hooks.processAssets // webpack 5
          : hooks.optimizeAssets; // webpack 4

        const stage =
          hooks.processAssets && webpack.Compilation
            ? webpack.Compilation.PROCESS_ASSETS_STAGE_OPTIMIZE
            : undefined;

        hook.tap(
          hooks.processAssets
            ? { name: "BuildInfoWebpackPlugin", stage }
            : "BuildInfoWebpackPlugin",
          () => {
            _injectToHTMLAssets(compilation, scriptTag);
          }
        );
      });
    }
  }
}

/**
 * 往 HTML 字符串中注入 <script> 标签
 */
function _injectScript(html, scriptTag) {
  if (typeof html !== "string") {
    html = String(html);
  }
  if (html.includes("</head>")) {
    return html.replace("</head>", scriptTag + "\n</head>");
  }
  if (html.includes("</body>")) {
    return html.replace("</body>", scriptTag + "\n</body>");
  }
  return scriptTag + "\n" + html;
}

/**
 * 遍历 compilation.assets 找到 HTML 文件并注入
 */
function _injectToHTMLAssets(compilation, scriptTag) {
  const filenames = Object.keys(compilation.assets);
  for (let i = 0; i < filenames.length; i++) {
    const filename = filenames[i];
    if (!/\.html?$/i.test(filename)) continue;

    try {
      const asset = compilation.assets[filename];
      const raw =
        typeof asset.source === "function" ? asset.source() : asset;
      // webpack 5 RawSource.source() 返回 Buffer
      const html =
        Buffer.isBuffer(raw) ? raw.toString("utf-8") : String(raw);

      const newHtml = _injectScript(html, scriptTag);

      compilation.assets[filename] = _createSource(newHtml);
    } catch (_) {
      // 单个文件失败不影响整体
    }
  }
}

/**
 * 创建 Source 对象，兼容 webpack 4 / 5
 */
function _createSource(content) {
  // webpack 5
  if (webpack.sources && webpack.sources.RawSource) {
    return new webpack.sources.RawSource(content);
  }
  // webpack 4
  try {
    return new (require("webpack-sources").RawSource)(content);
  } catch (_) {
    // 最小降级实现
    return {
      source: function () {
        return content;
      },
      size: function () {
        return Buffer.byteLength(content, "utf-8");
      },
    };
  }
}

module.exports = BuildInfoWebpackPlugin;

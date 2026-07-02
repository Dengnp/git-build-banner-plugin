const webpack = require("webpack");
const { collectInfo, printTerminal, generateBanner } = require("./index");

/**
 * BuildInfoPlugin — Webpack 版
 *
 * 通过 BannerPlugin 将构建信息注入到打包产物头部。
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
      new webpack.BannerPlugin({
        banner: generateBanner(info),
        raw: true,
        entryOnly: true,
      }).apply(compiler);
    }
  }
}

module.exports = BuildInfoWebpackPlugin;

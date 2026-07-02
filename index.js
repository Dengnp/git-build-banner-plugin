const { execSync } = require("child_process");
const path = require("path");
const webpack = require("webpack");

/**
 * BuildInfoPlugin — 自动注入打包信息到浏览器控制台
 *
 * 每次 webpack 打包时自动采集 Git 信息（项目名/分支/提交哈希）和打包时间，
 * 注入到打包产物的头部。浏览器打开页面后自动在控制台打印，同时挂载到
 * window.__APP_INFO__ 方便随时查看。
 *
 * @example
 * // vue.config.js / webpack.config.js
 * const BuildInfoPlugin = require("build-info-webpack-plugin");
 * module.exports = {
 *   configureWebpack: {
 *     plugins: [new BuildInfoPlugin()]
 *   }
 * };
 *
 * @param {Object} options
 * @param {string}  options.timeZone       - 时区，默认 "Asia/Shanghai"
 * @param {string}  options.projectName    - 手动指定项目名（跳过 Git 自动检测）
 * @param {boolean} options.printTerminal  - 打包时终端是否打印，默认 true
 * @param {boolean} options.printBrowser   - 浏览器控制台是否打印，默认 true
 */
class BuildInfoPlugin {
  constructor(options = {}) {
    this.timeZone = options.timeZone || "Asia/Shanghai";
    this._customProjectName = options.projectName || null;
    this.printTerminal = options.printTerminal !== false;
    this.printBrowser = options.printBrowser !== false;
  }

  apply(compiler) {
    const info = this._collect();
    if (this.printTerminal) this._printTerminal(info);
    if (this.printBrowser) {
      const code = this._banner(info);
      new webpack.BannerPlugin({
        banner: code,
        raw: true,
        entryOnly: true,
      }).apply(compiler);
    }
  }

  // ============================================================
  //  信息采集（每个方法独立 try-catch，绝不抛异常）
  // ============================================================

  _collect() {
    const projectName = this._customProjectName || this._getProjectName();

    return {
      projectName,
      gitBranch: this._getGitBranch(),
      gitCommit: this._getGitCommit(),
      buildTime: this._getBuildTime(),
    };
  }

  _getProjectName() {
    try {
      const url = execSync("git remote get-url origin", { encoding: "utf-8", stdio: ["pipe", "pipe", "ignore"] }).trim();
      const m = url.match(/\/([^/]+?)(?:\.git)?$/);
      if (m) return m[1];
    } catch (_) {}

    try {
      const top = execSync("git rev-parse --show-toplevel", { encoding: "utf-8", stdio: ["pipe", "pipe", "ignore"] }).trim();
      return path.basename(top);
    } catch (_) {}

    return "unknown";
  }

  _getGitBranch() {
    try {
      return execSync("git rev-parse --abbrev-ref HEAD", { encoding: "utf-8", stdio: ["pipe", "pipe", "ignore"] }).trim();
    } catch (_) {
      return "unknown";
    }
  }

  _getGitCommit() {
    try {
      return execSync("git rev-parse --short HEAD", { encoding: "utf-8", stdio: ["pipe", "pipe", "ignore"] }).trim();
    } catch (_) {
      return "unknown";
    }
  }

  _getBuildTime() {
    try {
      return new Date().toLocaleString("zh-CN", { timeZone: this.timeZone, hour12: false });
    } catch (_) {
      // timeZone 无效时降级
      return new Date().toLocaleString("zh-CN", { hour12: false });
    }
  }

  // ============================================================
  //  终端输出
  // ============================================================

  _printTerminal(info) {
    console.log(`\n📦 打包信息:
  项目名: ${info.projectName}
  分支:   ${info.gitBranch}
  提交:   ${info.gitCommit}
  时间:   ${info.buildTime}\n`);
  }

  // ============================================================
  //  生成浏览器端注入代码（IIFE + 执行守卫，防止多 chunk 重复打印）
  // ============================================================

  _banner(info) {
    return [
      '(function(){',
      'if(window.__APP_INFO_PRINTED__)return;',
      'window.__APP_INFO_PRINTED__=true;',
      'var i=' + JSON.stringify(info) + ';',
      'var s1="color:#3b82f6;font-size:14px;font-weight:bold;";',
      'var s2="color:#22c55e;font-size:12px;";',
      'var s3="color:#f59e0b;font-size:12px;";',
      'var s4="color:#8b5cf6;font-size:12px;";',
      'console.log(',
      '  "%c🏷 项目: %c"+i.projectName+',
      '  "  %c🌿 分支: %c"+i.gitBranch+',
      '  "  %c📝 提交: %c"+i.gitCommit+',
      '  "  %c🕐 打包: %c"+i.buildTime,',
      '  s1,s2,s1,s3,s1,s4,s1,s2',
      ');',
      'window.__APP_INFO__=i;',
      '})();',
    ].join('\n');
  }
}

module.exports = BuildInfoPlugin;

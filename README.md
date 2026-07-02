# build-info-webpack-plugin

每次 webpack 打包时自动采集 **项目名**、**Git 分支**、**Git 提交哈希**、**打包时间**，注入到打包产物头部。浏览器打开页面后自动在控制台打印，同时挂载到 `window.__APP_INFO__` 方便随时查看。

> 🎯 解决痛点：前端部署到线上后，排查问题时找不到对应哪个项目、哪个分支、什么时间打包的代码。

## 效果

### 终端（打包时）

```
📦 打包信息:
  项目名: my-frontend-app
  分支:   feature/new-dashboard
  提交:   a1b2c3d
  时间:   2026/7/2 15:30:00
```

### 浏览器控制台（页面打开后自动打印）

```
🏷 项目: my-frontend-app  🌿 分支: feature/new-dashboard  📝 提交: a1b2c3d  🕐 打包: 2026/7/2 15:30:00
```

控制台输入 `window.__APP_INFO__` 可随时查看完整信息。

## 安装

```bash
npm install build-info-webpack-plugin --save-dev
```

## 用法

### Vue CLI（vue.config.js）

```js
const BuildInfoPlugin = require("build-info-webpack-plugin");

module.exports = {
  configureWebpack: {
    plugins: [new BuildInfoPlugin()],
  },
};
```

### 原生 webpack（webpack.config.js）

```js
const BuildInfoPlugin = require("build-info-webpack-plugin");

module.exports = {
  plugins: [new BuildInfoPlugin()],
};
```

### Vite / Rollup

本插件仅支持 webpack。Vite 项目请使用 Vite 插件版本（TODO）。

## 配置

```js
new BuildInfoPlugin({
  timeZone: "Asia/Shanghai",  // 时区，默认 Asia/Shanghai
  projectName: "my-app",      // 手动指定项目名（跳过 Git 自动检测）
  printTerminal: true,        // 打包时终端是否打印，默认 true
  printBrowser: true,         // 浏览器控制台是否打印，默认 true
})
```

## 项目名获取策略

| 优先级 | 来源 | 示例 |
|--------|------|------|
| 1 | `options.projectName`（手动指定） | `"my-app"` |
| 2 | `git remote get-url origin` 提取仓库名 | `"my-frontend-app"` |
| 3 | `git rev-parse --show-toplevel` 目录名 | `"my-frontend-app"` |
| 4 | 兜底字符串 | `"unknown"` |

## 容错

- Git 未安装 / 不在 Git 仓库 / 无远程仓库 → **不会报错**，对应字段降级为 `"unknown"`
- 时区无效 → 自动降级为系统默认时区
- 插件内部任何异常 → 打包正常继续，只是不注入 banner

## License

MIT

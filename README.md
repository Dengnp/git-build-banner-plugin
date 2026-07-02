# build-info-webpack-plugin

每次构建时自动采集 **项目名**、**Git 分支**、**Git 提交哈希**、**打包时间**，注入到产物中。浏览器打开页面后自动在控制台打印，同时挂载到 `window.__APP_INFO__`。

> 🎯 前端部署到线上后，排查问题时一眼就知道对应哪个项目、哪个分支、什么时间打的包。
>
> ✅ 同时支持 **Webpack** 和 **Vite**

## 效果

### 终端（打包时）

```
📦 打包信息:
  项目名: my-frontend-app
  分支:   feature/new-dashboard
  提交:   a1b2c3d
  时间:   2026/7/2 15:30:00
```

### 浏览器控制台（页面加载后自动打印）

```
🏷 项目: my-frontend-app  🌿 分支: feature/new-dashboard  📝 提交: a1b2c3d  🕐 打包: 2026/7/2 15:30:00
```

控制台输入 `window.__APP_INFO__` 随时查看完整信息。

---

## 安装

```bash
npm install build-info-webpack-plugin --save-dev
```

---

## 用法

### Webpack / Vue CLI

```js
// webpack.config.js 或 vue.config.js
const BuildInfoPlugin = require("build-info-webpack-plugin");

module.exports = {
  // Vue CLI 写在 configureWebpack.plugins 里
  configureWebpack: {
    plugins: [new BuildInfoPlugin()],
  },
};
```

### Vite

```js
// vite.config.js
import buildInfoPlugin from "build-info-webpack-plugin/vite";

export default {
  plugins: [buildInfoPlugin()],
};
```

> Vite 版通过 `transformIndexHtml` 钩子注入 `<script>` 到 HTML，开发模式和生产模式均生效。

---

## 配置

```js
new BuildInfoPlugin({
  timeZone: "Asia/Shanghai", // 时区，默认 Asia/Shanghai
  projectName: "my-app",     // 手动指定项目名（跳过 Git 自动检测）
  printTerminal: true,       // 终端是否打印，默认 true
  printBrowser: true,        // 浏览器是否打印，默认 true
})
```

| 选项 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `timeZone` | `string` | `"Asia/Shanghai"` | 打包时间的时区 |
| `projectName` | `string` | 自动检测 | 手动指定项目名 |
| `printTerminal` | `boolean` | `true` | 构建时终端是否打印 |
| `printBrowser` | `boolean` | `true` | 浏览器控制台是否打印 |

---

## 项目名获取策略

| 优先级 | 来源 | 示例 |
|--------|------|------|
| 1 | `options.projectName`（手动指定） | `"my-app"` |
| 2 | `git remote get-url origin` 提取仓库名 | `"my-frontend"` |
| 3 | `git rev-parse --show-toplevel` 目录名 | `"my-frontend"` |
| 4 | 兜底 | `"unknown"` |

---

## 容错

- Git 未安装 / 不在仓库 / 无远程 → **不报错**，对应字段降级为 `"unknown"`
- 时区无效 → 自动降级为系统时区
- 插件内部任何异常 → 构建正常继续

## License

MIT

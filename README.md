# git-build-banner-plugin

每次构建时自动采集 **项目名**、**Git 分支**、**Git 提交哈希**、**打包时间**，注入到产物中。同时支持追踪**自定义环境变量**（如 `--env.NO_LOGIN=true`），方便区分不同构建参数。

> 🎯 前端部署到线上后，排查问题时一眼就知道对应哪个项目、哪个分支、什么时间打的包、用了什么构建参数。
>
> ✅ 同时支持 **Webpack ≥4** 和 **Vite ≥2** ｜ **Node ≥14**

## 效果

### 终端（打包时）

```
📦 打包信息:
  项目名: my-frontend-app
  构建:   build
  变量:   NO_LOGIN=true, SYS_CODE=420100
  分支:   feature/new-dashboard
  提交:   a1b2c3d
  时间:   2026/7/7 15:30:00
```

### 浏览器控制台

页面加载后只显示一行灰色提示，不会自动刷屏：

```
💡 输入 __buildInfo() 查看打包信息
```

在控制台输入 `__buildInfo()` 按需查看：

```
🏷 项目: my-frontend-app  🌿 分支: feature/new-dashboard  📝 提交: a1b2c3d  🕐 打包: 2026/7/7 15:30:00
🔧 变量: NO_LOGIN=true, SYS_CODE=420100
```

也可通过 `window.__APP_INFO__` 程序化读取完整构建信息。

---

## 安装

```bash
npm install git-build-banner-plugin --save-dev
```

---

## 用法

### Webpack / Vue CLI

```js
// webpack.config.js 或 vue.config.js
const BuildInfoPlugin = require("git-build-banner-plugin");

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
import buildInfoPlugin from "git-build-banner-plugin/vite";

export default {
  plugins: [buildInfoPlugin()],
};
```

> 两种模式都**只往 HTML 注入** `<script>`，不污染 JS / CSS bundle 文件。

### TypeScript

类型声明已内置，直接 import 即可：

```ts
// webpack.config.ts
import BuildInfoPlugin from "git-build-banner-plugin";
new BuildInfoPlugin({ envPrefix: "VUE_APP_" });

// vite.config.ts
import buildInfoPlugin from "git-build-banner-plugin/vite";
buildInfoPlugin({ envPrefix: "VUE_APP_" });
```

---

## 配置

```js
new BuildInfoPlugin({
  timeZone: "Asia/Shanghai",   // 时区，默认 Asia/Shanghai
  projectName: "my-app",       // 手动指定项目名（跳过 Git 自动检测）
  printTerminal: true,         // 终端是否打印，默认 true
  printBrowser: true,          // 浏览器是否注入 __buildInfo()，默认 true
  envPrefix: "VUE_APP_",       // 追踪的环境变量前缀，默认 ["VUE_APP_", "REACT_APP_"]
})
```

| 选项 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `timeZone` | `string` | `"Asia/Shanghai"` | 打包时间的时区 |
| `projectName` | `string` | 自动检测 | 手动指定项目名 |
| `printTerminal` | `boolean` | `true` | 构建时终端是否打印 |
| `printBrowser` | `boolean` | `true` | 浏览器是否注入 `__buildInfo()` |
| `envPrefix` | `string \| string[]` | `["VUE_APP_", "REACT_APP_"]` | 要追踪的自定义环境变量前缀 |

---

## 自定义环境变量

通过 `envPrefix` 指定要追踪的变量前缀，插件自动扫描 `process.env` 中匹配的变量并输出。

```js
// vue.config.js
process.env.VUE_APP_NO_LOGIN = process.env.npm_config_env_NO_LOGIN;
process.env.VUE_APP_SYS_CODE = process.env.npm_config_env_SYS_CODE;

module.exports = {
  configureWebpack: {
    plugins: [new BuildInfoPlugin()], // 自动追踪 VUE_APP_* 变量
  },
};
```

```bash
npm run build --env.NO_LOGIN=true --env.SYS_CODE=420100
```

构建时终端和控制台都会显示 `NO_LOGIN=true, SYS_CODE=420100`。

> 不同项目使用不同前缀时，传入自定义值：`new BuildInfoPlugin({ envPrefix: ['MY_APP_', 'CUSTOM_'] })`

---

## 项目名获取策略

| 优先级 | 来源 | 示例 |
|--------|------|------|
| 1 | `options.projectName`（手动指定） | `"my-app"` |
| 2 | `git remote get-url origin` 提取仓库名 | `"my-frontend"` |
| 3 | `git rev-parse --show-toplevel` 目录名 | `"my-frontend"` |
| 4 | 兜底 | `"unknown"` |

## 分支获取策略

| 优先级 | 来源 | 示例 |
|--------|------|------|
| 1 | CI 环境变量（Jenkins / GitHub Actions / GitLab CI 等 10+ 平台） | `main` |
| 2 | `git rev-parse --abbrev-ref HEAD` | `feature/xxx` |
| 3 | `git branch -r --contains HEAD`（detached HEAD 兜底） | `main` |
| 4 | `git log -1 --pretty=%D`（最终兜底） | `main` |

---

## 容错

- Git 未安装 / 不在仓库 / 无远程 → **不报错**，对应字段降级为 `"unknown"`
- 时区无效 → 自动降级为系统时区
- 环境变量未设置 → 不显示（过滤 `undefined` / `"undefined"`）
- 插件内部任何异常 → 构建正常继续

## License

MIT

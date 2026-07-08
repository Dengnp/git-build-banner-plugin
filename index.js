const { execSync } = require("child_process");
const path = require("path");

/**
 * 采集构建信息（项目名/分支/提交/时间/自定义变量）
 * 每个方法独立 try-catch，绝不抛异常
 */
function collectInfo(options = {}) {
  const timeZone = options.timeZone || "Asia/Shanghai";

  return {
    projectName: options.projectName || _getProjectName(),
    gitBranch: _getGitBranch(),
    gitCommit: _getGitCommit(),
    buildTime: _getBuildTime(timeZone),
    buildScript: process.env.npm_lifecycle_event || "",
    buildEnv: _getBuildEnv(options),
  };
}

function _getProjectName() {
  try {
    const url = execSync("git remote get-url origin", {
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "ignore"],
    }).trim();
    const m = url.match(/\/([^/]+?)(?:\.git)?$/);
    if (m) return m[1];
  } catch (_) {}

  try {
    const top = execSync("git rev-parse --show-toplevel", {
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "ignore"],
    }).trim();
    return path.basename(top);
  } catch (_) {}

  return "unknown";
}

function _getGitBranch() {
  // 1. 优先使用 CI 环境变量（Jenkins 等 detached HEAD 场景）
  const ciBranch = _getCIBranch();
  if (ciBranch) return ciBranch;

  // 2. git rev-parse（正常分支场景）
  try {
    const branch = execSync("git rev-parse --abbrev-ref HEAD", {
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "ignore"],
    }).trim();
    if (branch && branch !== "HEAD") return branch;
  } catch (_) {}

  // 3. detached HEAD 兜底：查找包含当前 HEAD 的远程分支
  try {
    const refs = execSync("git branch -r --contains HEAD", {
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "ignore"],
    }).trim();
    if (refs) {
      const match = refs.match(/origin\/(\S+)/);
      if (match) return match[1];
    }
  } catch (_) {}

  // 4. 通过 git log 引用名兜底
  try {
    const refs = execSync("git log -1 --pretty=%D", {
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "ignore"],
    }).trim();
    if (refs) {
      const match = refs.match(/origin\/(\S+)/);
      if (match) return match[1];
    }
  } catch (_) {}

  return "unknown";
}

/**
 * 从 CI 环境变量中获取当前分支名
 */
function _getCIBranch() {
  // Jenkins
  if (process.env.GIT_BRANCH) {
    return process.env.GIT_BRANCH.replace(/^origin\//, "");
  }
  if (process.env.BRANCH_NAME) {
    return process.env.BRANCH_NAME;
  }
  // GitHub Actions
  if (process.env.GITHUB_REF_NAME) {
    return process.env.GITHUB_REF_NAME;
  }
  if (process.env.GITHUB_HEAD_REF) {
    return process.env.GITHUB_HEAD_REF;
  }
  // GitLab CI
  if (process.env.CI_COMMIT_BRANCH) {
    return process.env.CI_COMMIT_BRANCH;
  }
  if (process.env.CI_COMMIT_REF_NAME) {
    return process.env.CI_COMMIT_REF_NAME;
  }
  // Bitbucket Pipeline
  if (process.env.BITBUCKET_BRANCH) {
    return process.env.BITBUCKET_BRANCH;
  }
  // Azure DevOps
  if (process.env.BUILD_SOURCEBRANCHNAME) {
    return process.env.BUILD_SOURCEBRANCHNAME;
  }
  // Drone CI
  if (process.env.DRONE_BRANCH) {
    return process.env.DRONE_BRANCH;
  }
  // Travis CI
  if (process.env.TRAVIS_BRANCH) {
    return process.env.TRAVIS_BRANCH;
  }
  // CircleCI
  if (process.env.CIRCLE_BRANCH) {
    return process.env.CIRCLE_BRANCH;
  }
  // Netlify
  if (process.env.HEAD) {
    return process.env.HEAD;
  }
  return null;
}

function _getGitCommit() {
  try {
    return execSync("git rev-parse --short HEAD", {
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "ignore"],
    }).trim();
  } catch (_) {
    return "unknown";
  }
}

function _getBuildTime(timeZone) {
  try {
    return new Date().toLocaleString("zh-CN", { timeZone, hour12: false });
  } catch (_) {
    return new Date().toLocaleString("zh-CN", { hour12: false });
  }
}

/**
 * 获取用户自定义环境变量
 *   通过 envPrefix 配置要追踪的前缀，如 ["VUE_APP_", "REACT_APP_"]
 *   从 process.env 中直接读取（变量在打包开始前已由配置文件设定）
 *
 * @param {Object} options
 * @param {string|string[]} options.envPrefix  环境变量前缀，默认 "VUE_APP_"
 * @returns {string}  如 "NO_LOGIN=true, REGION=hubei"
 */
function _getBuildEnv(options) {
  var prefixes = options.envPrefix || ["VUE_APP_", "REACT_APP_"];

  if (typeof prefixes === "string") {
    prefixes = [prefixes];
  }
  if (!Array.isArray(prefixes) || !prefixes.length) return "";

  var pairs = [];
  var seen = new Set();
  var keys = Object.keys(process.env);

  for (var i = 0; i < keys.length; i++) {
    var key = keys[i];
    for (var j = 0; j < prefixes.length; j++) {
      var prefix = prefixes[j];
      if (typeof prefix !== "string") continue;
      if (key.indexOf(prefix) === 0) {
        var name = key.slice(prefix.length);
        if (name && !seen.has(name)) {
          var val = process.env[key];
          // process.env 里存的是字符串，"undefined" 也需要过滤
          if (val == null || val === "undefined") continue;
          seen.add(name);
          pairs.push(name + "=" + val);
        }
        break;
      }
    }
  }

  return pairs.join(", ");
}

/**
 * 终端打印打包信息
 */
function printTerminal(info) {
  var lines = [
    "\n📦 打包信息:",
    "  项目名: " + info.projectName,
  ];
  if (info.buildScript) {
    lines.push("  构建:   " + info.buildScript);
  }
  if (info.buildEnv) {
    lines.push("  变量:   " + info.buildEnv);
  }
  lines.push(
    "  分支:   " + info.gitBranch,
    "  提交:   " + info.gitCommit,
    "  时间:   " + info.buildTime + "\n"
  );
  console.log(lines.join("\n"));
}

/**
 * 生成浏览器端注入代码
 * 注册 __buildInfo() 命令供按需调用
 */
function generateBanner(info) {
  var json = JSON.stringify(info);

  var code = [
    "(function(){",
    "var i=" + json + ";",
    "window.__APP_INFO__=i;",
    "window.__buildInfo=function(){",
    '  var a="color:#3b82f6;font-size:14px;font-weight:bold;";',
    '  var b="color:#22c55e;font-size:12px;";',
    '  var c="color:#f59e0b;font-size:12px;";',
    '  var d="color:#8b5cf6;font-size:12px;";',
    "  console.log(",
    '    "%c🏷 项目: %c"+i.projectName+',
    '    "  %c🌿 分支: %c"+i.gitBranch+',
    '    "  %c📝 提交: %c"+i.gitCommit+',
    '    "  %c🕐 打包: %c"+i.buildTime,',
    "    a,b,a,c,a,d,a,b",
    "  );",
  ];

  // 有自定义变量时额外打印一行
  code.push(
    "  if(i.buildEnv){",
    '    console.log(',
    '      "%c🔧 变量: %c"+i.buildEnv,',
    '      "color:#3b82f6;font-size:14px;font-weight:bold;",',
    '      "color:#ef4444;font-size:12px;"',
    "    );",
    "  }"
  );

  code.push(
    "};",
    'console.log("%c💡 输入 __buildInfo() 查看打包信息","color:#6b7280;font-style:italic;");',
    "})();"
  );

  return code.join("\n");
}

module.exports = { collectInfo, printTerminal, generateBanner };

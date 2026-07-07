const { execSync } = require("child_process");
const path = require("path");

/**
 * 采集构建信息（项目名/分支/提交/时间）
 * 每个方法独立 try-catch，绝不抛异常
 */
function collectInfo(options = {}) {
  const timeZone = options.timeZone || "Asia/Shanghai";

  return {
    projectName: options.projectName || _getProjectName(),
    gitBranch: _getGitBranch(),
    gitCommit: _getGitCommit(),
    buildTime: _getBuildTime(timeZone),
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
 * 终端打印打包信息
 */
function printTerminal(info) {
  console.log(`\n📦 打包信息:
  项目名: ${info.projectName}
  分支:   ${info.gitBranch}
  提交:   ${info.gitCommit}
  时间:   ${info.buildTime}\n`);
}

/**
 * 生成浏览器端注入代码
 * 注册 __buildInfo() 命令供按需调用，不再自动打印到控制台
 */
function generateBanner(info) {
  var json = JSON.stringify(info);
  return [
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
    "};",
    'console.log("%c💡 输入 __buildInfo() 查看打包信息","color:#6b7280;font-style:italic;");',
    "})();",
  ].join("\n");
}

module.exports = { collectInfo, printTerminal, generateBanner };

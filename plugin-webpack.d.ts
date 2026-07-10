import { Compiler } from "webpack";

export interface BuildInfoPluginOptions {
  /** 项目名称，默认自动从 git remote 获取 */
  projectName?: string;
  /** 时区，默认 "Asia/Shanghai" */
  timeZone?: string;
  /** 是否在终端打印打包信息，默认 true */
  printTerminal?: boolean;
  /** 是否在浏览器控制台注入 __buildInfo() 命令，默认 true */
  printBrowser?: boolean;
  /** 要追踪的环境变量前缀，默认 ["VUE_APP_", "REACT_APP_"] */
  envPrefix?: string | string[];
}

declare class BuildInfoWebpackPlugin {
  constructor(options?: BuildInfoPluginOptions);
  apply(compiler: Compiler): void;
}

export = BuildInfoWebpackPlugin;

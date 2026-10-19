# 第一阶段工程整理

日期：2026-10-19。

第二阶段的模型加载与动画调度整理见 [模型运行说明](model-runtime.md)。本页保留第一阶段的工具链约定与当时验证记录。

第三阶段的共享标签页、影像弹窗与 CSS 动画见 [共享界面说明](shared-ui.md)。

## 唯一源码与输出

维护入口是本仓库。各天体目录和 `shared/` 的现有层次不变。工作区外的 `previews/`、`ready2push/` 只保留历史资料；它们既不是发布输入，也不再接受反向同步。

```text
solar-lab/
  terminal/、mars/、其他天体/、shared/  唯一运行源码与素材
  scripts/                             预览、构建、静态校验与检查入口
  tests/browser/                       现有浏览器回归检查
  tests/fixtures/                      原稿与旧缓存的固定检查资料
  tests/build.test.mjs                  发布流程与预览服务回归检查
  package.json、package-lock.json       命令与浏览器检查依赖
  dist/                                自动生成，只发布、不维护
  .qa/                                 本机检查结果，不发布
```

## 本地工作流程

Node.js 20 或更新版本即可构建。开发服务器和静态检查没有第三方依赖。

```shell
npm run dev
npm run check
npm run build
npm run preview
```

`dev` 只监听本机，默认端口 8810，直接读取源码且禁用缓存；修改后刷新即可。`preview` 读取 `dist/`，请先构建。两种服务均从 `/terminal/index.html` 进入，支持音频范围请求和 HEAD 请求，并阻止访问工具、检查资料、隐藏文件。

可通过 `PORT` 环境变量更改端口。旧 `/uranus_preview/index.html` 等历史预览 URL 会重定向至正式路径。

## 构建约定

`scripts/site.mjs` 列出十个页面和共享资源目录。构建只复制运行目录以及根入口、404、Headers；工具、测试、依赖和隐藏文件不进入产物。各页的 `SOURCES.md`、第三方许可证和运行素材继续保留。

预检覆盖本地引用是否存在、路径大小写、应用脚本和内嵌脚本语法、单个资源大小。源码检查通过后先写临时目录，验证完整临时产物后才替换 `dist/`。依赖缺失和脚本语法错误不会先清空上一份有效产物。临时目录和替换范围固定在仓库下，不允许符号链接输出。

脚本与样式的内容版本在构建后的 HTML 内生成；原文、源文件资源引用、素材和运行脚本均不回写。版本保留原有查询参数与片段。`.build-lock/` 阻止多个构建进程同时替换产物；异常中断后如遗留锁目录，应先确认没有构建进程，再清理该空目录。

`node scripts/build.mjs --dry-run` 只预检，不创建或替换输出。若机器在最终目录替换时断电，留下 `.dist-previous/`，构建会停止并要求恢复，避免自动删除可能仍需保留的上一版。

## 浏览器检查

```shell
npm ci
npm run check:browser
```

Windows 默认使用已安装的 Microsoft Edge；其他平台使用 Playwright Chromium，首次使用前运行 `npx playwright install chromium`。`PLAYWRIGHT_CHANNEL` 可显式选择浏览器；`PLAYWRIGHT_MODULE` 兼容已有的外部依赖运行环境。仓库不保存个人电脑的模块绝对路径。

默认检查覆盖全站入口、模型与弹窗、原文展开和切换、火星/金星恢复原稿、返回控件与音乐。检查目标是新构建的 `dist/`，不要求工作区外有 previews、备份、工具目录或完整历史 Git 提交。

```shell
npm run check:browser -- uranus
npm run check:all
```

扩展检查还覆盖镜头调整、快速切换、后台暂停、WebGL 失败回退、离线打开和旧缓存。旧导出保护的测试已由 `tests/build.test.mjs` 中的单向构建、缺失依赖保护及只读检查取代。

## 旧工作区入口

- `../tools/export-site.mjs` 已停用从 previews 向源码复制，转为调用本仓库构建，保留 `--dry-run`；旧 `--allow-overwrite` 被拒绝。
- `../tools/version-archive-assets.cjs` 只调用构建，不再改写任何源码或预览文件。
- 已迁入仓库的旧 `../tools/verify-*.cjs` 入口转发到仓库内的检查。
- 旧 `previews` 的 `npm start` 与预览服务器改为读取正式源码。
- 其余早期生成、修复和个人主页集成脚本保留为历史资料，不属于当前工具链。

## 发布切换

Cloudflare Pages 的设置应为：生产分支 `main`，框架 `None`，构建命令 `node scripts/build.mjs`，输出目录 `dist`，仓库根目录留空，Node.js 20+。构建不依赖 Playwright，也不运行浏览器测试。

这两个构建字段位于 Cloudflare 项目设置中。当前会话未连接该账户管理接口，所以本地文件修改不代表平台设置已经改变。正式推送这轮工程变更前，应完成平台配置切换，避免继续把仓库根目录里的开发文件当作网站文件发布。

[Cloudflare Pages 构建配置](https://developers.cloudflare.com/pages/configuration/build-configuration/)

## 本轮边界

本轮整理工具链和验证入口。所有已有页面与 shared 运行文件按整理前哈希比对；不改变正文、模型加载、计算、动画或已有 Terminal 修改。模型加载和 CSS 动画属于后续独立改动。

## 本轮验证结果

- 223 个已有页面与 shared 文件，包含原先未提交的 Terminal 修改，与整理前逐字节一致。
- `npm run check`：226 个运行文件、268 处本地引用与脚本语法检查通过；7 项构建与预览服务测试通过。
- 默认 5 组浏览器检查通过：十页全站、24 项原文显示、51 项恢复原稿卡片/弹窗、返回控件与跨页音乐。
- 扩展 5 组检查通过：14 项交互检查、3 项镜头与失败回退检查、9 项轨道检查，以及天王星视图/四季/离线/旧缓存入口检查。
- 迁移时修正旧动画统计测试对资源版本参数的识别，继续检查暂停与离开视口后的帧调度；没有修改页面运行代码。
- 旧导出 `--dry-run` 只验证新流程，`--allow-overwrite` 被拒绝；本机旧预览 URL 返回 302，正式源码返回 200/no-store，检查资料路径返回 404。
- Node.js 20+ 构建仅使用内置模块；Playwright 已固定版本并写入 package-lock，旧缓存与原稿检查不再读取历史 Git 提交或工作区外文件。

以上为第一阶段完成时的验证记录。`.qa/` 为可删除的本机检查产物，检查时自动重建；Cloudflare 设置需在发布时独立核实。

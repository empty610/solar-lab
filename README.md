# Solar Laboratory · 太阳系探索

一个纯静态的太阳系探索网站，包含动态星图导航与九个天体档案。页面、Three.js、图片、纹理和音频均随仓库提供，无需安装依赖或构建。

## 目录

| 目录        | 页面                                         |
| ----------- | -------------------------------------------- |
| `terminal/` | 独立的太阳系总览：星图、天体目录、标签切换   |
| `mercury/`  | 水星当前版                                   |
| `venus/`    | 金星                                         |
| `mars/`     | 火星、卫星、巡视器与天空                     |
| `jupiter/`  | 木星                                         |
| `saturn/`   | 土星                                         |
| `uranus/`   | 天王星                                       |
| `neptune/`  | 海王星                                       |
| `europa/`   | 木卫二                                       |
| `pluto/`    | 冥王星                                       |
| `shared/`   | 各页面共用的界面过渡、返回入口与放大展示样式 |

根目录的 `index.html` 自动进入 `terminal/`。所有档案入口均已更新为本仓库的相对路径。地球尚未收录，目录中保留明确提示。

各档案页尾的“下一站”按现有页面串联：水星 → 金星 → 火星 → 木星 → 土星 → 天王星 → 海王星 → 冥王星 → 太阳系总览；木卫二支线接回土星。地球页完成后，可在金星与火星之间接入。页尾使用静态链接，样式集中在 `shared/journey.css`，跳转复用公共连接动画；所有来源说明继续保留。

## Cloudflare Pages

连接 `empty610/solar-lab` 后，选择以下设置：

| 配置         | 值                 |
| ------------ | ------------------ |
| 生产分支     | `main`             |
| 框架预设     | `None`             |
| 构建命令     | `exit 0`           |
| 构建输出目录 | `.`                |
| 根目录       | 留空（仓库根目录） |

网站已经是可直接发布的静态文件。请将整个仓库作为发布目录，使 terminal 能访问各天体档案；无需设置 Node.js 版本或运行 npm install。

[Cloudflare 静态 HTML 部署说明](https://developers.cloudflare.com/pages/framework-guides/deploy-anything/)

## 单独修改和提交 terminal

总览的页面源码与缩略图在 `terminal/` 中，修改后可单独提交：

```shell
git add terminal
git commit -m "Update solar system terminal"
git push origin main
```

`terminal/` 中：`app.js` 管理标签、选中天体和档案入口；`motion.js` 管理星图运转；`labels.js` 将标签放在独立图层并动态避开星球和其他标签。`style.css`、`refinement.css`、`motion.css` 管理布局、标签过渡和样式。

`shared/interface.css` 与 `shared/interface.js` 复用个人网站的金色双轨道、中心光点和深色遮罩，在跳转前显示约 1 秒的 `ESTABLISHING LINK` 连接动画；同时统一档案的 BACK 返回总览，以及左图右介绍的放大窗口（手机改为上下布局）。修改这些通用效果时，连同 `shared/` 一起提交。

Terminal 与九个介绍页的 BACK 统一采用 `shared/navigation-controls.css` 中的 Venus 模板：右上角的黑金色胶囊、回转箭头和 BACK 文字。Terminal 返回个人主页的“项目”区，介绍页返回 Terminal。介绍页的返回顶部按钮单独位于音乐按钮上方，两个圆形控件间隔 14px。Terminal 与九个天体档案统一使用 `shared/music-controls.css` 的音乐按钮。`shared/idle-controls.js` 在两秒无操作后淡出控件，鼠标、触摸或键盘操作会重新显示。`shared/music.js` 与 `shared/audio/ad-astra.mp3` 提供同款音乐，点击 ♪ 播放或暂停，并在同一标签页内记住开关与进度；进入档案或返回 Terminal 时续播。浏览器要求新的播放手势时，点击页面会恢复已启用的音乐。修改这些控件时，连同对应的 `shared/` 文件一起提交。

从原始工作区同步时，在 `E:\solar system` 运行 `node tools/export-site.mjs`，再在本仓库检查和提交变化。先运行 `node tools/export-site.mjs --dry-run` 查看新增、修改清单，该模式不会写入文件，也可以在有未提交改动时运行。正式导出会先检查全部页面及依赖，再开始复制，并跳过内容相同的文件。同步脚本保留本仓库元数据，复制当前版的页面依赖并更新目录链接；不会删除文件。正式目录可能包含比 previews 更新的修改：存在未提交改动时，脚本会在复制前停止。先检查差异、备份并将需要保留的修改同步到 previews；仅在确认需要覆盖时使用 `node tools/export-site.mjs --allow-overwrite`。修改 shared 或页面运行脚本后，应同时维护对应的 previews 源文件。

## 素材与来源

各档案的 `SOURCES.md`、素材来源 JSON 与页面中的资料链接保留原有来源说明。第三方库许可证位于各页面的 `vendor/` 中。发布版排除了本地备份、测试和预览截图、node_modules、生成脚本、旧版水星、下载的来源网页和已经嵌入运行时数据的月球原始模型。

星图和展示动画为导航与教学示意，参数与科学影像的解释以页面中的说明为准。

## 本地验证

从工作区根目录运行以下命令，使用已安装的 Playwright 和 Microsoft Edge：

```powershell
node tools/verify-site.cjs
node tools/verify-terminal-controls.cjs
node tools/verify-archive-music.cjs
node tools/verify-review.cjs
node tools/verify-second-review.cjs --with-dry-run
node tools/verify-third-review.cjs
node tools/verify-uranus.cjs
```

如果 Playwright 不在默认 Node.js 模块路径中，将 `PLAYWRIGHT_MODULE` 环境变量设为其绝对目录。验证脚本只启动本机服务；请勿添加 `--live`，除非需要验证线上网站。`verify-review.cjs` 覆盖快速标签切换、键盘焦点、星图暂停恢复、音乐续播、模型加载和不可见动画暂停，结果与截图保存在工作区的 `tools/.qa/`。

`verify-third-review.cjs` 检查七个档案的轨道演示暂停后不再调度动画、播放/暂停/重置，以及金星后台计时和水星纹理加载失败后的界面状态。结果位于工作区 `tools/.qa/third-review-results.json`。

`verify-uranus.cjs` 自动启动本机测试服务，验证天王星的三维视图、四季演示、照片弹窗、手机布局、返回导航、离线打开和回退模式。全站验证同时检查九个档案页的“下一站”链接及连接动画。

## Terminal 更新与浏览器缓存

Terminal 的脚本和样式引用带有内容版本参数，已有浏览器缓存也会请求新的资源地址。根目录 `_headers` 让 Terminal 和 shared 中的 JS/CSS 每次访问时重新校验，防止档案入口发布后仍被旧脚本显示为“待收录”；图片、纹理和音频继续使用默认缓存。修改 Terminal 运行资源时同步更新入口中的版本参数，并维护预览入口。缓存行为依据 [Cloudflare Pages Headers](https://developers.cloudflare.com/pages/configuration/headers/)。

在工作区运行 `node tools/verify-uranus-entry.cjs`，验证带旧缓存访问时，星图、目录、键盘和快捷入口仍能进入天王星档案；添加 `--live` 可验证已发布的线上入口。

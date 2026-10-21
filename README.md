# Solar Laboratory · 太阳系探索

一个纯静态的太阳系探索网站，包含动态星图导航与九个天体档案。页面、Three.js、图片、纹理和音频均随仓库提供。这里是唯一维护的源码；本地预览直接读取源码，发布由 Node.js 20+ 单向生成到 dist，线上仍为纯静态文件。

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
| 构建命令     | `node scripts/build.mjs` |
| 构建输出目录 | `dist`             |
| 根目录       | 留空（仓库根目录） |

请在 Cloudflare 项目设置中将构建命令改为 `node scripts/build.mjs`、输出目录改为 `dist`，使用 Node.js 20+。仅发布生成的 dist，不发布工具、测试、依赖和原稿检查资料。构建本身不需要安装浏览器依赖。平台设置独立于 Git，本次本地整理不代表远端设置已经修改。

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

Terminal 与九个介绍页的 BACK 统一采用 `shared/navigation-controls.css` 中的 Venus 模板：右上角的黑金色胶囊、回转箭头和 BACK 文字。Terminal 返回个人主页的“项目”区，介绍页返回 Terminal。介绍页的返回顶部按钮单独位于音乐按钮上方，两个圆形控件间隔 14px。Terminal 与九个天体档案统一使用 `shared/music-controls.css` 的音乐按钮。`shared/idle-controls.js` 在两秒无操作后淡出控件，鼠标、触摸或键盘操作会重新显示。`shared/music.js` 管理音乐播放：默认配乐为 `shared/audio/ad-astra.mp3`，火星使用用户提供的 `mars/assets/soil-of-life.mp3`，通过 `data-music-track` 独立保存该曲目的进度。点击 ♪ 播放或暂停，并在同一标签页内记住开关与进度；进入档案或返回 Terminal 时续播。浏览器要求新的播放手势时，点击页面会恢复已启用的音乐。修改这些控件时，连同对应的 `shared/` 文件一起提交。

本仓库为唯一源码，工作区的 previews 与 ready2push 仅作历史参考。预览和发布都从本仓库读取，不再双向复制。工具位于 `scripts/`，浏览器检查位于 `tests/browser/`，完整流程见 [工程说明](docs/engineering.md)。

模型的按需绘制、贴图加载与失败清理由 `shared/model-runtime.js` 提供公共生命周期工具，各页保留自己的场景和交互。改动范围、测量与维护约定见 [模型运行说明](docs/model-runtime.md)。

`shared/ui.js` 管理公共标签页和影像弹窗的状态、焦点与滚动锁，`shared/motion.css` 管理对应的有限 CSS 动画；金星、火星的主样式分别在自己的 `style.css`。维护方式与回归入口见 [共享界面说明](docs/shared-ui.md)。

## 介绍文字与资源版本

主天体的标题、介绍和展开说明以各页 `index.html` 中的原文为准。木星、木卫二、土星、天王星、海王星与冥王星在初始化和切换回主天体时保留这些 HTML 内容，包括换行、强调与链接；其他天体标签继续使用页面的资料脚本。直接在本仓库修改介绍，预览会读取同一份文件。

金星地貌与火星“地表外观”的原文放在 `.terrain-copy` 中，卡片可展开，放大窗口始终显示完整介绍。火星五类地貌的详细说明保存在卡片的 `data-image-caption` 中，弹窗按句子分段，保留全部原文和署名。修改后可运行 `npm run check:browser -- recovered-copy` 对照已恢复原稿，检查卡片、展开与放大窗口。

应用脚本和样式由 `npm run build` 复制到 dist 内的 `shared/cache/<内容哈希>/<原路径>`，HTML 引用指向这些地址并保留版本参数；源码不会回写。CSS 中的图片相对路径随输出位置调整，内嵌 SVG 与选择器保持原样。开发服务器使用 no-store，直接刷新即可读取修改后的文件。

## 素材与来源

各档案的 `SOURCES.md`、素材来源 JSON 与页面中的资料链接保留原有来源说明。第三方库许可证位于各页面的 `vendor/` 中。发布版排除了本地备份、测试和预览截图、node_modules、生成脚本、旧版水星、下载的来源网页和已经嵌入运行时数据的月球原始模型。

星图和展示动画为导航与教学示意，参数与科学影像的解释以页面中的说明为准。

## 开发与验证

在本仓库运行：

```shell
npm run dev
npm run check
npm run build
npm run preview
```

源码预览默认地址为 http://127.0.0.1:8810/terminal/index.html；preview 命令读取生成的 dist。构建和静态校验只需要 Node.js 20+。

浏览器回归检查：

```shell
npm ci
npm run check:browser
```

Windows 默认使用 Edge，其他平台首次检查前运行 `npx playwright install chromium`。检查默认读取 dist，结果写入忽略的 .qa。单独检查例如 `npm run check:browser -- uranus`，全部扩展检查使用 `npm run check:all`。原稿和旧缓存检查资料保存在 tests/fixtures，不依赖仓库外的备份与 Git 历史。

## Terminal 更新与浏览器缓存

脚本与样式的内容发生变化时，构建会生成不同的文件地址，已有浏览器缓存也会请求新资源。根目录 `_headers` 仅为 `shared/cache/*` 设置一年 immutable 缓存；HTML 和原址可变的旧 JS/CSS 要求重新校验。图片、纹理和音频继续使用默认缓存。八页相同的 Three.js 与七页相同的 OrbitControls 共用 `shared/vendor/`，金星 controls 与火星定制库分别保留。自定义域名的外部缓存规则仍可能覆盖响应头，需要独立核对线上结果。缓存行为依据 [Cloudflare Pages Headers](https://developers.cloudflare.com/pages/configuration/headers/)。

总览与正文影像卡片使用 WebP 预览，放大窗口保留原图和署名。模型库在模型区域首次可见时加载，火星隐藏巡视器图片与卫星精细模型、土星和海王星的卫星模型、木星与木卫二的贴图按观察目标准备；Mars/Jupiter/Europa 的内嵌贴图仅在 file:// 打开时加载。五页轨道演示在全部关联图表离屏后休眠，火星天空轨迹复用固定星历采样。跨页连接动画期间预取目标页的阅读界面资源。具体约定与复查结果见 [加载性能说明](docs/loading-performance.md)。

运行 `npm run check:browser -- uranus-entry`，验证带旧缓存访问时，星图、目录、键盘和快捷入口仍能进入天王星档案；默认检查只访问本机；线上检查需显式运行对应 tests/browser 脚本并加 --live。

# Solar Laboratory · 太阳系探索

一个纯静态的太阳系探索网站，包含动态星图导航与八个天体档案。页面、Three.js、图片、纹理和音频均随仓库提供，无需安装依赖或构建。

## 目录

| 目录        | 页面                                         |
| ----------- | -------------------------------------------- |
| `terminal/` | 独立的太阳系总览：星图、天体目录、标签切换   |
| `mercury/`  | 水星当前版                                   |
| `venus/`    | 金星                                         |
| `mars/`     | 火星、卫星、巡视器与天空                     |
| `jupiter/`  | 木星                                         |
| `saturn/`   | 土星                                         |
| `neptune/`  | 海王星                                       |
| `europa/`   | 木卫二                                       |
| `pluto/`    | 冥王星                                       |
| `shared/`   | 各页面共用的界面过渡、返回入口与放大展示样式 |

根目录的 `index.html` 自动进入 `terminal/`。所有档案入口均已更新为本仓库的相对路径。地球、天王星尚未收录，目录中保留明确提示。

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

`shared/interface.css` 与 `shared/interface.js` 复用个人网站的 `0.4 秒 ease` 轻微缩放入场，统一档案的 BACK 返回总览，以及左图右介绍的放大窗口（手机改为上下布局）。修改这些通用效果时，连同 `shared/` 一起提交。

从原始工作区同步时，在 `E:\solar system` 运行 `node tools/export-site.mjs`，再在本仓库检查和提交变化。同步脚本保留本仓库元数据，复制当前版的页面依赖并更新目录链接；不会删除文件。

## 素材与来源

各档案的 `SOURCES.md`、素材来源 JSON 与页面中的资料链接保留原有来源说明。第三方库许可证位于各页面的 `vendor/` 中。发布版排除了本地备份、测试和预览截图、node_modules、生成脚本、旧版水星、下载的来源网页和已经嵌入运行时数据的月球原始模型。

星图和展示动画为导航与教学示意，参数与科学影像的解释以页面中的说明为准。

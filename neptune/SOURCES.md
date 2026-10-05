# 海王星项目资料与素材来源

整理日期：2026-10-03。中文介绍为重写的科普摘要。数字多为近似值；不使用容易变化的已知卫星总数。

## 模型与影像

- [NASA VTAD 海王星模型](https://science.nasa.gov/resource/neptune-3d-model/)：从 [GLB](https://assets.science.nasa.gov/content/dam/science/psd/solar/2023/09/n/Neptune_1_49528.glb) 提取几何、原始 UV 与贴图，归一化半径。原模型节点方向保留；不是自然色校准产品。
- [NASA VTAD 海卫一模型](https://science.nasa.gov/resource/triton-3d-model/)：从 [GLB](https://assets.science.nasa.gov/content/dam/science/psd/solar/2023/09/t/Triton_1_2707.glb) 提取。未完整成像部分不代表精确地貌。
- `assets/triton-globe.png` 使用上述模型的原始几何、UV 与贴图渲染为透明背景球体，用于海卫一章节展示；探测器拼接照片仍保留在影像画廊。
- [大黑斑 PIA00052](https://science.nasa.gov/photojournal/neptune-great-dark-spot-in-high-resolution/)：NASA/JPL；旅行者二号。透明、绿色滤光片的合成影像。文件 `assets/dark-spot.jpg`。
- [海卫一全球拼接 PIA00317](https://science.nasa.gov/photojournal/global-color-mosaic-of-triton/)：NASA/JPL/USGS；旅行者二号。橙、紫、紫外滤光片映射色。文件 `assets/triton-mosaic.jpg` 已缩小至适合网页的分辨率。
- [海王星 NIRCam 近景 weic2214a](https://esawebb.org/images/weic2214a/)：NASA, ESA, CSA, STScI。2022 年发布，近红外映射色。文件 `assets/webb-rings.jpg`。

贴图压缩为 JPEG，几何和纹理嵌入 `assets/models.js`，方便 file:// 直接查看。原始 GLB 不属于运行时必需文件，未重复保留在交付目录。图片信用信息随卡片弹窗保留；没有声称 NASA/ESA 对本项目背书。

## 事实与说明

- [NASA Neptune Facts](https://science.nasa.gov/neptune/neptune-facts/)：赤道直径 49,528 km，约 30 AU，约 16 小时自转、165 年公转，冰巨星结构概述。
- [Oxford 2024 色彩重建](https://www.ox.ac.uk/news/2024-01-05-new-images-reveal-what-neptune-and-uranus-really-look-0)：经典海王星影像偏蓝的处理背景。
- [Hubble 跟踪风暴生命周期](https://science.nasa.gov/missions/hubble/hubble-tracks-the-lifecycle-of-giant-storms-on-neptune/)：暗斑并非永久地貌，1994 年旧大黑斑已消失。
- [Webb 首次探测海王星极光](https://science.nasa.gov/missions/webb/nasas-webb-captures-neptunes-auroras-for-first-time/)：2025 年发布的近红外光谱、H₃⁺ 与较低纬度极光。
- [NASA Triton](https://science.nasa.gov/neptune/moons/triton/)：逆行、捕获假说、同步自转、氮冰、薄大气和喷流。
- [JPL 卫星平均轨道根数](https://ssd.jpl.nasa.gov/sats/elem/)：NEP097 海卫一，a ≈ 354,800 km，P = 5.876994 天，倾角 157.3°（相对表中 Laplace 参考面）。模型将此近似应用于行星赤道框架，不含精密参考面变换或摄动，初相位任意。
- [USGS 行星环命名资料](https://planetarynames.wr.usgs.gov/Page/Rings)：五条主环名称与近似中心距。
- [The rings of Neptune / 2019 综述](https://arxiv.org/abs/1906.11728)：暗环、环弧与动力学研究背景。环弧维持机制不描述为已完全解决。
- [NASA 探索历程](https://science.nasa.gov/neptune/exploration/)：1846 年发现、1989 年旅行者二号飞掠、后续望远镜观测。

## 本地沿用内容

设计风格参考现有 Mercury preview v2、Jupiter preview v1 等本地项目；Three.js / OrbitControls 从 Jupiter 项目的 vendor 目录复制，许可随附。音乐 `ad-astra.mp3` 从同一项目复制，仅供本地预览，公开发布前需确认音乐授权。

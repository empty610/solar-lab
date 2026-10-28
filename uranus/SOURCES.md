# 天王星：资料与显示说明

整理日期：2026-10-13。正文为中文科普摘要，数值取近似值，不使用持续变化的卫星总数。

- [NASA Uranus Facts](https://science.nasa.gov/uranus/facts/)：51,118 km 赤道直径、97.77° 轴倾角、约 84 年公转、约 19 AU 日心距离及约 2 小时 40 分钟光程；大气与冰巨星分类。
- [NASA VTAD Uranus 3D Model](https://science.nasa.gov/resource/uranus-3d-model/)：[原始 GLB](https://assets.science.nasa.gov/content/dam/science/psd/solar/2023/09/u/Uranus_1_51118.glb)。几何、节点旋转、UV 与原始贴图提取后嵌入 `assets/model-data.js`，支持离线打开。`assets/globe.png` 为同一模型的透明渲染，用于图文回退和总览缩略图。
- [NASA / JPL-Caltech — PIA00032](https://science.nasa.gov/image-detail/pia00032/)：`assets/voyager-colors.jpg`，旅行者二号 1986 年 1 月 17 日的真彩色 / 假彩色对照。
- [NASA / ESA / CSA / STScI — Webb Uranus](https://science.nasa.gov/missions/webb/nasas-webb-rings-in-holidays-with-ringed-planet-uranus/)：`assets/webb-rings.png`，2023 年发布的 NIRCam 近红外影像。采用原始图像，不重绘科学细节。页面和弹窗注明红外映射色、极区云帽和季节变化。
- [NASA / JPL — Uranus Final Image](https://science.nasa.gov/resource/uranus-final-image/)：`assets/crescent.jpg`，PIA00143，1986 年 1 月 25 日飞掠后的弯月视角。
- [NASA Uranus Moons](https://science.nasa.gov/uranus/moons/)：卫星命名背景与主要冰月。
- [NASA Uranus Exploration](https://science.nasa.gov/uranus/exploration/)：1781 年发现、1977 年发现环、1986 年旅行者二号飞掠。

三维模型为可视化展示，不是自然色校准产品。主要内环的径向位置取近似比例，环宽、亮度经过增强，省略外侧尘埃环；自转速率为展示设置。自转轴参考图表示与轨道法线的约 98° 夹角，不表示实时天体方位。

四季实验室为圆轨道俯视投影，自转轴的出平面分量省略；相对尺寸与距离经过压缩。零点定义为北半球夏至，21、42、63 年分别是近似的秋分、冬至、春分，不对应具体地球历日期。默认静止，播放时每秒推进两个地球年。方位与季节描述基于太阳与自转轴的相对位置，不能用于精密星历或气象预报。

Three.js 与 OrbitControls 沿用现有项目本地版本，MIT 许可位于 `vendor/LICENSE`。导航、音乐和自动隐藏控件复用 `shared/`。图像信用归原机构所有，不表示它们对本项目背书。

## 2026-10-19 介绍补写资料

- [大气、自转、磁场与环](https://science.nasa.gov/uranus/facts/)
- [五颗主要卫星](https://science.nasa.gov/uranus/moons/)
- [探测与环的发现](https://science.nasa.gov/uranus/exploration/)
- [韦布的近红外观测](https://science.nasa.gov/missions/webb/nasas-webb-rings-in-holidays-with-ringed-planet-uranus/)

新增段落区分了直接测量、模型解释与尚待验证的可能性；未更新已有任务计划。

## 2026-10-27 机制与证据补写

硫化氢与云层组成、古卫星迁移倾角模型、导电流体与磁场、牧羊卫星、2025年内部热量重估及2026年外环光谱与物质来源。

- [硫化氢观测论文](https://ora.ox.ac.uk/objects/uuid%3A8ef4459a-29ec-4420-87af-e149c4f35c73)
- [古卫星迁移与倾角模型](https://www.aanda.org/articles/aa/pdf/2022/12/aa43953-22.pdf)
- [NASA · ε环与牧羊卫星](https://science.nasa.gov/uranus/moons/cordelia/)
- [NASA / Oxford · 2025年内部热量重估](https://science.nasa.gov/science-research/planetary-science/nasa-oxford-discover-warmer-uranus-than-once-thought/)：能量收支、反照率与内部热量；不把低云顶温度等同于内部没有热量。
- [Keck · 2026年两条外环的光谱与来源](https://keckobservatory.org/uranus-two-outer-rings/)：μ环水冰、玛布撞击供给与ν环岩质富碳材料的解释。
- [SLAC · 高压物质与冰巨星磁场](https://www6.slac.stanford.edu/news/2024-01-08-diamond-rain-icy-planets-offers-clues-magnetic-field-mysteries)：导电物质层与内部运动的候选模型。

正文保留原有介绍，新增内容延续提问、解释过程与生活类比的叙述。区分观测信号、模型推断和未解决环节；研究公布年份不等同于观测年份，未来任务节点不作为本轮更新内容。

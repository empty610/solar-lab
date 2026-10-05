# 科学来源、素材署名与模型说明

核对日期：2026-10-03。中文内容为整理改写；页面交互为教学展示。

## 科学内容

- [NASA Jupiter Facts](https://science.nasa.gov/jupiter/jupiter-facts/)：木星平均半径 69,911 km、自转约 9.9 小时、日距约 5.2 AU、气体组成与大气结构。
- [NASA Io Facts](https://science.nasa.gov/jupiter/jupiter-moons/io/facts/)：潮汐作用、火山与表面更新。
- [NASA Europa Facts](https://science.nasa.gov/jupiter/jupiter-moons/europa/europa-facts/)：海洋证据、表面构造与内部模型。
- [NASA Europa Clipper FAQ](https://science.nasa.gov/mission/europa-clipper/mission-faq/)：宜居性研究、海洋水量估计与多次飞掠设计。
- [NASA Europa: A World of Ice, With Potential for Life](https://science.nasa.gov/missions/europa-clipper/europa-a-world-of-ice-with-potential-for-life/)：海底水岩作用、物质交换与能量。
- [NASA Juno Measures Thickness of Europa’s Ice Shell](https://www.nasa.gov/missions/juno/nasas-juno-measures-thickness-of-europas-ice-shell/)（2026-01-27）：2022 年飞掠的微波辐射计数据支持所观测区域约 29 km 的冷硬、导热冰层估计。数值基于纯水冰模型；盐分会改变估计，如果下方还有对流冰层，总厚度可能更大。页面不将其写作全球精确厚度。
- [NASA Ganymede](https://science.nasa.gov/jupiter/jupiter-moons/ganymede/)：内禀磁场、极光、冰下海洋与地形。
- [NASA Callisto](https://science.nasa.gov/jupiter/jupiter-moons/callisto/)：撞击历史与可能的海洋。
- [JPL Planetary Satellite Physical Parameters](https://ssd.jpl.nasa.gov/sats/phys_par/sep.html)：采用该表平均半径，木卫一 1821.49 km、木卫二 1560.80 km、木卫三 2631.20 km、木卫四 2410.30 km。不同资料中的平均与参考半径可能略有差异。
- [JPL Satellite Mean Elements](https://ssd.jpl.nasa.gov/sats/elem/)：平均轨道半径量级，采用 421800、671100、1070400、1882700 km。页面周期使用常见恒星公转周期的教学舍入值 1.769、3.551、7.155、16.689 地球日，并未将轨道根数表中的不同周期定义混用。
- [NASA Universe Glossary](https://science.nasa.gov/universe/glossary/)：木卫一、二、三的 4∶2∶1 共振。

## 任务

- [Galileo](https://science.nasa.gov/mission/galileo/)：1995—2003 年木星轨道任务。
- [Juno](https://science.nasa.gov/mission/juno/)：2016 年进入木星轨道及后续卫星飞掠。
- [Europa Clipper](https://science.nasa.gov/mission/europa-clipper/) / [任务时间表](https://science.nasa.gov/mission/europa-clipper/mission-timeline/)：2024 年发射，计划 2030 年 4 月进入木星轨道，49 次木卫二近距离飞掠。它研究潜在宜居条件，并不直接寻找生命个体。
- [ESA Juice](https://www.esa.int/Science_Exploration/Space_Science/Juice) / [ESA 任务概览](https://www.cosmos.esa.int/web/juice/overview)：计划 2031 年抵达木星，考察三颗冰卫星，最终进入木卫三轨道。未来日期均为当前公布计划。

## 模型贴图

1. `assets/jupiter.jpg`：[NASA Jupiter 3D Model](https://science.nasa.gov/resource/jupiter-3d-model/)。从 `Jupiter_1_142984.glb` 提取 base-color 立方体图集，缩放为 2048×1536 并转换为 JPEG。模型的原始网格及 UV 映射保存在 `assets/jupiter-geometry.js`，赤道半径归一化为 1，保留原有扁率；贴图按原始 UV 投影而非直接包裹球体。Credit: NASA VTAD。
   原始下载：https://assets.science.nasa.gov/content/dam/science/psd/solar/2023/09/j/Jupiter_1_142984.glb
2. `assets/io.jpg`：[NASA Jupiter – Io (A)](https://science.nasa.gov/3d-resources/jupiter-io-a/)。USGS 将 Voyager 影像拼接，极区有数据缺口；Credit: USGS, JPL & Caltech。
   原始下载：https://assets.science.nasa.gov/content/dam/science/cds/3d/resources/image/jupiter---io-(a)/Jupiter%20-%20Io%20(A).jpg
3. `assets/europa.jpg`：[NASA Europa 3D Model](https://science.nasa.gov/resource/europa-3d-model/)。从模型 `Europa_1_3138.glb` 的 base-color 图提取，缩放为 2048×1024 并转换为 JPEG。Credit: NASA Visualization Technology Applications and Development (VTAD)。
4. `assets/ganymede.jpg`：[NASA Ganymede 3D Model](https://science.nasa.gov/resource/ganymede-3d-model/)。同上，从 `Ganymede_1_5268.glb` 提取、缩放和转换。Credit: NASA VTAD。
5. `assets/callisto.jpg`：[NASA Callisto 3D Model](https://science.nasa.gov/resource/callisto-3d-model/)。同上，从 `Callisto_1_4821.glb` 提取、缩放和转换。Credit: NASA VTAD。

这些图像是用于展示的全球拼接贴图，可能包含分辨率差异、处理与填补。卡片通过 CSS 裁切纹理；三维照明不是校准后的真实观测外观。`assets/textures.js` 是五张本地 JPG 的 base64 副本，支持直接离线打开。

## 实拍影像

- `assets/great-red-spot.jpg`：PIA21775，[Jupiter’s Great Red Spot in True Color](https://science.nasa.gov/photojournal/jupiters-great-red-spot-in-true-color/)。2017-07-10 JunoCam 数据，Björn Jónsson 处理，接近自然色。NASA/JPL-Caltech/SwRI/MSSS/Björn Jónsson；NASA 页面标注 CC-NC-SA。原图保持完整，卡片裁切显示，弹窗显示全图。来源页保留完整许可说明。
  下载：https://assets.science.nasa.gov/content/dam/science/psd/solar/2023/09/p/i/a/2/PIA21775-1.jpg
- `assets/europa-global.jpg`：PIA19048，[Europa’s Stunning Surface](https://science.nasa.gov/resource/europas-stunning-surface/)。伽利略号 1990 年代后期影像的重新拼接与色彩处理，近似人眼可见颜色。Credit: NASA/JPL-Caltech/SETI Institute。原图未修改。
  下载：https://assets.science.nasa.gov/content/dam/science/psd/solar/2023/09/2/204_PIA19048.jpg

## 计算与界面

三维长度以木星赤道半径 71492 km 为 1 单位，木星极半径采用 66854 km，卫星半径与轨道距离均按同一尺度计算。每颗卫星采用共面圆轨道，角度为初始相位加 `2π × 演示日 / 公转周期`。初始相位是任意示意；没有模拟引力摄动、轨道倾角、偏心率、光行时或食与凌的遮挡事件。二维轨道图沿用距离比例，放大天体圆点方便辨认。

全景中的标签为点击辅助，不代表天体直径。切换观察对象只调整相机位置与观察中心，五个天体的网格、尺寸与轨道位置保持不变，也不隐藏其他天体。近景之间沿用火星项目的退开、移动、拉近过渡，约 1.55 秒完成；各个近景的屏幕直径不可直接用来比较实际尺寸。近景隐藏轨道线和全景标签便于查看表面，轨道时间轴仍可更新天体位置。“自动环绕”是相机观察速度，非真实自转。内部结构 SVG 为作者绘制的简化示意，层厚经过明显放大；海底地质活动、海洋性质与宜居条件仍有未确定之处。

## 本地库与音乐

- `vendor/`：复用用户原有行星项目的 Three.js 与 OrbitControls，MIT 许可证保存在 `vendor/LICENSE`。
- `assets/ad-astra.mp3`：从用户现有网站音频复制，仅供此本地项目使用。没有新增音乐授权声明或发布行为。

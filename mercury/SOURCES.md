# 来源与署名

科学内容核对日期：2026-10-02。中文介绍为整理改写；图片下方与弹窗保留出处。

## 科学

- NASA Mercury Facts：https://science.nasa.gov/mercury/facts/ （半径、温度、结构、公转与太阳日）
- NASA Mercury's Strange Hollows：https://science.nasa.gov/solar-system/planets/mercury/mercurys-strange-hollows/ （空洞地貌、成因假说）
- NASA Mariner 10 历史：https://www.nasa.gov/history/45-years-ago-mariner-10-first-to-explore-mercury/ （飞掠、3:2 共振）
- NASA MESSENGER：https://science.nasa.gov/mission/messenger/ （轨道任务、极地水冰）
- ESA BepiColombo：https://www.esa.int/Science_Exploration/Space_Science/BepiColombo/BepiColombo_overview2 （双探测器，计划 2026 年末抵达；计划可能变化）
- ESA BepiColombo factsheet：https://www.esa.int/Science_Exploration/Space_Science/BepiColombo/BepiColombo_factsheet （截至核对日期，计划 2026-11-21 入轨、2027 年 4 月开始科学运行）
- ESA 转移模块分离消息：https://www.esa.int/Enabling_Support/Operations/BepiColombo_begins_Mercury_arrival_with_MTM_separation_success （2026 年 9 月分离）

## 地表纹理

`assets/mercury-surface.jpg`：Solar System Scope，2k Mercury texture。
https://www.solarsystemscope.com/textures/
https://www.solarsystemscope.com/textures/download/2k_mercury.jpg
CC BY 4.0：https://creativecommons.org/licenses/by/4.0/
图片原文件未修改，球面投影与照明由 Three.js 实时完成。纹理为处理后的可视化产品，部分缺失地形由作者补绘，不应作为科学测量底图。

## 地貌图像

- `caloris.jpg` / PIA10359：https://science.nasa.gov/photojournal/caloris-basin-in-color/ 。NASA / Johns Hopkins University Applied Physics Laboratory / Arizona State University / Carnegie Institution of Washington. Image reproduced courtesy of Science/AAAS. 增强色彩，非肉眼真实颜色。
- `scarps.jpg` / PIA17868：https://science.nasa.gov/photojournal/scours-and-scarps/ 。NASA / Johns Hopkins University Applied Physics Laboratory / Carnegie Institution of Washington。
- `hollows.jpg` / PIA14844：https://science.nasa.gov/photojournal/have-a-gander-at-sander/ 。NASA / Johns Hopkins University Applied Physics Laboratory / Carnegie Institution of Washington。
- `polar-ice.jpg` / PIA19411：https://science.nasa.gov/photojournal/water-ice-on-mercury/ 。NASA / Johns Hopkins University Applied Physics Laboratory / Carnegie Institution of Washington。黄色为雷达观测结果的标示，不是冰的真实颜色。

原文件保持完整；卡片通过 CSS 裁切显示，弹窗显示完整图像。

## 模型与程序

Three.js 与 OrbitControls 从用户现有 Venus 项目使用的本地库复制，保留 `vendor/LICENSE`。不在运行时请求外部库。

轨道：半长轴 0.387098 AU、偏心率 0.20563、公转周期 87.969 地球日；用牛顿迭代求开普勒方程。地球用半径 1 AU、周期 365.256 日的圆轨道，初始相位任意设置为 2.1 rad；两轨道共面，忽略长期摄动。轨道线距离同比例，太阳与行星圆点尺寸放大。

照明比例由水星—太阳与水星—地球向量的夹角计算；视直径为小角度近似。轨道速度用活力公式，日照倍数用距离平方反比。相位盘只显示简化光照，忽略自转轴投影方向与地面观测姿态。

共振：自转角 = 1.5 × 平近点角 + 初始角。赤道参考点初始朝向太阳。下方昼夜图以太阳方向为固定参考，忽略轴倾角，昼夜边界为半圆。一个太阳日取两个公转周期约 175.938 日。

第二版太阳视运动图：由椭圆轨道的真近点角减去 1.5 倍平近点角，计算赤道固定经线眼中的太阳东西向角位移。图表截取第二次近日点前后的第 76–100 日，并以第 88 日附近的角度为零点；显示角度经过局部放大。转向时刻由该角位移对时间的导数求零得到。模型忽略自转轴倾角、经度与地形，不能按图推断具体地点日出时间。

首屏三维球体为独立观察模型，展示自转速度、灯光和贴图经线朝向与轨道时间轴无关。内部结构图为示意，不代表精确深度分层。

## 音频

`assets/ad-astra.mp3` 从用户原有网站 `shared/audio/ad astra.mp3` 复制用于本地预览；未增加授权声明或重新发布。

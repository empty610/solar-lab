# 土星项目 · 素材与科学说明

整理日期：2026-10-04。中文为独立重写的科普叙述，参数取适合展示的近似值，不给出会不断变化的卫星总数。

## 三维素材

以下均来自 NASA Visualization Technology Applications and Development（VTAD）：

- [土星模型](https://science.nasa.gov/resource/saturn-3d-model/) · [原始 GLB](https://assets.science.nasa.gov/content/dam/science/psd/solar/2023/09/s/Saturn_1_120536.glb)
- [土卫六模型](https://science.nasa.gov/resource/titan-3d-model/) · [原始 GLB](https://assets.science.nasa.gov/content/dam/science/psd/solar/2023/09/t/Titan_1_5150.glb)
- [土卫二模型](https://science.nasa.gov/resource/enceladus-3d-model/) · [原始 GLB](https://assets.science.nasa.gov/content/dam/science/psd/solar/2023/09/e/Enceladus_1_504.glb)

保留原始几何、UV 和节点方向；归一化土星赤道半径，保留扁率。土星环用官方透明 PNG，并只渲染一份双面环，避免重叠闪烁。球体贴图压缩为 JPEG；几何和贴图嵌入 assets/models.js，支持 file:// 本地查看。纹理是可视化素材，不是严格的自然色或实时观测。土卫六模型为表面地图，不表示肉眼能穿透浓雾看到这些细节。

## 图片档案

- [The Day the Earth Smiled / PIA17172](https://science.nasa.gov/photojournal/the-day-the-earth-smiled/)：NASA/JPL-Caltech/SSI，2013-07-19 的土星系统自然色全景拼接。文件 assets/panorama-photo.jpg。
- [Saturn’s Streaming Hexagon Storm / PIA17652](https://science.nasa.gov/resource/saturns-streaming-hexagon-storm/)：NASA/JPL-Caltech/SSI/Hampton University，2012-12-10 序列中的官方彩色静帧；增强色，非自然色。文件 assets/hexagon-photo.jpg。
- [Enceladus the Storyteller / PIA07800](https://science.nasa.gov/photojournal/enceladus-the-storyteller/)：NASA/JPL/Space Science Institute，2005 年影像组成的南半球增强色拼接，2006 年发布。文件 assets/enceladus-photo.jpg。

网页照片仅进行尺寸缩减和 JPEG 压缩；没有用生成图代替科学影像。署名保留在对应弹窗，项目不代表 NASA 对其背书。

## 参数与科学叙述

- [NASA Saturn Facts](https://science.nasa.gov/saturn/facts/)：氢氦为主、无坚硬地表、约 10.7 小时自转、29.4 地球年公转、9.5 AU、26.73° 轴倾角。
- [Cassini：六边形](https://science.nasa.gov/mission/cassini/science/saturn/hexagon-in-motion/)：北极急流图案与中央极地涡旋，避免将其说成固体边界。
- [USGS 环与环缝](https://planetarynames.wr.usgs.gov/Page/Rings)：C、B、A 环与卡西尼缝的径向范围，距离从行星中心量起。
- [NASA Titan Facts](https://science.nasa.gov/saturn/moons/titan/facts/)：浓厚氮大气、烃类液体循环、同步自转。表面模型不表示云雾。
- [NASA Enceladus](https://science.nasa.gov/saturn/moons/enceladus/)：冰下海洋、喷流、潮汐、E 环物质补给与宜居性研究。明确“具备部分生命条件”不等于“发现生命”。
- [JPL 卫星平均轨道根数](https://ssd.jpl.nasa.gov/sats/elem/)：土卫六 a ≈ 1,221,900 km、P ≈ 15.945448 日；土卫二 a ≈ 238,400 km、P ≈ 1.370218 日。视图忽略偏心率、倾角和摄动。
- [Cassini—Huygens](https://science.nasa.gov/mission/cassini/)：2004–2017 环绕、2005 惠更斯着陆与最后进入大气的安排。

## 演示限制

1. 三维系统只含两颗卫星，不是完整的卫星系统。全景保留球体与轨道相对尺度，卫星近景独立放大。
2. 自转和卫星公转共用模拟天数；“暂停自转”也暂停卫星公转，维持同步自转关系。展示速度为每秒 0.025 地球日。
3. 三维模型与日心轨道实验是两个独立的教学视图，不代表同一真实日期。
4. 日心轨道按圆轨道示意；大小与轨道半径不按比例，周期比近似真实。按钮、太阳与滑块共用同一播放状态。
5. 光环整体用纹理显示，不模拟每一粒冰的差分公转；不计算具体日期环面照明。照明切换只是方便观察。
6. 不提供实时星历，不可据此安排实际观测或定位。

## 本地沿用与许可

Three.js / OrbitControls 从现有 Neptune 项目复制，许可证在 vendor/LICENSE。布局和交互延续本地 Mercury、Neptune 等界面。

背景音乐 ad-astra.mp3 沿用本地项目，仅供本地预览；公开发布前请确认音乐授权。显式点击后播放，循环并淡入，离开页面停止。本项目不自动播放音乐，也不访问外部 CDN。

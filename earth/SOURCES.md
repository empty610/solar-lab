# 地球 · 观察手记

本页为 Solar Laboratory 的本地地球介绍档案。主文保存在 index.html，模型、界面与素材随页面提供。没有运行时 CDN、远端字体或远端影像依赖。

## 影像与纹理

- `earth-day.jpg`：Three.js r160 examples 的 `earth_atmos_2048.jpg`，地表与云层的展示合成贴图。镜像来源：https://github.com/mrdoob/three.js/blob/r160/examples/textures/planets/earth_atmos_2048.jpg 。此纹理不代表某一时刻的全球天气。
- `earth-night.png`：同一 Three.js 示例集的 `earth_lights_2048.png`。夜间灯光合成图，用于比较地表与夜间视图，不是实时城市亮度数据。https://github.com/mrdoob/three.js/blob/r160/examples/textures/planets/earth_lights_2048.png
- `clouds.jpg`：NASA Visible Earth / Blue Marble 云层合成图，作为独立云层透明度纹理，非实时气象资料。官方文件：https://eoimages.gsfc.nasa.gov/images/imagerecords/57000/57747/cloud_combined_2048.jpg 。NASA 旧素材目录入口 https://visibleearth.nasa.gov/images/57747/blue-marble-clouds 已重定向至 Earth Observatory。
- `moon.jpg`：同一示例集的 `moon_1024.jpg`。CSS 球面外观用于章节插图，不作为精准月面地图。https://github.com/mrdoob/three.js/blob/r160/examples/textures/planets/moon_1024.jpg
- Three.js 示例仓库遵循 MIT 许可证：https://github.com/mrdoob/three.js/blob/r160/LICENSE 。使用项目中已有的 `shared/vendor/` 库与许可证；未引入新库版本。
- `earth-poster.png` 与 Terminal 的两张地球缩略图：使用本页球体与上述地球贴图生成的静态渲染。
- `file-textures.js`：白昼、夜间与云层纹理的等价 data URL，仅在直接打开 file:// 页面时按需加载，以避免浏览器禁止本地纹理跨源读取。
- `earthrise.jpg`：NASA / Bill Anders，Apollo 8，1968 年 12 月 24 日。来源：https://science.nasa.gov/resource/apollo-8s-iconic-earthrise/ 。本地保存官方 1280px 版本，卡片裁切显示，点击可打开完整影像。

## 科学资料

- NASA · 地球事实、轨道、内部结构：https://science.nasa.gov/earth/facts/
- NOAA · 海洋与地球的水：https://oceanservice.noaa.gov/facts/oceanwater.html
- NOAA · 大气分层：https://www.noaa.gov/jetstream/atmosphere/layers-of-atmosphere
- NASA · 大气层：https://science.nasa.gov/earth/earth-atmosphere/earths-atmosphere-a-multi-layered-cake/
- NASA · 气候变化：https://science.nasa.gov/climate-change/
- NASA · 极光：https://science.nasa.gov/sun/auroras/
- NASA · 月球事实：https://science.nasa.gov/moon/facts/
- Smithsonian · 早期生命与动物起源：https://naturalhistory.si.edu/education/teaching-resources/life-science/early-life-earth-animal-origins
- USGS · 地球圈层与板块背景：https://pubs.usgs.gov/gip/dynamic/inside.html
- NASA / USGS · Landsat 历史：https://landsat.gsfc.nasa.gov/satellites/landsat-1/

## 2026-10-29 正文扩充参考

叙述参照本项目火星与金星已恢复的手写原稿：从观察现象切入，以提问、熟悉事物的比较和机制解释展开，并区分观测、模型与未解决的问题。正文保存在 `index.html`，包括各标签页与展开说明；未改动其它行星的原文。

- NOAA · 海水颜色与光的吸收：https://oceanservice.noaa.gov/facts/oceanblue.html
- NOAA · 深海热泉与化能合成：https://oceanexplorer.noaa.gov/facts/photochemo.html
- USGS · 水循环与人类用水：https://www.usgs.gov/water-science-school/water-cycle
- USGS · 植物蒸腾：https://www.usgs.gov/water-science-school/science/evapotranspiration-and-water-cycle
- NASA · 冰芯中的古气候记录：https://science.nasa.gov/earth/earth-observatory/paleoclimatology-the-ice-core-record/
- NOAA NCEI · 古气候代用资料：https://www.ncei.noaa.gov/news/what-are-proxy-data
- NASA · 温室效应与当前气候变化成因：https://science.nasa.gov/climate-change/causes/
- NASA · 磁层与磁尾：https://science.nasa.gov/heliophysics/focus-areas/magnetosphere-ionosphere/
- USGS · 地震波与地球内部结构：https://pubs.usgs.gov/gip/interior/index.html
- NASA · 月球形成的证据与模型：https://science.nasa.gov/moon/formation/
- NASA · 月相：https://science.nasa.gov/moon/moon-phases/
- NASA · 潮汐：https://science.nasa.gov/moon/tides/

地月缩尺例子按本页地球平均半径、月球约1,737千米半径与384,400千米平均距离计算，均取便于阅读的近似值。未将模型演示描述为实时观测，也未把潜在宜居环境等同于已发现生命。

## 生态系统与天气补充

- NOAA · 食物网、生产者、消费者与分解者：https://www.noaa.gov/education/resource-collections/marine-life/aquatic-food-webs
- USDA NRCS · 土壤有机质与土壤功能：https://www.nrcs.usda.gov/conservation-basics/soil/soil-health/role-of-organic-matter
- NOAA · 河口、盐沼与红树林生境：https://www.noaa.gov/education/resource-collections/marine-life/life-in-estuary
- NOAA · 珊瑚共生、礁体与环境压力：https://www.noaa.gov/education/resource-collections/marine-life/coral-reef-ecosystems
- NOAA · 长期稳定的地表液态水及其他世界的海洋：https://oceanservice.noaa.gov/facts/et-oceans.html
- NWS · 季风环流与季节性水汽输送：https://www.weather.gov/twc/Monsooninfo
- NOAA · 雷暴的水汽、不稳定层结和抬升条件：https://www.noaa.gov/jetstream/thunderstorms/ingredients-for-thunderstorm
- NOAA · 热带天气系统：https://www.noaa.gov/jetstream/tropical
- NOAA · 热带气旋形成条件：https://www.noaa.gov/jetstream/tropical/tropical-cyclone-introduction

“独特”指地球已确认的生命圈与长期地表液态水等条件共同塑造的环境，并非宣称云、风暴或降水仅存在于地球。

## 可视化边界

地球三维观察采用球形近似，轴倾角取 23.44°；自转展示速度加快，镜头和光照服务于阅读。夜间视图单独展示全球灯光合成贴图，未计算实时晨昏线。

昼夜视图以约 0.9 秒的缓入缓出在同一球面上混合贴图，夜间自发光与独立云层透明度同步变化。中途反向切换从当前混合状态继续；减少动态效果时直接显示目标视图。动画沿用按需模型时钟，离屏或后台暂停，恢复后继续；此渐变是观察模式切换，不模拟真实日落。

地表四图、季风与积雨云剖面、生态景观长图为本页绘制的 SVG 艺术示意，不是观测影像或按比例的科学模拟。森林、根系、湿地、河流与海洋用于展示环境联系；水汽路径、雨线、洋流、光晕和磁场线的运动均为帮助阅读的视觉提示，速度、轨迹和明暗变化不对应实测值。原始 NASA 影像、模型纹理和科学参数未因美术调整改变。

插画循环由 CSS 驱动，`SolarUI.activity` 控制各图的可见性、前后台及页面生命周期；离屏暂停并保留动画进度。章节导航中的“插画动效”按钮可统一暂停或恢复插画循环，选择保存在本地。系统启用减少动态效果时，插画静止。正文不使用持续位移、滚动劫持或打字动画；有限的入场和交互过渡继续由共享界面生命周期收尾。

地心剖面依据平均半径与近似层界绘制，地壳厚度夸张以便辨识。大气色带、磁场与地月插图未按真实尺度。生命时间线是事件列表，间距不表示年代长度。

四季实验以春分位置为 0°，使用圆轨道角位置 θ，太阳赤纬近似为 δ = 23.44° × sin θ。纬度 φ 的日出时角满足 cos H = −tan φ × tan δ，昼长为 24H/π 小时，并在极昼/极夜边界截断。忽略轨道偏心率、大气折射、太阳视直径与地形；不能作为精确日出日落预报。北半球节气按钮对应 0°、90°、180°、270°。

主要参数为适合入门阅读的约值。形成、演化等推断与直接观测的影像在正文中区分说明。

本轮磁层图以迎日侧压缩、背日侧延伸与高纬极光三个观察层替换对称椭圆示意；流线用于定位结构，不表示粒子的精确轨迹或磁场方向。生态关系层区分水的转移、能量传递与养分循环，能量层不绘成闭合循环。所有关系切换仅突出配图与图注，预留当前宽度下最长说明的高度；键盘方向键可切换主题，无脚本时完整保留说明。窄屏生态全景完整呈现，避免森林与外海被裁切。章节导航保留原生锚点与历史记录，以连续位置判断当前章节；总阅读进度与当前章节进度分别显示，正文不随导航淡出。

模型观察区域扩展为与正文同宽的独立全景，初始镜头保留完整球体与留白；移除蓝色底板和固定装饰环。北回归线采用球面北纬 23.44° 的三维虚线，标签投影随镜头、球面自转与缩放更新，背面自动隐藏。滚轮、双指和缩放按钮在模型内控制距离；复位沿球面方向与相对观察距离做约 0.9 秒缓动，沿最短角度恢复球面朝向，可被手动操作中断。离屏、后台暂停复位计时，减少动态效果时直接收束；窗口尺寸变化保持观察方向和相对缩放。自转与昼夜选择在复位时保留。

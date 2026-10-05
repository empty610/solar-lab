# 资料来源与展示说明

核对日期：2026-10-03。页面是本地教学与视觉展示，任务未来节点均为计划日期。

## 科学资料

- [NASA · Europa Facts](https://science.nasa.gov/jupiter/jupiter-moons/europa/europa-facts/)：冰面、线状地形、少量撞击坑、稀薄氧气大气、同步自转、偏心轨道与地下海洋证据。
- [NASA · Ingredients for Life](https://science.nasa.gov/mission/europa-clipper/why-europa-ingredients-for-life/)：液态水、化学成分与能量等潜在宜居条件；海洋体积约为地球海洋两倍是模型估计，不代表已直接测量或发现生命。
- [JPL · 卫星物理参数](https://ssd.jpl.nasa.gov/sats/phys_par/sep.html)：木卫二平均半径 1560.8 km，月球平均半径 1737.4 km，用于直径比较。
- [JPL · 卫星平均轨道参数](https://ssd.jpl.nasa.gov/sats/elem/sep.html)：木卫二轨道半长轴 671100 km、偏心率约 0.009。展示使用常见近似恒星周期 3.551 地球日；不混用该表中不同定义的周期。
- [NASA · Juno 冰壳研究，2026-01-27](https://www.nasa.gov/missions/juno/nasas-juno-measures-thickness-of-europas-ice-shell/)：2022 年飞掠的微波观测约束所观测区域约 29 km 的冷硬传导冰层。该数字依赖纯水冰模型，盐和其他结构会改变解释，不能视为全球精确厚度或海洋深度。

## 探测任务

- [NASA · Europa Clipper](https://science.nasa.gov/mission/europa-clipper/) 与 [任务 FAQ](https://science.nasa.gov/mission/europa-clipper/mission-faq/)：2024 年发射，计划通过 49 次木卫二近距离飞掠调查宜居环境。
- [NASA · 任务时间线](https://science.nasa.gov/mission/europa-clipper/mission-timeline/)：2025 年 3 月完成火星助推；2026 年 12 月地球助推、2030 年 4 月抵达木星、2031 年春首次飞掠木卫二为计划节点。
- [NASA · 科学仪器](https://science.nasa.gov/mission/europa-clipper/spacecraft-instruments/)：REASON 雷达、ECM 磁力计、MISE 红外光谱仪与 MASPEX 质谱仪。任务研究宜居环境，不是直接探测生命的任务。
- [NASA · Voyager](https://science.nasa.gov/mission/voyager/)、[Galileo](https://science.nasa.gov/mission/galileo/)：历史飞掠、冰面影像和感应磁场观测。
- [ESA · Juice](https://www.esa.int/Science_Exploration/Space_Science/Juice)：计划 2031 年抵达木星系统，并飞掠木卫二进行冰卫星比较调查。

## 本地素材与署名

| 文件                                               | 来源与处理                                                                                                                                                                                                        |
| -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `assets/europa.jpg`                                | [NASA · Europa 3D Model](https://science.nasa.gov/resource/europa-3d-model/)，NASA / VTAD。从官方 GLB 提取球面纹理，缩至 2048 × 1024 JPG，用于本地 Three.js 球体。                                                |
| `assets/jupiter.jpg`、`assets/jupiter-geometry.js` | [NASA · Jupiter 3D Model](https://science.nasa.gov/resource/jupiter-3d-model/)，NASA / VTAD。保留官方网格、法线与 UV，归一化坐标，并将纹理转成 2048 × 1536 JPG。赤道半径 71492 km、极半径 66854 km，保留扁率。    |
| `assets/textures.js`                               | 上述两幅模型纹理的本地 data URL 副本，用于离线打开时避免文件协议纹理加载限制。                                                                                                                                    |
| `assets/europa-global.jpg`                         | [Europa’s Stunning Surface / PIA19048](https://science.nasa.gov/resource/europas-stunning-surface/)。伽利略号 1990 年代后期的重新拼接影像，接近自然色。NASA/JPL-Caltech/SETI Institute。                          |
| `assets/bands.jpg`                                 | [Crisscrossing Bands / PIA23872](https://science.nasa.gov/photojournal/crisscrossing-bands/)。1998-09-26 影像，高分辨率灰度与较低分辨率色彩数据合成，增强色处理，图幅约 285 km。NASA/JPL-Caltech/SETI Institute。 |
| `assets/chaos.jpg`                                 | [Chaos Near Agenor Linea / PIA23873](https://science.nasa.gov/photojournal/chaos-near-agenor-linea/)。1998-09-26 影像，增强色处理，图幅约 280 km。NASA/JPL-Caltech/SETI Institute。                               |
| `assets/ad-astra.mp3`                              | 来自用户已有本地项目的音频，沿用原项目，默认关闭；未新增授权声明。                                                                                                                                                |
| `vendor/`                                          | Three.js 与 OrbitControls，沿用已有本地项目版本，许可证见 `vendor/LICENSE`。                                                                                                                                      |

影像卡片使用 CSS 裁切；放大窗口展示本地保存的 NASA 显示分辨率图像，并非最高分辨率原始科学数据。图像本身未增加虚构地形。页面图标、大小比较、剖面和形变示意由 SVG 绘制。

## 模型边界

- 三维场景以木星赤道半径为 1；木卫二球体半径为 1560.8 / 71492，轨道坐标用同一长度单位。切换仅移动相机，不改变天体尺寸、位置或网格；选择会暂停轨道播放。
- 对木卫二使用平面开普勒椭圆，解开普勒方程得到非均匀公转位置；自转用平均周期匀速同步近似。第 0 日是假定近木点，不对应真实日期。忽略摄动、倾角、进动和真实姿态。
- 相对潮汐作用为 `(半长轴 / 即时中心距离)^3`，平均距离处归一化为 1；不是冰壳形变测量、潮汐产热计算或海洋响应模型。旁边的拉伸幅度为放大教学示意。
- 二维轨道按参数计算椭圆与距离；木卫二点标记放大便于观察，同一侧的绿色点展示近似同步自转。
- 内部剖面的各层厚度与颜色是示意，海洋与冰壳具体性质仍在研究。尚未确认木卫二上有生命。
- 模型照明、自动环绕和拼接贴图用于观察，没有模拟实时太阳照明或真实星历。网页可完全离线运行，外部来源链接需要联网。

## 2026-10-04 文案补充核对

本次扩写继续采用上述来源，补充说明地形先后关系、内部结构模型、潮汐耗散与仪器调查方法。Europa Clipper 环绕木星、反复飞掠的辐射环境原因，依据 [NASA 任务 FAQ](https://science.nasa.gov/mission/europa-clipper/mission-faq/)。水岩反应、化学能、宜居条件与有机物的科学边界，依据 [NASA Ingredients for Life](https://science.nasa.gov/mission/europa-clipper/why-europa-ingredients-for-life/)。

结尾对火星与木卫二探索路线的比较，以及对未来探索意义的追问，是科普叙述与作者式讨论，不是新的观测结论。29 km 估计对应纯水冰假设下、所观测区域的冷硬导热层；海洋水量为模型估计，未来任务节点继续标为计划。

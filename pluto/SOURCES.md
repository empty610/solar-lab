# 资料与素材来源

整理日期：2026-10-05。科学资料和素材来自 NASA 公开页面，文字为中文整理。NASA / Johns Hopkins APL / Southwest Research Institute；三维模型：NASA VTAD。项目不代表任何机构背书。

## 科学资料

- [NASA · 冥王星事实](https://science.nasa.gov/dwarf-planets/pluto/facts/)：直径约 2,377 km、自转约 6.4 地球日、公转约 248 地球年、阳光单程约 5.5 小时、2006 年矮行星分类。
- [NASA · 冥卫一](https://science.nasa.gov/dwarf-planets/pluto/moons/charon/)：直径约 1,214 km、两者中心距离约 19,640 km、相互潮汐锁定。
- [NASA StarChild · 共同质心](https://starchild.gsfc.nasa.gov/docs/StarChild/solar_system_level2/pluto_charon.html)：共同质心位于冥王星表面以外。
- [NASA · 冥王星与冥卫一的舞步](https://www.nasa.gov/missions/pluto-and-its-moon-charon-now-in-color/)：共同绕质心运动的影像与解释。
- [NASA · Hubble Focus: Our Amazing Solar System](https://www.nasa.gov/sites/default/files/atoms/files/hubblefocusouramazingsolarsystem.pdf)：冥卫一约为冥王星质量的 12%。演示采用约 0.122 的质量比；不作为精密星历使用。
- [NASA · 新视野号任务](https://science.nasa.gov/mission/new-horizons/)：2006 年发射、2015 年冥王星飞掠、2019 年阿罗科思飞掠。
- [NASA · 飞掠后的十项发现](https://www.nasa.gov/solar-system/five-years-after-new-horizons-historic-flyby-here-are-10-cool-things-we-learned-about-pluto/)：氮冰原、对流、地质活动与表面更新。

## 科学影像

| 本地文件                     | 来源                                                                                                                                                    | 说明                                                |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| `assets/pluto-global.jpg`    | [The Rich Color Variations of Pluto](https://science.nasa.gov/resource/the-rich-color-variations-of-pluto/)                                             | 2015 年 7 月 14 日；增强色影像，非肉眼自然色        |
| `assets/pluto-haze.jpg`      | [Pluto’s Blue Sky](https://www.nasa.gov/image-article/plutos-blue-sky/)                                                                                 | 飞掠后逆光下的薄雾                                  |
| `assets/pluto-mountains.jpg` | [Pluto’s Majestic Mountains, Frozen Plains and Foggy Hazes](https://science.nasa.gov/resource/plutos-majestic-mountains-frozen-plains-and-foggy-hazes/) | 低角度光照下的冰山、平原与薄雾，场景横跨约 1,250 km |

原图仅为网页浏览作尺寸与 JPEG 压缩处理。卡片中局部裁切，弹窗显示完整影像。页面与弹窗标明 NASA / Johns Hopkins APL / SwRI。

## 三维资源

- [NASA VTAD · Pluto 3D Model](https://science.nasa.gov/resource/pluto-3d-model/)
- [NASA VTAD · Charon 3D Model](https://science.nasa.gov/resource/charon-3d-model/)

`tools/prepare-assets.cjs` 从原始 GLB 提取网格、UV、法线和节点旋转，将几何归一化到单位最大半径，保存本地 JPEG 纹理及内嵌纹理版本。透明缩略图由同一模型经 Three.js 渲染，没有生成或补画科学表面细节。原始 URL 记录在 `assets/sources.json`。

模型贴图清晰度不均，未完整成像区域可能填补。增强色、展示光照、起始朝向和转动角度不代表真实时刻。双星全景使用直径比例 1214 / 2377，中心距离为 19640 / 1188.5 个冥王星半径；轨道为简化圆。二维演示用半径 30 和 246 的轨道示意近似质量比，天体图像适度放大，表面小点说明相互潮汐锁定。

Three.js 和 OrbitControls 沿用同目录其他行星页的本地版本。MIT 许可见 `vendor/LICENSE`。

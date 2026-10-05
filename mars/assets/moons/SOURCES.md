# 火卫一与火卫二

NASA/JPL-Caltech 原始 glTF 模型（内含贴图），下载于 2026-09-18：

- 火卫一：https://science.nasa.gov/resource/phobos-mars-moon-3d-model/
  - https://assets.science.nasa.gov/content/dam/science/psd/mars/resources/gltf_files/24878_Phobos_1_1000.glb
- 火卫二：https://science.nasa.gov/resource/deimos-mars-moon-3d-model/
  - https://assets.science.nasa.gov/content/dam/science/psd/mars/resources/gltf_files/24879_Deimos_1_1000.glb

本地 PNG 为模型中原始嵌入贴图，保留原有 UV；不是由单张照片随意铺到球体上。
prepare-moons.mjs 从这两个 GLB 提取几何与贴图到 moon-assets.js，用于 file:// 离线访问。

大小：https://ssd.jpl.nasa.gov/sats/phys_par/ （Phobos 11.08 km，Deimos 6.2 km，体积等效平均半径）。
轨道：https://ssd.jpl.nasa.gov/sats/elem/sep.html （MAR099，Phobos a=9375 km、e=.015、i=1.1°；Deimos a=23457 km、e≈0、i=1.8°）。
火星沿用 3390 km 平均半径。三者采用同一世界单位，卫星网格按体积等效半径等比例缩放，保留原始不规则外形；标签和定位圆点不按物理尺寸缩放。

轨道使用平均参数绘制；为教学展示，将卫星局部拉普拉斯参考面近似放在火星赤道面上，采用固定示意相位，未按实时星历传播。相机自动环绕用于观察模型，不代表卫星公转。

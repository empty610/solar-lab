/* Editorial content, physical constants and pure orbital math, separate from UI. */
(function (root) {
  'use strict';
  const TAU = Math.PI * 2;
  const data = {
    radius: 24764,
    tritonRadius: 1353.5,
    tritonOrbit: 354800,
    tritonPeriod: 5.876994,
    neptuneYear: 164.8,
  };
  const profiles = {
    neptune: {
      tag: 'THE EIGHTH PLANET',
      title: '蓝色，不等于平静。',
      copy: '看起来平静的蓝色，并不是一片海洋。你看到的是云层与大气；这里没有可供站立的地面，却有不断变化的风暴。往下阅读前，不妨先转动模型，找找明亮的云带。',
      facts: [
        ['赤道直径', '49,528', 'km'],
        ['自转周期', '约 16', '小时'],
        ['行星分类', '冰巨星', ''],
      ],
    },
    rings: {
      tag: 'A QUIET ARCHITECTURE',
      title: '微弱，却真实存在。',
      copy: '别急着寻找一圈土星那样的宽环。海王星的环细窄而暗弱，部分物质还聚成了环弧。这里增强了环的亮度与宽度，便于辨认位置，并不还原肉眼可见程度。',
      facts: [
        ['最外主环', 'Adams', ''],
        ['中心距', '62,930', 'km'],
        ['已知主环', '至少 5', '条'],
      ],
    },
    triton: {
      tag: 'TRITON / NEPTUNE I',
      title: '一颗逆流而行的冰月。',
      copy: '它朝着与海王星自转相反的方向绕行，却仍大致以同一面朝向行星。逆行与潮汐锁定并不矛盾；这颗可能被捕获的冰月，还保留着喷流与地表改造的线索。',
      facts: [
        ['直径', '约 2,707', 'km'],
        ['公转周期', '5.877', '天'],
        ['公转方向', '逆行', ''],
      ],
    },
    system: {
      tag: 'THE NEPTUNIAN SYSTEM',
      title: '把距离，放回视野。',
      copy: '把距离按比例放回去，你会发现海卫一比近景里小得多。这不是模型丢失了细节，而是空间本来就很空旷。球体半径与轨道半径保留相对比例；想看清地貌，可切回海卫一近景。',
      facts: [
        ['海卫一中心距', '354,800', 'km'],
        ['距离单位', '1 Rₙ', ''],
        ['时间速率', '1 秒 = 0.025', '天'],
      ],
    },
  };
  const photos = {
    storm: {
      src: 'assets/dark-spot.jpg',
      title: '风暴边缘的白色云羽',
      tag: 'VOYAGER 2 / PIA00052 / 1989',
      credit: 'NASA / JPL',
      url: 'https://science.nasa.gov/photojournal/neptune-great-dark-spot-in-high-resolution/',
      paragraphs: [
        '如果你的目光先被那块深色区域吸引，接下来不妨看看它边缘的白色云羽。旅行者二号拍下这张影像时，距离最近接近海王星还有约 45 小时，航天器与行星相隔约 280 万千米。即使这样，云层已经显露出细碎而复杂的结构。',
        '大黑斑不是地面上的坑洞，也不是一块固定的大陆，而是大气中的巨大涡旋。亮云跨过深浅不同的区域，让我们看见风暴附近并不光滑的边界。对于研究者来说，云不仅好看，也能成为追踪气流与变化的标记。',
        '一些小尺度云结构在一次自转前后就可能不同。因此，这张照片更像某一天的天气记录，而不是永久有效的地图。模型为了展示而保留的暗斑，也不应被理解为海王星今天仍有同样的风暴、位于同样的位置。',
        '原图由窄角相机的透明和绿色滤光片数据合成，颜色经过处理以突出结构。阅读它时，可以关注云的形态、边界与明暗差异，但不要仅凭屏幕上的蓝色深浅，就断定某个区域的真实颜色或温度。',
      ],
    },
    rings: {
      src: 'assets/webb-rings.jpg',
      title: '当蓝色褪去，尘埃亮起',
      tag: 'WEBB / NIRCAM / 2022',
      credit: 'NASA / ESA / CSA / STScI',
      url: 'https://esawebb.org/images/weic2214a/',
      paragraphs: [
        '这还是我们刚刚看过的海王星吗？如果你是第一次看到它的近红外影像，这个疑问很正常。经典照片里的蓝色不见了，细窄的环反而变得醒目。行星没有突然换一张脸，是观察它的波段变了。',
        '在这些近红外波段，甲烷吸收光，使大部分圆盘显得暗淡；较高处的云能把阳光反射出来，在暗背景上形成亮斑和条带。所以，图上更亮不一定意味着那里更热，也不能按可见光照片的直觉去读每一处明暗。',
        '再看环的部分，除了清晰的细线，还能辨认更弥散的尘埃结构。它们不是韦布到来后才出现，而是这次观测让这些结构更容易被分开辨认。看不清，与不存在，是两件不同的事。',
        '这张影像将近红外数据映射成屏幕可以显示的颜色，不代表人在太空中用肉眼会看到相同的景象。它的价值不在于替换那颗熟悉的蓝球，而在于补充可见光没有讲完的信息。',
      ],
    },
    triton: {
      src: 'assets/triton-mosaic.jpg',
      title: '一颗逆行冰月的面孔',
      tag: 'VOYAGER 2 / PIA00317 / 1989',
      credit: 'NASA / JPL / USGS',
      url: 'https://science.nasa.gov/photojournal/global-color-mosaic-of-triton/',
      paragraphs: [
        '海卫一看起来不像一颗普通的白色冰球。浅色极区与较暗、纹理复杂的区域拼在一起，明暗、色调和地貌各不相同。这张全球彩色拼接图来自旅行者二号的飞掠资料，也说明“冰质表面”并不意味着单调。',
        '你可以先沿着浅色区域的边界观察，再把目光移到那些带有复杂纹理的地方。不同区域可能经历过不同程度的沉积与改造；但仅凭颜色，无法把每一块地方的物质成分和形成时间都准确标出来。',
        '原始合成把橙、紫和紫外滤光片的数据映射到了可见颜色。因此，这张图适合比较区域之间的差异，却不是一张未经处理的人眼视图。与前两张影像一样，知道“怎样拍、怎样合成”，也是阅读图片的一部分。',
        '最后需要留意：一次飞掠无法在相同的光照、角度与分辨率下完整记录整颗卫星。模型里的纹理是为了连续展示而制作的地图，不能把未充分成像区域的外观，当成已经得到同等精度验证的地貌。留下空白并不可惜，把未知误当成已知才会妨碍理解。',
      ],
    },
  };
  // y is the spin axis. The inclined orbit has retrograde angular momentum.
  function tritonPosition(day) {
    const angle = (day / data.tritonPeriod) * TAU,
      r = data.tritonOrbit / data.radius,
      i = (157.3 * Math.PI) / 180;
    return {
      x: r * Math.cos(angle),
      y: r * Math.sin(angle) * Math.sin(i),
      z: -r * Math.sin(angle) * Math.cos(i),
      angle,
    };
  }
  function heliocentric(year) {
    return { earth: year * TAU, neptune: (year / data.neptuneYear) * TAU };
  }
  root.NeptuneData = { ...data, profiles, photos, tritonPosition, heliocentric };
})(typeof window !== 'undefined' ? window : globalThis);

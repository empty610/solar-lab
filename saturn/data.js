/* Editing entry point: profiles, photo essays and approximate physical constants. */
(function (root) {
  'use strict';
  const TAU = 2 * Math.PI;
  const radius = 60268,
    saturnYear = 29.4;
  const moons = {
    titan: { radius: 2575, orbit: 1221900, period: 15.945448, phase: 2.1 },
    enceladus: { radius: 252, orbit: 238400, period: 1.370218, phase: 0.2 },
  };
  const profiles = {
    saturn: {
      tag: 'THE SIXTH PLANET',
      title: '光环不是一件装饰。',
      copy: '它不是一整块薄圆盘，而是无数冰粒与碎块各自绕行的结果。先拖动土星，看一看环的倾角，再切到俯视寻找那道深色的卡西尼缝。',
      facts: [
        ['赤道直径', '120,536', 'km'],
        ['自转周期', '约 10.7', '小时'],
        ['行星分类', '气态巨行星', ''],
      ],
    },
    rings: {
      tag: 'ICE IN ORBIT',
      title: '每一粒冰，都在前进。',
      copy: '这不是一张唱片。环内侧的粒子绕行更快，外侧更慢；这里用 NASA 环贴图显示整体结构，不模拟每一颗粒子的运动。浅色宽环之间，卡西尼缝是一条值得寻找的线索。',
      facts: [
        ['主要可见环', 'C / B / A', ''],
        ['卡西尼缝宽', '约 4,700', 'km'],
        ['主要成分', '水冰', ''],
      ],
    },
    titan: {
      tag: 'TITAN / SATURN VI',
      title: '有湖海，不等于有海水。',
      copy: '土卫六的雨、河与湖海，主要与甲烷和乙烷有关。此处展示的是表面可视化地图；真实的浓厚雾霾会挡住许多细节，不是肉眼能直接看见的地表照片。',
      facts: [
        ['直径', '约 5,150', 'km'],
        ['同步周期', '15.95', '天'],
        ['大气主体', '氮', ''],
      ],
    },
    enceladus: {
      tag: 'ENCELADUS / SATURN II',
      title: '冰壳下面，还有海洋。',
      copy: '南极裂缝喷出水汽与冰粒，把内部的线索送入太空。模型展示表面纹理，不包含喷流动画；有水、有化学原料，仍不等于已经发现生命。',
      facts: [
        ['直径', '约 504', 'km'],
        ['同步周期', '1.37', '天'],
        ['关键线索', '南极喷流', ''],
      ],
    },
    system: {
      tag: 'A PART OF THE SATURN SYSTEM',
      title: '把真实的距离，放回来。',
      copy: '本视图仅展示两颗卫星，球体与轨道半径保留相对比例。因此土卫二会非常小，标签只是定位提示，并没有把它放大成另一颗行星。两颗卫星的自转与公转共享时间。',
      facts: [
        ['土卫六中心距', '122.2 万', 'km'],
        ['土卫二中心距', '23.84 万', 'km'],
        ['模拟速度', '1 秒 = 0.025', '天'],
      ],
    },
  };
  const photos = {
    panorama: {
      src: 'assets/panorama-photo.jpg',
      title: '当土星挡住太阳',
      tag: 'CASSINI / PIA17172 / 2013',
      credit: 'NASA / JPL-Caltech / SSI',
      url: 'https://science.nasa.gov/photojournal/the-day-the-earth-smiled/',
      paragraphs: [
        '先看那颗几乎变成剪影的土星，再看看周围被照亮的环。2013 年 7 月 19 日，卡西尼进入土星的阴影，利用行星遮住太阳的机会，回望整个系统。换一个光照方向，原本不醒目的结构就可能成为主角。',
        '这张自然色全景由多张红、绿、蓝滤光片影像拼接而成，不是一瞬间按下快门的单幅照片。逆光帮助研究者辨认环中的细小颗粒与弥散结构；亮度变化不仅和物质多少有关，也和粒子怎样散射光有关。',
        '它的名字是“地球微笑的那一天”，因为我们的家园也在这幅远景中。不过在网页缩略图上，很难直接认出那个小光点；想寻找地球，可以打开原始资料中的标注版本，不必把画面上每一个亮点都猜成它。',
        '当视角放到这么远，土星不再只是地球天空中的一颗星，地球也不再天然占据画面的中心。照片并没有替我们回答什么哲学问题，却至少提醒我们：观察的位置，决定了许多习以为常的比例。',
      ],
    },
    hexagon: {
      src: 'assets/hexagon-photo.jpg',
      title: '风，也能画出六边形',
      tag: 'CASSINI / PIA17652 / 2012',
      credit: 'NASA / JPL-Caltech / SSI / Hampton University',
      url: 'https://science.nasa.gov/resource/saturns-streaming-hexagon-storm/',
      paragraphs: [
        '如果不告诉你拍摄对象，这个轮廓可能会让人联想到某种规则的几何装置。但它位于土星北极的大气中，是急流与波动形成的近六边形图案，并没有一堵六边形墙把气流关在里面。',
        '先沿着外侧边界走一圈，再看中央的极地涡旋。它们同处北极区域，但不是同一个概念：六边形主要描述环绕的急流图案，中央则有独立的旋涡结构。把整幅图统称为“一个六角形风暴”，会遗漏这些层次。',
        '这里使用的是官方增强色序列中的静帧。不同滤光片的信息被映射成红、绿、蓝，以突出云层与霾的差异；鲜明的蓝绿和红色并不是土星北极的肉眼原貌。',
        '这个形状为什么能持续存在、又怎样随大气变化，是研究流体运动的问题。规则可以从运动中出现，并不一定来自坚硬物体的边界。若有兴趣，可以在原始资料里继续观看对应序列，而不只停在这一帧。',
      ],
    },
    enceladus: {
      src: 'assets/enceladus-photo.jpg',
      title: '白色外壳上的蓝色裂纹',
      tag: 'CASSINI / PIA07800 / 2005 MOSAIC',
      credit: 'NASA / JPL / Space Science Institute',
      url: 'https://science.nasa.gov/photojournal/enceladus-the-storyteller/',
      paragraphs: [
        '土卫二的表面看起来很亮，却并不光滑。图中既有撞击坑，也有裂缝、褶皱和脊状地形。它们出现在同一颗小卫星上，意味着我们不能只用“结了一层冰”概括它的全部历史。',
        '这幅拼接影像主要覆盖南半球，下部包括南极地形。醒目的蓝色断裂与周围不同纹理，帮助研究者辨认受改造的区域。哪些结构切过旧地形，哪些地方保留了更多撞击坑，都能为事件的先后提供线索。',
        '蓝色并不是一条裸露的河流。这是由紫外、可见光与红外滤光片资料组合出的增强色图，颜色被用来放大表面差异，而不是直接告诉我们“这里是液态水”。冰下海洋的判断还依赖其他独立证据。',
        '原图由卡西尼在 2005 年两次接近时获取的影像拼成，各区域的拍摄条件并不完全一致。阅读它时可以欣赏复杂的纹理，也应保留这点谨慎：一张漂亮的拼接图，并不等于所有地方都被以同样方式看清。',
      ],
    },
  };
  function moonPosition(id, day) {
    const m = moons[id],
      angle = (day / m.period) * TAU + m.phase,
      r = m.orbit / radius;
    return { x: r * Math.cos(angle), y: 0, z: -r * Math.sin(angle), angle };
  }
  function heliocentric(year) {
    return { earth: year * TAU, saturn: (year / saturnYear) * TAU };
  }
  root.SaturnData = { radius, saturnYear, moons, profiles, photos, moonPosition, heliocentric };
})(typeof window !== 'undefined' ? window : globalThis);

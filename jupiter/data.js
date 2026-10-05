(function (root) {
  'use strict';
  const RJ = 71492;
  const bodies = {
    jupiter: {
      name: '木星',
      english: 'Jupiter',
      type: '气态巨行星 / GAS GIANT',
      radius: 69911,
      color: '#b08a63',
      period: 4332.59,
      orbit: 0,
      heading: '一颗行星，<br>一个小宇宙。',
      description:
        '木星的体积足以容纳一千多颗地球。我们看见的条纹是不断流动的云带；在云层之下，氢和氦随着深度增加变成更致密的流体，深处还存在导电的金属氢。这里没有可以站立的固体表面。',
      feature:
        '快速自转塑造了略微扁平的身形，也参与驱动它强大的磁场。四颗伽利略卫星环绕在外，呈现火山、冰壳、磁场与古老撞击记录等不同面貌。',
    },
    io: {
      name: '木卫一',
      english: 'Io',
      type: '火山世界 / VOLCANIC WORLD',
      radius: 1821.49,
      orbit: 421800,
      period: 1.769,
      phase: 0.35,
      color: '#caa451',
      heading: '被引力揉热的<br>火山世界。',
      description:
        '木卫一是太阳系火山活动最活跃的天体。木星的强大引力与木卫二、木卫三周期性的牵引，让它不断受到潮汐变形，内部耗散的能量驱动了广泛的火山活动。',
      feature:
        '硫及其化合物让表面呈现黄、橙、白等颜色。熔岩和喷发沉积物不断重塑地表，古老的撞击坑很难长期保存。',
    },
    europa: {
      name: '木卫二',
      english: 'Europa',
      type: '重点探索 / OCEAN WORLD',
      radius: 1560.8,
      orbit: 671100,
      period: 3.551,
      phase: 2.4,
      color: '#75a6ad',
      heading: '冰封的表面，<br>海洋的线索。',
      description:
        '木卫二比月球略小，明亮的水冰表面布满交错的裂纹。伽利略号的磁场数据与地质观测共同支持：冰壳下面可能存在一片全球性咸水海洋。',
      feature:
        '它是否拥有适宜生命存在的环境，取决于液态水、化学原料与可利用的能量能否长期相遇。尚未发现木卫二生命，Europa Clipper 正为调查这些条件奔赴木星。',
    },
    ganymede: {
      name: '木卫三',
      english: 'Ganymede',
      type: '最大的卫星 / LARGEST MOON',
      radius: 2631.2,
      orbit: 1070400,
      period: 7.155,
      phase: 4.6,
      color: '#9b9280',
      heading: '比水星更大，<br>拥有自己的磁场。',
      description:
        '木卫三是太阳系最大的天然卫星，直径比水星还大。深色古老地形与明亮的沟槽地形交错，记录了撞击和冰壳变形的历史。',
      feature:
        '它是目前唯一已知拥有内禀磁场的卫星；极光的摆动也提供了冰下咸水海洋的证据。ESA 的 Juice 计划最终进入木卫三轨道。',
    },
    callisto: {
      name: '木卫四',
      english: 'Callisto',
      type: '古老的档案 / ANCIENT WORLD',
      radius: 2410.3,
      orbit: 1882700,
      period: 16.689,
      phase: 5.4,
      color: '#8c8174',
      heading: '把数十亿年，<br>留在撞击坑里。',
      description:
        '在四颗伽利略卫星中，木卫四距离木星最远。密布的撞击坑、多重环状盆地和较少的大规模地质更新，保存了漫长的撞击历史。',
      feature:
        '它不参与内侧三颗卫星的 4∶2∶1 共振。伽利略号数据提示其深处可能存在咸水层，这颗古老的冰岩世界仍有许多未解之处。',
    },
  };
  const moons = ['io', 'europa', 'ganymede', 'callisto'];
  function positionAt(id, day) {
    const b = bodies[id];
    if (!b || !Number.isFinite(day)) throw new Error('Invalid body or time');
    if (!b.orbit) return { x: 0, y: 0, z: 0, angle: 0 };
    const angle = b.phase + (2 * Math.PI * day) / b.period,
      distance = b.orbit / RJ;
    return { x: distance * Math.cos(angle), y: 0, z: -distance * Math.sin(angle), angle };
  }
  root.Jovian = { RJ, bodies, moons, positionAt, end: 16.689 };
})(typeof window === 'undefined' ? globalThis : window);

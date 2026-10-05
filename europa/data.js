(function (root) {
  'use strict';
  const RJ = 71492,
    period = 3.551,
    eccentricity = 0.009;
  const bodies = {
    jupiter: {
      name: '木星',
      english: 'Jupiter',
      type: '木卫二的引力伙伴 / JUPITER',
      radius: 69911,
      orbit: 0,
      period: 4332.59,
      color: '#b08a63',
      heading: '一颗巨行星，<br>牵动冰海的节奏。',
      description:
        '木星是木卫二环绕的气态巨行星。强大的引力塑造了卫星的同步自转，也让略微偏心的轨道产生周期变化的潮汐。',
      feature:
        '近景与全景采用同一长度比例。切换观察对象只移动镜头，木星和木卫二始终留在同一个场景中。',
    },
    europa: {
      name: '木卫二',
      english: 'Europa',
      type: '木星第二颗伽利略卫星 / OCEAN WORLD',
      radius: 1560.8,
      orbit: 671100,
      period,
      color: '#75a6ad',
      heading: '一层冰壳，<br>一个海洋世界。',
      description:
        '木卫二，木星四颗伽利略卫星中的第二颗，位于木卫一与木卫三之间。它比月球略小，每隔约 3.55 个地球日便绕木星一周。浅色的水冰覆盖着表面，红褐色的裂纹纵横交错，为这个遥远的世界留下了鲜明的轮廓。',
      feature:
        '如果你继续向冰面之下追问，就会来到木卫二最有趣的地方：一片可能环绕全球的咸水海洋。支持它的线索来自磁场与地质观测，海洋的具体性质和宜居条件仍待调查。我们现在能做的，是沿着这些线索，一步步接近那个尚未抵达的世界。',
    },
  };
  function positionAt(id, day) {
    const b = bodies[id];
    if (!b || !Number.isFinite(day)) throw new Error('Invalid body or time');
    if (!b.orbit) return { x: 0, y: 0, z: 0, angle: 0, spin: 0, distance: 0, tide: 0 };
    const mean = (2 * Math.PI * day) / period;
    let E = mean;
    for (let i = 0; i < 8; i++)
      E -= (E - eccentricity * Math.sin(E) - mean) / (1 - eccentricity * Math.cos(E));
    const x = b.orbit * (Math.cos(E) - eccentricity),
      z = -b.orbit * Math.sqrt(1 - eccentricity ** 2) * Math.sin(E),
      distance = Math.hypot(x, z);
    return {
      x: x / RJ,
      y: 0,
      z: z / RJ,
      angle: Math.atan2(-z, x),
      spin: mean,
      distance,
      tide: (b.orbit / distance) ** 3,
    };
  }
  root.EuropaData = { RJ, bodies, moons: ['europa'], positionAt, end: period, eccentricity };
})(typeof window === 'undefined' ? globalThis : window);

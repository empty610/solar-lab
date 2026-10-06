(function () {
  'use strict';
  const terrains = {
    caloris: {
      title: '卡洛里盆地',
      kicker: 'Impact basin / Caloris',
      image: 'assets/caloris.jpg',
      url: 'https://science.nasa.gov/photojournal/caloris-basin-in-color/',
      paragraphs: [
        '先看看画面中与周围颜色不同的那一大片区域。卡洛里盆地直径约 1,550 千米，是水星最显著的巨大撞击构造之一。对一颗半径不过约 2,440 千米的行星来说，这绝不是一道不起眼的伤痕。',
        '不过，如果只把它理解成一个被砸出来的大坑，就漏掉了后半段故事。撞击之后，火山活动带来的熔岩又充填了盆地，让盆底变得相对平坦。我们今天看到的，是撞击与后续改造叠在一起的结果，而不是撞击刚发生时的原貌。',
        '细心的读者可能会问：水星不是灰褐色的吗，为什么这里看起来像铺了一层金色？这并不是一张未经处理的肉眼照片。信使号把不同波段的信息组合起来，增强了地表材料之间的差异；颜色在这里更像标记，帮助研究者区分肉眼不容易辨认的区域。',
        '因此，读这张图时，不妨同时留意两件事：地形告诉我们发生过怎样的改造，色彩差异则提供材料变化的线索。至于具体是什么岩石、经历过几轮活动，还需要更多数据，不能只凭一种颜色就下结论。',
        '图像来源：NASA / Johns Hopkins University Applied Physics Laboratory / Arizona State University / Carnegie Institution of Washington；Image reproduced courtesy of Science/AAAS。PIA10359。',
      ],
    },
    scarps: {
      title: '一颗行星的皱纹',
      kicker: 'Global contraction / Lobate scarps',
      image: 'assets/scarps.jpg',
      url: 'https://science.nasa.gov/photojournal/scours-and-scarps/',
      paragraphs: [
        '这张影像来自伦勃朗盆地附近。除了大大小小的撞击地形，你还能找到一道斜贯画面的陡崖。它看起来像一道弯曲的褶皱，但并不是流水挖出的河谷，而与岩层受到挤压后的运动有关。',
        '原因需要从水星内部讲起。随着内部缓慢冷却，行星整体收缩，原本包裹在外面的岩壳便有些“太宽了”。岩石当然不会像衣服一样柔软地折起来，它会破裂；在挤压作用下，一侧岩层沿逆冲断层向另一侧推移、抬升，留下陡崖。',
        '这也是为什么我们把它称作行星的皱纹。这个比喻只是帮助理解，并不意味着水星真的在像水果一样失水变干。研究者测量陡崖的分布和地形，是为了约束岩壳怎样变形，以及内部冷却带来了多少收缩。',
        '再把目光放回周围的撞击抛出物，你会发现同一块地表上保存着不止一种过程。哪些构造被切过，哪些痕迹覆盖在上面，都可能帮助我们排列事件先后。水星看上去很安静，但安静的地表不等于没有历史。',
        '图像来源：NASA / Johns Hopkins APL / Carnegie Institution of Washington。PIA17868。',
      ],
    },
    hollows: {
      title: '桑德坑里的明亮空洞',
      kicker: 'Volatile loss / Hollows',
      image: 'assets/hollows.jpg',
      url: 'https://science.nasa.gov/photojournal/have-a-gander-at-sander/',
      paragraphs: [
        '先别把这些亮斑认成冰。桑德撞击坑里分布着一些明亮、边界不规则的浅凹地，英文称为 hollows。这里说的“空洞”是地貌名称，并不是探测器拍到了通向地下的洞穴入口。',
        '与轮廓较完整的普通撞击坑相比，这些凹地常常连成一片，周围还有明亮物质。这样一套形态，很难仅用又一次撞击解释，也不能照搬地球上风和流水侵蚀的过程。',
        '一种重要解释是：岩石中的某些易挥发组分暴露在地表后逐渐流失，剩余物质失去支撑，形成凹陷。太阳加热、太阳风与微小撞击可能参与其中，但究竟哪些物质最重要、不同机制各占多少，还没有完全弄清。',
        '有趣之处就在这里。我们很容易把水星想象成一颗早已“烤干”的古老石球，可这类相对年轻的地貌却说明，它仍保留着值得研究的挥发物与地表变化。形态年轻是线索，却不等于我们已经亲眼记录了每个空洞正在扩张。',
        '图像来源：NASA / Johns Hopkins APL / Carnegie Institution of Washington。PIA14844。',
      ],
    },
    ice: {
      title: '永久阴影中的水冰',
      kicker: 'Cold traps / North polar region',
      image: 'assets/polar-ice.jpg',
      url: 'https://science.nasa.gov/photojournal/water-ice-on-mercury/',
      paragraphs: [
        '看到“水星上的冰”，你或许会先想到前面那几百摄氏度的白昼。两者并不矛盾，因为那不是每一处地表都要经历的温度。对于冰能否保存，局部有没有阳光、能获得多少热量，比“离太阳最近”这句话更直接。',
        '水星的自转轴几乎直立，在极区，太阳总在很低的高度掠过天空。一些深坑的坑壁因此能长期挡住直射阳光，坑底成为低温的“冷阱”。阳光照亮了附近的高处，却未必能照进这些角落。',
        '这幅图展示的是北极区域。黄色部分叠加了地面雷达观测到的亮区，并非冰本身的颜色。许多亮区与永久阴影中的坑底相对应；结合信使号带回的多种探测结果，它们构成了水冰存在的证据链，而不只是“看起来像冰”的猜测。',
        '不过，发现水冰和发现宜居环境是两回事。这里没有因此变成一个拥有液态海洋的世界，猛烈辐射与极端环境也没有消失。更值得追问的是：水怎样来到这里，又怎样在这么靠近太阳的地方保存下来？一处小小的阴影，也能成为理解挥发物迁移的入口。',
        '图像来源：NASA / Johns Hopkins APL / Carnegie Institution of Washington。PIA19411。',
      ],
    },
  };
  const dialog = document.getElementById('image-dialog');
  const terrainKeys = Object.keys(terrains);
  let currentTerrain = 0;
  const pager = document.createElement('div');
  pager.className = 'dialog-pager';
  const counter = document.createElement('span');
  counter.setAttribute('aria-live', 'polite');
  const pagerActions = document.createElement('div');
  const previous = document.createElement('button'),
    next = document.createElement('button');
  previous.type = next.type = 'button';
  previous.textContent = '←';
  next.textContent = '→';
  previous.setAttribute('aria-label', '上一张影像');
  next.setAttribute('aria-label', '下一张影像');
  pagerActions.append(previous, next);
  pager.append(counter, pagerActions);
  dialog.querySelector('.dialog-copy').prepend(pager);
  function openTerrain(key) {
    const item = terrains[key];
    currentTerrain = terrainKeys.indexOf(key);
    document.getElementById('dialog-image').src = item.image;
    document.getElementById('dialog-image').alt = item.title;
    document.getElementById('dialog-title').textContent = item.title;
    document.getElementById('dialog-kicker').textContent = item.kicker;
    const content = document.getElementById('dialog-description');
    content.replaceChildren();
    item.paragraphs.forEach((text) => {
      const p = document.createElement('p');
      p.textContent = text;
      content.appendChild(p);
    });
    document.getElementById('dialog-source').href = item.url;
    counter.textContent = `影像 ${String(currentTerrain + 1).padStart(2, '0')} / 04`;
    if (!dialog.open) dialog.showModal();
    dialog.scrollTop = 0;
    document.dispatchEvent(new CustomEvent('mercury:terrainread', { detail: key }));
  }
  function stepTerrain(step) {
    openTerrain(terrainKeys[(currentTerrain + step + terrainKeys.length) % terrainKeys.length]);
  }
  document
    .querySelectorAll('[data-terrain]')
    .forEach((button) =>
      button.addEventListener('click', () => openTerrain(button.dataset.terrain)),
    );
  previous.addEventListener('click', () => stepTerrain(-1));
  next.addEventListener('click', () => stepTerrain(1));
  dialog.addEventListener('keydown', (event) => {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      stepTerrain(event.key === 'ArrowLeft' ? -1 : 1);
    }
  });
  document.querySelector('.dialog-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) {
      const r = dialog.getBoundingClientRect();
      if (
        event.clientX < r.left ||
        event.clientX > r.right ||
        event.clientY < r.top ||
        event.clientY > r.bottom
      )
        dialog.close();
    }
  });

  // Only mouse, touch/pen and keyboard input reset the two-second timer.
  const idleControls = [...document.querySelectorAll('.idle-control')];
  let idleTimer;
  function showControls() {
    clearTimeout(idleTimer);
    idleControls.forEach((el) => el.classList.remove('is-idle'));
    idleTimer = setTimeout(() => {
      idleControls.forEach((el) => {
        if (el !== document.activeElement) el.classList.add('is-idle');
      });
    }, 2000);
  }
  ['pointermove', 'pointerdown', 'keydown'].forEach((type) =>
    window.addEventListener(type, showControls, { passive: true }),
  );
  idleControls.forEach((el) => {
    el.addEventListener('focus', showControls);
    el.addEventListener('blur', showControls);
  });
  window.addEventListener('pageshow', showControls);
  showControls();

})();

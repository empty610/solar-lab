(() => {
  'use strict';
  const $=id=>document.getElementById(id), reduced=matchMedia('(prefers-reduced-motion: reduce)');
  // Start still, so the first state can be read before the user chooses to play.
  let years=0,playing=false,visible=false,frame=0,last=0;
  const phases=[
    ['NORTHERN SUMMER','北半球夏至','北极朝向太阳，北方的高纬地区迎来漫长白昼；南方则经历极夜。向前拖动，看看二十一年后的变化。'],
    ['NORTHERN AUTUMN','北半球秋分','阳光更接近照向赤道，两极从持续的白昼与黑夜中交替走出。自转轴的方向没有追随太阳改变。'],
    ['NORTHERN WINTER','北半球冬至','轮到南半球朝向太阳。北方的高纬地区进入极夜；一段在地球上足够长的人生，在这里可能还没有走完一个季节。'],
    ['NORTHERN SPRING','北半球春分','阳光再次靠近赤道。再前进约二十一年，北半球将迎来下一次夏至，完成这段八十四年的旅程。']
  ];
  function draw(){
    const a=Math.PI+years/84*Math.PI*2,x=310+215*Math.cos(a),y=215+133*Math.sin(a);
    $('season-planet').setAttribute('transform',`translate(${x} ${y})`);$('sun-ray').setAttribute('x2',x);$('sun-ray').setAttribute('y2',y);
    const distance=Math.hypot(x-310,y-215)||1;$('mini-planet').setAttribute('cx',`${50+(310-x)/distance*28}%`);$('mini-planet').setAttribute('cy',`${50+(215-y)/distance*28}%`);
    $('season-year').textContent=years.toFixed(1);$('season-time').value=years;
    const nearest=Math.round(years/21)%4,phase=phases[nearest],exact=Math.min(years%21,21-years%21)<.05;
    $('season-phase').textContent=phase[0];$('season-title').textContent=phase[1]+(exact?'':'前后');$('season-copy').textContent=phase[2];
    document.querySelectorAll('[data-year]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.year)===nearest*21)));
  }
  function sync(){ $('season-play').innerHTML=playing?'暂停演示 <span>Ⅱ</span>':'播放一个天王星年 <span>▷</span>';$('season-play').setAttribute('aria-pressed',String(playing));cancelAnimationFrame(frame);frame=0;if(playing&&visible&&!document.hidden){last=performance.now();frame=requestAnimationFrame(tick);} }
  function tick(now){frame=0;if(!playing||!visible||document.hidden)return;years=(years+Math.min((now-last)/1000,.08)*2)%84;last=now;draw();frame=requestAnimationFrame(tick);}
  function seek(value){years=value;playing=false;sync();draw();}
  $('season-play').addEventListener('click',()=>{playing=!playing;sync();});$('season-reset').addEventListener('click',()=>seek(0));$('season-time').addEventListener('input',e=>seek(Number(e.target.value)));
  document.querySelectorAll('[data-year]').forEach(b=>b.addEventListener('click',()=>seek(Number(b.dataset.year))));
  new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;sync();}).observe($('seasons'));
  document.addEventListener('visibilitychange',sync);reduced.addEventListener('change',()=>{if(reduced.matches){playing=false;sync();}document.querySelectorAll('.reveal').forEach(el=>el.classList.add('in-view'));});draw();
  window.UranusSeasons={get state(){return {years,playing,visible,scheduled:!!frame};}};
  const photos={
    voyager:{src:'assets/voyager-colors.jpg',tag:'VOYAGER 2 / 17 JANUARY 1986',title:'同一颗星球，两种读法。',credit:'NASA / JPL-Caltech',url:'https://science.nasa.gov/image-detail/pia00032/',paragraphs:['左侧是真彩色合成，右侧是假彩色呈现。它们来自旅行者二号在 1986 年 1 月 17 日传回的窄角相机影像。','两张图的不同，并不意味着天王星突然变了颜色。科学影像可以通过不同的合成方式突出肉眼难以辨认的差异。先看影像说明，再判断哪些特征来自观测，哪些来自呈现。']},
    webb:{src:'assets/webb-rings.png',tag:'WEBB / NIRCAM / 2023',title:'暗淡的环，终于亮起。',credit:'NASA / ESA / CSA / STScI',url:'https://science.nasa.gov/missions/webb/nasas-webb-rings-in-holidays-with-ringed-planet-uranus/',paragraphs:['韦布的近红外观测让天王星的细环与极区结构更容易辨认。明亮的北极云帽、低纬方向的暗带和附近亮云，呈现了可见光下不易看清的层次。','这些颜色是红外波段数据的可见色映射，不是航天员用肉眼直接看到的景象。极区亮度与云层也会随季节和天气改变；影像记录的是一次观察，而非固定不变的表面。']},
    crescent:{src:'assets/crescent.jpg',tag:'VOYAGER 2 / 25 JANUARY 1986',title:'转身之后的一弯青色。',credit:'NASA / JPL',url:'https://science.nasa.gov/resource/uranus-final-image/',paragraphs:['1986 年 1 月 25 日，旅行者二号在离开天王星、前往海王星的途中回望。逆光方向让圆盘变成一弯浅青色的弧。','这张照片提醒我们，行星影像的形态也取决于观察位置。我们从地球上看到的遥远圆盘，和一艘刚刚飞掠的探测器眼中的世界，可以截然不同。']}
  };
  const dialog=$('photo-dialog'),photoViewer=SolarUI.dialog(dialog);
  document.querySelectorAll('[data-photo]').forEach(button=>button.addEventListener('click',()=>{const photo=photos[button.dataset.photo];$('photo-image').src=photo.src;$('photo-image').alt=photo.title;$('photo-title').textContent=photo.title;$('photo-tag').textContent=photo.tag;$('photo-description').replaceChildren();[...photo.paragraphs,'影像来源：'+photo.credit].forEach(text=>{const p=document.createElement('p');p.textContent=text;$('photo-description').append(p);});$('photo-source').href=photo.url;photoViewer.open(button);}));
  if('IntersectionObserver' in window&&!reduced.matches){document.documentElement.classList.add('motion');const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('in-view');observer.unobserve(entry.target);}}),{threshold:.06});document.querySelectorAll('.reveal').forEach(el=>observer.observe(el));}
  const links=[...document.querySelectorAll('.section-nav a')];let navFrame=0;
  function updateNav(){navFrame=0;let active=0;links.forEach((a,i)=>{if(document.querySelector(a.hash).getBoundingClientRect().top<innerHeight*.4)active=i;});links.forEach((a,i)=>{if(i===active)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current');});}
  function scheduleNav(){if(!navFrame)navFrame=requestAnimationFrame(updateNav);}addEventListener('scroll',scheduleNav,{passive:true});addEventListener('resize',scheduleNav,{passive:true});addEventListener('pageshow',scheduleNav);updateNav();
})();

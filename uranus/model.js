(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const mount = $('model-mount');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const buttons = [...document.querySelectorAll('[data-view],#spin,#lighting,#reset')];
  // Keep the authored HTML, including links and paragraph formatting, on return.
  const authoredProfile = [
    'view-title',
    'view-copy',
  ].map((id) => [id, [...$(id).childNodes].map((node) => node.cloneNode(true))]);
  const views = {
    planet: { title:'青色云层之下，没有海岸。', copy:'我们看到的是大气，不是海洋。转动这颗冰巨星，再切换环系视图，看看它不同寻常的姿态。', extent:1.14, direction:[.2,.08,1] },
    rings: { title:'一圈细环，也随它侧身而行。', copy:'环与赤道处于同一平面。这里把镜头转向环面，让暗弱、狭窄的环系显现；亮度与宽度经过增强。', extent:2.18, direction:[1,.3,.7] },
    axis: { title:'97.77°，一个倾斜的世界。', copy:'青色实线是自转轴，虚线是轨道法线，弧线标出两者夹角。倾角示意采用正视镜头；拖动后投影角度会改变。', extent:1.9, direction:[0,0,1] }
  };
  let ready=false, failed=false, visible=true, spinning=!reduced.matches, selected='planet';
  let renderer, controls, frame=0, last=0, flight=null, noteTimer, settleUntil=0, dragging=false;
  let ringAlpha=0, axisAlpha=0, ringTarget=0, axisTarget=0, lightTarget=1.45, day=0;
  const note=$('view-note');
  function fail(error) {
    if (failed) return;
    failed=true;ready=false;cancelAnimationFrame(frame);frame=0;clearTimeout(noteTimer);
    if(controls) controls.enabled=false;
    mount.classList.remove('is-ready');note.classList.remove('is-changing');
    $('model-loading').hidden=true;$('model-fallback').hidden=false;
    $('model-status').textContent='图文模式';buttons.forEach(b=>b.disabled=true);
    console.warn('Uranus model unavailable:',error);
  }
  try {
    if(!window.THREE||!window.OrbitControls||!window.URANUS_MODEL)throw Error('Missing local model');
    const scene=new THREE.Scene();
    const camera=new THREE.PerspectiveCamera(32,1,.05,100);
    renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:'low-power'});
    renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.6));
    renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.06;
    mount.append(renderer.domElement);
    renderer.domElement.setAttribute('aria-label','天王星三维观察；拖动旋转，滚轮或双指缩放');
    const ambient=new THREE.AmbientLight(0xecf2dc,1.45),key=new THREE.DirectionalLight(0xfafff5,2.7);
    key.position.set(-5,5,8);scene.add(ambient,key);
    const tilt=new THREE.Group();tilt.rotation.z=-THREE.MathUtils.degToRad(97.77);scene.add(tilt);
    const spin=new THREE.Group();tilt.add(spin);
    const data=window.URANUS_MODEL,geometry=new THREE.BufferGeometry();
    geometry.setAttribute('position',new THREE.Float32BufferAttribute(data.positions,3));
    geometry.setAttribute('normal',new THREE.Float32BufferAttribute(data.normals,3));
    geometry.setAttribute('uv',new THREE.Float32BufferAttribute(data.uv,2));geometry.setIndex(data.indices);
    geometry.applyQuaternion(new THREE.Quaternion(...data.rotation));
    const material=new THREE.MeshStandardMaterial({roughness:.92,metalness:0});
    const globe=new THREE.Mesh(geometry,material);spin.add(globe);
    const ringMaterials=[];
    for(const [i,r] of [1.637,1.665,1.695,1.751,1.788,1.844,1.862,1.896,2.001].entries()){
      const width=i===8?.018:.006;
      const mat=new THREE.MeshBasicMaterial({color:i===8?0x647f69:0x879a7e,side:THREE.DoubleSide,transparent:true,opacity:0,depthWrite:false});ringMaterials.push(mat);
      const ring=new THREE.Mesh(new THREE.RingGeometry(r-width,r+width,256),mat);ring.rotation.x=-Math.PI/2;tilt.add(ring);
    }
    const axisMaterials=[];
    function line(points,color,dashed=false){const mat=dashed?new THREE.LineDashedMaterial({color,transparent:true,opacity:0,dashSize:.06,gapSize:.04}):new THREE.LineBasicMaterial({color,transparent:true,opacity:0});axisMaterials.push(mat);const object=new THREE.Line(new THREE.BufferGeometry().setFromPoints(points),mat);if(dashed)object.computeLineDistances();return object;}
    const spinAxis=line([new THREE.Vector3(0,-1.65,0),new THREE.Vector3(0,1.65,0)],0x447e77);tilt.add(spinAxis);
    scene.add(line([new THREE.Vector3(0,0,0),new THREE.Vector3(0,1.8,0)],0x849b8e,true));
    const arc=[];for(let i=0;i<=72;i++){const a=-THREE.MathUtils.degToRad(97.77)*i/72;arc.push(new THREE.Vector3(-Math.sin(a)*1.4,Math.cos(a)*1.4,0));}scene.add(line(arc,0xa58d51));
    controls=new OrbitControls(camera,renderer.domElement);controls.enablePan=false;controls.enableDamping=true;controls.dampingFactor=.09;controls.rotateSpeed=.6;controls.zoomSpeed=.65;controls.minDistance=1.25;controls.enabled=false;
    const vector=id=>new THREE.Vector3(...views[id].direction).normalize();
    function fit(){const half=Math.min(THREE.MathUtils.degToRad(camera.fov/2),Math.atan(Math.tan(THREE.MathUtils.degToRad(camera.fov/2))*camera.aspect));return views[selected].extent/Math.sin(half)*1.08;}
    function request(){if(!frame&&ready&&!failed&&visible&&!document.hidden){last=performance.now();frame=requestAnimationFrame(tick);}}
    function paint(){renderer.render(scene,camera);}
    function reset(immediate=false){
      controls.enableDamping=false;controls.update();controls.target.set(0,0,0);
      const distance=fit(),dir=vector(selected);controls.maxDistance=Math.max(distance*2.5,9);
      if(immediate||reduced.matches){flight=null;camera.position.copy(dir).multiplyScalar(distance);camera.lookAt(0,0,0);controls.update();controls.enableDamping=true;}
      else {const from=camera.position.clone().normalize();flight={elapsed:0,from:camera.position.length(),to:distance,dir:from,turn:new THREE.Quaternion().setFromUnitVectors(from,dir)};}
      request();
    }
    function spinLabel(){$('spin').textContent=spinning?'暂停自转':'继续自转';$('spin').setAttribute('aria-pressed',String(spinning));}
    function select(id){
      if(!ready||failed||!views[id]||id===selected)return;
      selected=id;clearTimeout(noteTimer);note.classList.add('is-changing');
      document.querySelectorAll('[data-view]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.view===id)));
      ringTarget=id==='rings'?.75:id==='axis'?.14:0;axisTarget=id==='axis'?1:0;
      noteTimer = setTimeout(() => {
        if (failed) return;
        $('view-title').textContent = views[id].title;
        $('view-copy').textContent = views[id].copy;
        if (id === 'planet') {
          for (const [elementId, nodes] of authoredProfile)
            $(elementId).replaceChildren(...nodes.map((node) => node.cloneNode(true)));
        }
        note.classList.remove('is-changing');
      }, reduced.matches ? 0 : 180);
      if(reduced.matches){ringAlpha=ringTarget;axisAlpha=axisTarget;}
      reset();
    }
    document.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>select(b.dataset.view)));
    $('spin').addEventListener('click',()=>{if(!ready)return;spinning=!spinning;spinLabel();request();});
    $('reset').addEventListener('click',()=>{if(ready)reset();});
    $('lighting').addEventListener('click',()=>{if(!ready)return;const night=$('lighting').getAttribute('aria-pressed')!=='true';$('lighting').setAttribute('aria-pressed',String(night));$('lighting').textContent=night?'均匀照明':'昼夜照明';lightTarget=night?.16:1.45;if(reduced.matches)ambient.intensity=lightTarget;request();});
    let width=0,height=0;
    function resize(){const w=mount.clientWidth,h=mount.clientHeight;if(!w||!h||(w===width&&h===height))return;const previous=fit(),was=width>0;width=w;height=h;camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h,false);if(!was)reset(true);else{const ratio=fit()/previous;camera.position.multiplyScalar(ratio);controls.maxDistance=Math.max(fit()*2.5,9);if(flight){flight.from*=ratio;flight.to*=ratio;}controls.update();}request();}
    new ResizeObserver(resize).observe(mount);resize();spinLabel();
    controls.addEventListener('start',()=>{flight=null;dragging=true;controls.enableDamping=true;request();});
    controls.addEventListener('end',()=>{dragging=false;settleUntil=performance.now()+900;request();});
    controls.addEventListener('change',()=>request());
    new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible)request();else{cancelAnimationFrame(frame);frame=0;}},{rootMargin:'80px'}).observe($('model-stage'));
    document.addEventListener('visibilitychange',()=>{cancelAnimationFrame(frame);frame=0;if(!document.hidden)request();});
    reduced.addEventListener('change',()=>{if(reduced.matches){spinning=false;spinLabel();ringAlpha=ringTarget;axisAlpha=axisTarget;ambient.intensity=lightTarget;reset(true);}request();});
    renderer.domElement.addEventListener('webglcontextlost',event=>{event.preventDefault();fail('WebGL context lost');});
    new THREE.TextureLoader().load(data.texture,texture=>{if(failed){texture.dispose();return;}texture.colorSpace=THREE.SRGBColorSpace;texture.flipY=false;texture.anisotropy=Math.min(4,renderer.capabilities.getMaxAnisotropy());material.map=texture;material.needsUpdate=true;renderer.compile(scene,camera);paint();ready=true;controls.enabled=true;$('model-loading').hidden=true;$('model-status').textContent='NASA VTAD / 模型就绪';mount.classList.add('is-ready');request();},undefined,fail);
    function tick(now){
      frame=0;if(!ready||failed||!visible||document.hidden)return;
      const dt=Math.min((now-last)/1000,.06);last=now;
      if(spinning){day+=dt*.025;spin.rotation.y+=dt*.065;}
      if(flight){flight.elapsed+=dt;const t=Math.min(1,flight.elapsed/1.15),s=t*t*(3-2*t);camera.position.copy(flight.dir).applyQuaternion(new THREE.Quaternion().slerp(flight.turn,s)).multiplyScalar(flight.from+(flight.to-flight.from)*s);camera.lookAt(0,0,0);if(t===1){flight=null;controls.enableDamping=true;}}
      const blend=reduced.matches?1:1-Math.exp(-dt*6);
      ringAlpha+=(ringTarget-ringAlpha)*blend;axisAlpha+=(axisTarget-axisAlpha)*blend;ambient.intensity+=(lightTarget-ambient.intensity)*blend;
      ringMaterials.forEach((mat,i)=>mat.opacity=ringAlpha*(i===8?1:.5));axisMaterials.forEach(mat=>mat.opacity=axisAlpha);
      controls.update();paint();
      if(spinning||flight||dragging||now<settleUntil||Math.abs(ringAlpha-ringTarget)>.001||Math.abs(axisAlpha-axisTarget)>.001||Math.abs(ambient.intensity-lightTarget)>.001){if(!frame)frame=requestAnimationFrame(tick);}
    }
    window.UranusView={get ready(){return ready;},get selected(){return selected;},get state(){return {ready,failed,selected,spinning,day,flight:!!flight,scheduled:!!frame,distance:camera.position.length(),direction:camera.position.clone().normalize().toArray()};},capture(){paint();return renderer.domElement.toDataURL('image/png');}};
  } catch(error){fail(error);}
})();

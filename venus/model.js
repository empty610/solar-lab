(() => {
  'use strict';
  const stage = document.getElementById('venus-stage');
  const mount = document.getElementById('venus-3d');

  let modelLoop, textureSet, failed = false, cleanup = () => {};
  function fail(error) {
    if (failed) return;
    failed = true;
    modelLoop?.dispose();
    textureSet?.dispose();
    cleanup();
    stage.classList.add('is-error');
    console.warn('Venus model unavailable:', error);
  }
  try {
    if (!window.ModelRuntime) throw new Error('Model runtime missing');
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
    camera.position.set(0, 0.08, 4.25);

    const renderer = new THREE.WebGLRenderer({
      antialias: (window.devicePixelRatio || 1) <= 1.25,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.15));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    mount.appendChild(renderer.domElement);
    textureSet = ModelRuntime.textures(THREE, renderer);

    const world = new THREE.Group();
    world.rotation.z = THREE.MathUtils.degToRad(177.4);
    scene.add(world);

    const material = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      toneMapped: false,
    });
    const sphere = new THREE.Mesh(new THREE.SphereGeometry(1.34, 64, 64), material);
    world.add(sphere);

    const textureSource = window.VENUS_TEXTURE_DATA;
    if (!textureSource) throw new Error('Embedded Venus texture is unavailable');
    textureSet.load(textureSource).then(map => {
      if (failed || !map) return;
      material.map = map;
      material.needsUpdate = true;
      modelLoop.start();
    }).catch(fail);

    const atmosphere = new THREE.Mesh(
      new THREE.SphereGeometry(1.39, 40, 40),
      new THREE.MeshBasicMaterial({
        color: 0xf0b458,
        transparent: true,
        opacity: 0.045,
        side: THREE.FrontSide,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    world.add(atmosphere);

    const glow = new THREE.Mesh(
      new THREE.SphereGeometry(1.47, 40, 40),
      new THREE.ShaderMaterial({
        transparent: true,
        side: THREE.BackSide,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: { glowColor: { value: new THREE.Color(0xc68e35) } },
        vertexShader: `
        varying vec3 vNormal;
        varying vec3 vWorldPosition;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vec4 worldPosition = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPosition.xyz;
          gl_Position = projectionMatrix * viewMatrix * worldPosition;
        }
      `,
        fragmentShader: `
        uniform vec3 glowColor;
        varying vec3 vNormal;
        varying vec3 vWorldPosition;
        void main() {
          vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
          float rim = pow(1.0 - max(dot(vNormal, viewDirection), 0.0), 2.8);
          gl_FragColor = vec4(glowColor, rim * 0.24);
        }
      `,
      }),
    );
    world.add(glow);

    scene.add(new THREE.HemisphereLight(0xfff4df, 0x6c4b2d, 1.8));
    const keyLight = new THREE.DirectionalLight(0xfff1cf, 4.3);
    keyLight.position.set(-3.6, 2.1, 4.8);
    scene.add(keyLight);
    const rimLight = new THREE.DirectionalLight(0x8bc8dd, 1.35);
    rimLight.position.set(4, -0.8, -2.2);
    scene.add(rimLight);

    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    cleanup = () => ModelRuntime.disposeScene(scene, renderer, controls);
    renderer.domElement.addEventListener('webglcontextlost', event => { event.preventDefault(); fail('WebGL context lost'); });
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    controls.enableDamping = true;
    controls.dampingFactor = 0.075;
    controls.enablePan = false;
    controls.minDistance = 2.7;
    controls.maxDistance = 6;
    controls.autoRotate = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    controls.autoRotateSpeed = 0.55;
    controls.rotateSpeed = 1.2;
    controls.zoomSpeed = 0.9;

    const resize = () => {
      if (failed) return;
      modelLoop?.invalidate();
      const width = Math.max(mount.clientWidth, 1);
      const height = Math.max(mount.clientHeight, 1);
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(mount);
    resize();

    modelLoop = ModelRuntime.loop({ element: stage, fps: 40, draw: () => {
      const moved = controls.update();
      renderer.render(scene, camera);
      return controls.autoRotate || moved;
    }});
    modelLoop.bind(controls);
    reduced.addEventListener('change', () => {
      if (reduced.matches) { controls.autoRotate = false; modelLoop.invalidate(); }
    });
  } catch (error) {
    fail(error);
  }
})();

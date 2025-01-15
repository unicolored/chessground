import { HeadlessState } from './state.js';
import { setVisible, createEl } from './util.js';
import { colors, Elements } from './types.js';
import { createElement as createSVG, setAttributes, createDefs } from './svg.js';
// @ts-expect-error Fix import of three
import * as THREE from '../node_modules/three/build/three.module.js';
// import { OrbitControls } from '../node_modules/three/examples/jsm/controls/OrbitControls.js';
// import GUI from 'lil-gui';

export function renderCanvas(element: HTMLElement, s: HeadlessState): Elements {
  // .cg-wrap (element passed to Chessground)
  //   cg-container
  //     cg-board
  //     svg.cg-shapes
  //       defs
  //       g
  //     svg.cg-custom-svgs
  //       g
  //     cg-auto-pieces
  //     coords.ranks
  //     coords.files
  //     piece.ghost

  element.innerHTML = '';

  // ensure the cg-wrap class is set
  // so bounds calculation can use the CSS width/height values
  // add that class yourself to the element before calling chessground
  // for a slight performance improvement! (avoids recomputing style)
  element.classList.add('cg-canvas');

  for (const c of colors) element.classList.toggle('orientation-' + c, s.orientation === c);
  element.classList.toggle('manipulable', !s.viewOnly);

  const canvas = createEl('canvas');
  // element.appendChild(canvas);

  const container = createEl('cg-container');
  //element.appendChild(container);

  const board = createEl('cg-board');
  //container.appendChild(board);

  const scene = new THREE.Scene();
  const material = new THREE.MeshStandardMaterial();
  material.metalness = 0.7;
  material.roughness = 0.2;
  // material.envMap = environmentMapTexture

  // gui.add(material, 'metalness').min(0).max(1).step(.0001)
  // gui.add(material, 'roughness').min(0).max(1).step(.0001)
  const sphere = new THREE.Mesh(new THREE.SphereGeometry(0.5, 64, 64), material);
  sphere.geometry.setAttribute('uv2', new THREE.BufferAttribute(sphere.geometry.attributes.uv.array, 2));
  sphere.position.x = -1.5;

  const plane = new THREE.Mesh(new THREE.PlaneGeometry(1, 1, 100, 100), material);

  plane.geometry.setAttribute('uv2', new THREE.BufferAttribute(plane.geometry.attributes.uv.array, 2));

  const torus = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.2, 64, 132), material);
  torus.geometry.setAttribute('uv2', new THREE.BufferAttribute(torus.geometry.attributes.uv.array, 2));
  torus.position.x = 1.5;

  scene.add(sphere, plane, torus);

  /**
   * Lights
   */
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);

  const pointLight = new THREE.PointLight(0xffffff, 0.5);
  pointLight.position.x = 2;
  pointLight.position.y = 3;
  pointLight.position.z = 4;
  scene.add(pointLight);

  /**
   * Sizes
   */
  const sizes = {
    width: window.innerWidth,
    height: window.innerHeight,
  };
  // const camera = new THREE.PerspectiveCamera( 75, element.clientWidth / element.clientHeight, 0.1, 1000 );

  /**
   * Camera
   */
  // Base camera
  const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100);
  camera.position.x = 1;
  camera.position.y = 1;
  camera.position.z = 2;
  scene.add(camera);

  // Controls
  // const controls = new OrbitControls(camera, canvas);
  // controls.enableDamping = true;

  /**
   * Renderer
   */
  const renderer = new THREE.WebGLRenderer({ canvas: canvas });
  renderer.setSize(element.clientWidth, element.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  element.appendChild(renderer.domElement);

  /**
   * Animate
   */
  const clock = new THREE.Clock();

  const tick = () => {
    const elapsedTime = clock.getElapsedTime();

    // Update objects
    sphere.rotation.y = 0.1 * elapsedTime;
    plane.rotation.y = 0.1 * elapsedTime;
    torus.rotation.y = 0.1 * elapsedTime;

    sphere.rotation.x = 0.15 * elapsedTime;
    plane.rotation.x = 0.15 * elapsedTime;
    torus.rotation.x = 0.15 * elapsedTime;

    // Update controls
    // controls.update()

    // Render
    renderer.render(scene, camera);

    // Call tick again on the next frame
    window.requestAnimationFrame(tick);
  };

  tick();

  let svg: SVGElement | undefined;
  let customSvg: SVGElement | undefined;
  let autoPieces: HTMLElement | undefined;

  if (s.drawable.visible) {
    svg = setAttributes(createSVG('svg'), {
      class: 'cg-shapes',
      viewBox: '-4 -4 8 8',
      preserveAspectRatio: 'xMidYMid slice',
    });
    svg.appendChild(createDefs());
    svg.appendChild(createSVG('g'));

    customSvg = setAttributes(createSVG('svg'), {
      class: 'cg-custom-svgs',
      viewBox: '-3.5 -3.5 8 8',
      preserveAspectRatio: 'xMidYMid slice',
    });
    customSvg.appendChild(createSVG('g'));

    autoPieces = createEl('cg-auto-pieces');

    //container.appendChild(svg);
    //container.appendChild(customSvg);
    //container.appendChild(autoPieces);
  }

  // if (s.coordinates) {
  //   const orientClass = s.orientation === 'black' ? ' black' : '';
  //   const ranksPositionClass = s.ranksPosition === 'left' ? ' left' : '';
  //
  //   if (s.coordinatesOnSquares) {
  //     const rankN: (i: number) => number = s.orientation === 'white' ? i => i + 1 : i => 8 - i;
  //     files.forEach((f, i) =>
  //       container.appendChild(
  //         renderCoords(
  //           ranks.map(r => f + r),
  //           'squares rank' + rankN(i) + orientClass + ranksPositionClass,
  //         ),
  //       ),
  //     );
  //   } else {
  //     container.appendChild(renderCoords(ranks, 'ranks' + orientClass + ranksPositionClass));
  //     container.appendChild(renderCoords(files, 'files' + orientClass));
  //   }
  // }

  let ghost: HTMLElement | undefined;
  if (s.draggable.enabled && s.draggable.showGhost) {
    ghost = createEl('piece', 'ghost');
    setVisible(ghost, false);
    //container.appendChild(ghost);
  }

  return {
    board,
    container,
    wrap: element,
    ghost,
    svg,
    customSvg,
    autoPieces,
  };
}

// function renderCoords(elems: readonly string[], className: string): HTMLElement {
//   const el = createEl('coords', className);
//   let f: HTMLElement;
//   for (const elem of elems) {
//     f = createEl('coord');
//     f.textContent = elem;
//     el.appendChild(f);
//   }
//   return el;
// }

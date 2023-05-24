import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { Face } from 'three/examples/jsm/math/ConvexHull.js'

(() => {

  // constants
  const COLORS = [
    0x00ff00,
    0xff0000,
    0x0000ff,
    0xffff00,
    0x00ffff,
    0xff00ff,
  ];

  const raycaster = new THREE.Raycaster()
  const mouse = new THREE.Vector2()

  // scene
  const scene = new THREE.Scene()
  scene.background = new THREE.Color(0xFFFFFF)
  const axisHelper = new THREE.AxesHelper(5)
  scene.add(axisHelper)
  const gridHelper = new THREE.GridHelper(20, 20)
  scene.add(gridHelper)
  
  // renderer
  const renderer = new THREE.WebGLRenderer({antialias: true})
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.setPixelRatio(window.devicePixelRatio)
  document.body.appendChild(renderer.domElement)
  
  // camera
  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100)
  const controls = new OrbitControls(camera, renderer.domElement)
  camera.position.set(0, 10, 15)

  // lights
  const ambientLight = new THREE.AmbientLight(0xffffff)

  // plane
  const planeGeometry = new THREE.PlaneGeometry(20, 20)
  const planeMaterial = new THREE.MeshBasicMaterial({color: 0x000000, side: THREE.DoubleSide, visible: false})
  const plane = new THREE.Mesh(planeGeometry, planeMaterial)
  plane.rotation.x = Math.PI / 2


  const cubeGeometry = new THREE.BoxGeometry(1, 1, 1)
  const cubeMaterial = new THREE.MeshPhongMaterial({color: 0x00ff00})
  const cube = new THREE.Mesh(cubeGeometry, cubeMaterial)
  cube.position.set(0.5, 0.5, 0.5)
  scene.add(cube)

  scene.add(plane, ambientLight)


  const animate = () => {
    requestAnimationFrame(animate)
    controls.update()
    renderer.render(scene, camera)
  }

  const onMouseMove = (e: MouseEvent) => {
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1

    raycaster.setFromCamera(mouse, camera)
  }

  // window.addEventListener('mousemove', onMouseMove, false)
  window.addEventListener('click', onMouseMove, false)
  animate()

})();






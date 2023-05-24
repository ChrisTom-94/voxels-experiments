import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { Face } from 'three/examples/jsm/math/ConvexHull.js'

(() => {

  const MAX_VOXELS = 1000

  // constants
  const COLORS = [
    0x00ff00,
    0xff0000,
    0x0000ff,
    0xffff00,
    0x00ffff,
    0xff00ff,
  ];

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
  const cubeMaterial = new THREE.MeshToonMaterial({color: 0x00ff00})

  const shadowVoxel = new THREE.Mesh(cubeGeometry, cubeMaterial)
  shadowVoxel.material.opacity = 0.5
  const voxels = new THREE.InstancedMesh(cubeGeometry, cubeMaterial, MAX_VOXELS)
  voxels.count = 1

  voxels.instanceMatrix.setUsage(THREE.DynamicDrawUsage)
  voxels.setMatrixAt(0, new THREE.Matrix4().makeTranslation(0.5, 0.5, 0.5))

  const raycaster = new THREE.Raycaster()
  const mouse = new THREE.Vector2()

  scene.add(plane, voxels, shadowVoxel, ambientLight)

  const animate = () => {
    requestAnimationFrame(animate)
    controls.update()
    renderer.render(scene, camera)
  }

  const onMouseMove = (e: MouseEvent) => {
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1

    raycaster.setFromCamera(mouse, camera)
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1

    raycaster.setFromCamera(mouse, camera)

    const intersects = raycaster.intersectObjects([plane, voxels])
    
    if(intersects.length <= 0) return

    const { point } = intersects[0]

    const { x, y, z } = point

    shadowVoxel.position.set(
      Math.floor(x) + 0.5,
      Math.ceil(y) + 0.5,
      Math.floor(z) + 0.5
    )
  }

  const onClick = () => {

    const {x, y, z} = shadowVoxel.position
    const matrix = new THREE.Matrix4().makeTranslation(x, y, z)

    voxels.count += 1
    voxels.setMatrixAt(voxels.count - 1, matrix)
    voxels.instanceMatrix.needsUpdate = true
  }

  window.addEventListener('mousemove', onMouseMove, false)
  window.addEventListener('click', onClick, false)
  animate()

})();






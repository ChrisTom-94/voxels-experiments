import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

(() => {

  const pos = new THREE.Vector3()
  const quat = new THREE.Quaternion()
  const scale = new THREE.Vector3()

  // constants
  const MAX_VOXELS = 1000
  const matrixShadow = new THREE.Matrix4().makeTranslation(0.5, 0.5, 0.5)
  const COLORS = [
    // 0xDF1F1F, 0xDFAF1F, 0x80DF1F, 0x1FDF50, 0x1FDFDF, 0x1F4FDF, 0x7F1FDF, 0xDF1FAF, 0xEFEFEF, 0x303030
    0x00FF00, 0xDFAF1F, 
  ];
  const color = new THREE.Color()

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
  controls.enablePan = false
  controls.maxPolarAngle = Math.PI / 2
  camera.position.set(0, 10, 15)

  // lights
  const ambientLight = new THREE.AmbientLight(0x404040);

  // plane
  const planeGeometry = new THREE.PlaneGeometry(20, 20)
  const planeMaterial = new THREE.MeshBasicMaterial({color: 0x000000, visible: false, side: THREE.DoubleSide})
  const plane = new THREE.Mesh(planeGeometry, planeMaterial)
  plane.name = 'plane'
  plane.rotation.x = Math.PI / 2


  // voxels
  const cubeGeometry = new THREE.BoxGeometry(1, 1, 1)
  const cubeMaterial = new THREE.MeshBasicMaterial()

  const shadowVoxelMaterial = new THREE.MeshBasicMaterial({color: 0x000000, transparent: true, side: THREE.DoubleSide})
  const shadowVoxel = new THREE.Mesh(cubeGeometry, shadowVoxelMaterial)
  shadowVoxel.material.opacity = 0.5
  const voxels = new THREE.InstancedMesh(cubeGeometry, cubeMaterial, MAX_VOXELS)
  
  for(let i = 0; i < MAX_VOXELS; i++) {
    voxels.setMatrixAt(i, matrixShadow)
    voxels.setColorAt(i, color)
  }
  voxels.setColorAt(0, color.setHex(0xff0000))
  
  voxels.instanceMatrix!.needsUpdate = true
  voxels.instanceColor!.needsUpdate = true
  voxels.instanceMatrix!.setUsage(THREE.DynamicDrawUsage)
  voxels.instanceColor!.setUsage(THREE.DynamicDrawUsage)
  voxels.count = 1
  

  // raycaster
  const raycaster = new THREE.Raycaster()
  const mouse = new THREE.Vector2()

  scene.add(plane, voxels, shadowVoxel, ambientLight)

  // events
  const onWindowResize = () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );
  }

  const onMouseMove = (e: MouseEvent) => {
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1    
  }

  const onClick = () => {

    const {x, y, z} = shadowVoxel.position
    matrixShadow.identity().makeTranslation(x, y, z)

    voxels.count += 1
    voxels.setMatrixAt(voxels.count - 1, matrixShadow)
    voxels.setColorAt(voxels.count - 1, color.setHex(COLORS[Math.floor(Math.random() * COLORS.length)]))
    voxels.instanceMatrix!.needsUpdate = true
    voxels.instanceColor!.needsUpdate = true
  }

  window.addEventListener('resize', onWindowResize, false)
  window.addEventListener('mousemove', onMouseMove, false)
  window.addEventListener('click', onClick, false)

  // render
  const animate = () => {
    requestAnimationFrame(animate)
    controls.update()
    renderer.render(scene, camera)

    raycaster.setFromCamera(mouse, camera)

    const intersects = raycaster.intersectObjects([plane, voxels])

    if (intersects.length <= 0) {
      shadowVoxel.visible = false
      return
    }

    shadowVoxel.visible = true

    const intersect = intersects[0]
    const { point, face, object} = intersect

    // object.matrixWorld.makeTranslation(face!.normal.x, face!.normal.y, face!.normal.z)
    const position = new THREE.Vector3().add(point);
    const x = Math.floor(position.x) + 0.5
    const y = Math.floor(position.y) + 0.5 > 0.5 ? Math.floor(position.y) + 0.5 : 0.5
    const z = Math.floor(position.z) + 0.5
    shadowVoxel.position.set(x, y, z)
  }

  animate()

})();






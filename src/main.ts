import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

(() => {

  // constants

  const clear_btn = document.getElementById('clear') as HTMLButtonElement
  const save_btn = document.getElementById('save') as HTMLButtonElement
  const load_input = document.getElementById('load') as HTMLInputElement

  const COLORS = [
    0xDF1F1F, 
    0xDFAF1F, 
    0x80DF1F, 
    0x1FDF50, 
    0x1FDFDF, 
    0x1F4FDF, 
    0x7F1FDF, 
    0xDF1FAF, 
    0xEFEFEF, 
    0x303030 
  ];
  const grid_size = 20


  // variables
  let intersectedObjects: THREE.Intersection<THREE.Object3D<THREE.Event>>[] = []
  let to_intersect: THREE.Object3D[] = []
  let current_color = 0


  // scene
  const scene = new THREE.Scene()
  scene.background = new THREE.Color(0xFFFFFF)
  const gridHelper = new THREE.GridHelper(grid_size, grid_size)
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

  const directionalLight_1 = new THREE.DirectionalLight(0xffffff, 0.5);
  directionalLight_1.position.set(5, 5, -5);

  const directionalLight_2 = new THREE.DirectionalLight(0xffffff, 0.5);
  directionalLight_2.position.set(-5, 5, 5);

  const lights = new THREE.Group()
  lights.add(ambientLight, directionalLight_1, directionalLight_2)

  
  // plane
  const planeGeometry = new THREE.PlaneGeometry(grid_size, grid_size)
  const planeMaterial = new THREE.MeshBasicMaterial({color: 0x000000, visible: false, side: THREE.DoubleSide})
  const plane = new THREE.Mesh(planeGeometry, planeMaterial)
  plane.name = 'plane'
  plane.rotation.x = Math.PI / 2


  // voxels
  const cubeGeometry = new THREE.BoxGeometry(1, 1, 1)
  
  const shadowMaterial = new THREE.MeshBasicMaterial({color: COLORS[current_color], transparent: true, opacity: 0.5})
  const shadowVoxel = new THREE.Mesh(cubeGeometry, shadowMaterial)
  shadowVoxel.material.opacity = 0.5
  
  const cubeMaterial = new THREE.MeshPhongMaterial()
  const voxel =  new THREE.Mesh(cubeGeometry, cubeMaterial)
  voxel.position.set(0.5, 0.5, 0.5)
  voxel.material.color.setHex(COLORS[Math.floor(Math.random() * COLORS.length)])
  voxel.userData.isVoxel = true


  // raycaster
  const raycaster = new THREE.Raycaster()
  const mouse = new THREE.Vector2()


  // add to scene
  scene.add(plane, voxel, shadowVoxel, lights)
  to_intersect = scene.children.filter((child) => child.userData.isVoxel).concat(plane)


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

  const onClick = (e: MouseEvent) => {
    
    if (e.button === 0) {

      if (intersectedObjects.length <= 0) return

      const material = new THREE.MeshPhongMaterial()
      const newVoxel = new THREE.Mesh(cubeGeometry, material)

      newVoxel.position.copy(shadowVoxel.position)
      newVoxel.material.color.setHex(COLORS[current_color])
      newVoxel.userData.isVoxel = true
  
      to_intersect.push(newVoxel)
      scene.add(newVoxel)

    } else if (e.button === 2) {

      const intersect = intersectedObjects[0]
      if (!intersect || !intersect.object.userData.isVoxel) return
      
      to_intersect.splice(to_intersect.indexOf(intersect.object), 1)
      scene.remove(intersect.object)

    }

  }

  const onKeyDown = (e: KeyboardEvent) => {

    if(e.key === 'ArrowLeft') current_color = (current_color - 1 + COLORS.length) % COLORS.length
    if(e.key === 'ArrowRight') current_color = (current_color + 1) % COLORS.length

    shadowVoxel.material.color.setHex(COLORS[current_color])

  }

  window.addEventListener('resize', onWindowResize, false)
  window.addEventListener('mousemove', onMouseMove, false)
  window.addEventListener('mousedown', onClick, false)
  window.addEventListener('keydown', onKeyDown, false)


  const clear = () => {
      
      scene.children.filter((child) => child.userData.isVoxel).forEach((child) => scene.remove(child))
  
  }

  const save = () => {
      
      const data = scene.children.filter((child) => child.userData.isVoxel).map((child) => {
  
        const mesh = child as THREE.Mesh
        const material = mesh.material as THREE.MeshPhongMaterial

        const {x, y, z} = mesh.position
        const color = material.color!.getHex()
  
        return {
          position: {x, y, z},
          color
        }
  
      })
  
      const blob = new Blob([JSON.stringify(data)], {type: 'application/json'})
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'voxels.json'
      link.click()
  
  }

  const load = (e: Event) => {

    const input = e.target as HTMLInputElement
    const file = input.files![0]
    const reader = new FileReader()

    if (!file) return

    reader.onload = (e: ProgressEvent<FileReader>) => {

      const data = JSON.parse(e.target!.result as string)
      clear()

      data.forEach((voxel: any) => {

        const material = new THREE.MeshPhongMaterial()
        const newVoxel = new THREE.Mesh(cubeGeometry, material)

        newVoxel.position.copy(voxel.position)
        newVoxel.material.color.setHex(voxel.color)
        newVoxel.userData.isVoxel = true
    
        to_intersect.push(newVoxel)
        scene.add(newVoxel)

      })

    }

    reader.readAsText(file)

  }

  clear_btn.addEventListener('click', clear)
  save_btn.addEventListener('click', save)
  load_input.addEventListener('change', load)

  // render
  const animate = () => {

    if(!document.hasFocus()){
      shadowVoxel.visible = false
    }

    requestAnimationFrame(animate)
    controls.update()
    renderer.render(scene, camera)

    raycaster.setFromCamera(mouse, camera)

    intersectedObjects.length = 0
    raycaster.intersectObjects(to_intersect, true, intersectedObjects)

    if (intersectedObjects.length <= 0) {
      shadowVoxel.visible = false
      return
    }

    if(intersectedObjects[0].object === shadowVoxel) {
        return
    }

    shadowVoxel.visible = true

    const intersect = intersectedObjects[0]
    const {point, face} = intersect

    const position = new THREE.Vector3().copy(point).addScaledVector(face!.normal, 0.5)
    position.floor().addScalar(0.5)

    position.x = Math.max((-grid_size / 2) + 0.5, Math.min((grid_size / 2) - 0.5, position.x))
    position.z = Math.max((-grid_size / 2) + 0.5, Math.min((grid_size / 2) - 0.5, position.z))
    position.y = Math.max(position.y, 0.5)

    shadowVoxel.position.copy(position)

  }

  animate()

})();






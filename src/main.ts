import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { log } from 'three/examples/jsm/nodes/Nodes.js';

(() => {

  // constants

  const selectionRange = document.getElementById('selection') as HTMLDivElement
  const clearBtn = document.getElementById('clear') as HTMLButtonElement
  const saveBtn = document.getElementById('save') as HTMLButtonElement
  const loadInput = document.getElementById('load') as HTMLInputElement
  const examplesSelect = document.getElementById('examples') as HTMLSelectElement

  const EXAMPLES = ["chicken"]

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
    0x303030,
    0xFFA500,
  ];
  const grid_size = 20


  // variables
  let intersectedObjects: THREE.Intersection<THREE.Object3D<THREE.Event>>[] = []
  let toIntersect: THREE.Object3D[] = []
  let startSelection: THREE.Vector2 = new THREE.Vector2()
  let endSelection: THREE.Vector2 = new THREE.Vector2()
  let leftMouseDown = false
  let currentColor = 0
  let lastExample = 'chicken'


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
  camera.position.set(0, 20, 25)


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
  
  const shadowMaterial = new THREE.MeshBasicMaterial({color: COLORS[currentColor], transparent: true, opacity: 0.5})
  const shadowVoxel = new THREE.Mesh(cubeGeometry, shadowMaterial)
  shadowVoxel.material.opacity = 0.5

  const loadExample = async (name: string) => {

    if (EXAMPLES.includes(name)){
      // load from json
      const data = await fetch(`examples/${name}.json`)
      const json = await data.json()

      // clear scene
      toIntersect.forEach((child) => scene.remove(child))
      toIntersect = [plane]

      // add voxels
      json.forEach((voxel: any) => {
        const material = new THREE.MeshPhongMaterial()
        const newVoxel = new THREE.Mesh(cubeGeometry, material)
        newVoxel.position.copy(voxel.position)
        newVoxel.material.color.setHex(voxel.color)
        newVoxel.userData.isVoxel = true
        toIntersect.push(newVoxel)
        scene.add(newVoxel)
      })
    }

  }

  loadExample('chicken')


  // raycaster
  const raycaster = new THREE.Raycaster()
  const mouse = new THREE.Vector2()


  // add to scene
  scene.add(plane, shadowVoxel, lights)
  toIntersect = scene.children.filter((child) => child.userData.isVoxel).concat(plane)


  // events
  const onWindowResize = () => {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );

  }

  const onMouseMove = (e: MouseEvent) => {

    mouse.x = (e.clientX / window.innerWidth) * 2 - 1
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1    

    if(!(e.shiftKey && leftMouseDown)) return

    endSelection.x = mouse.x
    endSelection.y = mouse.y

    const min_x = Math.min(startSelection.x, endSelection.x)
    const max_x = Math.max(startSelection.x, endSelection.x)
    const min_y = Math.min(startSelection.y, endSelection.y)
    const max_y = Math.max(startSelection.y, endSelection.y)

    const width = max_x - min_x
    const height = max_y - min_y

    selectionRange.style.visibility = 'visible'
    selectionRange.style.left = `${min_x * window.innerWidth / 2 + window.innerWidth / 2}px`
    selectionRange.style.top = `${-max_y * window.innerHeight / 2 + window.innerHeight / 2}px`
    selectionRange.style.width = `${width * window.innerWidth / 2}px`
    selectionRange.style.height = `${height * window.innerHeight / 2}px`

  }

  const onClick = (e: MouseEvent) => {
    
    if (e.button === 0) {

      leftMouseDown = true

      if (e.shiftKey) {
        startSelection.x = mouse.x
        startSelection.y = mouse.y
        return
      }

      if (intersectedObjects.length <= 0) return

      const material = new THREE.MeshPhongMaterial()
      const newVoxel = new THREE.Mesh(cubeGeometry, material)

      newVoxel.position.copy(shadowVoxel.position)
      newVoxel.material.color.setHex(COLORS[currentColor])
      newVoxel.userData.isVoxel = true
  
      toIntersect.push(newVoxel)
      scene.add(newVoxel)

    } else if (e.button === 2) {

      const intersect = intersectedObjects[0]
      if (!intersect || !intersect.object.userData.isVoxel) return
      
      toIntersect.splice(toIntersect.indexOf(intersect.object), 1)
      scene.remove(intersect.object)

    }

  }

  const onMouseUp = (e: MouseEvent) => {
    console.log(leftMouseDown)
    if (!(e.shiftKey && leftMouseDown)) return
    leftMouseDown = false

    selectionRange.style.visibility = 'hidden'
    selectionRange.style.width = '0px'
    selectionRange.style.height = '0px'

    // throw ray for each pixel in selection range
    const min_x = Math.min(startSelection.x, endSelection.x)
    const max_x = Math.max(startSelection.x, endSelection.x)
    const min_y = Math.min(startSelection.y, endSelection.y)
    const max_y = Math.max(startSelection.y, endSelection.y)

    const step = 0.01
    let intersected = []
    const pos = new THREE.Vector2()
    for (let x = min_x; x < max_x; x += step) {
      for (let y = min_y; y < max_y; y += step) {
        pos.set(x, y)
        raycaster.setFromCamera(pos, camera)
        const intersects = raycaster.intersectObjects(toIntersect)
        if (intersects.length > 0) {
          const intersect = intersects[0]
          if (intersect.object.userData.isVoxel) {
            intersected.push(intersect.object)
          }
        }
      }
    }

    intersected = Array.from(new Set(intersected))
    intersected.forEach((voxel) => {
      let mesh = voxel as THREE.Mesh
      let material = mesh.material as THREE.MeshPhongMaterial
      material.color.setHex(COLORS[0])
    })
    
  }

  const onKeyDown = (e: KeyboardEvent) => {

    if(e.key === 'ArrowLeft') currentColor = (currentColor - 1 + COLORS.length) % COLORS.length
    if(e.key === 'ArrowRight') currentColor = (currentColor + 1) % COLORS.length

    shadowVoxel.material.color.setHex(COLORS[currentColor])

  }

  window.addEventListener('resize', onWindowResize, false)
  window.addEventListener('mousemove', onMouseMove, false)
  window.addEventListener('mousedown', onClick, false)
  window.addEventListener('mouseup', onMouseUp, false)
  window.addEventListener('keydown', onKeyDown, false)


  const clear = () => {
      
      scene.children.filter((child) => child.userData.isVoxel).forEach((child) => scene.remove(child))
      toIntersect = [plane]
      lastExample = ""
  
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
    
        toIntersect.push(newVoxel)
        scene.add(newVoxel)

      })

    }

    reader.readAsText(file)

    // reset input
    input.value = ''

  }

  const onSelect = (e: Event) => {
    
    const input = e.target as HTMLInputElement
    const name = input.value

    if (!EXAMPLES.includes(name)) return

    if (lastExample === name) return

    loadExample(name)

  }

  clearBtn.addEventListener('click', clear)
  saveBtn.addEventListener('click', save)
  loadInput.addEventListener('change', load)
  examplesSelect.addEventListener('change', onSelect)

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
    raycaster.intersectObjects(toIntersect, true, intersectedObjects)

    if (intersectedObjects.length <= 0) {
      shadowVoxel.visible = false
      // document.body.style.cursor = 'default'
      return
    }

    if(intersectedObjects[0].object === shadowVoxel) {
        return
    }

    shadowVoxel.visible = true
    // document.body.style.cursor = 'crosshair'

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






import React, {useState} from 'react';
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import * as THREE from 'three'
import * as CANNON from 'cannon-es'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { setContent, showEdges, setEdgeColor, setEdgeWidth } from '@bit/benolayinka.benolayinka.utils'
import ThreeSceneRenderer from '@bit/benolayinka.benolayinka.three-scene-renderer'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Interaction } from 'three.interaction';
import ReactHowler from 'react-howler';
import { CSSTransition } from 'react-transition-group'
import Emoji from '@bit/benolayinka.benolayinka.emoji'
import {isIOS} from 'react-device-detect';
import { FaVolumeUp } from 'react-icons/fa';
import Gamepad from './components/Gamepad'
import GamepadControls from './GamepadControls'

const NEAR = 0.01, FAR = 1000, FOV = 60, ASPECT = 16/9

var actions //fucking js

var canvas, renderer, scene, camera, clock, mixer, controls

var controlLoopRunning = false

var gpControls

const gamepadData = {
            driveJoystickData: {x:0, y:0},
            lookJoystickData: {x:0, y:0},
            buttonsPressed: {0:false, 1:false, 2:false},
            keysPressed: {},
        }

var kick, wait, run

var currentAction

var interaction

var character

var pos = {}

var shape

function App() {

	const [playing, setPlaying] = useState(false);
	const [showLoading, setShowLoading] = useState(true);
	const [showLoadingText, setShowLoadingText] = useState(true);

  	function extendScene(props){

  		//trigger onLoaded callback when all assets are loaded
	    THREE.DefaultLoadingManager.onLoad = () => {
	        setShowLoadingText(false)
		};

		({canvas, renderer} = props)

		scene = new THREE.Scene()

	  	camera = new THREE.PerspectiveCamera(FOV, ASPECT, NEAR, FAR);

	  	controls = new OrbitControls(camera, renderer.domElement);

		clock = new THREE.Clock()

		interaction = new Interaction(renderer, scene, camera);

	  	let loader = new GLTFLoader()

	  	// Custom-built version of DRACOLoader, for Node.js.
		const NodeDRACOLoader = require('./NodeDRACOLoader.js');

		const DRACOLoader = new NodeDRACOLoader()

		// GLTFLoader prefetches the decoder module, when Draco is needed, to speed up
		// parsing later. This isn't necessary for our custom decoder, so set the
		// method to a no-op.
		DRACOLoader.getDecoderModule = () => {};
		DRACOLoader.preload = () => {};

		loader.setDRACOLoader( DRACOLoader );

	  	//let dracoLoader = new DRACOLoader();
		//dracoLoader.setDecoderPath( 'three/' );

	  	// Optional: Provide a DRACOLoader instance to decode compressed mesh data
		//const decoder = require('draco3dgltf').createDecoderModule();
		
		//loader.setDRACOLoader(decoder);

		//loader.setDRACOLoader( new DRACOLoader() );

	  	loader.load('assets/samurai_animated_draco.drc', (gltf)=>{

	  		gltf.scene.traverse((mesh)=>{

				if(mesh.isSkinnedMesh) {
					const skeletonHelper = new THREE.SkeletonHelper( mesh.skeleton.bones[ 0 ].parent );
					scene.add(skeletonHelper)
					skeletonHelper.visible = false

					character = mesh.skeleton.bones[ 0 ].parent
					mesh.frustumCulled = false

					const helper = new THREE.BoxHelper(mesh);
	  				scene.add(helper)
	  				helper.visible = false

	  				controlLoopRunning = true
				}
	  		})

			mixer = new THREE.AnimationMixer( gltf.scene );

			wait = mixer.clipAction(gltf.animations[0])
			run = mixer.clipAction(gltf.animations[1])
			kick = mixer.clipAction(gltf.animations[2])

			actions = [kick, wait, run]

			activateAllActions()

			playAction(run)

			scene.add(gltf.scene)

			// controls.autoRotate = true
			// controls.autoRotateSpeed = 0.7
			controls.zoomSpeed = 0.2
			controls.rotateSpeed = 0.2
			controls.enableKeys = false
			camera.near = 0.01
			camera.updateProjectionMatrix()
			camera.position.z += 6

			setContent(scene, camera, controls)
			//setContent(scene, camera)
			//camera.position.y += 1
			//camera.position.z -= 2

	  	})

	  	let spotLight = new THREE.SpotLight('white', 1)
	  	spotLight.position.set(45, 50, 15);
	  	scene.add(spotLight);

	  	let pointLight = new THREE.PointLight('white', 1)
	  	spotLight.position.set(0, 5, -5);
	  	scene.add(spotLight);

	  	var ambientLight = new THREE.AmbientLight('white', 1)
	  	scene.add(ambientLight)

	  	var light = new THREE.HemisphereLight( 'white', 'pink', 1 );
	  	scene.add(light)

		window.addEventListener('resize', handleWindowResize)

	  	handleWindowResize()

	  	animate()
  	}

  	function activateAllActions() {

  		setWeight(wait, 1)
  		setWeight(run, 0)
  		setWeight(kick, 0)

		actions.forEach( function ( action ) {

			action.play();

		} );

	}

	// This function is needed, since animationAction.crossFadeTo() disables its start action and sets
	// the start action's timeScale to ((start animation's duration) / (end animation's duration))

	function setWeight( action, weight ) {

		action.enabled = true;
		action.setEffectiveTimeScale( 1 );
		action.setEffectiveWeight( weight );

	}

  	function prepareCrossFade( startAction, endAction, defaultDuration ) {

		// If the current action is 'fight' (duration 4 sec), execute the crossfade immediately;
		// else wait until the current action has finished its current loop

		if ( startAction === kick ) {

			synchronizeCrossFade( startAction, endAction, defaultDuration );

		} else {

			executeCrossFade( startAction, endAction, defaultDuration );

		}

	}

	function synchronizeCrossFade( startAction, endAction, duration ) {

		mixer.addEventListener( 'loop', onLoopFinished );

		function onLoopFinished( event ) {

			if ( event.action === startAction ) {

				mixer.removeEventListener( 'loop', onLoopFinished );

				executeCrossFade( startAction, endAction, duration );

			}

		}

	}

	function executeCrossFade( startAction, endAction, duration ) {

		// Not only the start action, but also the end action must get a weight of 1 before fading
		// (concerning the start action this is already guaranteed in this place)

		setWeight( endAction, 1 );
		endAction.time = 0;

		// Crossfade with warping - you can also try without warping by setting the third parameter to false

		startAction.crossFadeTo( endAction, duration, false );

	}

  	function playAction(action){

  		if(!currentAction)
  			currentAction = action

  		if(action === currentAction)
  			return

  		prepareCrossFade(currentAction, action, 0.5)

  		currentAction = action
  	}

  	function handleWindowResize(){
		let width = canvas.clientWidth;
		let height = canvas.clientHeight;
		camera.aspect = width/height;
		camera.updateProjectionMatrix();
	}

	function controlLoop(character, data){

		var range = 90

        var moveY,moveX, lookX, lookY
        moveY = moveX = lookY = lookX = 0

		//back, or key s = 83
        if(gamepadData.buttonsPressed[0] || gamepadData.keysPressed['83'])
            moveY -= range

        //forward, button 1 or key w = 87
        if(gamepadData.buttonsPressed[1] || gamepadData.keysPressed['87'])
            moveY += range

		//right, or key d = 68
        if(gamepadData.keysPressed['68'])
            moveX += range

        //left, or key a = 65
        if(gamepadData.keysPressed['65'])
            moveX -= range

        //lookUp, i = 73
        if(gamepadData.keysPressed['73'])
            lookY += range

        //lookLeft, j=74
        if(gamepadData.keysPressed['74'])
            lookX -= range

        //lookDown, k=75
        if(gamepadData.keysPressed['75'])
            lookY -= range
        
        //lookRight l=76
        if(gamepadData.keysPressed['76'])
            lookX += range

		moveX += gamepadData.driveJoystickData.x
    	moveY += gamepadData.driveJoystickData.y

    	if(moveX || moveY){
    		playAction(run)
    	} else {
    		playAction(wait)
    	}

    	//apply rotation
    	character.rotation.z = Math.atan2(moveX, moveY)
	}

  	function animate(){

		var delta = clock.getDelta();

		if(mixer){
	  		mixer.update(delta)
		}

    	if(controls){
    		controls.update();
    	}

    	if(controlLoopRunning){
    		controlLoop(character, delta)
    	}

		renderer.render(scene, camera)

		requestAnimationFrame(animate)
  	}

  	function onPlayButton(){
  		setPlaying(!playing)
  	}

  	function onGamepadEvent(evt, data){
        if(evt === 'driveJoystick'){
            gamepadData.driveJoystickData = data
        }
        else if(evt === 'lookJoystick'){
            gamepadData.lookJoystickData = data
        }
        else if(evt === 'button'){
            gamepadData.buttonsPressed[data.button] = data.pressed
        }
        else if(evt === 'mouse'){
            //placeholder
        }
        else if(evt === 'key'){
            gamepadData.keysPressed[data.key] = data.pressed
        }
	}

  	var i = 0
	function sceneClick(){
		playAction(kick)
	}

	const defaultNippleSize=100 
	const defaultButtonSize=40
	const defaultNippleColor='black'

	const driveJoystickOptions = {
        mode: 'static',
        restOpacity: 1,
        size: defaultNippleSize,
        color: defaultNippleColor,
        position: { top: '50%', left: '50%' },
        fadeTime: 0,
    }

	return (
		<div className="App h-100 w-100 position-absolute bg-color">
			<CSSTransition
					in={showLoading}
					unmountOnExit
					timeout={1200}
					classNames="fade"
			>
				<div className='h-100 w-100 position-absolute z-9 bg-color d-flex flex-column justify-content-center align-items-center'>
					<CSSTransition
							in={showLoadingText}
							unmountOnExit
							timeout={1200}
							classNames="fade"
							onExited={()=>{setShowLoading(false)}}
					>
						<div className = 'd-flex align-items-center justify-content-center'>
							<svg width="20" className='m-4 bounce'>
						    	<circle cx={10} cy={10} r={10} />
							</svg>
							<svg width="20" className='m-4 bounce'>
						    	<circle cx={10} cy={10} r={10} />
							</svg>
							<svg width="20" className='m-4 bounce'>
						    	<circle cx={10} cy={10} r={10} />
							</svg>
						</div>
					</CSSTransition>
				</div>
			</CSSTransition>
			<div className="h-100 w-100 position-absolute text-color d-flex justify-content-center align-items-center text-center">
				<h1 className = "grow">サムライを台無しにしないでください</h1>
			</div>
			<div className = 'z-8 top p-3 d-flex justify-content-center text-color'>
				<button 
					className='btn-naked'
					>
					<h2>ひよことベンが作った</h2>
				</button>
			</div>
			<div className = 'z-8 bottom p-3 d-flex justify-content-center text-color'>
				<button 
					className='btn-naked'
					onClick={sceneClick}
					>
					<h2>キック</h2>
				</button>
				<button 
					className='btn-naked'
					onClick={onPlayButton}
				>
					{
					playing ?
					<h2 className = 'play play-active'><FaVolumeUp /></h2>
					:
					<h2 className = 'play'><FaVolumeUp /></h2>
					}
				</button>
			</div>
			<ReactHowler
				src="/assets/kungfufighting.mp3"
				playing={playing}
				loop={true}
				html5={isIOS ? true : false}
			  />
			<Gamepad 
				onEvent={onGamepadEvent} 
				style={{zIndex:1, position: 'absolute', padding: '2rem', height: '100%', width: '100%'}}
			    joysticks={[
			        {
			            name: 'driveJoystick',
			            position: '7',
			            options: driveJoystickOptions,
			        }
			    ]}
				/>
			<ThreeSceneRenderer 
				className='h-100 w-100 position-absolute' 
				adaptToDeviceRatio 
				onMount={extendScene}
			/>
		</div>
	);
}

export default App;

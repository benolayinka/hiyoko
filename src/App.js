import React from 'react';
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { setContent } from '@bit/benolayinka.benolayinka.utils'
import ThreeSceneRenderer from '@bit/benolayinka.benolayinka.three-scene-renderer'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GUI } from 'three/examples/jsm/libs/dat.gui.module.js';

function App() {

  	var canvas, renderer, scene, camera, clock, mixer, controls

  	var model, skeleton

  	var text, inc = 0

	var crossFadeControls = [];

	var fightAction, tposeAction, punchAction;
	var fightWeight, tposeWeight, punchWeight;
	var actions, settings;

	var singleStepMode = false;
	var sizeOfNextStep = 0;

  	function createScene(props){

		({canvas, renderer} = props)

		scene = new THREE.Scene()

		const NEAR = 0.01, FAR = 1000, FOV = 60, ASPECT = 16/9

	  	camera = new THREE.PerspectiveCamera(FOV, ASPECT, NEAR, FAR);

	  	controls = new OrbitControls(camera, renderer.domElement);

		clock = new THREE.Clock()

	  	var avatar = new THREE.Object3D()

	  	scene.add(avatar)

	  	let loader = new GLTFLoader()

	  	loader.load('assets/samurai_animated.glb', (gltf)=>{

	  		model = gltf.scene

	  		//fix for Box3.setFromObject doesn't calc bounding boxes
	  		gltf.scene.traverse((mesh)=>{

	  			mesh.frustumCulled = false

	  			if(mesh.userData.text){
	  				text = mesh
	  			}

				if(mesh.isSkinnedMesh) {
					const helper = new THREE.BoxHelper(mesh);
					helper.visible = false
					avatar.add(helper)
				}
	  		})

	  		skeleton = new THREE.SkeletonHelper( gltf.scene );
			skeleton.visible = false;
			scene.add( skeleton );

			createPanel();

			mixer = new THREE.AnimationMixer( gltf.scene );

			var animations = gltf.animations;

			fightAction = mixer.clipAction( animations[ 0 ] );
			tposeAction = mixer.clipAction( animations[ 2 ] );
			punchAction = mixer.clipAction( animations[ 1 ] );

			actions = [ punchAction, fightAction, tposeAction ];

			activateAllActions();

			scene.add(gltf.scene)

			setContent(avatar, camera, controls)

			animate()
	  	})

	  	let spotLight = new THREE.SpotLight(0xffffff, 1)
	  	spotLight.position.set(45, 50, 15);
	  	scene.add(spotLight);

	  	let ambLight = new THREE.AmbientLight(0xffffff, 0.5);
	  	ambLight.position.set(5, 3, 5);
	  	scene.add(ambLight);

	  	window.addEventListener('resize', handleWindowResize)

	  	handleWindowResize()
  	}

  	function handleWindowResize(){
		let width = canvas.clientWidth;
		let height = canvas.clientHeight;
		camera.aspect = width/height;
		camera.updateProjectionMatrix();
	}

  	function animate(){

  		tposeWeight = tposeAction.getEffectiveWeight();
		fightWeight = fightAction.getEffectiveWeight();
		punchWeight = punchAction.getEffectiveWeight();

		// Update the panel values if weights are modified from "outside" (by crossfadings)

		updateWeightSliders();

		// Enable/disable crossfade controls according to current weight values

		updateCrossFadeControls();

		// Get the time elapsed since the last frame, used for mixer update (if not in single step mode)

		var mixerUpdateDelta = clock.getDelta();

		// If in single step mode, make one step and then do nothing (until the user clicks again)

		if ( singleStepMode ) {

			mixerUpdateDelta = sizeOfNextStep;
			sizeOfNextStep = 0;

		}

		if(mixer){
	  		mixer.update(mixerUpdateDelta)
		}

		const scale = 1 + 0.02 * Math.sin(0.1 * inc++)
		text.scale.set(scale, scale, scale)

    	controls.update();

		renderer.render(scene, camera)

		requestAnimationFrame(animate)
  	}

  	function createPanel() {

		var panel = new GUI( { width: 310 } );

		var folder1 = panel.addFolder( 'Visibility' );
		var folder2 = panel.addFolder( 'Activation/Deactivation' );
		var folder3 = panel.addFolder( 'Pausing/Stepping' );
		var folder4 = panel.addFolder( 'Crossfading' );
		var folder5 = panel.addFolder( 'Blend Weights' );
		var folder6 = panel.addFolder( 'General Speed' );

		settings = {
			'show model': true,
			'show skeleton': false,
			'deactivate all': deactivateAllActions,
			'activate all': activateAllActions,
			'pause/continue': pauseContinue,
			'make single step': toSingleStepMode,
			'modify step size': 0.05,
			'from punch to fight': function () {

				prepareCrossFade( punchAction, fightAction, 1.0 );

			},
			'from fight to punch': function () {

				prepareCrossFade( fightAction, punchAction, 0.5 );

			},
			'use default duration': true,
			'set custom duration': 3.5,
			'modify fight weight': 1.0,
			'modify tpose weight': 0.0,
			'modify punch weight': 0.0,
			'modify time scale': 1.0
		};

		folder1.add( settings, 'show model' ).onChange( showModel );
		folder1.add( settings, 'show skeleton' ).onChange( showSkeleton );
		folder2.add( settings, 'deactivate all' );
		folder2.add( settings, 'activate all' );
		folder3.add( settings, 'pause/continue' );
		folder3.add( settings, 'make single step' );
		folder3.add( settings, 'modify step size', 0.01, 0.1, 0.001 );
		crossFadeControls.push( folder4.add( settings, 'from punch to fight' ) );
		crossFadeControls.push( folder4.add( settings, 'from fight to punch' ) );
		folder4.add( settings, 'use default duration' );
		folder4.add( settings, 'set custom duration', 0, 10, 0.01 );
		folder5.add( settings, 'modify fight weight', 0.0, 1.0, 0.01 ).listen().onChange( function ( weight ) {

			setWeight( fightAction, weight );

		} );
		folder5.add( settings, 'modify tpose weight', 0.0, 1.0, 0.01 ).listen().onChange( function ( weight ) {

			setWeight( tposeAction, weight );

		} );
		folder5.add( settings, 'modify punch weight', 0.0, 1.0, 0.01 ).listen().onChange( function ( weight ) {

			setWeight( punchAction, weight );

		} );
		folder6.add( settings, 'modify time scale', 0.0, 1.5, 0.01 ).onChange( modifyTimeScale );

		folder1.open();
		folder2.open();
		folder3.open();
		folder4.open();
		folder5.open();
		folder6.open();

		crossFadeControls.forEach( function ( control ) {

			control.classList1 = control.domElement.parentElement.parentElement.classList;
			control.classList2 = control.domElement.previousElementSibling.classList;

			control.setDisabled = function () {

				control.classList1.add( 'no-pointer-events' );
				control.classList2.add( 'control-disabled' );

			};

			control.setEnabled = function () {

				control.classList1.remove( 'no-pointer-events' );
				control.classList2.remove( 'control-disabled' );

			};

		} );

	}


	function showModel( visibility ) {

		model.visible = visibility;

	}


	function showSkeleton( visibility ) {

		skeleton.visible = visibility;

	}


	function modifyTimeScale( speed ) {

		mixer.timeScale = speed;

	}


	function deactivateAllActions() {

		actions.forEach( function ( action ) {

			action.stop();

		} );

	}

	function activateAllActions() {

		setWeight( fightAction, settings[ 'modify fight weight' ] );
		setWeight( tposeAction, settings[ 'modify tpose weight' ] );
		setWeight( punchAction, settings[ 'modify punch weight' ] );

		actions.forEach( function ( action ) {

			action.play();

		} );

	}

	function pauseContinue() {

		if ( singleStepMode ) {

			singleStepMode = false;
			unPauseAllActions();

		} else {

			if ( fightAction.paused ) {

				unPauseAllActions();

			} else {

				pauseAllActions();

			}

		}

	}

	function pauseAllActions() {

		actions.forEach( function ( action ) {

			action.paused = true;

		} );

	}

	function unPauseAllActions() {

		actions.forEach( function ( action ) {

			action.paused = false;

		} );

	}

	function toSingleStepMode() {

		unPauseAllActions();

		singleStepMode = true;
		sizeOfNextStep = settings[ 'modify step size' ];

	}

	function prepareCrossFade( startAction, endAction, defaultDuration ) {

		// Switch default / custom crossfade duration (according to the user's choice)

		var duration = setCrossFadeDuration( defaultDuration );

		// Make sure that we don't go on in singleStepMode, and that all actions are unpaused

		singleStepMode = false;
		unPauseAllActions();

		// If the current action is 'fight' (duration 4 sec), execute the crossfade immediately;
		// else wait until the current action has finished its current loop

		if(1) {
		//if ( startAction === fightAction ) {

			executeCrossFade( startAction, endAction, duration );

		} else {

			synchronizeCrossFade( startAction, endAction, duration );

		}

	}

	function setCrossFadeDuration( defaultDuration ) {

		// Switch default crossfade duration <-> custom crossfade duration

		if ( settings[ 'use default duration' ] ) {

			return defaultDuration;

		} else {

			return settings[ 'set custom duration' ];

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

		startAction.crossFadeTo( endAction, duration, true );

	}

	// This function is needed, since animationAction.crossFadeTo() disables its start action and sets
	// the start action's timeScale to ((start animation's duration) / (end animation's duration))

	function setWeight( action, weight ) {

		action.enabled = true;
		action.setEffectiveTimeScale( 1 );
		action.setEffectiveWeight( weight );

	}

	// Called by the render loop

	function updateWeightSliders() {

		settings[ 'modify fight weight' ] = fightWeight;
		settings[ 'modify tpose weight' ] = tposeWeight;
		settings[ 'modify punch weight' ] = punchWeight;

	}

	// Called by the render loop

	function updateCrossFadeControls() {

		crossFadeControls.forEach( function ( control ) {

			control.setDisabled();

		} );

		if ( fightWeight === 1 && tposeWeight === 0 && punchWeight === 0 ) {

			crossFadeControls[ 1 ].setEnabled();

		}

		if ( fightWeight === 0 && tposeWeight === 0 && punchWeight === 1 ) {

			crossFadeControls[ 0 ].setEnabled();

		}

	}

	return (
		<div className="App">
			<ThreeSceneRenderer 
				className='h-100 w-100 position-fixed bg-gradient' 
				adaptToDeviceRatio 
				gammaCorrect
				onMount={createScene}
			/>
		</div>
	);
}

export default App;

import * as THREE from 'three'

export default class GamepadControls{

    constructor(controlObject){
        this.controlObject = controlObject
        this.lookObject = new THREE.Object3D()
        controlObject.add(this.lookObject)

        this.quat = new THREE.Quaternion()

        this.inputVelocity = new THREE.Vector3();
    }

    getLookObject() {
        return this.lookObject
    }

    getDirection(targetVec){
        targetVec.set(0,0,-1);
        this.quat.multiplyVector3(targetVec);
    }

    update(delta, gamepadData){

        delta = delta * 0.5

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

        lookX += gamepadData.lookJoystickData.x
        lookY += gamepadData.lookJoystickData.y
        moveX += gamepadData.driveJoystickData.x
        moveY += gamepadData.driveJoystickData.y

        this.inputVelocity.set(0,0,0)

        this.inputVelocity.x = moveY * delta * 0.2 //movement fwd back

        this.lookObject.getWorldQuaternion( this.quat )
        this.inputVelocity.applyQuaternion( this.quat )
        //this.cannonBody.velocity.x += this.inputVelocity.x
        //this.cannonBody.velocity.y += this.inputVelocity.y

        //apply rotation
        this.controlObject.rotation.z = Math.atan2(moveX, moveY)

        //apply rotation to look object (relative to body)
        this.lookObject.rotation.y = -lookY * 0.010;
        this.lookObject.rotation.z = -lookX * 0.010;

        console.log(this.inputVelocity)
    }
}
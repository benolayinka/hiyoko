
const FREQUENCY = 60

export default class CannonSceneController{
	constructor(props){
		this.scene = props.scene
		this.world = props.world
		this.objects = []
	}

	addObject(obj) {
        this.objects.push(obj)
        if(obj.mesh){
            this.scene.add(obj.mesh)
        }

        if(obj.body)
            this.world.addBody(obj.body)
    }

    updateVisuals() {
        for (const object of this.objects) {
            const mesh = object.mesh
            const body = object.body
            const update = object.update

            //copy physics if object has a body
            if(body){
                mesh.position.copy(body.position)
                if(body.quaternion) {
                    mesh.quaternion.copy(body.quaternion)
                }
            }

            //run update function if it exists
            if(update && typeof(update) === 'function'){
                object.update()
            }
        }
    } 

    updatePhysics() {
        var timeStep = 1 / FREQUENCY;
        this.world.step(timeStep)
    }


    step() {
    	this.updatePhysics()
    	this.updateVisuals()
    }
}
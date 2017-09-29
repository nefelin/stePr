const ACT = { //I think maybe actions should have no targets
					// and target should be inherent in acttype, like MOVE_FREE
					// or SHIFT_WEIGHT
	ROT_FOOT : "rotate one foot",
	ROT_BOD  : "rotate both feet around standing",
	MOVE     : "translate foot/weight in XY space",
	POINT    : "articulate the ankle"
}

function Action(type, amount, target = null){
	if (true){ //want to test valid act_type but enum is weird in JS BUG*
		this.type = type;
		this.amount = amount;
		this.target = target;
	}
	else {console.log('ERROR ', type);}
}


function Frame(actions, absolutes) {
	this.actions = actions; //Should be an array of Actions
	this.absolutes = absolutes; //This should be an object containing absolute 
								//position/rotation/yaw of each foot
}

// TODO need absolutes class? decide format

function FrameLib(){
	this.frames = {};
}




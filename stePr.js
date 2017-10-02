// //FrameLib stuff


// function Action(type, amount, target){
// 	if (true){ //want to test valid act_type but enum is weird in JS BUG*
// 		this.type = type;
// 		this.amount = amount;
// 		this.target = target;
// 	}
// 	else {console.log('ERROR ', type);}
// }


// function Frame(actions, absolutes) {
// 	this.actions = actions; //Should be an array of Actions
// 	this.absolutes = absolutes; //This should be an object containing absolute 
// 								//position/rotation/yaw of each foot
// }

// function FrameData(xyPos, yawAngle, pitchAngle){
// 	this.xyPos = xyPos;
// 	this.yawAngle = yawAngle;
// 	this.pitchAngle = pitchAngle;
// }


// function FrameLib(){
// 	this.frames = {};
// }

//View CLASS Should contain objects, track/set frame number, facilitating animation
//Not sure where to keep key frame data, with dancer or individual objects

var ACT_TYPES = { //I think maybe actions should have no targets
					// and target should be inherent in acttype, like MOVE_FREE
					// or SHIFT_WEIGHT
	ROT_FOOT : "rotate one foot",
	// ROT_BOD  : "rotate both feet around standing",
	MOVE     : "translate foot/weight in XY space",
	// POINT    : "articulate the ankle"
}

var UISYMBOLS = {
	ACT_MOVE: new Path.Rectangle({
		point: [-100,-100],
		size: [15,15],
		fillColor: 'black',
	}),
	ACT_ROTATE: new Path.Circle({
		center: [-100,-100],
		radius: 7.5,
		fillColor: 'blue'
	}),
}


var UICOLORS = {
	frameStrokeSelected : 'blue',
	frameStrokeUnSelected : 'black'
}

function ViewController(frameCount, objects, containerView){
	this.UIGroupHUD = new Group();
	this.UIGroupActionLog = new Group();

	//Vars for recording individual translations
	this.obStartState = null; //Used to track object change
	this.actionLog = {}; //Holds current translations until they are logged to a keyframe
	this.actionLogUI = [];

	this.focusedObj = null;
	this.userAction = 'none';

	this.FRAMECOUNT = typeof frameCount == 'undefined' ? 20 : frameCount;


	// this.objects = typeof objects == 'undefined' ? [] : objects //Why doesn't this work here as above?
	if (objects == undefined) this.objects = [];
	else this.objects = objects;
	

	this.currentFrame = 0; 
	this.uiFrameBoxes = [];

	//Init FrameLib
	this.frameLib = {};

	this.addObj = function(obToAdd){
		
		obToAdd.applyMatrix = false; //TODO It's important that all objects in view don't apply matrix but we'll handly this in object design rather than having the view enforce it

		//Add event handlers for object focus
		obToAdd.onMouseEnter = function(event) {
			if (this.focusedObj) this.focusedObj.selected = false;
			this.focusedObj = obToAdd;			
			obToAdd.selected = true;

		}.bind(this);

		this.objects.push(obToAdd); //Add object to contents list

		// obToAdd.onMouseLeave = function(event) {
		// 	this.focusedObj = null;
		// 	obToAdd.selected = false;

		// }.bind(this);

	}.bind(this);

	this.setFrame = function(frameNum){
		
		if ((frameNum < 0) || (frameNum >= this.FRAMECOUNT)) return -1;
		this.currentFrame = frameNum;
		this.loadFrame();
		this.updateUI();
		
	}.bind(this);

	this.logFrame = function(){
		if (this.userAction != 'none'){
			this.endAction();
		}

		// if (!(this.currentFrame in this.frameLib)){ //If there's no keyframe make a new blank. 
		if (!(this.currentFrame in this.frameLib)){
			this.frameLib[this.currentFrame] = {}
		}

		for (objI in this.objects){
			this.frameLib[this.currentFrame][this.objects[objI].id] = {}
			var thisEntry = this.frameLib[this.currentFrame][this.objects[objI].id];
			var thisObject = this.objects[objI];

			thisEntry.position = thisObject.position;
			thisEntry.rotation =  thisObject.rotation;

			thisEntry.actionLog = this.actionLog;

		}
		this.updateUI();//make sure frames show new content

	}.bind(this);

	this.loadFrame = function(){
		this.actionLog = {}; //Start fresh

		if (this.currentFrame in this.frameLib){ //This should be abstracted more clearly TODO each object's position and actionlog should be in the same Object
			for (obIndex in this.objects){
				var thisOb = this.objects[obIndex];
				var thisEntry = this.frameLib[this.currentFrame][thisOb.id];


				thisOb.position = thisEntry.position; //Would be nice to set this to a function rather than recording each property
				thisOb.rotation = thisEntry.rotation;	  //so that if we add or remove properties they can be stored or loaded programattically

				this.actionLog = thisEntry.actionLog;
				// console.log("Setting object #: " + thisOb.id + " to position: " + thisEntry.position + "\nSetting rotation to: " + thisEntry.rotation);
			}
		}
		else {
			
		}//Interpolate


		 // console.log(this.frameLib);
	}.bind(this);

	this.initUI = function(){
		//Buttons
		var buttonRect = new Rectangle(view.center,[100,40])
		var button1 = new Button(buttonRect, 'blue', 'Play', function(){alert('Will run animation')});

		var button2 = new Button(buttonRect, 'red', 'log', function(event){this.logFrame();});
		button1.position = [60,30] //TODO (location should be set in constructor maybe change the rect parameter)
		button2.position = [60,80]



		//Create FrameUI View
		for (var i = 0; i<this.FRAMECOUNT;i++){
		 
			var frame = new Path.Rectangle([10+15*i,550], [10,40]);

	
			if (i in this.frameLib){
				frame.fillColor = 'black';	
			} 
			else {
				frame.fillColor = 'grey';
			}


			frame.strokeWidth = 2;
			// if (i == this.currentFrame) frame.strokeColor = UICOLORS.frameStrokeSelected;
			// else frame.strokeColor = UICOLORS.frameStrokeUnSelected;

			(function (ind, whichframe, controller) { //Assign event handlers to all frames, closure is necessary to make sure iteration is handled correctly
				whichframe.idNum = ind;
				// alert(ind);
				whichframe.onClick = function(event){
					controller.setFrame(ind);
				}
			})(i, frame, this);

			this.uiFrameBoxes.push(frame);
		}
		//Frame Count
		this.frameText = new PointText({
		    point: [view.bounds.width-200, 50],
		    content: 'Frame: \n Action: ',
		    fillColor: 'black',
		    fontFamily: 'Courier New',
		    fontWeight: 'bold',
		    fontSize: 16
		});


	}.bind(this);

	this.updateUI = function(){
		for (var i in this.uiFrameBoxes){ //Update frame boxes			
			if (i == this.currentFrame) this.uiFrameBoxes[i].strokeColor = UICOLORS.frameStrokeSelected;
			else this.uiFrameBoxes[i].strokeColor = UICOLORS.frameStrokeUnSelected;

			if (i in this.frameLib){
					this.uiFrameBoxes[i].fillColor = 'black';	
				}
				else {
					this.uiFrameBoxes[i].fillColor = 'grey';
				}
		};

		this.frameText.content = 'Frame #: ' + this.currentFrame + "\nAction: " + this.userAction;

		//DraUILayerObject
		


		//Feel like maybe this should be in it's own function.
		//Or that they're should be an addTranslation, delTranslation, or something equivalent. 
		//Then that drawing could be separate?
		this.UIGroupActionLog.removeChildren()

		var itemCount = 0;
		for (key in this.actionLog) {

			itemCount++;
			switch (key){
				case 'position': //make boxes for 
					var logItemRep = UISYMBOLS.ACT_MOVE.clone();
					break;
				case 'rotation':
					var logItemRep = UISYMBOLS.ACT_ROTATE.clone();
					break;
			}

			(function(thisKey, thisItem, thisLog, thisView) {
				logItemRep.onClick = function(){
					
					thisView.focusedObj[thisKey] += thisLog[thisKey]; //Undo the translation

					thisItem.remove(); // Remove UI Element

					delete thisLog[thisKey]; //Remove Log Entry QUESTION: What's the difference between [] and .blahblah?

					// console.log(thisLog);

					thisView.updateUI(); //Update View
				}

			;})(key, logItemRep, this.actionLog, this);


			// (function(item, thisKey, log) {
			// 	logItemRep.onClick = function(){
			// 		console.log('transform click');
			// 		console.log(log.thisKey);
			// 		// item[thisKey] -= log.thisKey; //reverse movement on object, 

			// 		delete log.thisKey;//delete key

					
			// 		logItemRep.remove();//delete rep
			// 	}

			// }.bind(this))(logItemRep, key, this.actionLog)

			logItemRep.position = [view.bounds.width-200,100+itemCount*20];
			this.UIGroupActionLog.addChild(logItemRep);

		}


		// console.log("active: " + project.activeLayer);
		// console.log("all layers " + project.layers)

	}.bind(this);

	

	//INITIALIZE INTERFACE
	this.initUI();
	this.updateUI();

	//User Interaction Stuff:
	this.setAction = function(newAction){
		if (this.focusedObj!=null){
			if (this.userAction == newAction) {
				this.endAction();
				this.userAction = 'none';
			}
			else {
				this.startAction(newAction);
				this.userAction = newAction;
			}
			this.updateUI();
		}
	}.bind(this);

	this.startAction = function(actType){

		switch (actType){//record targets current state (only for relevant action)
						 //*** This should not be necessary, should just log absolute positions 
						 //and base changes off of that. Otherwise we're dealing with change from last move
						 //not from start position. 
			case 'position':
				this.obStartState = this.focusedObj.position;
				break;
			case 'rotation':
				this.obStartState= this.focusedObj.rotation;
				break;
			case 'pitch':
				this.obStartState= this.focusedObj.pitch;
				break;
		}
		// console.log(this.obStartState);

		//set the the action state, does that need to be separate function?
	}.bind(this);

	this.endAction = function(){
		switch (this.userAction){//Note difference between last position and this position (or rotation or pitch or whatever)
			case 'position':
				var stateDiff = this.obStartState - this.focusedObj.position;
				break;
			case 'rotation':
				var stateDiff = this.obStartState - this.focusedObj.rotation;
				break;
			case 'pitch':
				var stateDiff = this.obStartState - this.focusedObj.pitch;
				break;
		}
		
		this.actionLog[this.userAction] = stateDiff;//Record Difference record movement in the actionLog for this frame, which will be added (plus absolute positions) to the framelib object IF the frame gets logged
		// console.log(this.actionLog);
		

		this.updateUI();//update the UI to show new actions created
	}.bind(this);

	containerView.onKeyDown = function(event){
		// console.log(event.key + 'pressed');
		switch(event.key){
			case 'g':
				this.setAction('position');
				break;
			case 'r':
				this.setAction('rotation');
				break;
			case 'space':
				this.logFrame(); 
				this.setFrame(this.currentFrame+1);
				break;
			case 'f':
				this.setFrame(this.currentFrame+1);
				break;
			case 'e':
				this.setFrame(this.currentFrame-1);
				break;
		}
		
	}.bind(this);

	containerView.onMouseMove = function(event){
		switch (this.userAction){
			case 'position':
				this.focusedObj.position += event.delta;
				break;
			case 'rotation':
				this.focusedObj.rotation += event.delta.y;
				break;

		}
	}.bind(this);

}




function Button(rect, color, text, clickAction){
	this.rect = new Path.Rectangle(rect);
	this.rect.fillColor = color;
	this.rect.opacity = .6
	this.text = new PointText({
		    point: this.rect.position,
		    content: text,
		    fillColor: 'white',
		    fontFamily: 'Courier New',
		    fontWeight: 'bold',
		    fontSize: 16
		});

	this.text.position = this.rect.position //center align text to box;

	this.group = new Group(this.rect,this.text);

	this.group.onClick = clickAction;

	Object.defineProperty(this, 'position', {
		get: function(){
			return this.group.position;
		},
		set: function(value){
			// console.log('setter');
			this.group.position = value;
		}

	});
} //Button class to help with interface



//Proto Foot Class to allow pitch shading to indicate footsteps, still need to figure out how to hand when rotated out of cardinal directions...
var FOOT_HEIGHT = 60;
var FOOT_WIDTH = 20

function Foot(position){ //FOOT class needs to extend paper.item otherwise it can't interact with environment with correctly TODO TODO TODO BUG

	var startPos = typeof position == 'undefined' ? view.center : position;
	this.pitch = 0;
	this.position = null;

	this.shadowRep = new paper.Path.Rectangle(view.center, [FOOT_WIDTH,FOOT_HEIGHT])
	this.shadowRep.position = startPos; //no need to keep class position as we can just return one of the element's xy's same goes for yaw, since pitch is not maintained by paperjs we need our own.
	this.shadowRep.applyMatrix = false; //Only have to do this once since all members are clones of shadowRep

	this.footRep = this.shadowRep.clone();
	this.shadowRep.opacity = .2;

	this.shadowRep.fillColor = 'grey';
	this.footRep.fillColor = 'black';

	this.footMask = this.footRep.clone();

	var footGroup = new Group(this.footMask,this.footRep);
	footGroup.clipped = true;

	Object.defineProperty(this, 'position', {
	get: function() {
		return this.shadowRep.selected;
	},
	set: function(value) {
		this.shadowRep.selected = value;
		console.log('foot selected');
	}
});


//Getter/Setter Methods

Object.defineProperty(this, 'onMouseEnter', {
	get: function() {
		return this.footGroup.onMouseEnter;
	},
	set: function(value) {
		this.footGroup.onMouseEnter = value;
	}
});

Object.defineProperty(this, 'position', {
	get: function() {
		return this.footRep.position;
	},
	set: function(value) {
		console.log('setting foot position')
		this.footRep.position = value;
		this.shadowRep.position = value;
		this.footMask.position = value;
	}
});

Object.defineProperty(this, 'pitch', {
	get: function() {
		return this.footRep.rotation;
	},
	set: function(value) {
		this.footRep.rotation = value;
		this.shadowRep.rotation = value;
		this.footMask.rotation = value;
	}
});

Object.defineProperty(this, 'yaw', { //The problem is with these setters every time we set the position the yaw will be reset BUG TODO have to resovle
	get: function() {
		return this.yaw;
	},
	set: function(value) {
		this.pitch = value;
		if (this.pitch == 0) {//Mostly feet will be flat
			this.footMask.position = this.footRep.position;
		}
		else {
			var offset = FOOT_HEIGHT/90 //takes away one pixel of shoe for degree of rotation, I think... TODO
			var dirVec = new Point(0, 1);

			dirVec.angle += this.shadowRep.rotation+180;

			footMask.position = this.footRep.position + dirVec

		}


	}
});

}
//Need function to set rotation center too! TODO check paper syntax on that....

// Object.defineProperty(Foot.prototype, 'position', {
// 	get: function() {
// 		return this.footRep.position;
// 	},
// 	set: function(value) {
// 		this.footRep.position = value;
// 		this.shadowRep.position = value;
// 		this.footMask.position = value;
// 	}
// });

// Object.defineProperty(Foot.prototype, 'pitch', {
// 	get: function() {
// 		return this.footRep.rotation;
// 	},
// 	set: function(value) {
// 		this.footRep.rotation = value;
// 		this.shadowRep.rotation = value;
// 		this.footMask.rotation = value;
// 	}
// });

// Object.defineProperty(Foot.prototype, 'yaw', { //The problem is with these setters every time we set the position the yaw will be reset BUG TODO have to resovle
// 	get: function() {
// 		return this.yaw;
// 	},
// 	set: function(value) {
// 		this.pitch = value;
// 		if (this.pitch == 0) {//Mostly feet will be flat
// 			this.footMask.position = this.footRep.position;
// 		}
// 		else {
// 			var offset = FOOT_HEIGHT/90 //takes away one pixel of shoe for degree of rotation, I think... TODO
// 			var dirVec = new Point(0, 1);

// 			dirVec.angle += this.shadowRep.rotation+180;

// 			footMask.position = this.footRep.position + dirVec

// 		}


// 	}
// });






//Create View	
var mainView = new ViewController(50, null, view);






//Create stuff to animate:
var d1 = new Item();


var obj1 = new paper.Path.Rectangle(view.center, [50,150])
obj1.fillColor = 'black';

var obj2 = obj1.clone(); 
obj2.position += [60,0];



// var testFoot = new Foot(); //OUT until we fix foot specific code TODO
// mainView.addObj(testFoot);


mainView.addObj(obj1);
mainView.addObj(obj2);


// onMouseMove = function(event){
// 	obj1.position += event.delta;
// }





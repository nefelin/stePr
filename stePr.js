// //frameLib stuff


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
	//Play Control Variables
	this.playing = false;

	this.BPM = 80; //This controls the resolution of the frames, each frame is a beat. So 60 / BMP = length of each frame in seconds.

	//UI Control Groups
	this.UIGroupHUD = new Group();
	this.UIGroupActionLog = new Group();

	//Vars for recording individual translations
	this.obStartState = null; //Used to track object change
	this.actionLogUI = [];

	this.dancers = [];
	
	this.focusedObj = null;
	this.userAction = 'none';

	this.FRAMECOUNT = typeof frameCount == 'undefined' ? 20 : frameCount;
	this.frameLib = {};


	// this.objects = typeof objects == 'undefined' ? [] : objects //Why doesn't this work here as above?
	if (objects == undefined) this.objects = [];
	else this.objects = objects;
	

	this.currentFrame = 0; 
	this.uiFrameBoxes = [];

	this.addDancer = function(newDancer){ //When new dancers are added throw them on the array and register each of their objects for handling
		this.dancers.push(newDancer);
		for (var i in newDancer.wholeBody.children){
			this.registerForHandling(newDancer.wholeBody.children[i]);
		}
	}.bind(this)

	

	this.registerForHandling = function(obToAdd){
		

		//Add event handlers for object focus
		obToAdd.onMouseEnter = function(event) {
			if (this.userAction=='none'){
				if (this.focusedObj) this.focusedObj.selected = false; //If there was another object with focus, remove its border

				this.focusedObj = obToAdd; //Change focusedObJ point to currently moused obj
				obToAdd.selected = true;	//Add a border
				
			}
		
		}.bind(this);

	}.bind(this);

	this.setFrame = function(frameNum){
		
		if ((frameNum < 0) || (frameNum >= this.FRAMECOUNT)) return -1;
		this.currentFrame = frameNum;
		
		this.updateUI();
		
	}.bind(this);

	this.logFrame = function(){ 
		var that = this; //avoid binding this on each foreach loop

		if (this.userAction != 'none'){
			this.endAction(); //Log changes if user is acting
		}

		this.dancers.forEach(function(dancer){ //This should be contained in the dancer class TODO
			
			dancer.blankFrameAt(that.currentFrame); //Guarantees us a blank frame
			
			dancer.wholeBody.children.forEach(function(rep){
				var thisEntry = dancer.frameLib[that.currentFrame][rep.name];

				thisEntry.position = rep.position;
				thisEntry.rotation = rep.rotation;

				
				

			});
			dancer.frameLib[that.currentFrame].transLog = JSON.parse(JSON.stringify(dancer.transLogStash)); //Needed to deep clone object
			// console.log(dancer.transLogStash);
			// console.log(dancer.frameLib);

		});


		this.updateUI();//make sure frames show new content

	}.bind(this);

	this.logTranslation = function(stateDiff) {
		this.focusedObj.owner.logTranslation(this.focusedObj.name, this.userAction, stateDiff);
		// this.focusedObj.owner.transLogStash[this.focusedObj.name][this.userAction] = stateDiff;
	}.bind(this);

	this.loadFrame = function(frameNum){

		this.dancers.forEach(function(dancer){ //each dancer loads their own frame info

			dancer.initTransLogStash(); //Start with black transLog
			dancer.loadFrame(frameNum); //Really this should be like dancer.loadMoment that calls a loadFram if loadFrame exists.... TODO

		}.bind(this));

	}.bind(this);

	this.initUI = function(){
		//Buttons
		var buttonRect = new Rectangle(view.center,[100,40])
		var button1 = new Button(buttonRect, 'blue', 'Play', function(){this.togglePlayback();}.bind(this));

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
					controller.loadFrame(ind);
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


			this.dancers.forEach(function (dancer) { //Check if anyone has content for frame and determine coloring...
				if (dancer.hasFrameAt(i)){
						this.uiFrameBoxes[i].fillColor = 'black';	
					}
					else {
						this.uiFrameBoxes[i].fillColor = 'grey';
					}
			}.bind(this))
			
		};

		this.frameText.content = 'Frame #: ' + this.currentFrame + "\nAction: " + this.userAction;

		//Draw transLogStash for each dancer
		


		//Feel like maybe this should be in it's own function.
		//Or that they're should be an addTranslation, delTranslation, or something equivalent. 
		//Then that drawing could be separate?

		
		// this.UIGroupActionLog.removeChildren()

		// var itemCount = 0;

		//  this.dancers.forEach(function(dancer){ // TODO BUG a little broken and not the priority as I would rather implement a different display anyways
		//  	for (var limb in dancer.transLogStash) {
		//  		for (var trans in dancer.transLogStash[limb]) {
		// 			switch (trans){
		// 				case 'position': //make boxes for 
		// 					var logItemRep = UISYMBOLS.ACT_MOVE.clone();
		// 					break;
		// 				case 'rotation':
		// 					var logItemRep = UISYMBOLS.ACT_ROTATE.clone();
		// 					break;
		// 			}

		// 			(function(thisKey, thisItem, thisLog, thisView) {
		// 				logItemRep.onClick = function(){
							
		// 					thisView.focusedObj[thisKey] += thisLog[thisKey]; //Undo the translation

		// 					thisItem.remove(); // Remove UI Element

		// 					delete thisLog[thisKey]; //Remove Log Entry QUESTION: What's the difference between [] and .blahblah?

		// 					// console.log(thisLog);

		// 					thisView.updateUI(); //Update View
		// 				}

		// 			;})(trans, logItemRep, dancer.transLogStash, this);


		// 			logItemRep.position = [view.bounds.width-200,100+itemCount*20];
		// 			// this.UIGroupActionLog.addChild(logItemRep);

		//  		}
		//  	}

		//  })
		


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
		
		this.logTranslation(stateDiff);

		this.updateUI();//update the UI to show new actions created
	}.bind(this);

	this.clearFrame = function(){
		if (this.focusedObj){
				
				this.focusedObj.owner.clearFrameAt(this.currentFrame);
				this.loadFrame();
				this.updateUI();
			}
	}.bind(this);

	containerView.onKeyDown = function(event){
		
		switch(event.key){
			case 'g':
				this.setAction('position');
				break;
			case 'r':
				this.setAction('rotation');
				break;
			case 'space':
				this.logFrame(); 
				break;
			case 'f':
				this.setFrame(this.currentFrame+1);
				break;
			case 'e':
				this.setFrame(this.currentFrame-1);
				break;
			case 'c':
				this.clearFrame();
				break;
		}
		
	}.bind(this);

	//Playback functions

	this.getFrameFromTime = function(time){
		time /= 1000; //Convert from miliseconds
		var secsPerBeat = 60/this.BPM;

		return time / secsPerBeat;

	}.bind(this);

	this.playStartTime = null;

	// this.startPlayback = function() { //This only plays from beginning TODO
	// 	this.playing = true;
	// 	this.playStartTime = Date.now();
	// }.bind(this);

	// this.stopPlayback = function() {
	// 	this.playing = false;
		
	// }.bind(this);

	this.togglePlayback = function() {
		this.playing = !this.playing;
		this.playStartTime = Date.now();
		
	}.bind(this);

	containerView.onFrame = function(event){
		//If state is playing increment playhead by elapsed time
		if (this.playing) {
			
			//get frame for that moment,
			var thisFrame = this.getFrameFromTime(Date.now() - this.playStartTime);
			
 	 		

			if (thisFrame>this.FRAMECOUNT) this.togglePlayback(); //if frame is out of range, stop playback	
			else {
				this.loadFrame(thisFrame);
				this.setFrame(Math.floor(thisFrame));
			}
			
		}
		
	}.bind(this)

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

//Dancer Class
var HIP_WIDTH = 30;
var FOOT_DIMENSIONS = [20,60];
var FOOT_REP = new Path.Rectangle({
	point:[-100,-100],
	size:FOOT_DIMENSIONS,
	fillColor:'black'
});
var WEIGHT_REP = new Path.Circle({
	center: [-100,-100],
	radius:5,
	fillColor: 'red'
})

function Dancer(startPos, facing/*unImplemented TODO*/) {

	//create Objects
	this.left = FOOT_REP.clone();
	this.right = FOOT_REP.clone();

	this.weight = WEIGHT_REP.clone();
	this.wholeBody =  new Group(this.left, this.right,this.weight);

	this.wholeBody.applyMatrix = false; 

	this.contents = [this.left,this.right,this.weight/*,this.wholeBody shoould switch to use this instead of wholeBody.children I think TODO*/];


	
	//need to add more custom pointers for owner weight? wholeBody. 
	//how do I handle weight management TODO
	this.wholeBody.children.forEach(function(el){
		el.applyMatrix = false;
		el.owner = this;
	}.bind(this))

	this.left.mirror = this.right;
	this.right.mirror = this.left;
	this.left.name = 'left';
	this.right.name = 'right';
	this.weight.name = 'weight';

	this.left.position = startPos + [-.5*HIP_WIDTH,0];
	this.right.position = startPos + [.5*HIP_WIDTH,0];
	this.weight.position = this.left.position;

	this.frameLib = {};
	


	this.initTransLogStash = function () {
		this.transLogStash = {
			left: {},
			right: {},
			weight: {},
		}
	
	}.bind(this); //Ask Joe TODO
	this.initTransLogStash();

	this.logTranslation = function(target, type, amount) {
		this.transLogStash[target][type] = amount;
	}.bind(this)

	this.hasFrameAt = function (frameNum) {
		return (frameNum in this.frameLib);
	}

	this.clearFrameAt = function (frameNum) {
		delete this.frameLib[frameNum];
	}

	this.becomeFrame = function(dataFrame){ //Sort out become frame and load frame confusing naming...
		this.contents.forEach(function(part) {
				var thisEntry = dataFrame[part.name];
				
				
				
				part.position = thisEntry.position;
				part.rotation = thisEntry.rotation;
				
				//Figure out what to do with translog stash for interpolated frames, kind of a UX issue TODO

			}.bind(this))
	}.bind(this);

	this.loadFrame = function (frameNum){ //This is ambiguous

		if (frameNum in this.frameLib) {
			// console.log('dancer found frame data, loading');
			this.contents.forEach(function(part) {
				var thisEntry = this.frameLib[frameNum][part.name];
				
				// console.log(thisEntry);
				part.position = thisEntry.position;
				part.rotation = thisEntry.rotation;
				// console.log(this.transLogStash);
				this.transLogStash = this.frameLib[frameNum].transLog; 
				// console.log(this.transLogStash);

			}.bind(this))

		}
		else {
			// console.log('dancer found no data, interpolating');
			var lastFrame = this.frameBefore(frameNum);
			var nextFrame = this.frameAfter(frameNum);
			// console.log(lastFrame);
			// console.log(nextFrame); 

			if (lastFrame && nextFrame){
				// console.log('frame boundries found so interpolation can proceed');
				var progress = frameNum/nextFrame.frameNum;
				var tweenFrame = linearIntrpl.interpolate(lastFrame.frame,nextFrame.frame, progress);
				this.becomeFrame(tweenFrame);
			}
		}
	}.bind(this)

	this.frameAfter = function (frameNum){
		var nextFrame = null; 
		for (num in this.frameLib){
			if (num > frameNum){
				if (!nextFrame) nextFrame = num; //If this is the first number we find, that's our next frame
				if (num < nextFrame) nextFrame = num; //If this number is lower than current find, that's our nextFrame;
			}
		}
		return nextFrame ? {frameNum: nextFrame, frame: this.frameLib[nextFrame]} : null; //Return the next frame from our lib if we found it, else null
	}.bind(this);

	this.frameBefore = function (frameNum){
		var prevFrame = null; 
		for (num in this.frameLib){
			if (num < frameNum){
				if (!prevFrame) prevFrame = num; //If this is the first number we find, that's our next frame
				if (num > prevFrame) prevFrame = num; //If this number is higher than current find, that's our prevFrame;
			}
		}
		return prevFrame ? {frameNum: prevFrame, frame: this.frameLib[prevFrame]} : null; //Return the next frame from our lib if we found it, else null
	}.bind(this);


	this.blankFrameAt = function (frameNum){
		if (!(frameNum in this.frameLib)){
			this.frameLib[frameNum] = blankFrame();
		}
	}
}

//TODO should classify transLog and frame so that I don't have to maintain coherence in so many locations IMPORTANT

var blankFrame = function() {
	return {
				transLog: {}, //is this ok or should it have categories prepped? QUESTION TODO
				left: {},
				right: {},
				weight: {}
			};
} 


function Interpolater() { //Start out with simple linear, later instantiate other stype of interpolater
	//TODO would like to be able to return a frame with no translogStash so we need some error handling around that
	//otherwise we have to keep sending blank translogs back which seems like a waste of memory, especially while animating.
	this.interpolate = function (startFrame, endFrame, progress){
		// console.log('interpolater interpolating')
		var resultFrame = blankFrame();

		for (item in startFrame){
			for (prop in startFrame[item]){
				resultFrame[item][prop] = endFrame[item][prop] - startFrame[item][prop];
			}
		}

		for (item in startFrame){
			for (prop in startFrame[item]){
				resultFrame[item][prop] = startFrame[item][prop] + resultFrame[item][prop] * progress;
			}
		}
		
		return resultFrame;
		
	}
}

var linearIntrpl = new Interpolater(); //Not sure this is the right model, maybe should have functions built in for different eases and we pick one...



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
			
			this.group.position = value;
		}

	});
} //Button class to help with interface



//Create View	
var mainView = new ViewController(50, null, view);







//Create stuff to animate:
// var d1 = new Item();


// var obj1 = new paper.Path.Rectangle(view.center, [50,150])
// obj1.fillColor = 'black';

// var obj2 = obj1.clone(); 
// obj2.position += [60,0];

var d1 = new Dancer(view.center);
d1.name = 'dude';
mainView.addDancer(d1);

// mainView.registerForHandling(obj1);
// mainView.registerForHandling(obj2);


// //FrameLib stuff
// var ACT = { //I think maybe actions should have no targets
// 					// and target should be inherent in acttype, like MOVE_FREE
// 					// or SHIFT_WEIGHT
// 	ROT_FOOT : "rotate one foot",
// 	ROT_BOD  : "rotate both feet around standing",
// 	MOVE     : "translate foot/weight in XY space",
// 	POINT    : "articulate the ankle"
// }

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
var UICOLORS = {
	frameStrokeSelected : 'blue',
	frameStrokeUnSelected : 'black'
}

function ViewController(frameCount, objects){
	this.FRAMECOUNT = typeof frameCount == 'undefined' ? 20 : frameCount;

	if (objects == undefined) this.objects = [];
	else this.objects = [];

	this.currentFrame = 0; 
	this.uiFrameBoxes = [];

	//Init FrameLib
	this.frameLib = {};

	this.setFrame = function (frameNum) {
		this.currentFrame = frameNum;
		this.updateContents();
		this.updateUI();
		
	}.bind(this);

	this.logFrame = function() { 
		console.log('log!');

		// if (!(this.currentFrame in this.frameLib)){ //If there's no keyframe make a new blank. 
		if (!(this.currentFrame in this.frameLib)){
			this.frameLib[this.currentFrame] = {}
		}

		for (objI in this.objects){
			this.frameLib[this.currentFrame][this.objects[objI].id] = {}
			var thisEntry = this.frameLib[this.currentFrame][this.objects[objI].id];
			var thisObject = this.objects[objI];
			thisEntry.position = thisObject.position;
			thisEntry.yaw =  thisObject.rotation;
			console.log(thisEntry.position);

		}
		this.updateUI();//make sure frames show new content

	}.bind(this);



	this.initUI = function(){
		// console.log('initing UI');



		//Create FrameUI View
		console.log(this.FRAMECOUNT);
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
					// console.log('frameNum: ' + whichframe.idNum + ' clicked');
					controller.setFrame(ind);
				}
			})(i, frame, this);

			this.uiFrameBoxes.push(frame);
		}
		//Frame Count
		

		this.frameText = new PointText([view.bounds.width-100,40]);
		this.frameText.justification = 'center';
		this.frameText.fillColor = 'black';
		
		this.frameText.fontSize = 20;


	}.bind(this);

	this.updateUI = function(){
		for (var i in this.uiFrameBoxes){ //Update frame boxes
			// console.log('updating frame ' + i);
			
			if (i == this.currentFrame) this.uiFrameBoxes[i].strokeColor = UICOLORS.frameStrokeSelected;
			else this.uiFrameBoxes[i].strokeColor = UICOLORS.frameStrokeUnSelected;

			if (i in this.frameLib){
					this.uiFrameBoxes[i].fillColor = 'black';	
				}
				else {
					this.uiFrameBoxes[i].fillColor = 'grey';
				}
		};

		this.frameText = 'Frame #: '; + this.currentFrame;
	}.bind(this);

	this.updateContents = function(){
		if (this.currentFrame in this.frameLib){
			for (obIndex in this.objects){
				var thisOb = this.objects[obIndex];
				thisOb.position = this.frameLib[this.currentFrame][thisOb.id].position;
				console.log("Setting object #: " + thisOb.id + " to position: " + this.frameLib[this.currentFrame][thisOb.id].position);
			}
		}
		// console.log(this.frameLib);
	}.bind(this);

	//INITIALIZE INTERFACE
	this.initUI();
	this.updateUI();

}



//Test ActionLog

// var testAct = new Action(ACT.MOVE,2,3);
// var testFrame = new Frame([testAct],'absolute');
// var testLib = {};
// testLib[5] = testFrame;

// console.log(test);


//Proto Foot Class to allow yaw shading to indicate footsteps, still need to figure out how to hand when rotated out of cardinal directions...


// function Foot(position){
// 	this.yaw = 0;
// 	this.shadowRep = new paper.Path.Rectangle(view.center, [20,60])
// 	this.footRep = shadowRep.clone();
// 	this.shadowRep.opacity = .1;

// }

// Object.defineProperty(Foot, 'position', {
// 	get: function() {
// 		return this.footRep.position;
// 	},
// 	set: function(value) {
// 		this.footRep.position = value;
// 		this.shadowRep.position = value;
// 	}
// });

// Object.defineProperty(Foot, 'yaw', {
// 	get: function() {
// 		return this.yaw;
// 	},
// 	set: function(value) {
// 		this.yaw = value;
// 		if (this.yaw == 0) {//Mostly feet will be flat
// 		}
// 		else if (this.yaw<0){//When not flat likely to tilt back
// 		}
// 		else if (this.yaw>0){//But somtimes they're pointed forward
// 		}


// 	}
// });

var button = new Path.Rectangle([10,10], [100,40]);
button.fillColor = 'red';
button.onClick = function(event){
	console.log('click');
	mainView.logFrame();
}

	

var mainView = new ViewController();


var obj1 = new paper.Path.Rectangle(view.center, [50,150])
obj1.fillColor = 'black';
console.log('object id:' + obj1.id);
mainView.objects.push(obj1);





obj1.onMouseDrag = function(event){

	obj1.position += event.delta;
}


var butrect = new paper.Rectangle(paper.view.center, [50,15]);
var but1 = new paper.Path.Rectangle(butrect);
but1.fillcolor = 'black';



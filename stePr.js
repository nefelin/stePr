//FrameLib stuff
var ACT = { //I think maybe actions should have no targets
					// and target should be inherent in acttype, like MOVE_FREE
					// or SHIFT_WEIGHT
	ROT_FOOT : "rotate one foot",
	ROT_BOD  : "rotate both feet around standing",
	MOVE     : "translate foot/weight in XY space",
	POINT    : "articulate the ankle"
}

function Action(type, amount, target){
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

function FrameData(xyPos, yawAngle, pitchAngle){
	this.xyPos = xyPos;
	this.yawAngle = yawAngle;
	this.pitchAngle = pitchAngle;
}


function FrameLib(){
	this.frames = {};
}

//View CLASS Should contain objects, track/set frame number, facilitating animation
//Not sure where to keep key frame data, with dancer or individual objects
var UICOLORS = {
	frameStrokeSelected : 'blue',
	frameStrokeUnSelected : 'black'
}

function ViewController(frameCount, objects){
	this.FRAMECOUNT = typeof frameCount == 'undefined' ? 20 : frameCount;

	if (objects == undefined) this.objects = [];
	else this.objects = {};

	this.currentFrame = 0; 
	this.allFrames = [];
	this.frameLib = {};

	this.setFrame = function (frameNum) {
		this.currentFrame = frameNum;
		this.updateContents();
		this.updateUI();
		
	}.bind(this);

	this.logFrame = function() { //Hobbled to work with one object and only xy pos
		console.log('log!');
		for (objI in this.objects){
			this.frameLib[this.currentFrame][objects][this.objects[objI]]['position'] = this.objects[objI].position;
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

			this.allFrames.push(frame);
		}
		//Frame Count
		

		this.frameText = new PointText([view.bounds.width-100,40]);
		this.frameText.justification = 'center';
		this.frameText.fillColor = 'black';
		
		this.frameText.fontSize = 20;


	}.bind(this);

	this.updateUI = function(){
		for (var i in this.allFrames){ //Update frame boxes
			// console.log('updating frame ' + i);
			
			if (i == this.currentFrame) this.allFrames[i].strokeColor = UICOLORS.frameStrokeSelected;
			else this.allFrames[i].strokeColor = UICOLORS.frameStrokeUnSelected;

			if (i in this.frameLib){
					this.allFrames[i].fillColor = 'black';	
				}
				else {
					this.allFrames[i].fillColor = 'grey';
				}
		};

		this.frameText = 'Frame #: '; + this.currentFrame;
	}.bind(this);

	this.updateContents = function(){
		// if (this.currentFrame in this.frameLib) {
		// 	for (var obIndex in this.frameLib[this.currentFrame].objects){
				
		// 	}
		// }
		console.log(this.frameLib);
	}.bind(this);

	//INITIALIZE INTERFACE
	this.initUI();
	this.updateUI();

}



//Test ActionLog

var testAct = new Action(ACT.MOVE,2,3);
var testFrame = new Frame([testAct],'absolute');
var testLib = {};
testLib[5] = testFrame;

// console.log(test);




var button = new Path.Rectangle([10,10], [100,40]);
button.fillColor = 'red';
button.onClick = function(event){
	console.log('click');
	mainView.logFrame();
}

	

var mainView = new ViewController();


var obj1 = new paper.Path.Circle(view.center, 50)
obj1.fillColor = 'black';
console.log('object id:' + obj1.id);





obj1.onMouseDrag = function(event){

	obj1.position += event.delta;
}


var butrect = new paper.Rectangle(paper.view.center, [50,15]);
var but1 = new paper.Path.Rectangle(butrect);
but1.fillcolor = 'black';



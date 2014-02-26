var id = 0;
var viewer = {currentColor: 0,
		paths: [], 
		colors: ["#FFFFFF", "#808080", "#FF0000", "#FFFF00", 
		         "#00FF00", "#00FFFF", "#0000FF", "#800080"],
};

viewer.setup = function() {
	/*	if (navigator.userAgent.indexOf('Android') != -1){
		document.getElementById("close_android_ad").onclick = function(){
			document.getElementById("android_ad").style.visibility = "hidden";
			return false;
		}
		document.getElementById("android_ad").style.visibility = "visible";
	}
	 */
	var c=document.getElementById("main-canvas");
	viewer.canvas = c;
	viewer.ctx = c.getContext("2d");
	viewer.ctx.lineWidth = 6;
	
	viewer.colorPanel = document.getElementById("colors");

	for (var ic = 0; ic < viewer.colors.length; ic++){
		document.getElementById("color-" + ic).style.backgroundColor = viewer.colors[ic];
	}

	tool = new tool_pencil();

	c.addEventListener("mousedown", tool.mousedown, false);
	c.addEventListener("mousemove", tool.mousemove, false);
	c.addEventListener("mouseup",   tool.mouseup, false);
	c.addEventListener("touchstart", tool.touchstart, false);
	c.addEventListener("touchmove", tool.touchmove, false);
	c.addEventListener("touchend",   tool.touchend, false);

};

viewer.setCanvasSize = function() {
	viewer.width = window.innerWidth - viewer.canvas.parentElement.offsetLeft - 10;
	viewer.height = window.innerHeight - viewer.canvas.parentElement.offsetTop - 10;
	viewer.canvas.style.width = viewer.width + "px";
	viewer.canvas.style.height = viewer.height + "px";
	viewer.canvas.parentElement.style.width = viewer.width + "px";
	viewer.canvas.parentElement.style.height = viewer.height + "px";
	viewer.canvas.width = viewer.width;
	viewer.canvas.height = viewer.height;
	viewer.ctx.lineWidth = 6;
	viewer.ctx.shadowColor = "white";

	viewer.xsize = viewer.width;
	viewer.ysize = viewer.height;

};

window.onresize = function() {
	viewer.setCanvasSize();
	//viewer.setupPxData();
};


function setup(doodle){

	var pieces = doodle.split(":");
	for (var ip = 0; ip < pieces.length; ip++){
		var segments = pieces[ip].split(";");
		var pxd = [];
		var ipx = 0;
		for (var is = 1; is < segments.length; is = is + 2){
			pxd[ipx] = [segments[is] * viewer.xsize, segments[is + 1] * viewer.ysize];
			ipx++;
		}
		viewer.paths[ip] = {color: segments[0], pxdata: pxd};
	}

	draw();
}

function draw(){	
	var c = viewer.canvas;
	var ctx = viewer.ctx;
	var xsize = c.clientWidth;
	var ysize = c.clientHeight;

	ctx.clearRect(0, 0, c.width, c.height);	

	for (var ip = 0; ip < viewer.paths.length; ip++){
		ctx.beginPath();
		ctx.moveTo(viewer.paths[ip].pxdata[0][0], viewer.paths[ip].pxdata[0][1]);
		for (var is = 1; is < viewer.paths[ip].pxdata.length; is++){
			//ctx.moveTo(viewer.paths[ip].pxdata[is -1][0], viewer.paths[ip].pxdata[is -1][1]);
			ctx.lineTo(viewer.paths[ip].pxdata[is][0], viewer.paths[ip].pxdata[is][1]);
		}
		ctx.strokeStyle = viewer.colors[viewer.paths[ip].color]; 
		ctx.stroke();
		ctx.closePath();
	}
}	


function tool_pencil () {
	var canvas = viewer.canvas;
	var context = viewer.ctx;	
	var tool = this;
	this.started = false;
	this.lastX = -1;
	this.lastY = 0;
	this.lastColor = -1;
	this.drawnSegments = 0;
	this.drawnPaths = 0; 
	this.looperCounter = 0;
	this.continuingOn = false;


	this.touchstart = function (ev) {
		ev.preventDefault(); 
		x = ev.targetTouches[0].pageX - canvas.parentElement.offsetLeft;
		y = ev.targetTouches[0].pageY - canvas.parentElement.offsetTop;
		tool.start(x, y);
	}
	this.touchmove = function (ev) {
		ev.preventDefault(); 
		x = ev.targetTouches[0].pageX - canvas.parentElement.offsetLeft;
		y = ev.targetTouches[0].pageY - canvas.parentElement.offsetTop;
		tool.move(x, y);
	}
	this.touchend = function (ev) {
		ev.preventDefault(); 
		tool.end();
	}

	this.mousedown = function (ev) {
		ev.preventDefault(); 
		x = ev.pageX - canvas.parentElement.offsetLeft;
		y = ev.pageY - canvas.parentElement.offsetTop;
		tool.start(x, y);
	}
	this.start = function(x, y){

		
		tool.drawnPaths = viewer.paths.length;
		context.strokeStyle = viewer.colors[viewer.currentColor];
		context.beginPath();
		context.moveTo(x, y);

		tool.started = true;

		tool.drawnSegments = 0;
		segments = [];

		tool.lastX = x;
		tool.lastY = y;


		segments[tool.drawnSegments] = [x, y];
		tool.drawnSegments++;

		onEdit();
	};

	this.mousemove = function (ev) {
		ev.preventDefault(); 
		x = ev.pageX - canvas.parentElement.offsetLeft;
		y = ev.pageY - canvas.parentElement.offsetTop;
		tool.move(x, y);
	}

	this.move = function(x, y){

		if (tool.started) {
			context.lineTo(x, y);
//			context.moveTo(x, y);
			context.stroke();
			
			segments[tool.drawnSegments] = [x, y];
			
			tool.lastX = x;
			tool.lastY = y;
			tool.drawnSegments++;
		}
	};

	this.mouseup = function (ev) {
		ev.preventDefault(); 
		tool.end();
	}

	this.end = function (){
		if (tool.started) {
			context.closePath();

			tool.started = false;

//			segments[tool.drawnSegments] = [tool.lastX, -1];

			tool.drawnSegments++;

			viewer.paths[tool.drawnPaths] = {color: viewer.currentColor, 
					pxdata: segments};

			tool.drawnPaths++;
		}
	};
}

function chooseColor(color){
	var offs = 5;
	if (viewer.currentColor > -1){ 
		var oldColor = document.getElementById("color-" + viewer.currentColor);
		oldColor.style.borderWidth = "1px";
		//  var newLeft = oldColor.style.left + 3;
		//  oldColor.style.left = newLeft + "px";
		oldColor.style.borderColor = "#808080";
		oldColor.style.zIndex = 0;
	}
	var newColor = document.getElementById("color-" + color);
	newColor.style.borderWidth = "3px";
	//  var newLeft2 = newColor.style.left - 3;
	//  newColor.style.left = newLeft2;
	newColor.style.borderColor = "#FFFFFF";
	newColor.style.zIndex = 1;
	viewer.currentColor = color;


}
function onEdit(){
	id = 0;	
}
function clearButton(){
	onEdit();
	viewer.paths = [];
	draw();
}
function undoButton(){
	viewer.paths = viewer.paths.slice(0, viewer.paths.length - 1);
	draw();
	onEdit();
}

function facebookButton(){
	shareButton('http://www.facebook.com/sharer/sharer.php?t=YouGotADoodle&u=http%3A%2F%2Fyougotadoodle.appspot.com%2Fd.jsp');
}

function twitterButton(){
	shareButton( "http://twitter.com/home?status=http%3A%2F%2Fyougotadoodle.appspot.com%2Fd.jsp");
}

function emailButton(){
	var url = 'mailto:?subject=You Got A Doodle!&body=http://yougotadoodle.appspot.com/d.jsp';
	shareButton(url);
}

function shareButton(url){
	if (viewer.paths.length == 0){
		//url = ;
		window.location = url; 

	}
	else if (id > 0 ){
		url = url + '%3Fid%3D' + id ;
		//var newWindow = window.open(url, "share"); 
		window.location = url; 
	}
	else {
		var doodle = "";
		for (var ip = 0; ip < viewer.paths.length; ip++){
			if (doodle.length > 0){
				doodle = doodle + ":";
			}
			doodle = doodle + "" + viewer.paths[ip].color;
			for (var is = 0; is < viewer.paths[ip].pxdata.length;is++){
				doodle = doodle + ";" + (viewer.paths[ip].pxdata[is][0] / viewer.xsize).toFixed(3);
				doodle = doodle + ";" + (viewer.paths[ip].pxdata[is][1] / viewer.ysize).toFixed(3);
			}
		}				

		var xhr = new XMLHttpRequest();
		xhr.open("POST", "/d", true);
		xhr.onreadystatechange = function(){
			if (xhr.readyState == 4){
				var nid = xhr.responseText;
				url = url + '%3Fid%3D' + nid ;
				window.location = url; 
				//var newWindow = window.open(url, "share"); 
				id = nid;
			}
		}
		xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
		var params = "xy=" + doodle;

		xhr.send(params);
	}
}


viewer.isShowingSettings = false;
viewer.showSettings = function(on) {
    if (on == undefined)
        on = !viewer.isShowingSettings;
    if (on) {
        viewer.showColors(false);
        //viewer.showShare(false);
    }
    if (on != viewer.isShowingSettings)
        viewer.animateSettings(on);

    viewer.isShowingSettings = on;
};

viewer.isShowingColors = false;
viewer.showColors = function(on) {
    if (on == undefined)
        on = !viewer.isShowingColors;
    if (on) {
        viewer.showSettings(false);
//        viewer.showShare(false);
    }
    if (on != viewer.isShowingColors)
        viewer.animateColors(on);

    viewer.isShowingColors = on;
}


viewer.animateColors = function(on, status) {
    if (status == undefined) {
        status = {
            started : (new Date).getTime(),
            duration : 400,
            left : -160
        };
    }
    var percentIn = (Date.now() - status.started) / status.duration;

    var newLeft = status.left * percentIn;
    if (on)
        newLeft = Math.min(0, status.left + (-1 * newLeft));

    viewer.colorPanel.style.left = newLeft + "px";
    if (percentIn < 1) {
        setTimeout(function() {
            viewer.animateColors(on, status);
        }, 50);
    }
}
viewer.animateSettings = function(on, status) {
    if (status == undefined) {
        status = {
            started : Date.now(),
            duration : 400,
            rightOn : 0,
            rightOff : -300
        };
    }
    var percentIn = (Date.now() - status.started) / status.duration;

    var newRight = status.rightOff * percentIn;
    if (on)
        newRight = Math.min(0, status.rightOff + percentIn
                * (status.rightOn - status.rightOff));

    viewer.settings.style.right = newRight + "px";
    if (percentIn < 1) {
        setTimeout(function() {
            viewer.animateSettings(on, status);
        }, 50);
    }
};


viewer.animateDialog = function(dialog, on, status) {
    if (status == undefined) {
        status = {
            started : Date.now(),
            duration : 400,
            rightOn : 0,
            rightOff : -300
        };
        if (on) {
            dialog.style.visibility = "visible";
        }
    }
    var percentIn = (Date.now() - status.started) / status.duration;

    dialog.style.opacity = on ? percentIn : 1 - percentIn;

    if (percentIn < 1) {
        setTimeout(function() {
            viewer.animateDialog(dialog, on, status);
        }, 50);
    } else if (!on) {
        dialog.style.visibility = "hidden";
    }
};


viewer.setup();
viewer.setCanvasSize();

document.getElementById("settings-button").onclick = function() {
    viewer.showSettings();
};
document.getElementById("settings-close-button").onclick = function() {
	viewer.showSettings(false);
};
document.getElementById("colors-button").onclick = function() {
	viewer.showColors();
};

document.getElementById("undo-button").onclick = function() {
	undoButton();
};
document.getElementById("clear-button").onclick = function() {
	clearButton();
};

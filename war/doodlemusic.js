var acontext;
var mobile = false;
var hasAudio = false;
//window.addEventListener('load', init, false);
function Monadaphone(groove) {
	mobile =  (document.getElementById("ismobile").clientWidth == 10);

	try {
		acontext = new webkitAudioContext();
		hasAudio = true;
	}
	catch(e) {
	}

	if (groove == null){
		var groove = getDefaultGroove();
	}

	// and have another object that can play it
	player = {
		groove: undefined,
		canvas: document.getElementById("mainCanvas"),
		channels: [],
		playing: false,
		currentColor: -1,
		tool: 0,
		loadGroove: function(groove){
			this.groove = groove;
			setupPxData();
			tool.drawnPaths = groove.channels.length;
		},
		aColors: ["#FFFFFF", "#FF0000", "#FFFF00", "#00FF00", "#0000FF", 
		"#FF8000", "#9E9E9E", "#00FFFF", "#800080", "#632DFF", "#63FF08"],
		defaultGain: 0.4,
		playPressed: 0,
		storedParts: [], 
		mutating:false,
		playLevel: 0
	};
	setupCanvas();

	player.loadGroove(groove);

	chooseColor(7);

	window.requestAnimFrame = (function(callback) {
		return window.requestAnimationFrame || 
		window.webkitRequestAnimationFrame || 
		window.mozRequestAnimationFrame || 
		window.oRequestAnimationFrame || 
		window.msRequestAnimationFrame || 
		function(callback) {
		    window.setTimeout(callback, 1000 / 60);
		};
	})();

	draw();

// TODO
//	var showingNewInputs = false;
//	var gallery;
	if (!mobile){
		loadGallery();
	}

}




function getInstrumentInfo(color){
    var instrumentType = 0;
    var ldelay = false;
	var softEnvelope = false; // TODO slow attack and sustain if true
    if (color == 0) {
		ldelay = true;
		softEnvelope = true;
    } 
    else if (color == 1) {
    } 
    else if (color == 2) {
		softEnvelope = true;
		instrumentType = 1;
    } 
    else if (color == 3) {
		instrumentType = 1;
    } 
    else if (color == 4) {
		softEnvelope = true;
		instrumentType = 1;
    } 
    else if (color == 5) {
		instrumentType = 1;
    } 
    else if (color == 6) {
		softEnvelope = true;
		instrumentType = 1;
		ldelay = true;
    } 
    else if (color == 7) {
		softEnvelope = true;
		instrumentType = 2;
    } 
    else if (color == 8) {
		instrumentType = 2;
    } 
    else if (color == 9) {
		instrumentType = 2;
		ldelay = true;
		softEnvelope = true;    } 
    else if (color == 10) {
	instrumentType = 2;
	ldelay = true;
    } 
	return {type: instrumentType, delay: ldelay, soft: softEnvelope};
}



function play() {
	if (hasAudio){
		verifyData();  
	    for (var iline = 0; iline < player.groove.channels.length; iline++){
			if (player.channels[iline] == undefined){
			
				var data = makeFreqsAndTimesFromSegments(player.groove.channels[iline].data);
				var chan = makeNewChannel(player.groove.channels[iline].instrument);
				chan.freqs = data[0];
				chan.times = data[1];
				player.channels[iline] = chan;
			}
	    }
	}
	else {
		playWithAudioElement(player.groove);
	}
    
    player.loopStarted = (new Date).getTime();
    player.playing = true;

    if (hasAudio){
    	player.playLevel++;
        for (var iline = 0; iline < player.channels.length; iline++){
    		goTime(player.channels[iline]);
    	}
    }
    var pl = player.playLevel;
    setTimeout(function(){resetChannels(pl)}, player.groove.duration);
}

function resetChannels(pl){
	if (!player.playing || player.playLevel > pl){
		return;
	}

    player.loopStarted = (new Date).getTime(); // or loopStarted + duration?
    if (hasAudio){
    	for (var iline = 0; iline < player.channels.length; iline++){
    		player.channels[iline].mute();
    		player.channels[iline].i = 0;			
    		if (player.channels[iline].finishedLoop){
    			player.channels[iline].finishedLoop = false;
    			goTime(player.channels[iline]);
    		}
    	}    	
    }
	setTimeout(function(){
		resetChannels(pl)
	}, player.groove.duration);
}

function goTime(chan){

	if (chan.finish){
		chan.mute();
//		chan.volume.disconnect(acontext.destination);
//		chan.delayGain.disconnect(acontext.destination);
		chan.osc.noteOff(0);
		return;
	}
	if (!player.playing){
		return;
	}
	var now = (new Date).getTime() - player.loopStarted;
	var nowP = (now / player.groove.duration) ;

	if (chan.i == -1){
		for (var it = 0; it < chan.times.length; it++){
			if (chan.times[it] < nowP){
				chan.i = it;
			}
		}
	}
	if (chan.times.length > chan.i){
		var freq = chan.freqs[chan.i];
		if (freq == -1){
			chan.mute();
			chan.i++;
		}
		else {
			if (chan.times[chan.i] < nowP){
				if (chan.muted){
					chan.unmute();
				}
				if (chan.osc.frequency.value != chan.freqs[chan.i]){
					chan.osc.frequency.setValueAtTime(chan.freqs[chan.i], 0);
					//experiment chan.osc.noteOn(0);

				}
				chan.i++;						 
			}
		}
		setTimeout(function(){goTime(chan)}, 
			chan.times.length > chan.i ? (chan.times[chan.i] - nowP) * player.groove.duration : 0);
	}
	else {
		chan.finishedLoop = true;
		chan.mute();
	}
}





// these two functions are translated from Adam Smith's Android code
function buildScale(quantizerString) {
    if (quantizerString != null && quantizerString.length > 0) 
    {
        var parts = quantizerString.split(",");
        var scale = []; //new float[parts.length];
        for (var i = 0; i < parts.length; i++) {
            scale[i] = parseFloat(parts[i]);
        }
        return scale;
    } else {
        return null;
    }
}
function buildFrequency(scale, octaves, input, base) {
    input = Math.min(Math.max(input, 0.0), 1.0);
    var mapped = 0;
    if (scale == null) {
        mapped = base + input * octaves * 12.0;
    } else {
        var idx = Math.floor((scale.length * octaves + 1) * input);
        mapped = base + scale[idx % scale.length] + 12 * Math.floor(idx / scale.length);
    }
    return Math.pow(2, (mapped - 69.0) / 12.0) * 440.0;
}


//animation stuffs
function animate(lastTime, myRectangle) {
	var xsize = player.xsize;
	var ysize = player.ysize;
    if (!player.playing){
		return;
	}
    var canvas = document.getElementById("mainCanvas");
	var context = canvas.getContext("2d"); 
    draw();

    context.beginPath();
    context.moveTo(player.loopStartSize, 0);
    context.lineTo(player.loopStartSize, ysize);
    context.closePath();
    context.strokeStyle = "#8ED6FF";
    context.stroke();

    context.beginPath();
    context.moveTo(player.stopLine, 0);
    context.lineTo(player.stopLine, ysize);
    context.closePath();
    context.strokeStyle = "#8ED6FF";
    context.stroke();

    // update
    var nowInLoop = (new Date).getTime() - player.loopStarted; 
    var newX = player.loopStartSize + (nowInLoop / player.groove.duration) * player.loopSize;
    myRectangle.x = newX;
    context.beginPath();
    context.rect(myRectangle.x, myRectangle.y, myRectangle.width, myRectangle.height);
    context.closePath();
    
    context.fillStyle = "#8ED6FF";
    context.fill();
    context.lineWidth = myRectangle.borderWidth;
    context.strokeStyle = "black";
    context.stroke();

    // request new frame
    requestAnimFrame(function() {
        animate(lastTime, myRectangle);
    });
}

function playButton(){
	var button = document.getElementById("play_button");
	if (button.innerHTML == "Stop"){
		playing = false;
		stop();
	}
	else {
		button.style.background = "#FF66FF";
		button.innerHTML = "Stop";

        player.loopStarted = 0;
		play();

    var myRectangle = {
        x: 0,
        y: 0,
        width: 4,
        height: player.ysize,
        borderWidth: 2
    };
    
    animate((new Date()).getTime(), myRectangle);
	}
}

function draw(){

	var canvas = document.getElementById("mainCanvas");
    var context = canvas.getContext("2d");
	context.lineWidth = 4;
    context.clearRect(0, 0, canvas.width, canvas.height);
    for (var il = 0; il < player.channels.length; il++) {
		var data = player.channels[il].pxdata;
        context.beginPath();
        context.moveTo(data[0][0], data[0][1]);
        context.strokeStyle = player.aColors[player.groove.channels[il].instrument];
        

	for (var is = 1; is < data.length; is++) {

        if (data[is][1] > -1) {
          context.lineTo(data[is][0], data[is][1]);                
		  context.moveTo(data[is][0], data[is][1]);
		}
		else if (is + 1 < data.length) {
			context.moveTo(data[is + 1][0], data[is + 1][1]);
		}
	}
	context.stroke();
	context.closePath();
  
    }

}


function tool_pencil () {
  var context = document.getElementById("mainCanvas").getContext("2d");	
  var tool = this;
  this.started = false;
  this.lastX = -1;
  this.lastY = 0;
  this.lastColor = -1;
  this.drawnSegments = 0;
  this.drawnPaths = 0; 
  this.looperCounter = 0;
  this.continuingOn = false;
  this.lastUp = 0;


	this.touchstart = function (ev) {
		ev.preventDefault(); 
		x = ev.targetTouches[0].pageX - player.canvas.offsetLeft;
		y = ev.targetTouches[0].pageY - player.canvas.offsetTop;
		tool.start(x, y);
	}
	this.touchmove = function (ev) {
		ev.preventDefault(); 
		x = ev.targetTouches[0].pageX - player.canvas.offsetLeft;
		y = ev.targetTouches[0].pageY - player.canvas.offsetTop;
		tool.move(x, y);
	}
	this.touchend = function (ev) {
		ev.preventDefault(); 
		tool.end();
	}

	this.mousedown = function (ev) {
		x = ev.pageX - player.canvas.offsetLeft;
		y = ev.pageY - player.canvas.offsetTop;
		tool.start(x, y);
	}
	this.start = function(x, y){
		if (!player.playing){
		  context.strokeStyle = player.aColors[player.currentColor];
		  context.beginPath();
		  context.moveTo(x, y);
		}
      tool.started = true;

		if (tool.drawnPaths == 0){
			tool.loopCounter = (new Date).getTime();
			tool.lowX = x;
			tool.highX = x;
		}
	  if (tool.lastUp > 0 && (new Date).getTime() - tool.lastUp < 500 && tool.lastX > -1 && tool.lastX <= x && player.currentColor == tool.lastColor){
	  	tool.drawnPaths = tool.drawnPaths - 1;
	    tool.continuingOn = true;
		tool.currentChannel.unmute(); 
		if (tool.drawnPaths == 0){
//			player.running = false;			
		}
	  }
	  else {
		tool.continuingOn = false;
	    tool.drawnSegments = 0;
      	segments = [];

		if (hasAudio){
			tool.currentChannel = makeNewChannel(player.currentColor);
			player.channels[tool.drawnPaths] = tool.currentChannel;
		}
		else {
			tool.currentChannel = {freqs:[],times:[]};
			player.channels[tool.drawnPaths] = tool.currentChannel;
		}
  	  }
	  if (hasAudio){
		  tool.currentChannel.unmute(); 
		  var freq = makeFrequency(y);
		  tool.currentChannel.freqs[tool.drawnSegments] = freq;
		  tool.currentChannel.osc.frequency.setValueAtTime(freq, 0);
    	}

      tool.lastX = x;
      tool.lastY = y;


      segments[tool.drawnSegments] = [x, y];
      tool.drawnSegments++;

      player.groove.channels[tool.drawnPaths] = {instrument: player.currentColor};
	  tool.currentChannel.pxdata = segments;

	  onEdit();
  };

  this.mousemove = function (ev) {
    x = ev.pageX - player.canvas.offsetLeft;
    y = ev.pageY - player.canvas.offsetTop;
	tool.move(x, y);
	}

  this.move = function(x, y){

    if (tool.started) {
		if (!player.playing){
		  context.lineTo(x, y);
		  context.moveTo(x, y);
		  context.stroke();
		}
      segments[tool.drawnSegments] = [x, y];

	  var freq  = makeFrequency(y);
      tool.currentChannel.freqs[tool.drawnSegments] = freq;
	  if (hasAudio){
		  tool.currentChannel.osc.frequency.setValueAtTime(freq, 0);
	  }
      
		if (tool.drawnPaths == 0){
			if (tool.lowX > x){
				tool.lowX = x
			}
			if (tool.highX < x){
				tool.highX = x
			}
		}
      tool.lastX = x;
      tool.lastY = y;
      tool.drawnSegments++;
    }
  };

  this.mouseup = function (ev) {
	ev.preventDefault(); 
    x = ev.pageX - player.canvas.offsetLeft;
    y = ev.pageY - player.canvas.offsetTop;
	tool.end(x, y);
	}

  this.end = function (){
    if (tool.started) {
		if (!player.playing){
	      context.closePath();
		}

      tool.started = false;

      segments[tool.drawnSegments] = [tool.lastX, -1];

      tool.currentChannel.freqs[tool.drawnSegments] = -1;
      if (hasAudio){
          tool.currentChannel.mute();    	  
      }

	  tool.drawnSegments++;
	  tool.lastColor = player.currentColor;
      player.channels[tool.drawnPaths] = tool.currentChannel;
      player.channels[tool.drawnPaths].pxdata= segments;


		if (tool.drawnPaths == 0){
			if (tool.lowX > x){
				tool.lowX = x
			}
			if (tool.highX < x){
				tool.highX = x
			}
			tool.lastUp = (new Date).getTime();
			player.groove.duration = tool.lastUp - tool.loopCounter;
			player.groove.startLine = tool.lowX / player.xsize;
			player.groove.lineLength = (tool.highX - tool.lowX) / player.xsize;
			player.loopSize = player.groove.lineLength * player.xsize;
			player.loopStartSize = player.groove.startLine * player.xsize;
			player.stopLine = player.loopStartSize + player.loopSize;
			if (hasAudio && !tool.continuingOn){
				playButton();
			}
		}

	    for (var iseg = 0 ; iseg < segments.length; iseg++){
            tool.currentChannel.times[iseg] = (segments[iseg][0]/player.xsize - player.groove.startLine) / player.groove.lineLength;
        }
		goTime(tool.currentChannel);

      tool.drawnPaths++;
    }
  };
}

function makeNewChannel(color){
		var info = getInstrumentInfo(color);
		var chan = {osc: acontext.createOscillator(),
			freqs: [],
			times: [],
			pxdata: [],
			i: 0,
			muted: true,
			finishedLoop: false, 
			volume: acontext.createGainNode(), 
			delay: acontext.createDelayNode(),
			delayGain: acontext.createGainNode(),
			mute: function(){
				this.muted = true;
				this.volume.gain.value = 0;
			},
			unmute: function(){
				this.muted = false;
				this.volume.gain.value = player.defaultGain / (info.soft ? 2 : 1);
			}
		}
		chan.osc.type = info.type;


		/* ugh , the wet sounds ok, but somehow its distorting or doubling the dry signal
		 * although it seems ok on iphone?
		 * */
		chan.osc.connect(chan.volume);		
		
		if (info.delay){
			chan.delay.delayTime.value = 0.5;
			chan.volume.connect(chan.delay);
			chan.delay.connect(chan.delayGain);
			chan.delayGain.connect(acontext.destination);
		}

		chan.volume.gain.value = 0; //player.defaultGain;
		chan.volume.connect(acontext.destination);
		
		chan.osc.frequency.value = 0;
		chan.osc.noteOn(0);

		return chan;
}

function chooseColor(color){
  var offs = 5;
  if (player.currentColor > -1){ 
  var oldColor = document.getElementById("color-" + player.currentColor);
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
  player.currentColor = color;


}
var firstClear = true;
function clearButton(){
   stop();
   var oldgroove = player.groove;
   player.groove = {id:-1,
	duration: 2000, 
   	lineLength:1, 
   	channels: [],
   	base: parseInt(document.getElementById("base").value ), 
   	octaves: parseInt(document.getElementById("octaves").value )
   	 };
   player.groove.scale = oldgroove.scale;
   player.groove.ascale = oldgroove.ascale;
   player.channels = [];
//   groove.segments = []
   draw();
   tool.drawnPaths = 0;
   tool.drawnSegments = 0;
//   player.loopSize = xsize;
//   player.loopStartSize = 0;
//   player.groove.startLine = 0;
//   player.groove.lineLength = 1;
//   groove.stopLine = 1;
//   document.getElementById("currentArtist").innerHTML  = "";
//   document.getElementById("currentGroove").innerHTML  = "";

	if (mobile){
		document.getElementById("share_dialog").style.visibility = "hidden";
	}
	else{
		document.getElementById("share_dialog").style.visibility = "visible";
	}
	document.getElementById("share_button").style.visibility = "hidden";
    document.getElementById("new_groove").value = "new groove";
    var newartist = document.getElementById("new_artist");
    if (newartist.value.indexOf("&") != -1){
    	newartist.value = newartist.value.substr(0, newartist.value.indexOf("&"));
    	
    }

	if (firstClear){
		document.getElementById("octaves").value = 4;
		document.getElementById("base").value = 36;
		player.groove.base = 36;
		player.groove.octaves = 4;
		firstClear = false;
	}
}

function stop(){
	// TODO something still squirrelly in here when played a second time
	if (hasAudio){
		if (player.channels.length != undefined){
			for (var iaudio = 0; iaudio < player.channels.length; iaudio++){
				player.channels[iaudio].volume.gain.value = 0;
				player.channels[iaudio].muted = true;
				player.channels[iaudio].i = 0;
			}
		}
	}
	else {
		try{
			if (aaudio != undefined){
			    for (iline = 0; iline < aaudio.length; iline++){
			        aaudio[iline].pause();
			    }
			}
		}
		catch (e) {}
	}
	
	player.playing = false;
	showPlayButton();	
}
function showPlayButton(){
	var button = document.getElementById("play_button");
	button.style.background = "#00FF00";
	button.innerHTML = "Play!";
	player.playing = false;
}
//mikewashere
function makeFreqsAndTimesFromSegments(segments){
    var ii = 0;
    var currentDur = 0;
    var freqs = new Array;
    var times = new Array;
    debugsegments = segments;
    for (var iseg = 0 ; iseg < segments.length; iseg++){

            //convert this into a duration
            currentDur = (segments[iseg][0] - player.groove.startLine) / player.groove.lineLength;

            // convert this into a frequency
            var y = segments[iseg][1];
            var freq = 0;
            if (y == -1) {
                freq = -1;
            } 
            else {
                freq = buildFrequency(player.groove.ascale, player.groove.octaves, 1 - y, player.groove.base);
            }

            times[ii] = currentDur;
            freqs[ii] = freq;
            ii++;

        }

    return [freqs, times];
}

function play_down(){
   var playB = document.getElementById("play_button");
   if (playB.innerHTML != "Stop"){
   //   playB.innerHTML = "(adjusting speed)";
      player.playPressed = (new Date).getTime();
   }
}
function play_up(){
   if (player.playPressed > 0){
      	//the scale might be updated
		// should really do this when the <select> changes
		player.groove.ascale = buildScale(document.getElementById("scale").value);
		player.groove.octaves = parseInt(document.getElementById("octaves").value);
		player.groove.base = parseInt(document.getElementById("base").value);
      
      var pressLength = (new Date).getTime() - player.playPressed;
      if (pressLength > 1000){
          player.groove.duration = pressLength;
      }

      playButton();
      player.playPressed = 0;
   }
   else if (document.getElementById("play_button").innerHTML == "Stop"){
       stop();
   }

}


function shareButton(){
	if (mobile){
		var sd = document.getElementById("share_dialog");
		if (sd.style.visibility == "visible"){
			sd.style.visibility = "hidden";

		}
		else {
			sd.style.visibility = "visible";
		}
	}
	else {
		okShareButton();
	}
}

function okShareButton(){

	var url;
	//stop();
	if (player.groove.channels.length > 0){
		if (player.groove.id > -1 ){
			url = 'http://www.facebook.com/sharer/sharer.php?u=http%3A%2F%2Fcloudmusiccompany.appspot.com%2Fwatch.jsp%3Fid%3D' +
					player.groove.id + "&t=MonadPad";
			//var newWindow = window.open(url, "share"); 
			window.location = url; 
		}
		else {
			var json = []
			verifyData();
			var xhr = new XMLHttpRequest();
			xhr.open("POST", "/grooves", true);
			xhr.onreadystatechange = function(){
				if (xhr.readyState == 4){
					var id = xhr.responseText.split(";")[1];
					url = 'http://www.facebook.com/sharer/sharer.php?u=http%3A%2F%2Fcloudmusiccompany.appspot.com%2Fwatch.jsp%3Fid%3D' +
						id + "&t=MonadPad";
					window.location = url; 
					//var newWindow = window.open(url, "share"); 
					player.groove.id = id;
				}
			}
			xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
			var params = "artist=" + document.getElementById("new_artist").value +
				"&name=" +  document.getElementById("new_groove").value +
				"&json=" + JSON.stringify(player.groove);
			
			xhr.send(params);
		}
	}
}


function loadGallery(){
	xhr = new XMLHttpRequest();
	xhr.open("GET", "/gallery", true);
	xhr.onreadystatechange = function(){
		if (xhr.readyState == 4){
			var responseText = xhr.responseText;
			gallery = eval(responseText);
			var galldiv = document.getElementById("gallerylist");
			galldiv.innerHTML = "";
			for (var ig = 0 ; ig < gallery.length; ig++){
				var newItem = document.createElement("div");
				newItem.innerHTML = "<div onclick='loadFromGallery(" + ig + ")' class='galleryItem'><canvas id='canvas" + ig + 
					"' class='gcanvas'></canvas><div class='grooveName'>" + 
					gallery[ig].name + "</div><div class='artistName'>" + 
					gallery[ig].artist + "</div></div>";
				galldiv.appendChild(newItem);

				if (gallery[ig].json.channels == undefined){
					//old format
					debugjson2 = gallery[ig].json;
					gallery[ig].json = loadOldGroove(gallery[ig].json);					 
					
				}
				//gallery[ig].json = loadOldGroove(s);
				drawGallery(ig, gallery[ig].json);					
			}
		}
	}
	xhr.send(null);
	document.getElementById("parts_button").style.borderWidth = "0px";
	document.getElementById("recently_shared_button").style.borderWidth = "3px";

}

function loadFromGallery(g){

    clearButton();
	currentGallery = g;
    document.getElementById("currentGroove").innerHTML = gallery[g].name;
    document.getElementById("currentArtist").innerHTML = gallery[g].artist;
    document.getElementById("share_button").style.visibility = "visible";

    //if (showingNewInputs){
	    document.getElementById("share_dialog").style.visibility = "hidden";
    	//document.getElementById("newArtist").style.visibility = "hidden";
   // 	showingNewInputs = false;
   // }
    document.getElementById("currentGroove").scrollIntoView(false);
    
    player.groove = gallery[g].json;
    if (player.groove.id == undefined || player.groove.id == -1){
    	player.groove.id  = gallery[g].id;
    }
    document.getElementById("scale").value = player.groove.ascale + "";
    document.getElementById("octaves").value = parseInt(player.groove.octaves);
    document.getElementById("base").value = parseInt(player.groove.base);
    
    
	setupPxData();
	tool.drawnPaths = player.groove.channels.length;	
	draw(); 	

}

function drawGallery(id, sjson){
	var cg = document.getElementById("canvas" + id);
	cg.height = 80;
	cg.width = 100;
	var cgx = cg.getContext("2d");
	cgx.lineWidth = 4;
//    cgx.clearRect(0, 0, cg.width, cg.height);
	var json = sjson;
	if (json.channels == undefined){
		json = JSON.parse(sjson);
	}
    for (var il = 0; il < json.channels.length; il++) {
		var data = json.channels[il].data;
        cgx.beginPath();
        cgx.moveTo(data[0][0] * 100, data[0][1] * 80);
        cgx.strokeStyle = player.aColors[json.channels[il].instrument];
        

		for (var is = 1; is < data.length; is++) {

	        if (data[is][1] > -1) {

	          cgx.lineTo(data[is][0]  * 100, data[is][1] * 80);                
			  cgx.moveTo(data[is][0] * 100, data[is][1] * 80);

		}
		else if (is + 1 < data.length) {

			cgx.moveTo(data[is + 1][0] * 100, data[is + 1][1] * 80);
		}
	}
	cgx.closePath();
	cgx.stroke();
  
    }

}

function onEdit(){
	document.getElementById("share_button").style.visibility = "visible";

  var sd = document.getElementById("share_dialog");
  var newArtist = document.getElementById("new_artist");
  var newGroove = document.getElementById("new_groove");
  
    if (player.groove.id > -1){
    	// TODO
    	newGroove.value = document.getElementById("currentGroove").innerHTML + String.fromCharCode(65 + Math.floor(Math.random() * 26)) + String.fromCharCode(65 + Math.floor(Math.random() * 26)); 
    	if (newArtist.value != document.getElementById("currentArtist").innerHTML){
			newArtist.value = newArtist.value + "&" + document.getElementById("currentArtist").innerHTML;
    	}
    	player.groove.id = -1;
    }
    if (!mobile){
    	sd.style.visibility = "visible";
    }

}

function verifyData(){
	for (var ip = 0; ip < player.groove.channels.length; ip++){
		if (player.groove.channels[ip].data == undefined){
			var newData = [];
			for (var is = 0; is < player.channels[ip].pxdata.length; is++){
				var newY = player.channels[ip].pxdata[is][1];
				if (newY != -1){ 
					newY = newY / player.ysize;
				}
				newData[is] = [player.channels[ip].pxdata[is][0] / player.xsize, newY];
			}
			player.groove.channels[ip].data = newData;
		}
	}
}

function setupPxData(){
	var groove = player.groove;
	var xsize = player.xsize;
	var ysize = player.ysize;
	for (var ip = 0; ip < groove.channels.length; ip++){
		var newData = [];
		var newInfo = [];
		for (var is = 0; is < groove.channels[ip].data.length; is++){
			newInfo[is] = [groove.channels[ip].data[is][0], groove.channels[ip].data[is][1]];
			var newY = newInfo[is][1];
			if (newY != -1){ 
				newY = newY * ysize;
			}
			newData[is] = [groove.channels[ip].data[is][0] * xsize, newY];
		}
		if (player.channels[ip] == undefined){
			player.channels[ip] = hasAudio ? makeNewChannel(groove.channels[ip].instrument) : {};
		}
		player.channels[ip].pxdata = newData;

		var data = makeFreqsAndTimesFromSegments(player.groove.channels[ip].data)
		player.channels[ip].freqs = data[0];
		player.channels[ip].times = data[1];
		if (hasAudio){
			player.channels[ip].osc.frequency.setValueAtTime(player.channels[ip].freqs[0], 0);
		}
	}
	player.loopSize = groove.lineLength * xsize;
	player.loopStartSize = groove.startLine * xsize;
	player.stopLine = player.loopSize + player.loopStartSize;

}

function makeFrequency(y){

	return buildFrequency(player.groove.ascale, player.groove.octaves, 1 - y / player.ysize, player.groove.base);
}

function getDefaultGroove(){
return {id:1, duration:2815, startLine:0.031231694, lineLength:0.72873956, ascale:[0, 2, 4, 5, 7, 9, 11], octaves:4, base:24,  channels:[{instrument:5, data:[[0.031231694, 0.662798], [0.06558655, 0.662798], [0.07599712, 0.662798], [0.08848979, 0.662798], [0.09890036, 0.662798], [0.10202353, 0.662798], [0.10618776, 0.662798], [0.10826987, 0.662798], [0.113475166, 0.662798], [0.115557276, 0.662798], [0.115557276, 0.662798], [0.11588284, "-1.0"], [0.19988284, 0.49652153], [0.20925233, 0.49652153], [0.2154987, 0.49652153], [0.23007347, 0.5011084699999999], [0.23840192, 0.5056953399999999], [0.25297672, 0.5148692], [0.2602641, 0.5183093999999999], [0.27379784, 0.5183093999999999], [0.28108522, 0.5183093999999999], [0.2935779, 0.5102823400000001], [0.2987832, 0.5056953399999999], [0.30190638, 0.5011084699999999], [0.30711165, 0.4953748], [0.30711165, 0.4953748], [0.30711165, "-1.0"], [0.40392992, 0.78205836], [0.41225836, 0.78205836], [0.41850466, 0.78205836], [0.4257921, 0.78205836], [0.4393258, 0.78205836], [0.44869533, 0.78205836], [0.4570238, 0.78205836], [0.46639332, 0.78205836], [0.4695165, 0.78205836], [0.47263962, 0.78205836], [0.4757628, 0.78779197], [0.47784492, 0.7923789], [0.48200917, 0.80269957], [0.48200917, 0.80269957], [0.48200917, "-1.0"], [0.56112945, 0.63068944], [0.56112945, 0.63068944], [0.5663347, 0.63068944], [0.57153994, 0.63068944], [0.5757042, 0.63527632], [0.58090955, 0.63871652], [0.5840327, 0.64215672], [0.5861148, 0.6467436], [0.5892379, 0.65018392], [0.5913201, 0.65133065], [0.5934022, 0.65133065], [0.5944432, 0.6536240600000001], [0.5954843, 0.65247738], [0.5954843, 0.65247738], [0.5954843, "-1.0"], [0.75997126, 0.63183612], [0.75997126, 0.63183612], [0.75997126, 0.63183612]]}, {instrument:1, data:[[0.497625, 0.2339194], [0.497625, 0.22589230000000005], [0.497625, 0.21901183999999996], [0.5069945, 0.20869130000000002], [0.5246924, 0.18346304000000002], [0.535103, 0.16740880000000002], [0.535103, 0.16740880000000002], [0.535103, "-1.0"], [0.5673757, 0.22359883999999997], [0.5673757, 0.21327819999999997], [0.5788274, 0.18919677000000001], [0.5840327, 0.17658269999999998], [0.5840327, 0.17658269999999998], [0.5840327, "-1.0"], [0.6277571, 0.23965309999999995], [0.6392086, 0.21671839999999998], [0.6392086, 0.21671839999999998]]}, {instrument:0, data:[[0.22070397, 0.07796353], [0.22070397, 0.07796353], [0.22070397, 0.07796353], [0.22903244, 0.07796353], [0.23840192, 0.09057760000000004], [0.2488125, 0.10548513999999998], [0.25297672, 0.11351233999999999], [0.258182, 0.11695259999999996], [0.26651046, 0.1100721], [0.27171573, 0.09401780000000004], [0.27379784, 0.08025700000000002], [0.276921, 0.07452329999999996], [0.27796206, 0.07222989999999996], [0.2790031, 0.07108320000000001], [0.28004417, 0.06993645000000004], [0.28108522, 0.07337665999999998], [0.28524947, 0.08828413000000002], [0.28420845, 0.1066319], [0.2914958, 0.1100721], [0.2967011, 0.10433840000000005], [0.3081527, 0.09631133000000003], [0.3081527, 0.09631133000000003]]}, {instrument:6, data:[[0.6277571, 0.059615850000000026], [0.6277571, 0.059615850000000026], [0.6371265, 0.059615850000000026], [0.6444139, 0.059615850000000026], [0.6527423, 0.059615850000000026], [0.6548245, 0.059615850000000026], [0.66002977, 0.06993645000000004], [0.6673172, 0.09401780000000004], [0.6725225, 0.10548513999999998], [0.67980987, 0.11465910000000001], [0.69438463, 0.11924599999999996], [0.70687735, 0.1100721], [0.72873956, 0.08140380000000003], [0.7401912, 0.061909259999999966], [0.7401912, 0.061909259999999966]]}]};
//	return {id:1, duration:2815, startLine:0.031231694, lineLength:0.72873956, ascale:[0, 2, 4, 5, 7, 9, 11], octaves:4, base:24,  channels:[]};
}

function setupCanvas(){
	var c = document.getElementById("mainCanvas");

	player.xsize = c.clientWidth;
	player.ysize = c.clientHeight;
	c.width = player.xsize;
	c.height = player.ysize;

	var hasTouch = 'ontouchstart' in window || 'createTouch' in document,
	eventStart = hasTouch ? 'touchstart' : 'mousedown',
	eventMove = hasTouch ? 'touchmove' : 'mousemove',
	eventEnd = hasTouch ? 'touchend' : 'mouseup';

	tool = new tool_pencil();

	// Attach the mousedown, mousemove and mouseup event listeners.
	c.addEventListener("mousedown", tool.mousedown, false);
	c.addEventListener("mousemove", tool.mousemove, false);
	c.addEventListener("mouseup",   tool.mouseup, false);
	c.addEventListener("touchstart", tool.touchstart, false);
	c.addEventListener("touchmove", tool.touchmove, false);
	c.addEventListener("touchend",   tool.touchend, false);


	var context = c.getContext("2d");
	context.lineWidth = 6;

}

function loadOldGroove(info){

	// if we are pre-loading this groove, player might not be made yet
	var xsize, ysize;
	var c = document.getElementById("mainCanvas");
	xsize = c.clientWidth;
	ysize = c.clientHeight;

	//shouldnt need 'paths' global variable
	var paths = [];
	var ogroove = {};
	
	// split this
	var as = info.split(":");
	var aline1 = as[0].split(";");
	
	ogroove.duration = parseInt(aline1[0]);
	ogroove.startLine = parseFloat(aline1[1]);
	ogroove.lineLength = parseFloat(aline1[2]);
	ogroove.stopLine = (ogroove.startLine + ogroove.lineLength) * xsize;
	
	ogroove.timeLoopStarted = 0;
	
	
	// build the scale
	var scale = aline1[3];
	ogroove.ascale = buildScale(scale);
	ogroove.octaves = parseInt(aline1[4]);
	ogroove.base = parseInt(aline1[5]);

	ogroove.loopSize = ogroove.lineLength * xsize;
	ogroove.loopStartSize = ogroove.startLine * xsize;
	
	ogroove.aaudio = [];    

	for (var line = 1; line < as.length; line++) {
	    
	    var segment = as[line].split(";");
	    
	    var color = parseInt(segment[0]);
	    
	    var isX = true;
	    var freqs = [];
	    var times = [];
	    var ii = 0;
	    var currentDur = 0;
	    var lastFreq = 0;
	    var lastDur = 0;
	    var ipath = 0;
	    var isegments = [];
	    segments = [];
	    var addedTime = 0;
	    for (var i = 1; i < segment.length; i++) {
	        
	        if (isX) {
	            isX = false;
	        } 
	        else {
	            isX = true;
			    var y2 = parseFloat(segment[i]);
			    var y2size = y2;
				if (y2 != -1){
					y2 = (1 - segment[i]);
					y2size = y2 * ysize;
				}		

				isegments[ipath] = [parseFloat(segment[i-1]), y2];     
				segments[ipath] = [segment[i-1] * xsize, y2size];
					
				ipath++;
	        
	        }
			paths[line - 1] = {instrument: color, 
				data: isegments,
				pxdata: segments};

	    }
		ogroove.channels = paths;	
	}
	return ogroove;
}

function undoButton(){
	var newChannels = [];
	if (player.channels.length > 0){
		// TODO might need a noteOff() somewhere around here
		player.channels[player.channels.length - 1].finish = true;

		for (var i = 0; i < player.channels.length - 1; i++){
			newChannels[i] = player.channels[i];
		}
		player.channels = [];
		player.channels = newChannels;
		newChannels = [];
		for (var i = 0; i < player.groove.channels.length - 1; i++){
			newChannels[i] = player.groove.channels[i];
		}
		player.groove.channels = [];
		player.groove.channels = newChannels;
		tool.drawnPaths = tool.drawnPaths - 1;
		draw();
	}
}

function cancelShareButton(){
	document.getElementById("share_dialog").style.visibility = "hidden";

}





//////////////////////////////////////////////////////////////
// <audio> version
//
// I think the idea here, is accept a groove, and make a WAV

function playWithAudioElement(groove){
	verifyData();
	var aSamples = [];
	for (var ic = 0; ic < groove.channels.length; ic++){
		aSamples[ic] = makeSamples(groove, groove.channels[ic].instrument, 
			makeFnT(groove, groove.channels[ic].data));
	}
	playSamples(aSamples);
}

function saveButton(){

	verifyData();
	var aSamples = [];
	var sampleRate = 44100;
	for (var ic = 0; ic < player.groove.channels.length; ic++){
		aSamples[ic] = makeSamples(player.groove, player.groove.channels[ic].instrument, 
			makeFnT(player.groove, player.groove.channels[ic].data));
		
	    if (aSamples[ic].length == 0) {
	        alert("ERROR: No values in array 'samples'");
	        return;
	    }
	    normalize_invalid_values(aSamples[ic]); // keep samples between [-1, +1]
	    
	    var wave = new RIFFWAVE();
	    wave.header.sampleRate = sampleRate;
	    wave.header.numChannels = 1;
	    var samples2 = convert255(aSamples[ic]);
	    wave.Make(samples2);
	}

	//save uri is a global variable
	var newWindow = window.open(saveURI, "ringtone");
}



/* 
 * RIFFWAVE.js v0.02 - Audio encoder for HTML5 <audio> elements.
 * Copyright (C) 2011 Pedro Ladaria <pedro.ladaria at Gmail dot com>
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public License...
 */

var FastBase64 = {
    
    chars: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",
    encLookup: [],
    
    Init: function() {
        for (var i = 0; i < 4096; i++) {
            this.encLookup[i] = this.chars[i >> 6] + this.chars[i & 0x3F];
        }
    },
    
    Encode: function(src) {
        var len = src.length;
        var dst = '';
        var i = 0;
        while (len > 2) {
            n = (src[i] << 16) | (src[i + 1] << 8) | src[i + 2];
            dst += this.encLookup[n >> 12] + this.encLookup[n & 0xFFF];
            len -= 3;
            i += 3;
        }
        if (len > 0) {
            var n1 = (src[i] & 0xFC) >> 2;
            var n2 = (src[i] & 0x03) << 4;
            if (len > 1)
                n2 |= (src[++i] & 0xF0) >> 4;
            dst += this.chars[n1];
            dst += this.chars[n2];
            if (len == 2) {
                var n3 = (src[i++] & 0x0F) << 2;
                n3 |= (src[i] & 0xC0) >> 6;
                dst += this.chars[n3];
            }
            if (len == 1)
                dst += '=';
            dst += '=';
        }
        return dst;
    } // end Encode

}

FastBase64.Init();

var RIFFWAVE = function(data) {
    
    this.data = []; // Byte array containing audio samples
    this.wav = []; // Array containing the generated wave file
    this.dataURI = ''; // http://en.wikipedia.org/wiki/Data_URI_scheme
    
    this.header = { // OFFS SIZE NOTES
        chunkId: [0x52, 0x49, 0x46, 0x46], // 0    4    "RIFF" = 0x52494646
        chunkSize: 0, // 4    4    36+SubChunk2Size = 4+(8+SubChunk1Size)+(8+SubChunk2Size)
        format: [0x57, 0x41, 0x56, 0x45], // 8    4    "WAVE" = 0x57415645
        subChunk1Id: [0x66, 0x6d, 0x74, 0x20], // 12   4    "fmt " = 0x666d7420
        subChunk1Size: 16, // 16   4    16 for PCM
        audioFormat: 1, // 20   2    PCM = 1
        numChannels: 1, // 22   2    Mono = 1, Stereo = 2, etc.
        sampleRate: 8000, // 24   4    8000, 44100, etc
        byteRate: 0, // 28   4    SampleRate*NumChannels*BitsPerSample/8
        blockAlign: 0, // 32   2    NumChannels*BitsPerSample/8
        bitsPerSample: 8, // 34   2    8 bits = 8, 16 bits = 16, etc...
        subChunk2Id: [0x64, 0x61, 0x74, 0x61], // 36   4    "data" = 0x64617461
        subChunk2Size: 0 // 40   4    data size = NumSamples*NumChannels*BitsPerSample/8
    };
    function u32ToArray(i) {
        return [i & 0xFF, (i >> 8) & 0xFF, (i >> 16) & 0xFF, (i >> 24) & 0xFF];
    }
    function u16ToArray(i) {
        return [i & 0xFF, (i >> 8) & 0xFF];
    }
    
    this.Make = function(data) {
        if (data instanceof Array)
            this.data = data;
        this.header.byteRate = (this.header.sampleRate * this.header.numChannels * 
        
        this.header.bitsPerSample) >> 3;
        this.header.blockAlign = (this.header.numChannels * this.header.bitsPerSample) >> 3;
        this.header.subChunk2Size = this.data.length;
        this.header.chunkSize = 36 + this.header.subChunk2Size;
        
        this.wav = this.header.chunkId.concat(
        u32ToArray(this.header.chunkSize), 
        this.header.format, 
        this.header.subChunk1Id, 
        u32ToArray(this.header.subChunk1Size), 
        u16ToArray(this.header.audioFormat), 
        u16ToArray(this.header.numChannels), 
        u32ToArray(this.header.sampleRate), 
        u32ToArray(this.header.byteRate), 
        u16ToArray(this.header.blockAlign), 
        u16ToArray(this.header.bitsPerSample), 
        this.header.subChunk2Id, 
        u32ToArray(this.header.subChunk2Size), 
        this.data
        );
        this.dataURI = 'data:audio/wav;base64,' + FastBase64.Encode(this.wav);
        saveURI = 'data:application/wav;base64,' + FastBase64.Encode(this.wav);
    };
    if (data instanceof Array)
        this.Make(data);
}; // end RIFFWAVE


// this sounds important
function makeSamples(groove, color, data){

	var oneSecond = 44100;
	var loop = false;
	var repeats = 4;
	var repeated = 0;
	var PI = Math.PI;

	var maxSamples = (groove.duration * oneSecond ) / 1000 ;	
    var instrumentType = "sin";
    var delay = false;
    if (color == 0) {
	delay = true;
    } 
    else if (color == 1) {
    } 
    else if (color == 2) {
	instrumentType = "sqr";
    } 
    else if (color == 3) {
	instrumentType = "sqr";
    } 
    else if (color == 4) {
	instrumentType = "sqr";
    } 
    else if (color == 5) {
	instrumentType = "sqr";
    } 
    else if (color == 6) {
	instrumentType = "sqr";
	delay = true;
    } 
    else if (color == 7) {
	instrumentType = "saw";
    } 
    else if (color == 8) {
	instrumentType = "saw";
    } 
    else if (color == 9) {
	instrumentType = "saw";
    } 
    else if (color == 10) {
	instrumentType = "saw";
    } 

    var freqs = data[0];
    var times = data[1];
	debugfreqs = freqs;
 	debugtimes = times;

    var samples = [];
    ii = 0;
    var tcounter = 0;
    for (var j = 0; j < freqs.length - 1; j++) {
		if (j == 0 && times[0] > groove.startLine){
			var freqDur = times[j] / groove.lineLength;
	        
			freqDur = freqDur * groove.duration;
			freqDur = freqDur * 44100;
			freqDur = Math.floor(freqDur / 1000);
	        
	        	for (var i = 0; i < freqDur; i++) {
	        	    var t = i / oneSecond; 
	        	    samples[ii] = 0;
	        	    ii++;
		        }
		}
        var frequency = freqs[j];
//	if (freqs.length > j + 1 && freqs[j + 1] == 0){
//		frequency = 0;
//	}

        var freqDur = times[j + 1] / groove.lineLength;
        
        freqDur = freqDur * groove.duration;
        freqDur = freqDur * 44100;
        freqDur = Math.floor(freqDur / 1000);

//    	for (var i = 0; i < freqDur; i++){
		var i = 0;
        while (true){
            var t = i / oneSecond; // time from 0 to 1
            if (frequency == 0){
                 samples[ii] = 0;
            }
		    else if (instrumentType == "sin"){
		            samples[ii] = Math.sin(frequency * 2 * PI * t); // wave equation (between -1,+1)
		    }
            else if (instrumentType == "sqr") {
			    if (Math.sin(frequency * 2 * PI * t) > 0){
					samples[ii] = 1; } else { samples[ii] = -1;
				}
		    }
            else if (instrumentType == "saw") {
            	samples[ii] = 1 - ((frequency*t)%1);
		    }
            samples[ii] = samples[ii] * 0.25;

			if (i >= freqDur){
				if (instrumentType == "sin"){
					if (samples[ii] == 0 || (samples[ii -1] < samples[ii] && samples[ii] < 0.01 && samples[ii] > -0.01)){
							break;
					}
				}
				else{
					break;
				}			
			}
            ii++;
            if (maxSamples > 0 && ii >= maxSamples){
				break;
		    }
		    i++;
        }
        if (maxSamples > 0 && ii >= maxSamples){
			break;
	    }
    }
    if (maxSamples == 0){
		maxSamples = ii;
    }
    else {
		while (ii < maxSamples){
	       		samples[ii] = 0;
	        	ii++;
		}
    }
//	document.write(ii);
//	document.write("<br/>");
//  var delayLine = new Array;
//  var pointer = 0;
//  var delayLength = oneSecond / 2;
//    for (var ijj = 0; ijj < groove.lineLength; ijj++){
//		delayLine[ijj] = 0;
//    }
    for (var repeat = 1 ; repeat < repeats; repeat++){
        for (var jj = 0 ; jj < ii ; jj++){
            samples[jj + ii * repeat] = samples[jj];
	    if (delay){
//		samples[jj + ii * repeat] = samples[jj + ii * repeat] - 0.5*delayLine[pointer];
//		delayLine[pointer] = samples[jj + ii * repeat];
//		pointer = (pointer+1)%lineLength;
        }
	    }
	}
    return samples;
}



function playSamples(asamples) {

    aaudio = [];    
    for (var iline = 0; iline < asamples.length; iline++){

    sampleRate = 44100;
    
    if (asamples[iline].length == 0) {
        alert("ERROR: No values in array 'samples'");
        return;
    }
    
    normalize_invalid_values(asamples[iline]); // keep samples between [-1, +1]
    
    var wave = new RIFFWAVE();
    wave.header.sampleRate = sampleRate;
    wave.header.numChannels = 1;
    var audio = new Audio();
//	audio.loop = loop;
    var samples2 = convert255(asamples[iline]);
    wave.Make(samples2);
    audio.src = wave.dataURI;
    
    
    aaudio[iline] = audio;
    }

    iline = 0;
    for (iline = 0; iline < aaudio.length; iline++){
        aaudio[iline].play();
    }

}

function normalize_invalid_values(samples) {
    for (var i = 0, len = samples.length; i < len; i++) {
        if (samples[i] > 1) {
            samples[i] = 1;
        } else if (samples[i] < -1) {
            samples[i] = -1;
        }
    }
}
function convert255(data) {
    var data_0_255 = [];
    for (var i = 0; i < data.length; i++) {
        data_0_255[i] = 128 + Math.round(127 * data[i]);
    }
    return data_0_255;
}

function makeFnT(groove, segments){
    var lastFreq = -2;
    var addedTime = 0;
    var ii = 0;
    var currentDur = 0;
    var lastDur = 0;
    var freqs = new Array;
    var times = new Array;
    debugsegments = segments;
    for (var iseg = 0 ; iseg < segments.length; iseg++){

            //convert this into a duration
            //currentDur = segments[iseg][0] /xsize - groove.startLine - lastDur;
            currentDur = segments[iseg][0] - groove.startLine - lastDur;
            lastDur = lastDur + currentDur; 

            // convert this into a frequency
            var y = segments[iseg][1];
            var freq = 0;
            if (y == -1) {
                freq = 0;
            } 
            else {
                //freq = buildFrequency(groove.ascale, groove.octaves, 1 - y / ysize, groove.base);
                freq = buildFrequency(groove.ascale, groove.octaves, 1 - y, groove.base);
            }

            if (freq != lastFreq) {
                times[ii] = currentDur + addedTime;
                freqs[ii] = freq;
                ii++;
                lastFreq = freq;
		addedTime = 0;
            } 
            else {
//                times[ii - 1] = times[ii - 1] + currentDur;
		addedTime += currentDur;
            }
            
        }

    return [freqs, times];
}


function storePartButton(){
	verifyData();
	player.storedParts[player.storedParts.length] = JSON.stringify(player.groove);
	
	showStoredParts();
}

function showStoredParts(){
	
	var galldiv = document.getElementById("gallerylist");
	galldiv.innerHTML = "";

	for (var ig = 0; ig < player.storedParts.length; ig++){
		var newItem = document.createElement("div");
		newItem.innerHTML = "<div onclick='recallPart(" + ig + ")' class='galleryItem'><canvas id='canvas" + ig + 
			"' class='gcanvas'></canvas><div class='grooveName'>" + 
			String.fromCharCode(65 + ig) + "</div></div>";
		galldiv.appendChild(newItem);

		drawGallery(ig, player.storedParts[ig]);					
	}
	
	document.getElementById("parts_button").style.borderWidth = "3px";
	document.getElementById("recently_shared_button").style.borderWidth = "0px";
}

function recallPart(index){
	for (var iline = 0; iline < player.channels.length; iline++){
		player.channels[iline].finish = true;
	}		

	player.groove = JSON.parse(player.storedParts[index]);
	player.channels = [];
	setupPxData();
	if (!player.playing){
		draw();
	}
	else {
		for (var iline = 0; iline < player.channels.length; iline++){
			player.channels[iline].i = -1;
			goTime(player.channels[iline]);
		}		
	}
	tool.drawnPaths = player.channels.length;
}


function controlChanged(){
	player.groove.ascale = buildScale(document.getElementById("scale").value);
	player.groove.octaves = parseInt(document.getElementById("octaves").value);
	player.groove.base = parseInt(document.getElementById("base").value);
	if (hasAudio){
	    for (var iline = 0; iline < player.groove.channels.length; iline++){
	    	 
			if (player.channels[iline] == undefined){
				var chan = makeNewChannel(player.groove.channels[iline].instrument);
				player.channels[iline] = chan;
			}		
			var data = makeFreqsAndTimesFromSegments(player.groove.channels[iline].data);
			player.channels[iline].freqs = data[0];
//			chan.times = data[1];
		}		
	}
}

function mutateButton(source){
	player.mutating = !player.mutating;
	if (player.mutating){
		setTimeout(function(){ mutate()}, 100);
	}
}

function mutate(){
	verifyData();
	var d = 0.05;
	for (var i = 0; i < player.groove.channels.length; i++){
		for (var i2 = 0; i2 < player.groove.channels[i].data.length; i2++){
			player.groove.channels[i].data[i2][1] = player.groove.channels[i].data[i2][1] + Math.random() / 60 * (Math.random() > 0.5 ? 1 : -1);			
		}
	}
	setupPxData();
	if (!player.playing){
		draw();
	}
	if (player.mutating){
		setTimeout(function(){ mutate()}, 100);
	}
	document.getElementById("mutate_button").style.background = player.mutating ? "#FF66FF" : "#808080";
}

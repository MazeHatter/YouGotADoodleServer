<%@ page contentType="text/html;charset=UTF-8" language="java" %><%@ page import="java.util.List" %><%@ page import="com.google.appengine.api.users.User" %><%@ page import="com.google.appengine.api.users.UserService" %><%@ page import="com.google.appengine.api.users.UserServiceFactory" %><%@ page import="com.google.appengine.api.datastore.DatastoreServiceFactory" %><%@ page import="com.google.appengine.api.datastore.DatastoreService" %><%@ page import="com.google.appengine.api.datastore.Query" %><%@ page import="com.google.appengine.api.datastore.Entity" %><%@ page import="com.google.appengine.api.datastore.FetchOptions" %><%@ page import="com.google.appengine.api.datastore.Key" %><%@ page import="com.google.appengine.api.datastore.KeyFactory" %><%@ page import="com.google.appengine.api.datastore.Text" %><%
Entity doodle = null;
String id = request.getParameter("id");
String saclient = request.getParameter("aclient");
boolean aclient = saclient != null && saclient.equals("true");

if (id == null){
	if (aclient){
		response.getWriter().print("bad");
		return;
	}
}
else {
	Query q = new Query("Moovles", KeyFactory.createKey("Moovles", Long.parseLong(id)));
	DatastoreService ds = DatastoreServiceFactory.getDatastoreService();
	doodle = ds.prepare(q).asSingleEntity();
	if (doodle == null){
		if (aclient){
			response.getWriter().print("bad") ;
			return;
		}
	}
	else{
		if (aclient){
			response.getWriter().print(((Text)doodle.getProperty("xy")).getValue());
			return;
		}
	}
}%><!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />        

<script src="json2.js" type="text/javascript" ></script>
<script>
var OVERLAP = 1;
var id = 0;
var viewer;
window.onload = function() {
	/*	if (navigator.userAgent.indexOf('Android') != -1){
		document.getElementById("close_android_ad").onclick = function(){
			document.getElementById("android_ad").style.visibility = "hidden";
			return false;
		}
		document.getElementById("android_ad").style.visibility = "visible";
	}
	 */

	var c=document.getElementById("mainCanvas");
	var ctx=c.getContext("2d");

	ctx.lineWidth = 6;

	viewer = {currentColor: 0,
			paths: [], 
			colors: ["#FFFFFF", "#FF0000", "#FFFF00", "#00FF00", "#0000FF", 
			  		"#FF8000", "#9E9E9E", "#00FFFF", "#800080", "#632DFF", "#63FF08"],
	         xsize: c.clientWidth, 
	         ysize: c.clientHeight,
	         animating:false,
	         mode: OVERLAP,
	         lastUp: 0
	};

	setupAudio();

	for (var ic = 0; ic < viewer.colors.length; ic++){
		document.getElementById("color-" + ic).style.backgroundColor = viewer.colors[ic];
	}
	<%
	if (doodle != null){
		%>
		var oo = <%= ((Text)doodle.getProperty("xy")).getValue()%>;
		viewer.paths = oo.paths;
		id = <%= id%>;
		if (viewer.hasAudio){
			if (oo.audio){
				viewer.audio = oo.audio;
			    document.getElementById("scale").value = viewer.audio.ascale + "";
			    document.getElementById("octaves").value = parseInt(viewer.audio.octaves);
			    document.getElementById("base").value = parseInt(viewer.audio.base);
			}
			for (var i = 0; i < viewer.paths.length; i++){
				mixer.channels[i] = makeChannel(viewer.paths[i].color);
				for (var j = 0; j < viewer.paths[i].pxdata.length; j++){
					mixer.channels[i].data[j] = [makeFreq(viewer.paths[i].pxdata[j][1]), 
					                             makePan(viewer.paths[i].pxdata[j][0])];
				}
			}
		}
		animate();
		<%
	}
	%>

	tool = new tool_pencil();

	c.addEventListener("mousedown", tool.mousedown, false);
	c.addEventListener("mousemove", tool.mousemove, false);
	c.addEventListener("mouseup",   tool.mouseup, false);
	c.addEventListener("touchstart", tool.touchstart, false);
	c.addEventListener("touchmove", tool.touchmove, false);
	c.addEventListener("touchend",   tool.touchend, false);

};

function setupAudio(){
	viewer.hasAudio = false;
	try {
		acontext = new webkitAudioContext();
		viewer.hasAudio = true;
	}
	catch(e) {
		var closeF = function(){
			document.getElementById("audiocontext").style.visibility = "hidden";
			return false;
		};
		document.getElementById("close_audiocontext").onclick = closeF; 
		document.getElementById("audiocontext").style.visibility = "visible";
		setTimeout(closeF, 5500);

	}
	
	viewer.audio = {ascale: [0,2,4,5,7,9,11], octaves:4, base:36};
	if (viewer.hasAudio){
		mixer = {channels: []};

	}

}

function draw(){	
	var c=document.getElementById("mainCanvas");
	var ctx=c.getContext("2d");
	var xsize = c.clientWidth;
	var ysize = c.clientHeight;
	var freq;
	var panX = 0;
	var skipNext = false;
	ctx.clearRect(0, 0, c.width, c.height);	


	for (var ip = 0; ip < viewer.paths.length; ip++){
		var nowInLoop = -1;
		panX = 0;
		freq = 0;
		if (viewer.paths[ip].animating){
			nowInLoop = (new Date).getTime() - (viewer.mode == OVERLAP ? viewer.paths[ip].loopStarted : viewer.loopStarted);
		}

		ctx.beginPath();
		for (var is = 1; is < viewer.paths[ip].pxdata.length; is++){
			var pxdata = viewer.paths[ip].pxdata;
			if (!viewer.paths[ip].finished && (nowInLoop == -1 || pxdata[is][2] < nowInLoop)){
				if (pxdata[is][1] == -1){
					skipNext = true;
				}
				else {
					if (!skipNext) {
						ctx.moveTo(pxdata[is -1][0], pxdata[is -1][1]);
						ctx.lineTo(pxdata[is][0], pxdata[is][1]);
					}
					skipNext = false;
				}
				if (viewer.hasAudio){
					// TODO seems expensive to read this every time, when we only need where it breaks
					freq = mixer.channels[ip].data[is][0];
					panX = mixer.channels[ip].data[is][1];
				}
				if (nowInLoop > -1 && is == pxdata.length - 1){
					if (ip == 0){
						viewer.loopStarted = (new Date).getTime();
						viewer.paths[0].loopStarted = viewer.loopStarted;
						for (var ip2 = 0; ip2 < viewer.paths.length; ip2++){
							if (viewer.paths[ip2].finished){
								viewer.paths[ip2].loopStarted = viewer.loopStarted;
								viewer.paths[ip2].finished = false;
							}
						}
						
					}
					else {
//						viewer.paths[ip].loopStarted = viewer.loopStarted;
						viewer.paths[ip].finished = true;						
					}
				}
			}
			else{
				break;
			}
		}
		if (viewer.hasAudio){
			if (freq == -1){
				mixer.channels[ip].gain.gain.value = 0;
				mixer.channels[ip].muted = true;
			}
			else {
				if (mixer.channels[ip].muted){
					mixer.channels[ip].muted = false;
					mixer.channels[ip].gain.gain.value = mixer.channels[ip].defaultGain;
				}
				mixer.channels[ip].osc.frequency.setValueAtTime(freq, 0);
				mixer.channels[ip].panner.setPosition(panX, 0, 0);
			}
		}
		ctx.closePath();
		ctx.strokeStyle = viewer.colors[viewer.paths[ip].color]; 
		ctx.stroke();
	}
	if (viewer.animating){
		requestAnimFrame(function() {
			draw();
		});

	}
}	


function tool_pencil () {
	var canvas = document.getElementById("mainCanvas");
	var context = canvas.getContext("2d");	
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
		x = ev.targetTouches[0].pageX - canvas.offsetLeft;
		y = ev.targetTouches[0].pageY - canvas.offsetTop;
		tool.start(x, y);
	}
	this.touchmove = function (ev) {
		ev.preventDefault(); 
		x = ev.targetTouches[0].pageX - canvas.offsetLeft;
		y = ev.targetTouches[0].pageY - canvas.offsetTop;
		tool.move(x, y);
	}
	this.touchend = function (ev) {
		ev.preventDefault(); 
		tool.end();
	}

	this.mousedown = function (ev) {
		x = ev.pageX - canvas.offsetLeft;
		y = ev.pageY - canvas.offsetTop;
		tool.start(x, y);
	}
	this.start = function(x, y){
		var now = (new Date).getTime();
		if (now - viewer.lastUp < 500){
			tool.drawnPaths--;
		}
		else {
			tool.drawnSegments = 0;
			segments = [];
			tool.drawnPaths = viewer.paths.length;
			if (viewer.hasAudio){
				mixer.channels[tool.drawnPaths] = makeChannel(viewer.currentColor);
			}
			if (viewer.animating){
				tool.loopCounter = viewer.loopStarted;
			}
			else {
				context.strokeStyle = viewer.colors[viewer.currentColor];
				context.beginPath();
				context.moveTo(x, y);
				tool.loopCounter = (new Date).getTime();
			}
		}

		if (viewer.hasAudio){
			var freq = makeFreq(y) ;
			var panX = makePan(x);
			mixer.channels[tool.drawnPaths].osc.frequency.value = freq;
			mixer.channels[tool.drawnPaths].panner.setPosition(panX, 0, 0);
			mixer.channels[tool.drawnPaths].data[tool.drawnSegments] = [freq, panX];
		}

		tool.started = true;

		tool.lastX = x;
		tool.lastY = y;

		segments[tool.drawnSegments] = [x, y, (new Date).getTime() - tool.loopCounter];
		tool.drawnSegments++;

		viewer.paths[tool.drawnPaths] = {color: viewer.currentColor, 
				pxdata: segments,
				i:0,
				animating:false,
				finished:false
		};
		onEdit();
	};

	this.mousemove = function (ev) {
		x = ev.pageX - canvas.offsetLeft;
		y = ev.pageY - canvas.offsetTop;
		tool.move(x, y);
	}

	this.move = function(x, y){

		if (tool.started) {
			if (!viewer.animating)
			{
				context.lineTo(x, y);
				context.moveTo(x, y);
				context.stroke();
			}

			if (viewer.hasAudio){
				var freq = makeFreq(y) ;
				var panX = makePan(x);
				mixer.channels[tool.drawnPaths].data[tool.drawnSegments] = [freq, panX];
				mixer.channels[tool.drawnPaths].osc.frequency.setValueAtTime(freq, 0);
				mixer.channels[tool.drawnPaths].panner.setPosition(panX, 0, 0);
			}

			segments[tool.drawnSegments] = [x, y, (new Date).getTime() - tool.loopCounter];

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
			if (!viewer.animating){
				context.closePath();	
			}
			var now = (new Date).getTime();
			tool.started = false;

			if (viewer.hasAudio){
				mixer.channels[tool.drawnPaths].osc.frequency.setValueAtTime(0, 0);
				mixer.channels[tool.drawnPaths].data[tool.drawnSegments] = [-1, 0];
			}

			segments[tool.drawnSegments] = [tool.lastX, -1, now - tool.loopCounter];

			tool.drawnSegments++;

			if (!viewer.animating){
				animate();
			}
			else {
				if (tool.drawnPaths > 0){
					viewer.paths[tool.drawnPaths].finished = true;
				}
			}
			viewer.paths[tool.drawnPaths].loopStarted = now;
			viewer.paths[tool.drawnPaths].animating = true;

			tool.drawnPaths++;
			viewer.lastUp = now;

		}
	};
}

function animate(){
	viewer.animating = true;
	viewer.loopStarted = (new Date).getTime();
	draw();
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
	if (viewer.hasAudio){
		for (var i = 0; i<viewer.paths.length; i++){
			mixer.channels[i].osc.noteOff(0);
		}
	}
	viewer.animating = false;
	viewer.paths = [];
	draw();
}
function undoButton(){
	if (viewer.paths.length == 1){
		clearButton();
		return;
	}
	if (viewer.hasAudio && viewer.paths.length > 0){
		mixer.channels[viewer.paths.length - 1].osc.noteOff(0);
	}
	viewer.paths = viewer.paths.slice(0, viewer.paths.length - 1);
	draw();
	onEdit();
}

function getDoodleJSON(){
	var odoodle = {audio: viewer.audio, paths: viewer.paths	};
	var doodle = JSON.stringify(odoodle);
	return doodle;
	
}
function facebookButton(){
	shareButton('http://www.facebook.com/sharer/sharer.php?t=YouGotADoodle&u=http%3A%2F%2Fyougotadoodle.appspot.com%2Fm.jsp');
}
function twitterButton(){
	shareButton( "http://twitter.com/home?status=http%3A%2F%2Fyougotadoodle.appspot.com%2Fm.jsp");
}
function emailButton(){
	var url = 'mailto:?subject=You Got A Moving Music Doodle!&body=http://yougotadoodle.appspot.com/m.jsp';
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
		var doodle = getDoodleJSON();
		
		var xhr = new XMLHttpRequest();
		xhr.open("POST", "/m", true);
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



function makeFreq(y){
	return buildFrequency(viewer.audio.ascale, viewer.audio.octaves, 1 - y / 400, viewer.audio.base);	
}
function makePan(x){
	return (x / viewer.xsize - 0.5) * 10;
}
//translated from Adam Smith's Android code
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

function makeChannel(color){
	var info = getInstrumentInfo(color);
	var chan = 	{};
	chan.data = [];
	chan.muted = false;
	chan.defaultGain = 0.4;
	chan.osc = acontext.createOscillator();
	chan.gain = acontext.createGainNode();
	chan.delay = acontext.createDelayNode();
	chan.delayGain = acontext.createGainNode();
	chan.panner = acontext.createPanner();
	chan.gain.gain.value = chan.defaultGain; 
	chan.delayGain.gain.value = 0.3;
	chan.osc.connect(chan.gain);
	chan.gain.connect(chan.panner);
	chan.panner.connect(acontext.destination);

	chan.osc.type = info.type;

	if (info.delay){
		chan.delay.delayTime.value = 0.5;
		chan.gain.connect(chan.delay);
		chan.delay.connect(chan.delayGain);
		chan.delayGain.connect(acontext.destination);
	}
	chan.osc.noteOn(0);
	return chan;
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


function controlChanged(){
	viewer.audio.ascale = buildScale(document.getElementById("scale").value);
	viewer.audio.octaves = parseInt(document.getElementById("octaves").value);
	viewer.audio.base = parseInt(document.getElementById("base").value);
	if (viewer.hasAudio){
	    for (var iline = 0; iline < viewer.paths.length; iline++){
	    	var pxdata = viewer.paths[iline].pxdata;
	    	for (var ii = 0; ii < pxdata.length; ii++){
	    		mixer.channels[iline].data[ii][0] = makeFreq(pxdata[ii][1]);
	    	}
		}		
	}
}

</script>


<meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=no" />


<style type="text/css" media="screen">
body {color:white; background-color:#333333; font-family:Tahoma,Geneva,sans-serif;}

.button {font-size:14pt;
text-align:center;
vertical-align:middle;
background:#00FF00; 
width:48px; 
padding:10px; 
border-radius:5px;
position:absolute;
background:#808080; 
}
#button_row{
	position:absolute;
top:454px;
left:130px;
}

#facebook_button {
	background-image:url('img/f_logo.png'); 
height:42px;
width:42px;
top:0px;
left:35px;
padding:0px;
/*visibility:hidden;*/
}
#twitter_button {
	background-image:url('img/twitter_logo.png');
	background-color:#FFFFFF; 
height:42px;
width:42px;
top:0px;
left:78px;
padding:0px;
}
#email_button {
	background-image:url('img/email.png');
	background-color:#FF80FF; 
height:42px;
width:42px;
top:0px;
left:120px;
padding:0px;
}

#share_button {
/*	background-color:#10F010;*/ 
width:80px;
top:0px;
left:0px;
/*visibility:hidden;*/
}

#clear_button {
	top:0px;
left:332px;
}
#undo_button {
	top:0px;
left:259px;
}

#controls {font-size:8pt;

position:absolute;
top:450px;
left:0px;
}


#mainCanvas {border-radius:5px;
position:absolute;
top:150px;
left:130px;
width:400px;
height:300px;
background-color:black;
}
.color_box {
	line-height:10px;
font-size:8pt;
text-align:center;
position:absolute;
height:33px;
width:33px;
border-width:1px;
border-color:#808080;
border-style:solid;
border-radius:5px;
}
#colors {position:absolute; left:95px; top:150px; color:black;}
#color-0{
	left:0px;
top:0px;
background-color:#FFFFFF;
}
#color-1{
	left:0px;
top:35px;
background-color:#FF0000;

}
#color-2{
	left:0px;
top:70px;
background-color:#FFFF00;
}
#color-3{
	left:0px;
top:105px;
background-color:#00FF00;
}
#color-4{
	left:0px;
top:140px;
background-color:#0000FF;

}
#color-5{
	left:0px;
top:175px;
background-color:#FF8000;
}
#color-6{
	left:0px;
top:210px;
background-color:#9E9E9E;
}
#color-7{
	left:0px;
top:245px;
background-color:#00FFFF;
}
#color-8{
	left:0px;
top:280px;
background-color:#00FFFF;
}
#color-9{
	left:0px;
top:315px;
background-color:#00FFFF;
}
#color-10{
	left:0px;
top:350px;
background-color:#00FFFF;
}

#share_dialog{
	position:absolute;
top:85px;
left:130px;
visibility:hidden;
}
#ok_button {font-size:12pt;
text-align:center;
vertical-align:middle;
background:#808080; 
width:40px; padding:8px; border-radius:5px;
position:absolute;
top:68px;
left:160px;
visibility:hidden;
}	
#cancel_button {font-size:12pt;
text-align:center;
vertical-align:middle;
background:#808080; 
width:40px; padding:8px; border-radius:5px;
position:absolute;
top:68px;
left:220px;
visibility:hidden;
}

#android_ad {visibility:hidden;
left:200px; width:230px; top:220px; padding:5px;
}

#mainCanvas {
	top:42px;
left:33px;
width:300px;
height:400px;
}
#colors {position:absolute; left:0px; top:42px;}
#button_row {left:0px; top:0px;}


#undo_button {left:190px;}
#clear_button {left:260px;}

#share_dialog {	top:42px;
left:40px;
}
#ismobile {width:10px;}

#ok_button {visibility:inherit;}
#cancel_button {visibility:inherit;}

#android_ad {visibility:hidden;
left:76px; top:200px; 
}
#audiocontext {visibility:hidden;
left:60px; top:100px;
width:200px;
font-size:12pt;
}

a, a:visited {color:white;}
</style>
<meta property="og:image" content="http://yougotadoodle.appspot.com/img/yougotadoodle.png" />
<meta property="og:description" content="Make doodle movies with sound and send them to your friends!" />
<title>You Got A Moving Music Doodle! (It's a Moovle!)</title>


		<link ref="apple-touch-icon" href="http://yougotadoodle.appspot.com/img/yougotadoodle.png" />
<!--<link ref="apple-touch-startup-image" href="http://yougotadoodle.appspot.com/img/drawmusicsplash.png" />-->
<!--removes back button, ect, not sure its a good idea, but not sure its working either-->
<meta name="apple-mobile-web-app-capable" content="yes" />

</head>

<body>

<div id="button_row">

<div id="facebook_button" class="button" onClick="facebookButton()">
</div>

<div id="twitter_button" class="button" onClick="twitterButton()">

</div>

<div id="email_button" class="button" onClick="emailButton()">
</div>


<div id="undo_button"  class="button" onClick="undoButton()">
Undo
</div>

<div id="clear_button"  class="button" onClick="clearButton()">
Clear
</div>
</div>


<div id="colors">
<div id="color-0" class="color_box" onClick="chooseColor(0)"></div>
<div id="color-1" class="color_box" onClick="chooseColor(1)"></div>
<div id="color-2" class="color_box" onClick="chooseColor(2)"></div>
<div id="color-3" class="color_box" onClick="chooseColor(3)"></div>
<div id="color-4" class="color_box" onClick="chooseColor(4)"></div>
<div id="color-5" class="color_box" onClick="chooseColor(5)"></div>
<div id="color-6" class="color_box" onClick="chooseColor(6)"></div>
<div id="color-7" class="color_box" onClick="chooseColor(7)"></div>
<div id="color-8" class="color_box" onClick="chooseColor(8)"></div>
<div id="color-9" class="color_box" onClick="chooseColor(9)"></div>
<div id="color-10" class="color_box" onClick="chooseColor(10)"></div>
</div>


<canvas id="mainCanvas" width="300" height="400" style="background-color:black;border:1px solid #c3c3c3;">
Your browser does not support the canvas element.
</canvas>

<div id="share_dialog">
<input type="text" id="new_artist" value="your name"/>
<div id="ok_button" onClick="okShareButton()">Ok!</div>
<div id="cancel_button" onClick="cancelShareButton()">Cancel</div>
</div>


<div id="android_ad" class="button">Get the Android App!<br/>
<a href="https://play.google.com/store/apps/details?id=com.monadpad.teledoodle"><img style="height:80px;width:80px;" src="img/market114.jpg" /></a>
<a href="http://www.amazon.com/gp/mas/dl/android?p=com.monadpad.teledoodle"><img style="height:80px;width:80px;" src="img/amazon114.png" /></a>
<br/>or<br/>
<a href='http://yougotadoodle.appspot.com/d.jsp?id=<%= id %>'>I already have the App!</a>
<br/>or<br/>
<a href="#" id="close_android_ad">(no thanks, close dialog)</a>
</div>

<div id="audiocontext" class="button">
You need Chrome or Safarai (iOS 6 on mobile) to hear sounds made by this app.
<br/><br/>
But you can still draw, so have fun!
<br/>
<a href="#" id="close_audiocontext">(OK!)</a>
</div>

<div id="controls">
Scale:
<select id="scale" default-value="0,2,4,5,7,9,11" onchange="controlChanged()">
<option value="0,1,2,3,4,5,6,7,8,9,10,11">Chromatic</option>
<option selected="selected" value="0,2,4,5,7,9,11">Major</option>
<option value="0,2,3,5,7,8,10">Minor</option>
<option value="0,2,4,7,9">Pentatonic</option>
<option value="0,3,5,6,7,10">Blues</option>
<option value="0,7">Fiths</option>
<option value="">Theremin</option>
</select>
Bottom Note:
<select id="base" onchange="controlChanged()">
<option value="24">C 1</option>
<option value="25">C# 2</option>
<option value="26">D 1</option>
<option value="27">Eb 1</option>
<option value="28">E 1</option>
<option value="29">F 1</option>
<option value="30">F# 1</option>
<option value="31">G 1</option>
<option value="32">G# 1</option>
<option value="33">A 2</option>
<option value="34">Bb 2</option>
<option value="35">B 2</option>
<option selected="selected" value="36">C 2</option>
<option value="37">C# 2</option>
<option value="38">D 2</option>
<option value="39">Eb 2</option>
<option value="40">E 2</option>
<option value="41">F 2</option>
<option value="42">F# 2</option>
<option value="43">G 2</option>
<option value="44">G# 2</option>
<option value="45">A 3</option>
<option value="46">Bb 3</option>
<option value="47">B 3</option>
<option value="48">C 3</option>
</select>
Octaves:
<select id="octaves" default="4" onchange="controlChanged()">
<option value="1">1</option>
<option value="2">2</option>
<option value="3">3</option>
<option selected="selected" value="4">4</option>
<option value="5">5</option>
<option value="6">6</option>
</select>
<p align="center">
<a href="http://monadpad.com">monadpad.com</a></p>
</div>


<div id="ismobile">
</div>
</body>
</html>
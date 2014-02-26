<%@ page contentType="text/html;charset=UTF-8" language="java" %><%@ page import="java.util.List" %><%@ page import="com.google.appengine.api.users.User" %><%@ page import="com.google.appengine.api.users.UserService" %><%@ page import="com.google.appengine.api.users.UserServiceFactory" %><%@ page import="com.google.appengine.api.datastore.DatastoreServiceFactory" %><%@ page import="com.google.appengine.api.datastore.DatastoreService" %><%@ page import="com.google.appengine.api.datastore.Query" %><%@ page import="com.google.appengine.api.datastore.Entity" %><%@ page import="com.google.appengine.api.datastore.FetchOptions" %><%@ page import="com.google.appengine.api.datastore.Key" %><%@ page import="com.google.appengine.api.datastore.KeyFactory" %><%@ page import="com.google.appengine.api.datastore.Text" %><%
Entity doodle = null;
String id = request.getParameter("id");
String saclient = request.getParameter("aclient");
boolean aclient = saclient != null && saclient.equals("true");
boolean goodToGo = false;
if (id == null){
	if (aclient){
		response.getWriter().print("bad");
		return;
	}
}
else {
	Query q = new Query("Doodles", KeyFactory.createKey("Doodles", Long.parseLong(id)));
	DatastoreService ds = DatastoreServiceFactory.getDatastoreService();
	doodle = ds.prepare(q).asSingleEntity();
	if (doodle == null){
		if (aclient){
			response.getWriter().print("bad") ;
			return;
		}
	}
	else{
/*		if (aclient){
			%>good:<%= ((Text)doodle.getProperty("xy")).getValue()%><%
			return;
		}
*/
		String code = (String)doodle.getProperty("code");
		String pcode = request.getParameter("code");
		if (code == null) {
			goodToGo = true;
		}
		else if (pcode == null){
			// redirect to ask pin
			response.sendRedirect("pin.jsp?id=" + id);
		}
		else if (pcode.equals(code)) {
			goodToGo = true;
			ds.delete(doodle.getKey());
		}
	}
}%><!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />        

<script>
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

	setCanvasSize();
	
	viewer = {currentColor: 0,
			paths: [], 
			colors: ["#FFFFFF", "#808080", "#FF0000", "#FFFF00", 
		               "#00FF00", "#00FFFF", "#0000FF", "#800080"],
		    xsize: c.clientWidth, 
		    ysize: c.clientHeight
		    };
	
	
	for (var ic = 0; ic < viewer.colors.length; ic++){
		document.getElementById("color-" + ic).style.backgroundColor = viewer.colors[ic];
	}
<%
if (doodle != null && goodToGo) {
	%>
	setup("<%= ((Text)doodle.getProperty("xy")).getValue()%> ");
	id = <%= id%>;		
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
	var c=document.getElementById("mainCanvas");
	var ctx=c.getContext("2d");
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
	    x = ev.pageX - canvas.offsetLeft;
	    y = ev.pageY - canvas.offsetTop;
		tool.move(x, y);
		}

	  this.move = function(x, y){

	    if (tool.started) {
		  context.lineTo(x, y);
//		  context.moveTo(x, y);
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

//	      segments[tool.drawnSegments] = [tool.lastX, -1];

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
	shareButton('https://www.facebook.com/sharer/sharer.php?t=YouGotADoodle&u=https%3A%2F%2Fyougotadoodle.appspot.com%2Fd.jsp');
}

function twitterButton(){
	shareButton( "https://twitter.com/home?status=https%3A%2F%2Fyougotadoodle.appspot.com%2Fd.jsp");
}

function emailButton(){
	var url = 'mailto:?subject=You Got A Doodle!&body=https://yougotadoodle.appspot.com/d.jsp';
	shareButton(url);
}

function privateButton() {
	var code = 10000 + Math.floor(Math.random() * 90000);
	
	var doodle = makeDoodle();
	
	var xhr = new XMLHttpRequest();
	xhr.open("POST", "/d", true);
	xhr.onreadystatechange = function(){
		if (xhr.readyState == 4){
			
			document.getElementById("private-code").value = code;
			var id = xhr.responseText;

			var url = "https://yougotadoodle.appspot.com/d.jsp?id=" + id;
			document.getElementById("doodle-url").value = url;
			document.getElementById("doodle-url-with-code").value = url + "&code=" + code;

			var dlg = document.getElementById("private-dialog");
			dlg.style.display = "block";
			dlg.style.left = (window.innerWidth / 2 - dlg.clientWidth / 2) + "px";
			dlg.style.top = (window.innerHeight / 2 - dlg.clientHeight / 2) + "px";

		}
	}
	xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
	var params = "code=" + code + "&xy=" + doodle;
	xhr.send(params);

}

function shareButton(url){

	
	var c = document.getElementById("mainCanvas")
	var data = c.toDataURL();

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
		var doodle = makeDoodle();
		
		
		
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
		var params = "xy=" + doodle + "&img=" + data;

		xhr.send(params);
	}
}

function makeDoodle() {
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
	return doodle;

}

window.onresize = function() {
    setCanvasSize();
};
function setCanvasSize() {
	var c=document.getElementById("mainCanvas");
	var width = window.innerWidth - c.offsetLeft - 5;
	var height = window.innerHeight - c.offsetTop - 30;
	c.style.width = width + "px";
	c.style.height = height + "px";
	c.height = height;
	c.width = width;
	c.getContext("2d").lineWidth = 5;
}

</script>


<meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=no" />


<style type="text/css" media="screen">
/*body {color:white; background-color:#333333; font-family:Tahoma,Geneva,sans-serif;}*/
body {background-color:#CCCCCC; font-family:Tahoma,Geneva,sans-serif;}

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

/*#button_row{
	position:absolute;
	top:454px;
	left:130px;
}*/

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

#private_button {
	background-color:#202020; 
height:42px;
width:42px;
top:0px;
left:162px;
padding:0px;
}


#clear_button {
	top:0px;
	right:6px;
}
#undo_button {
	top:0px;
	right:79px;
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
#colors {position:absolute; left:95px; top:158px; color:black;}
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

#share_dialog{
	position:absolute;
	top:85px;
	left:130px;
	visibility:hidden;
}
#share_dialog{
	position:absolute;
	margin:auto;
	width:50%;
	display:none;
	zindex:2;
}
#private-dialog{
	position:absolute;
	margin:auto;
	display:none;
	background:#C0C0C0;
	padding:8px;
	z-index:2;
}
.ok_button, #ok_button {font-size:12pt;
	text-align:center;
	vertical-align:middle;
	background:#808080; 
	width:70px; padding:8px; border-radius:5px;
}	
.cancel_button, #cancel_button {font-size:12pt;
	text-align:center;
	vertical-align:middle;
	background:#808080; 
	width:80%px; padding:8px; border-radius:5px;
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
#colors {position:absolute; left:0px; top:62px;}
#button_row {left:0px; top:0px; }


/*#undo_button {left:190px;}
#clear_button {left:260px;}
*/

#share_dialog {	top:42px;
	left:40px;
}
#ismobile {width:10px;}

#ok_button {visibility:inherit;}
#cancel_button {visibility:inherit;}

#android_ad {visibility:hidden;
	left:76px; top:200px; 
	}

#bottomline{font-size:8pt;
text-align:center;
position:absolute;
bottom:6px;
right:6px;

}

/*a, a:visited {color:white;}*/

.warning {color:red;}
</style>
<meta property="og:image" content="http://yougotadoodle.appspot.com/img/yougotadoodle.png" />
<meta property="og:description" content="Make your emails, texts, and tweets more personal, more fun, and more you!" />
<title>You Got A Doodle!</title>


<link rel="apple-touch-icon" href="http://yougotadoodle.appspot.com/img/yougotadoodle.png" />
<!--<link ref="apple-touch-startup-image" href="http://yougotadoodle.appspot.com/img/drawmusicsplash.png" />-->
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

<div id="private_button" class="button" onClick="privateButton()">
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
</div>

<div id="bottomline">Try <a href="http://monadpad.com">our</a> 
<a href="http://sketchatune.com">Music</a> and <a href="http://cloudmoviecompany.com">Animation</a> Apps</a></div>

<canvas id="mainCanvas" width="300" height="400" style="background-color:black;border:1px solid #c3c3c3;">
Your browser does not support the canvas element.
</canvas>

<div id="share_dialog">
<input type="text" id="new_artist" value="your name"/>
<div id="ok_button" onClick="okShareButton()">Ok!</div>
<div id="cancel_button" onClick="cancelShareButton()">Cancel</div>
</div>

<div id="private-dialog">
This option creates a URL that will <span class="warning"><b>self destruct</b></span> after it is accessed once. <br/>
The doodle will require a five digit code. <br/>
You can choose to send the Url separate from the secret code, or together.<br/>
Once accessed the data will be removed from the system, and thus the internet.<br/>
<hr />
Code: <input type="text" id="private-code" value=""/><br />
Url: <input type="text" id="doodle-url" value=""/> <br />
Url + Code: <input type="text" id="doodle-url-with-code" value=""/>
<br/>
<br/>
<div class="cancel_button" onClick="document.getElementById('private-dialog').style.display = 'none'">Close This Dialog</div>
</div>


<div id="android_ad" class="button">Get the Android App!<br/>
<a href="https://play.google.com/store/apps/details?id=com.monadpad.teledoodle"><img style="height:80px;width:80px;" src="img/market114.jpg" /></a>
<a href="http://www.amazon.com/gp/mas/dl/android?p=com.monadpad.teledoodle"><img style="height:80px;width:80px;" src="img/amazon114.png" /></a>
<br/>or<br/>
<a href='http://yougotadoodle.appspot.com/d.jsp?id=<%= id %>'>I already have the App!</a>
<br/>or<br/>
<a href="#" id="close_android_ad">(no thanks, close dialog)</a>
</div>

<div id="ismobile">
</div>
</body>
</html>
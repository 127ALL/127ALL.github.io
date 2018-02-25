const NUM_LAYERS = 3;
var backgroundSrc = null;

function load(res){
	clearLayers();
	var copy = res.slice();
	for(var i = 0; i < NUM_LAYERS; i++)
	{
		var layer = document.getElementById("layer"+String(i));
		console.log(copy);
		loadRes(copy, layer, 1);	
	}
}
function clearLayers(){
	try{
		backgroundSrc.pause();
	}catch(error){
		console.log();
	}backgroundSrc=null;
	is_done = true;
	for(var i = 0; i < NUM_LAYERS; i++)
	{
		var layer = document.getElementById("layer"+String(i));
		while (layer.firstChild) {
		    layer.removeChild(layer.firstChild);
		}	
	}

}
function loadRes(res, layer, count)
{
	if(res.length <= 0 || count > 4) return;
	var i = Math.floor(Math.random()* Math.floor(res.length));
	var j = window.location.pathname.lastIndexOf("/");			
	var file = window.location.pathname.substr(0,j)+"/" + res[i]
	//get file extension type
	j = file.lastIndexOf(".");			
	var ext = file.substr(j+1,file.length);
	var elem = null;
	if(ext == "jpg" || ext == "jpeg" || ext == "gif" || ext == "png"){
		elem= document.createElement("img");
		elem.src=file;
	}
	else if(ext == "webm" || ext == "mp4"){
		elem= document.createElement("video");
		if (elem.canPlayType('video/mp4').length > 0) {
			elem.src=file;
			elem.autoPlay = true;		
			elem.loop = true;					
			elem.controls = true;
		    //elem.play();
		}
	}
	var rand = Math.random()*2.0+1.00;
	//elem.style.transform = "scale("+String(rand)+")";
	elem.style.width = elem.style.width%240+120;
	elem.style.height = elem.style.height%240+120;
	//elem.style.width =String(elem.width*rand+250)+"px";
	//elem.style.height =String(elem.height*rand+250)+"px";
	//elem.style.marginLeft =String(Math.random()* document.body.clientWidth)+"px";
	//elem.style.marginTop = String(Math.random()* document.body.clientHeight)+"px";
	elem.style.left =String(rand* elem.style.width)+"px";
	elem.style.top = String(rand* elem.style.height)+"px";
	layer.appendChild(elem);
	res.splice(i,1);			
	loadRes(res, layer, count+1);	

};

function loadBG()
{
	try{
		backgroundSrc.pause();
	}catch(error){
		console.log();
	}
	backgroundSrc=null;
	var i = Math.floor(Math.random()* 4);
	var arr = []
	if(i==0){
		arr = anxiety.splice();
	}else if(i==1){
		arr = despair;
	}else if(i==2){
		arr = eccentricity;
	}else if(i==3){
		arr = endeavor;
	}else if(i==4){
		arr = solitude;
	}
	if (arr.length > 0){
		i = Math.floor(Math.random()* arr.length);
       // video.muted = true;
        var ext = arr[i].substr(arr[i].lastIndexOf(".")+1, arr[i].length);
	
		if(ext == "webm"  || ext == "mp4" ){
			backgroundSrc= document.createElement('video');
			backgroundSrc.autoplay = true;
		    backgroundSrc.loop = true;
			backgroundSrc.src = arr[i];
		    backgroundSrc.play();       
		}
		else {
			backgroundSrc= document.createElement('img');
			backgroundSrc.src = arr[i];		
		}
	}
};


//WEBGL

var vSource =`
	attribute vec2 coord; 
	attribute vec2 uv;
	varying vec2 uvcoord;

    void main(void) {  
    	uvcoord = uv;
    	gl_Position = vec4(coord,0.0, 1.0);
	}

`;

var fSource = `
	precision mediump float;
	uniform float time;
	varying vec2 uvcoord;

	void main(void) {
		float color = smoothstep(1.0, 
				cos(cos(time/10.0))*3.0+0.2, 		//step (width)size, negative inverts colors

				 abs(length(uvcoord) 
		    + sin(atan(uvcoord.y, uvcoord.x) 
		    * abs(10.0*tan(uvcoord.x+uvcoord.y)*sin(dot(uvcoord, uvcoord*time))*cos(tan(length(uvcoord*sin(100.0+time/1000.0)*10.0)))  ) 		//number of petals
		    - 3.141 / 2.0) )	//rotation
		    *9.0								//size
		    );
		
		vec4 offset;
		offset = vec4(
			color*sin(-1.0*tan(uvcoord.x*tan(time/100.0)
			*sin(uvcoord.x*cos(cos(uvcoord.x-uvcoord.y))*2.2)
			+(uvcoord.x+uvcoord.y))*time/10.0),
			color*0.3,
			color*0.25, 1.0 );

		offset = vec4(
		color*sin(-1.0*tan(uvcoord.x*tan(time/100.0)
		*sin(uvcoord.x*cos(cos(uvcoord.x-uvcoord.y))*2.2)
		+(uvcoord.x+uvcoord.y))*time/10.0),
		color*0.3,
		color*0.25, 1.0 );
		offset.x +=  sin(time/10.0+tan((uvcoord.x+uvcoord.y)/10.0));
		offset.y +=  sin(time/18.0+tan((uvcoord.x+uvcoord.y)/4.0));
		offset.z +=  step(1.0, sin(time)*gl_FragColor.z);
		gl_FragColor = offset;
	}
`;


var fVidSource = `
	precision mediump float;
	uniform float time;
	uniform sampler2D sampler0;
	uniform sampler2D sampler1;
	varying vec2 uvcoord;
	void main(void) {
		float t = clamp(time /60.0, 0.0, 1.0);
		vec2 uv = uvcoord;
		 uv.y = 1.0-uv.y;
		vec2 texcoord=uv+(uv-0.5) 
		* (sin(distance(uv, vec2(1,1)*sin(cos(time/100.0))*uv.y-uv.x) * 12.0 - time) + 0.5) / 30.0;
		vec4 diffuse = texture2D(sampler0, texcoord);
		vec4 color =  diffuse *  t;
		if(length(color.xyz) < 0.01)
			gl_FragColor = texture2D(sampler1, uv);
		else
			gl_FragColor =  color; 
		
	}
`;


function runBackground(){
	var canvas = document.getElementById('glcanvas');
	var gl = canvas.getContext('experimental-webgl');

	canvas.width  = document.body.clientWidth;
	canvas.height = document.body.clientHeight;
	var vidvertices = [   
	-0.5, -0.5,
     0.5, -0.5,
     0.5,  0.5,
    -0.5,  0.5];
	var viduvs = [ 
    0.0,  0.0,
    1.0,  0.0,
    1.0,  1.0,
    0.0,  1.0
    ];
	var vertices = [   
	-1.0, -1.0,
     1.0, -1.0,
     1.0,  1.0,
    -1.0,  1.0];
	var uvs = [ 
    0.0,  0.0,
    1.0,  0.0,
    1.0,  1.0,
    0.0,  1.0
    ];
    var indices = [ 0, 1, 2, 0, 2, 3 ];
    var vidindices = [ 0, 1, 2, 0, 2, 3 ];

	var vertexBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);         
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
	gl.bindBuffer(gl.ARRAY_BUFFER, null);

	var vidvertexBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, vidvertexBuffer);         
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vidvertices), gl.STATIC_DRAW);
	gl.bindBuffer(gl.ARRAY_BUFFER, null);

	var uvBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);         
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(uvs), gl.STATIC_DRAW);
	gl.bindBuffer(gl.ARRAY_BUFFER, null);

	const indexBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,
 	 new Uint16Array(indices), gl.STATIC_DRAW);

	var viduvBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, viduvBuffer);         
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(viduvs), gl.STATIC_DRAW);
	gl.bindBuffer(gl.ARRAY_BUFFER, null);

	const vidindexBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, vidindexBuffer);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(vidindices), gl.STATIC_DRAW);

	var vShader = gl.createShader(gl.VERTEX_SHADER);
	gl.shaderSource(vShader, vSource);
	gl.compileShader(vShader);
	var compiled = gl.getShaderParameter(vShader, gl.COMPILE_STATUS);
	console.log('Shader compiled successfully: ' + compiled);
	var compilationLog = gl.getShaderInfoLog(vShader);
	console.log('Shader compiler log: ' + compilationLog);

	var fShader = gl.createShader(gl.FRAGMENT_SHADER);
	gl.shaderSource(fShader, fSource);
	gl.compileShader(fShader);
	var compiled = gl.getShaderParameter(fShader, gl.COMPILE_STATUS);
	console.log('Shader compiled successfully: ' + compiled);
	var compilationLog = gl.getShaderInfoLog(fShader);
	console.log('Shader compiler log: ' + compilationLog);

	var fVidShader = gl.createShader(gl.FRAGMENT_SHADER);
	gl.shaderSource(fVidShader, fVidSource);
	gl.compileShader(fVidShader);
	var compiled = gl.getShaderParameter(fVidShader, gl.COMPILE_STATUS);
	console.log('F VID Shader compiled successfully: ' + compiled);
	var compilationLog = gl.getShaderInfoLog(fVidShader);
	console.log('F VID Shader compiler log: ' + compilationLog);

	var shader = gl.createProgram();
	gl.attachShader(shader, vShader); 
	gl.attachShader(shader, fShader);
	gl.linkProgram(shader);

	var vidshader = gl.createProgram();
	gl.attachShader(vidshader, vShader); 
	gl.attachShader(vidshader, fVidShader);
	gl.linkProgram(vidshader);

	var texture = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_2D, texture);

	var pixel = new Uint8Array([0, 0, 255, 255]);  // opaque blue
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, pixel);

	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

	var targetTexture = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_2D, targetTexture);

	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, canvas.width,canvas.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

	const fb = gl.createFramebuffer();
	gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
	
	const attachmentPoint = gl.COLOR_ATTACHMENT0;
	gl.framebufferTexture2D(gl.FRAMEBUFFER, attachmentPoint, gl.TEXTURE_2D, targetTexture, 0);

 	var  start = Date.now();;
	var elapsed = 0;
	var speed = 0.01;
	function draw(){
		setTimeout(function(){
//    	gl.bindFramebuffer(gl.FRAMEBUFFER, null);

		gl.clearColor(0.0, 0.0, 0.0, 0.0);
		gl.enable(gl.DEPTH_TEST); 
		gl.clear(gl.COLOR_BUFFER_BIT);
			gl.viewport(0,0,canvas.width,canvas.height);			
	
		if(backgroundSrc != null)
		{
			gl.useProgram(vidshader);			
			gl.bindBuffer(gl.ARRAY_BUFFER, vidvertexBuffer);
			var coord = gl.getAttribLocation(vidshader, "coord");
			gl.vertexAttribPointer(coord, 2, gl.FLOAT, false, 0, 0);
			gl.enableVertexAttribArray(coord);
			gl.bindBuffer(gl.ARRAY_BUFFER, viduvBuffer);
			var uv = gl.getAttribLocation(vidshader, "uv");
			gl.vertexAttribPointer(uv, 2, gl.FLOAT, false, 0, 0);
			gl.enableVertexAttribArray(uv);
			gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, vidindexBuffer);
			//SET UNIFORMS
			gl.activeTexture(gl.TEXTURE0);
// copy the video  canvas to gl texure
			gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA,
					    gl.RGBA, gl.UNSIGNED_BYTE, backgroundSrc);
			// bind texture to TEX 0
			gl.bindTexture(gl.TEXTURE_2D, texture);						
			// bind sampler to TEX 0
			gl.uniform1i(gl.getUniformLocation(vidshader, "sampler0"), 0);

			gl.activeTexture(gl.TEXTURE1);
			// bind texture to TEX 0
			gl.bindTexture(gl.TEXTURE_2D, targetTexture);						
			// bind sampler to TEX 0
			gl.uniform1i(gl.getUniformLocation(vidshader, "sampler1"), 1);


			var time = gl.getUniformLocation(vidshader, "time");
			elapsed += (Date.now() - start)*speed;
			gl.uniform1f(time, elapsed);
			start = Date.now();
			//DRAW!!
			gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
		}
	gl.useProgram(shader);
		gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
		var coord = gl.getAttribLocation(shader, "coord");
		gl.vertexAttribPointer(coord, 2, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(coord);
		gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
		var uv = gl.getAttribLocation(shader, "uv");
		gl.vertexAttribPointer(uv, 2, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(uv);
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
		//SET UNIFORMS
		var time = gl.getUniformLocation(shader, "time");
		elapsed += (Date.now() - start)*speed;
		gl.uniform1f(time, elapsed);
		start = Date.now();
		//DRAW!!
		gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);

		// render to our targetTexture by binding the framebuffer
		gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
		gl.bindTexture(gl.TEXTURE_2D, targetTexture);
		gl.clearColor(0, 0, 1, 1);   // clear to blue
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
		//gl.viewport(0, 0,targetWidth,targetHeight);
		gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
    	gl.bindFramebuffer(gl.FRAMEBUFFER, null);
		draw(); //loop
	}, 60);
	};
	draw();
}


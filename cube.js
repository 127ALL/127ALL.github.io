var cubeRotation = 0.0;
var is_done = false;
// will set to true when video can be copied to texture

// Vertex shader program

const vsSource = `
  attribute vec4 vertex;
  attribute vec3 normal;
  attribute vec2 uv;
  uniform mat4 normalMatrix;
  uniform mat4 modelViewMatrix;
  uniform mat4 projectionMatrix;
  varying highp vec2 _uv;
  varying highp vec3 _light;
  void main(void) {
    _uv = uv;
    
    gl_Position = projectionMatrix * modelViewMatrix * vertex;
    // Apply lighting effect
    highp vec3 ambient = vec3(0.3, 0.3, 0.3);
    highp vec3 directionalLightColor = vec3(1, 1, 1);
    highp vec3 directionalVector = normalize(vec3(0.85, 0.8, 0.75));
    highp vec4 transformedNormal = normalMatrix * vec4(normal, 1.0);
    highp float directional = max(dot(transformedNormal.xyz, directionalVector), 0.0);
    _light = ambient + (directionalLightColor * directional);
  }
`;

// Fragment shader program

const fsSource = `
  varying highp vec2 _uv;
  varying highp vec3 _light;
  uniform sampler2D sampler;
  void main(void) {
    highp vec4 color = texture2D(sampler, _uv);
    gl_FragColor = vec4(color.rgb * _light, color.a);
  }
`;


function renderVideosToCubes(video_urls) {
is_done = false;
  var canvas = document.getElementById('glcanvas');
    var gl = canvas.getContext('experimental-webgl');

  var shaderProgram = createShader(gl, vsSource, fsSource);
  
  var programInfo = {
    program: shaderProgram,
    attrib: {
      vertex: gl.getAttribLocation(shaderProgram, 'vertex'),
      normal: gl.getAttribLocation(shaderProgram, 'normal'),
      uv: gl.getAttribLocation(shaderProgram, 'uv'),
    },
    uniform: {
      projectionMatrix: gl.getUniformLocation(shaderProgram, 'projectionMatrix'),
      modelViewMatrix: gl.getUniformLocation(shaderProgram, 'modelViewMatrix'),
      normalMatrix: gl.getUniformLocation(shaderProgram, 'normalMatrix'),
      sampler: gl.getUniformLocation(shaderProgram, 'sampler'),
    },
  };

  // Here's where we call the routine that builds all the
  // objects we'll be drawing.
  const buffers = initBuffers(gl);
  var videos = [];
  var texture = initTexture(gl);
  
  for(var i =0; i < video_urls.length; i++){
    var  j = video_urls[i].lastIndexOf(".");      
    var ext = video_urls[i].substr(j+1,video_urls[i].length);
    if(ext == 'mp4' || ext == 'webm')
      videos.push( setupVideo(video_urls[i]));

  }
  var then = 0;

  // Draw the scene repeatedly
  function render(now) {
    now *= 0.001;  // convert to seconds
    const deltaTime = now - then;
    then = now;

    gl.clearColor(0.0, 0.0, 0.0, 1.0);  // Clear to black, fully opaque
    gl.clearDepth(1.0);                 // Clear everything
    gl.enable(gl.DEPTH_TEST);           // Enable depth testing
    gl.depthFunc(gl.LEQUAL);            // Near things obscure far things

    // Clear the canvas before we start drawing on it.

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    const fieldOfView = 45 * Math.PI / 180;   // in radians
    const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    const zNear = 0.1;
    const zFar = 100.0;
    const projectionMatrix = mat4.create();

    // note: glmatrix.js always has the first argument
    // as the destination to receive the result.
    mat4.perspective(projectionMatrix,
                     fieldOfView,
                     aspect,
                     zNear,
                     zFar);
  //FOR EACH video draw cube CUBE DO
      for(var i =0; i < videos.length; i++){
        updateTexture(gl, texture, videos[i]);
        // Set the drawing position to the "identity" point, which is
        // the center of the scene.
        const modelViewMatrix = mat4.create();

        // Now move the drawing position a bit to where we want to
        // start drawing the square.

        mat4.translate(modelViewMatrix,modelViewMatrix, [Math.sin(i*3.14/2), Math.sin(i*3.14/2), -6.0+(i*0.1)]);
        mat4.rotate(modelViewMatrix,modelViewMatrix,cubeRotation*(i+1)*0.01,[0, 0, 1]);       
        mat4.rotate(modelViewMatrix,modelViewMatrix,cubeRotation * .7*(i+1)*0.01,[0, 1, 0]);      

        const normalMatrix = mat4.create();
        mat4.invert(normalMatrix, modelViewMatrix);
        mat4.transpose(normalMatrix, normalMatrix);

        draw(gl, programInfo, buffers, texture, deltaTime,projectionMatrix,modelViewMatrix,normalMatrix);
      }
  //END FOR EACH
	if(!is_done)
      	requestAnimationFrame(render);
    }
  requestAnimationFrame(render);
}

function setupVideo(url) {
  var video= document.createElement('video');
    video.autoplay = true;
       // video.muted = true;
        video.loop = true;
        video.src = url;
        video.play();
        return video;
 }

function draw(gl, programInfo, buffers, texture, deltaTime, projectionMatrix, modelViewMatrix, normalMatrix) {
  {
    const numComponents = 3;
    const type = gl.FLOAT;
    const normalize = false;
    const stride = 0;
    const offset = 0;
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.vertex);
    gl.vertexAttribPointer(
        programInfo.attrib.vertex,
        numComponents,
        type,
        normalize,
        stride,
        offset);
    gl.enableVertexAttribArray(
        programInfo.attrib.vertex);
  }

  {
    const numComponents = 2;
    const type = gl.FLOAT;
    const normalize = false;
    const stride = 0;
    const offset = 0;
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.uv);
    gl.vertexAttribPointer(
        programInfo.attrib.uv,
        numComponents,
        type,
        normalize,
        stride,
        offset);
    gl.enableVertexAttribArray(
        programInfo.attrib.uv);
  }

  // Tell WebGL how to pull out the normals from
  // the normal buffer into the vertexNormal attribute.
  {
    const numComponents = 3;
    const type = gl.FLOAT;
    const normalize = false;
    const stride = 0;
    const offset = 0;
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.normal);
    gl.vertexAttribPointer(programInfo.attrib.normal,3,gl.FLOAT,false,0,0);
    gl.enableVertexAttribArray(
        programInfo.attrib.normal);

    
  }

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indices);


  gl.useProgram(programInfo.program);
  gl.uniformMatrix4fv(programInfo.uniform.projectionMatrix,false,projectionMatrix);
  gl.uniformMatrix4fv(programInfo.uniform.modelViewMatrix,false,modelViewMatrix);
  gl.uniformMatrix4fv(programInfo.uniform.normalMatrix,false,normalMatrix);

  gl.activeTexture(gl.TEXTURE0);
  // bind texture to TEX 0
  gl.bindTexture(gl.TEXTURE_2D, texture);
  // bind sampler to TEX 0
  gl.uniform1i(programInfo.uniform.sampler, 0);

  gl.drawElements(gl.TRIANGLES, 36, gl.UNSIGNED_SHORT, 0);

  cubeRotation += deltaTime;
}
function initBuffers(gl) {

  const vertex = [
    // Front face
    -1.0, -1.0,  1.0,
     1.0, -1.0,  1.0,
     1.0,  1.0,  1.0,
    -1.0,  1.0,  1.0,

    // Back face
    -1.0, -1.0, -1.0,
    -1.0,  1.0, -1.0,
     1.0,  1.0, -1.0,
     1.0, -1.0, -1.0,

    // Top face
    -1.0,  1.0, -1.0,
    -1.0,  1.0,  1.0,
     1.0,  1.0,  1.0,
     1.0,  1.0, -1.0,

    // Bottom face
    -1.0, -1.0, -1.0,
     1.0, -1.0, -1.0,
     1.0, -1.0,  1.0,
    -1.0, -1.0,  1.0,

    // Right face
     1.0, -1.0, -1.0,
     1.0,  1.0, -1.0,
     1.0,  1.0,  1.0,
     1.0, -1.0,  1.0,

    // Left face
    -1.0, -1.0, -1.0,
    -1.0, -1.0,  1.0,
    -1.0,  1.0,  1.0,
    -1.0,  1.0, -1.0,
  ];

  const normals = [
    // Front
     0.0,  0.0,  1.0,
     0.0,  0.0,  1.0,
     0.0,  0.0,  1.0,
     0.0,  0.0,  1.0,

    // Back
     0.0,  0.0, -1.0,
     0.0,  0.0, -1.0,
     0.0,  0.0, -1.0,
     0.0,  0.0, -1.0,

    // Top
     0.0,  1.0,  0.0,
     0.0,  1.0,  0.0,
     0.0,  1.0,  0.0,
     0.0,  1.0,  0.0,

    // Bottom
     0.0, -1.0,  0.0,
     0.0, -1.0,  0.0,
     0.0, -1.0,  0.0,
     0.0, -1.0,  0.0,

    // Right
     1.0,  0.0,  0.0,
     1.0,  0.0,  0.0,
     1.0,  0.0,  0.0,
     1.0,  0.0,  0.0,

    // Left
    -1.0,  0.0,  0.0,
    -1.0,  0.0,  0.0,
    -1.0,  0.0,  0.0,
    -1.0,  0.0,  0.0,
  ];

  var uv = [
    // Front
    0.0,  0.0,
    1.0,  0.0,
    1.0,  1.0,
    0.0,  1.0,
    // Back
    0.0,  0.0,
    1.0,  0.0,
    1.0,  1.0,
    0.0,  1.0,
    // Top
    0.0,  0.0,
    1.0,  0.0,
    1.0,  1.0,
    0.0,  1.0,
    // Bottom
    0.0,  0.0,
    1.0,  0.0,
    1.0,  1.0,
    0.0,  1.0,
    // Right
    0.0,  0.0,
    1.0,  0.0,
    1.0,  1.0,
    0.0,  1.0,
    // Left
    0.0,  0.0,
    1.0,  0.0,
    1.0,  1.0,
    0.0,  1.0,
  ];


  const indices = [
    0,  1,  2,      0,  2,  3,    // front
    4,  5,  6,      4,  6,  7,    // back
    8,  9,  10,     8,  10, 11,   // top
    12, 13, 14,     12, 14, 15,   // bottom
    16, 17, 18,     16, 18, 19,   // right
    20, 21, 22,     20, 22, 23,   // left
  ];

  //Setup cube buffers
  const vertexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertex), gl.STATIC_DRAW);

  const normalBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals),gl.STATIC_DRAW);

  var uvBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(uv),
                gl.STATIC_DRAW);


  const indexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,
      new Uint16Array(indices), gl.STATIC_DRAW);

  return {
    vertex: vertexBuffer,
    normal: normalBuffer,
    uv: uvBuffer,
    indices: indexBuffer,
  };
}

function initTexture(gl) {
  var texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);

  var pixel = new Uint8Array([0, 0, 255, 255]);  // opaque blue
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA,
                1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
                pixel);

  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

  return texture;
}

function updateTexture(gl, texture, video) {
  gl.bindTexture(gl.TEXTURE_2D, texture);
// copy the video  canvas to gl texure
  try{
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA,
                gl.RGBA, gl.UNSIGNED_BYTE, video);
  }
  catch(error)
  {
    console.log(error);
  }
}

function isPowerOf2(value) {
  return (value & (value - 1)) == 0;
}


function createShader(gl, vSource, fSource) {
  const vShader = loadShader(gl, gl.VERTEX_SHADER, vSource);
  const fShader = loadShader(gl, gl.FRAGMENT_SHADER, fSource);
  const program  = gl.createProgram();
  if(program){
    gl.attachShader(program, vShader);
    gl.attachShader(program, fShader);
    gl.linkProgram(program );
  }
  // If creating the shader program failed, alert

  if (!gl.getProgramParameter(program , gl.LINK_STATUS)) {
    console.log('LINK ERROR: ' + gl.getProgramInfoLog(program ));
    program = null;
  }

  return program;
}

function loadShader(gl, type, source) {
  var shader = gl.createShader(type);

  gl.shaderSource(shader, source);

  gl.compileShader(shader);

  
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.log('COMPILE ERROR: ' + gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    shader = null;
  }
  return shader;
}


/**
 * @author Rick Battagline / https://embed.com/wasm
 */

import {
  WebGLShader, shaderSource, createShader, compileShader, 
  VERTEX_SHADER, FRAGMENT_SHADER, createProgram, WebGLProgram,
  attachShader, useProgram, WebGLUniformLocation, getUniformLocation,
  linkProgram, clearColor, clear, imageReady,
  createBuffer, ARRAY_BUFFER, 
  createTexture, createImage, ImageData, pixelStorei, activeTexture,
  bindTexture, texParameteri, texImage2D, uniform1i, 
  DYNAMIC_DRAW, FLOAT, COLOR_BUFFER_BIT, DEPTH_TEST, DEPTH_BUFFER_BIT,
  UNPACK_FLIP_Y_WEBGL, UNPACK_PREMULTIPLY_ALPHA_WEBGL, TEXTURE0, TEXTURE1, 
  TEXTURE_2D, TEXTURE_MIN_FILTER, LINEAR, TEXTURE_MAG_FILTER, RGB, UNSIGNED_BYTE,
  enableVertexAttribArray, bindBuffer, createContextFromCanvas,
  bufferData, getAttribLocation, drawArrays, enable, depthFunc,
  vertexAttribPointer, TRIANGLES, GREATER, uniform3f,
} from '../../webgl'


import {
  objArray, matArray, groupArray, VertGroup, matMapArray, MaterialMap
} from './Moon_Sphere'

// OG CODE
const VERTEX_SHADER_CODE:string = `#version 300 es
precision highp float;

in vec3 position;
in vec3 normal;
in vec2 tex_uv;

out vec3 cam_dir;
out vec3 light_dir;
out vec2 tc;
out vec3 norm;

void main() {
  // rotate z axis
  
    mat4 mRotateTranslate = mat4(
       1.0, 0.0,       0.0,        0.0, // column 1
       0.0, cos(-0.2),-sin(-0.2), -0.2, // column 2
       0.0, sin(-0.0), cos(-0.2),  0.0, // column 3
       0.0, 0.0,       0.0,        1.0  // column 4
    );
  
  vec3 up = vec3(0.0, -1.0, 0.0);
  vec3 light_pos = vec3( 0.0, -0.7, 0.5 );
  float d = dot( up, normal ); 

  vec3 tan = cross( up, normal );
  vec3 bitan = cross( normal, tan );

  vec3 l;
  l.x = dot( tan, light_pos );
  l.y = dot( bitan, light_pos );
  l.z = dot( normal, light_pos );

  light_dir = l; //normalize(l);

  vec3 camera;
  camera.x = dot( tan, position );
  camera.y = dot( bitan, position );
  camera.z = dot( normal, position );

  cam_dir = normalize(camera);
  tc = tex_uv;
  norm = normal;

  gl_Position = vec4(position, 1.0);
}`;

// this shader is super kludgy
const FRAGMENT_SHADER_CODE:string = `#version 300 es
precision highp float;
uniform sampler2D normalMap;
uniform sampler2D sampler;

in vec3 cam_dir;
in vec3 light_dir;
in vec2 tc;
in vec3 norm;

out vec4 color;
void main (void)
{
	vec3 l = normalize(light_dir);
	vec3 e = normalize(-cam_dir);
	vec3 n = 2.0 * texture(normalMap, tc).rgb - 1.0;

	float kd = clamp(dot(l, n + norm - vec3(0.0, 0.0, 1.0)), 0.1, 1.0);

	vec3 tex_color = texture(sampler, tc).rgb;
	vec3 c = kd * tex_color;

  color = vec4( c, 1.0 );
}`;


  // initialize webgl
  var gl = createContextFromCanvas('cnvs', 'webgl2');

  let vertex_shader: WebGLShader = createShader(this.gl, VERTEX_SHADER);
  shaderSource(gl, vertex_shader, VERTEX_SHADER_CODE);
  compileShader(gl, vertex_shader);

  let fragment_shader: WebGLShader = createShader(gl, FRAGMENT_SHADER);
  shaderSource( gl, fragment_shader, FRAGMENT_SHADER_CODE);
  compileShader( gl, fragment_shader );

  let program = createProgram(gl);

  attachShader(gl, program, vertex_shader);
  attachShader(gl, program, fragment_shader);

  linkProgram( gl, program );

  useProgram( gl, program );

  let buffer = createBuffer(gl);
  bindBuffer(gl, ARRAY_BUFFER, buffer);

  let position_al = getAttribLocation(gl, program, 'position');
  enableVertexAttribArray(gl, position_al);

  let tex_uv_al = getAttribLocation(gl, program, 'tex_uv');
  enableVertexAttribArray(gl, tex_uv_al);

  let normal_al = getAttribLocation(gl, program, 'normal');
  enableVertexAttribArray(gl, normal_al);

//  let diffuse = getUniformLocation( gl, program, 'diffuse' );

  let texture = createTexture(gl);
  let sampler = getUniformLocation( gl, program, 'sampler' );

  let texture_n = createTexture(gl);
  let tex_norm = getUniformLocation( gl, program, 'normalMap' );

  var image_id: ImageData = createImage(<string>matMapArray[0].diffuse);
  var norm_image_id: ImageData = createImage(<string>matMapArray[0].bump);

  var image_ready: bool = false;

//diffuse
  enable(gl, DEPTH_TEST);

function rotate(theta: f32) : void { //u32 {
  for( var obj_i: i32 = 0; obj_i < objArray.length; obj_i++ ) {
    for( var coord_i: i32 = 0; coord_i < objArray[obj_i].length; coord_i += 8 ) {

      let x:f32 = objArray[obj_i][coord_i];
      let z:f32 = objArray[obj_i][coord_i+2];

      let nx:f32 = objArray[obj_i][coord_i+5];
      let nz:f32 = objArray[obj_i][coord_i+7];

      let x1:f32 = x * Mathf.cos(theta) + z * Mathf.sin(theta);
      let z1:f32 = z * Mathf.cos(theta) - x * Mathf.sin(theta);

      let nx1:f32 = nx * Mathf.cos(theta) + nz * Mathf.sin(theta);
      let nz1:f32 = nz * Mathf.cos(theta) - nx * Mathf.sin(theta);

      objArray[obj_i][coord_i] = x1;
      objArray[obj_i][coord_i+2] = z1;

      objArray[obj_i][coord_i+5] = nx1;
      objArray[obj_i][coord_i+7] = nz1;
    }
  }

  return;
}

  var vGroup: VertGroup;
  export function displayLoop(delta:i32):void {
    let r: f32 = <f32>delta / 10000.0;
    rotate(r);

    clearColor(gl, 0.0, 0.0, 0.0, 1.0);
    clear(gl, COLOR_BUFFER_BIT | DEPTH_BUFFER_BIT);

    if( image_ready == false ) {
      if( imageReady(image_id) == false || imageReady(norm_image_id) == false ) {
        return;
      }

      pixelStorei(gl, UNPACK_FLIP_Y_WEBGL, 1);
      pixelStorei(gl, UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
      activeTexture(gl, TEXTURE0);
      bindTexture(gl, TEXTURE_2D, texture);
      texParameteri(gl, TEXTURE_2D, TEXTURE_MIN_FILTER, LINEAR);
      texParameteri(gl, TEXTURE_2D, TEXTURE_MAG_FILTER, LINEAR);
      texImage2D(gl,  TEXTURE_2D, 0,     RGB, RGB, UNSIGNED_BYTE, image_id);

      activeTexture(gl, TEXTURE1);
      bindTexture(gl, TEXTURE_2D, texture_n);
      texParameteri(gl, TEXTURE_2D, TEXTURE_MIN_FILTER, LINEAR);
      texParameteri(gl, TEXTURE_2D, TEXTURE_MAG_FILTER, LINEAR);
      texImage2D(gl,  TEXTURE_2D, 0,     RGB, RGB, UNSIGNED_BYTE, norm_image_id);

      uniform1i(gl, sampler, 0);
      image_ready = true;
    }

    for( var g_i: i32 = 0; g_i < groupArray.length; g_i++ ) {
      vGroup = groupArray[g_i];
      bufferData<f32>(gl, ARRAY_BUFFER, objArray[vGroup.obj_index], DYNAMIC_DRAW);
/*
      let diffuse_r: f32 = matArray[vGroup.mat_index][4];
      let diffuse_g: f32 = matArray[vGroup.mat_index][5];
      let diffuse_b: f32 = matArray[vGroup.mat_index][6];
      uniform3f(gl, diffuse, diffuse_r, diffuse_g, diffuse_b); 
*/
      //                                   dimensions | data_type | normalize | stride | offset
      vertexAttribPointer(gl, position_al, 3,           FLOAT,      false,      32,      0);
      vertexAttribPointer(gl, tex_uv_al,   2,           FLOAT,      false,      32,      12);
      vertexAttribPointer(gl, normal_al,   3,           FLOAT,      false,      32,      20);
      drawArrays(gl, TRIANGLES, vGroup.start_face, vGroup.length);
    }
  }
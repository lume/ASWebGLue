/**
 * @author Rick Battagline / https://embed.com/wasm
 */

import {
  WebGLShader, shaderSource, createShader, compileShader,
  VERTEX_SHADER, FRAGMENT_SHADER, createProgram, WebGLProgram,
  attachShader, useProgram, WebGLUniformLocation, getUniformLocation,
  linkProgram, clearColor, clear,
  createBuffer, ARRAY_BUFFER,
  DYNAMIC_DRAW, FLOAT, COLOR_BUFFER_BIT,
  enableVertexAttribArray, bindBuffer, createContextFromCanvas,
  bufferData, getAttribLocation, drawArrays,
  vertexAttribPointer, TRIANGLE_STRIP,
} from '../../webgl'

const VERTEX_SHADER_CODE: string = `#version 300 es
  precision highp float;

  layout(location = 0) in vec2 position;
  layout(location = 1) in vec3 color;
  out vec4 c;
  
  void main() {
    gl_Position = vec4( position, 0.0, 1.0 );
    c = vec4(color, 1.0);
  }
`;
// THIS IS THE FRAGMENT SHADER
const FRAGMENT_SHADER_CODE: string = `#version 300 es
  precision highp float;
  in vec4 c;
  out vec4 color;

  void main() {
    color = c;
  }
`;

// initialize webgl
var gl = createContextFromCanvas('cnvs', 'webgl2');

let vertex_shader: WebGLShader = createShader(gl, VERTEX_SHADER);
shaderSource(gl, vertex_shader, VERTEX_SHADER_CODE);
compileShader(gl, vertex_shader);

let fragment_shader: WebGLShader = createShader(gl, FRAGMENT_SHADER);
shaderSource(gl, fragment_shader, FRAGMENT_SHADER_CODE);
compileShader(gl, fragment_shader);

let program = createProgram(gl);

attachShader(gl, program, vertex_shader);
attachShader(gl, program, fragment_shader);

linkProgram(gl, program);

useProgram(gl, program);

let buffer = createBuffer(gl);
bindBuffer(gl, ARRAY_BUFFER, buffer);

let position_al = getAttribLocation(gl, program, 'position');

let color_al = getAttribLocation(gl, program, 'color');

//                                   X    Y      R     G     B   
let line_data: StaticArray<f32> = [0.0, 0.5, 1.0, 0.0, 0.0,
  -0.55, -0.5, 0.0, 1.0, 0.0,
  0.55, -0.5, 0.0, 0.0, 1.0,
];

enableVertexAttribArray(gl, position_al);
enableVertexAttribArray(gl, color_al);



function rotate(theta: f32): void { //u32 {

  for (var coord_i: i32 = 0; coord_i < line_data.length; coord_i += 5) {
    let x: f32 = line_data[coord_i];
    let y: f32 = line_data[coord_i + 1];

    let x1: f32 = x * Mathf.cos(theta) - y * Mathf.sin(theta);

    let y1: f32 = y * Mathf.cos(theta) + x * Mathf.sin(theta);

    line_data[coord_i] = x1;
    line_data[coord_i + 1] = y1;
  }
  return;
}
export function displayLoop(delta: i32): void {
  let r: f32 = <f32>delta / 10000.0;
  rotate(r);

  clearColor(gl, 0.0, 0.0, 0.0, 1.0);
  clear(gl, COLOR_BUFFER_BIT);

  bufferData<f32>(gl, ARRAY_BUFFER, line_data, DYNAMIC_DRAW);

  //vertexAttribPointer     attribute |  dimensions | data type | normalize | stride bytes | offset bytes
  vertexAttribPointer(gl, position_al, 2, FLOAT, false, 20, 0);
  vertexAttribPointer(gl, color_al, 3, FLOAT, false, 20, 8);

  drawArrays(gl, TRIANGLE_STRIP, 0, line_data.length / 5);

}
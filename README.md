# 3D Motion, Lighting, and Shading in WebGL
A demonstration of Phong/Blinn-Phong lighting and Phong/Gouraud shading in 3D graphics using WebGL. The program also supports movement through the 3D space; strafing, climbing, and panning are all implemented.
## Motivation
This was my final project for COMP_SCI 351-1: Intro to Graphics at Northwestern University. The project centered around experimenting with lighting and shading techniques.
## Languages and libraries used
The webpage is written just with HTML and JS, but much of the JS is using the WebGL library which interfaces directly with the GPU. In order to use WebGL in JS, there are also shaders (represented as strings in the JS) written in GLSL (OpenGL Shading Language).
## How to use?
The project is hosted live on GitHub Pages and can be found [here](https://henrypereira.github.io/3d-graphics-and-lighting/). There are many input options beneath the graphics display where you can play with the different lighting inputs. You can also change the material used for the main sphere. Furthermore, you can move the camera and change its viewing direction with the WASD and arrow keys respectively.
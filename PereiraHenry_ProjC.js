var gl;
var g_canvasID = document.getElementById("webgl");
var worldBox = new VBObox0();
var gouraudBox = new VBObox1();
var phongBox = new VBObox2();
var otherBox = new VBObox3();
var g_lastMS = Date.now();
var g_worldMat = new Matrix4();

var g_show = {
    "world": 1,
    "gouraud": 1,
    "phong": 0
}

var g_Camera = {
    "x": -5.7,
    "y": -9.8,
    "z": 6.1,
    "theta": 64.0,
    "tilt": -0.5,
    "v": 0.1
}

var g_Angles = {
    "sphere": {
        "now": 0.0,
        "rate": 10.0
    },
    "worm": {
        "now": 0.0,
        "rate": 5.0,
        "min": -5.0,
        "max": 5.0,
    }
}

var g_LightPosition = {
    "x": 5.0,
    "y": 5.0,
    "z": 5.0
}

var g_LightColor = {
    "r": 1.0,
    "g": 1.0,
    "b": 1.0
}

var g_AmbientColor = {
    "r": 1.0,
    "g": 1.0,
    "b": 1.0
}

var g_SpecularColor = {
    "r": 1.0,
    "g": 1.0,
    "b": 1.0
}

var oldLights = {
    "ambient": {"r": 1.0,
                "g": 1.0,
                "b": 1.0},
    "specular": {"r": 1.0,
                 "g": 1.0,
                 "b": 1.0}
}

var g_Material = {
    "Kd": new Float32Array([0.780392, 0.568627, 0.113725]),
    "Ka": new Float32Array([0.329412, 0.223529, 0.027451]),
    "Ks": new Float32Array([0.992157, 0.941176, 0.807843]),
    "Se": 27.8974
}

var g_isBlinnPhong = 0.0;

function main() {
    drawResize();
    gl = g_canvasID.getContext("webgl", {preserveDrawingBuffer: true});

    if (!gl) {
        console.log('Failed to get the rendering context for WebGL');
        return;
    }
    gl.clearColor(0.2, 0.2, 0.2, 1);
    
    gl.enable(gl.DEPTH_TEST);
    
    worldBox.init(gl);                   
    gouraudBox.init(gl);
    phongBox.init(gl);
    otherBox.init(gl);

    setCamera();
    window.addEventListener("keydown", handleKeyDown);

    const tick = function() {
        // timerAll();
        setCamera();
        animateAll();
        drawAll();
        requestAnimationFrame(tick, g_canvasID);
    };
    tick();
}

function animateAll() {
    const nowMS = Date.now();
    let elapsedMS = nowMS - g_lastMS;
    g_lastMS = nowMS;
    if(elapsedMS > 1000.0) {            
        elapsedMS = 1000.0/30.0;
    }
    g_Angles.sphere.now += (g_Angles.sphere.rate * elapsedMS) / 1000.0;
    g_Angles.sphere.now %= 360.0;
    g_Angles.worm.now += (g_Angles.worm.rate * elapsedMS) / 1000.0;
    g_Angles.worm.now %= 360.0;
    if(g_Angles.worm.now >= g_Angles.worm.max) {
        g_Angles.worm.rate *= -1;
        g_Angles.worm.now = g_Angles.worm.max;
    } else if(g_Angles.worm.now <= g_Angles.worm.min) {
        g_Angles.worm.rate *= -1;
        g_Angles.worm.now = g_Angles.worm.min;
    }
}

function drawAll() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    if(g_show.world == 1) {
        worldBox.switchToMe();
        worldBox.adjust();
        worldBox.draw();
    }
    if(g_show.gouraud == 1) {
        gouraudBox.switchToMe();
        gouraudBox.adjust();
        gouraudBox.draw();
    }
    if(g_show.phong == 1) {
        phongBox.switchToMe();
        phongBox.adjust();
        phongBox.draw();
    }
    otherBox.switchToMe();
    otherBox.adjust();
    otherBox.draw();
}

function handleKeyDown(key) {
    if(key.code == "KeyW") {
      // Move camera forward
      const eyeX = g_Camera.x;
      const eyeY = g_Camera.y;
      const eyeZ = g_Camera.z;
      const {aimX, aimY, aimZ} = computeAim();
      const {dispX, dispY, dispZ} = computeDisplacement(eyeX, eyeY, eyeZ,
                                                        aimX, aimY, aimZ,
                                                        g_Camera.v);
      g_Camera.x -= dispX;
      g_Camera.y -= dispY;
      g_Camera.z -= dispZ;
    } else if(key.code == "KeyS") {
      // Move camera backward
      const eyeX = g_Camera.x;
      const eyeY = g_Camera.y;
      const eyeZ = g_Camera.z;
      const {aimX, aimY, aimZ} = computeAim();
      const {dispX, dispY, dispZ} = computeDisplacement(eyeX, eyeY, eyeZ,
                                                        aimX, aimY, aimZ,
                                                        g_Camera.v);
      g_Camera.x += dispX;
      g_Camera.y += dispY;
      g_Camera.z += dispZ;
    } else if(key.code == "KeyA") {
      // Strafe camera left
      const eye = new Vector3([g_Camera.x, g_Camera.y, g_Camera.z]);
      const {aimX, aimY, aimZ} = computeAim(g_Camera);
      const aim = new Vector3([aimX, aimY, aimZ]);
      const forward = aim.subtract(eye);
      const up = new Vector3([0.0, 0.0, 1.0]);
      const right = up.cross(forward);
      g_Camera.x += right.elements[0] * g_Camera.v;
      g_Camera.y += right.elements[1] * g_Camera.v;
      g_Camera.z += right.elements[2] * g_Camera.v;
    } else if(key.code == "KeyD") {
      // Strafe camera right
      const eye = new Vector3([g_Camera.x, g_Camera.y, g_Camera.z]);
      const {aimX, aimY, aimZ} = computeAim(g_Camera);
      const aim = new Vector3([aimX, aimY, aimZ]);
      const forward = aim.subtract(eye);
      const up = new Vector3([0.0, 0.0, 1.0]);
      const right = up.cross(forward);
      g_Camera.x -= right.elements[0] * g_Camera.v;
      g_Camera.y -= right.elements[1] * g_Camera.v;
      g_Camera.z -= right.elements[2] * g_Camera.v;
    } else if(key.code == "ArrowLeft") {
      // Aim camera left
      g_Camera.theta += 1.0;
    } else if(key.code == "ArrowRight") {
      // Aim camera right
      g_Camera.theta -= 1.0;
    } else if(key.code == "ArrowUp") {
      // Aim camera up
      g_Camera.tilt += 0.025;
    } else if(key.code == "ArrowDown") {
      // Aim camera down
      g_Camera.tilt -= 0.025;
    } else if(key.code == "Comma"){
        g_Material.Se += 1.0;
        if(g_Material.Se > 200.0) {
            g_Material.Se = 200.0;
        }
    } else if(key.code == "Period"){
        g_Material.Se -= 1.0;
        if(g_Material.Se < 1.0) {
            g_Material.Se = 1.0;
        }
    } else {
      return;
    }
  }

const radians = (degrees) => degrees * Math.PI / 180.0;

function computeAim() {
    const eyeX = g_Camera.x;
    const eyeY = g_Camera.y;
    const eyeZ = g_Camera.z;
    const aimX = eyeX + Math.cos(radians(g_Camera.theta));
    const aimY = eyeY + Math.sin(radians(g_Camera.theta));
    const aimZ = eyeZ + g_Camera.tilt;
    return {aimX, aimY, aimZ};
}

function computeDisplacement(x0, y0, z0, x1, y1, z1, vel) {
    const dispX = (x0 - x1) * vel;
    const dispY = (y0 - y1) * vel;
    const dispZ = (z0 - z1) * vel;
    return {dispX, dispY, dispZ};
}

function setCamera() {
    gl.viewport(0, 0, g_canvasID.width, g_canvasID.height);
    const vpAspect = g_canvasID.width / g_canvasID.height;
    g_worldMat.setIdentity();
    g_worldMat.perspective(42.0,
                           vpAspect,
                           1.0,
                           200.0);
    const eyeX = g_Camera.x; 
    const eyeY = g_Camera.y; 
    const eyeZ = g_Camera.z;
    const {aimX, aimY, aimZ} = computeAim();
    g_worldMat.lookAt(eyeX, eyeY, eyeZ,
                      aimX, aimY, aimZ,
                      0.0, 0.0, 1.0);

}

function drawResize() {
    const extraMargin = 16;
    g_canvasID.width = innerWidth - extraMargin;
    g_canvasID.height = (innerHeight * .7) - extraMargin;
  }

function updateLightPosition() {
    const x = parseFloat(document.getElementById("light-x").value);
    const y = parseFloat(document.getElementById("light-y").value);
    const z = parseFloat(document.getElementById("light-z").value);
    g_LightPosition = {x, y, z};
}
function updateLightColor() {
    const r = parseFloat(document.getElementById("light-r").value);
    const g = parseFloat(document.getElementById("light-g").value);
    const b = parseFloat(document.getElementById("light-b").value);
    g_LightColor = {r, g, b};
}
function updateAmbientColor() {
    const r = parseFloat(document.getElementById("ambient-r").value);
    const g = parseFloat(document.getElementById("ambient-g").value);
    const b = parseFloat(document.getElementById("ambient-b").value);
    g_AmbientColor = {r, g, b};
}
function updateSpecularColor() {
    const r = parseFloat(document.getElementById("specular-r").value);
    const g = parseFloat(document.getElementById("specular-g").value);
    const b = parseFloat(document.getElementById("specular-b").value);
    g_SpecularColor = {r, g, b};
}

function updateMaterial() {
    const select = document.getElementById( "material" );
    const selection = select.options[ select.selectedIndex ].value
    if(selection == "red-plastic") {
        g_Material = {
            "Kd": new Float32Array([0.6, 0.0, 0.0]),
            "Ka": new Float32Array([0.1, 0.1, 0.1]),
            "Ks": new Float32Array([0.6, 0.6, 0.6]),
            "Se": 50.0
        }
    } else if(selection == "brass") {
        g_Material = {
            "Kd": new Float32Array([0.780392, 0.568627, 0.113725]),
            "Ka": new Float32Array([0.329412, 0.223529, 0.027451]),
            "Ks": new Float32Array([0.992157, 0.941176, 0.807843]),
            "Se": 27.8974
        }
    } else if(selection == "gold") {
        g_Material = {
            "Kd": new Float32Array([0.34615,  0.3143,   0.0903]),
            "Ka": new Float32Array([0.24725,  0.2245,   0.0645]),
            "Ks": new Float32Array([0.797357, 0.723991, 0.208006]),
            "Se": 83.2
        }
    } else if(selection == "chrome") {
        g_Material = {
            "Kd": new Float32Array([0.4,      0.4,      0.4]),
            "Ka": new Float32Array([0.25,     0.25,     0.25]),
            "Ks": new Float32Array([0.774597, 0.774597, 0.774597]),
            "Se": 76.8
        }
    }
    else if(selection == "green-plastic") {
        g_Material = {
            "Kd": new Float32Array([0.0,     0.6,    0.0]),
            "Ka": new Float32Array([0.05,    0.05,   0.05]),
            "Ks": new Float32Array([0.2,     0.2,    0.2]),
            "Se": 60.0
        }
    }
    else if(selection == "bronze") {
            g_Material = {
                "Kd": new Float32Array([0.4,      0.2368,   0.1036]),
                "Ka": new Float32Array([0.25,     0.148,    0.06475]),
                "Ks": new Float32Array([0.774597, 0.458561, 0.200621]),
                "Se": 76.8
            }
    }
    else if(selection == "copper") { MATL_COPPER_SHINY:
            g_Material = {
                "Kd": new Float32Array([0.5508,   0.2118,   0.066]),
                "Ka": new Float32Array([0.2295,   0.08825,  0.0275]),
                "Ks": new Float32Array([0.580594, 0.223257, 0.0695701]),
                "Se": 51.2
            }
    }
    else if(selection == "pewter") {
            g_Material = {
                "Kd": new Float32Array([0.427451, 0.470588, 0.541176]),
                "Ka": new Float32Array([0.105882, 0.058824, 0.113725]),
                "Ks": new Float32Array([0.333333, 0.333333, 0.521569]),
                "Se": 9.84615
            }
    }
    else if(selection == "silver") {
            g_Material = {
                "Kd": new Float32Array([0.2775,   0.2775,   0.2775]),
                "Ka": new Float32Array([0.23125,  0.23125,  0.23125]),
                "Ks": new Float32Array([0.773911, 0.773911, 0.773911]),
                "Se": 89.6
            }
    }
    else if(selection == "emerald") {
            g_Material = {
                "Kd": new Float32Array([0.07568, 0.61424,  0.07568]),
                "Ka": new Float32Array([0.0215,  0.1745,   0.0215]),
                "Ks": new Float32Array([0.633,   0.727811, 0.633]),
                "Se": 76.8
            }
    } 
}
function updateLighting() {
    const select = document.getElementById( "lighting" );
    const selection = select.options[ select.selectedIndex ].value;
    if(selection == "blinn-phong") {
        g_isBlinnPhong = 1.0;
    } else {
        g_isBlinnPhong = 0.0;
    }
}
function updateShading() {
    const select = document.getElementById( "shading" );
    const selection = select.options[ select.selectedIndex ].value;
    if(selection == "gouraud") {
        g_show.gouraud = 1;
        g_show.phong = 0;
    } else {
        g_show.gouraud = 0;
        g_show.phong = 1;
    }
}

function lightsOffOrOn() {
    if(document.getElementById("on-off").checked){
        oldLights.ambient = g_AmbientColor;
        oldLights.specular = g_SpecularColor;
        g_AmbientColor = {"r": 0.0, "g": 0.0, "b": 0.0};
        g_SpecularColor = {"r": 0.0, "g": 0.0, "b": 0.0};
    } else {
        g_AmbientColor = oldLights.ambient;
        g_SpecularColor = oldLights.specular;
    }
}
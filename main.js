import * as THREE from 'three';
import { OrbitControls, ThreeMFLoader, UnrealBloomPass } from 'three/examples/jsm/Addons.js';
import { clamp, normalize, randFloat, randInt } from 'three/src/math/MathUtils.js';
import {GUI} from 'lil-gui';
import { cameraPosition } from 'three/webgpu';



const scene = new THREE.Scene(); 
const renderer = new THREE.WebGLRenderer(); 


renderer.setSize( window.innerWidth, window.innerHeight ); 

const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 ); 

const controls = new OrbitControls(camera, renderer.domElement );

let settings = {
     lightSourceXPos: 3.0,
     lightSourceYPos: 5.0,
     lightSourceZPos: 3.0,
     lightIntensity: 1.0,
     mainColor: { r: 1.0, g: 1.0, b: 1.0},
     lightSourceColor: {r: 1.0, g: 1.0, b: 1.0},
     ambientLightColor: {r: 0.1, g: 0.1, b: 0.1},
     ambientLightIntensity: 0.5,
     shininessFactor: 32.0,
     shininessIntensity: 1.0,
}

let gui = new GUI({title: "Lighting settings"});
gui.add(settings, "lightIntensity", 0.0, 1.0);
gui.add(settings, "ambientLightIntensity", 0.0, 1.0);
gui.add(settings, "lightSourceXPos", -10.0, 10.0).onChange((val) => {
     lightSourcePos.x = val;
})
gui.add(settings, "lightSourceYPos", -10.0, 10.0).onChange((val) => {
     lightSourcePos.y = val;
});
gui.add(settings, "lightSourceZPos", -10.0, 10.0).onChange((val) => {
     lightSourcePos.z = val;
});

gui.add(settings, "shininessFactor", 1.0, 256);
gui.add(settings, "shininessIntensity", 0.0, 1.0);

gui.addColor(settings, "mainColor");
gui.addColor(settings, "lightSourceColor");
gui.addColor(settings, "ambientLightColor");
document.body.appendChild( renderer.domElement );


let lightSourcePos = new THREE.Vector3(3.0,5.0,3.0);
let directionalLightHelper = new THREE.Mesh(new THREE.SphereGeometry(), new THREE.MeshBasicMaterial({color: 0xffffff}));
scene.add(directionalLightHelper);

let lightDependentShaderMat = new THREE.ShaderMaterial({
     vertexShader: vertexShader(),
     fragmentShader: fragmentShader(),
     uniforms: {
          uLightSourcePos: {value: lightSourcePos},
          uLightIntensity: {value: settings.lightIntensity},
          uCameraPos: {value: camera.position},
          uMainColor: {value: settings.mainColor},
          uAmbientLightColor: {value: settings.ambientLightColor},
          uAmbientLightIntensity: {value: settings.ambientLightIntensity},
          uLightSourceColor: {value: settings.lightSourceColor},
          uShininessFactor: {value: settings.shininessFactor},
          uShininessIntensity: {value: settings.shininessIntensity},
     },
     transparent: true,
})

let sphere = new THREE.Mesh(new THREE.SphereGeometry(), lightDependentShaderMat);
scene.add(sphere);


camera.position.z = 5;


function animate() {

     directionalLightHelper.position.copy(lightSourcePos);
     lightDependentShaderMat.uniforms.uLightSourcePos.value = lightSourcePos;
     lightDependentShaderMat.uniforms.uLightIntensity.value = settings.lightIntensity;
     lightDependentShaderMat.uniforms.uCameraPos.value = camera.position;
     lightDependentShaderMat.uniforms.uMainColor.value = settings.mainColor;
     lightDependentShaderMat.uniforms.uAmbientLightColor.value = settings.ambientLightColor;
     lightDependentShaderMat.uniforms.uAmbientLightIntensity.value = settings.ambientLightIntensity;
     lightDependentShaderMat.uniforms.uLightSourceColor.value = settings.lightSourceColor;
     lightDependentShaderMat.uniforms.uShininessFactor.value = settings.shininessFactor;
     lightDependentShaderMat.uniforms.uShininessIntensity.value = settings.shininessIntensity;

     renderer.render( scene, camera ); 

     controls.update();

} 

renderer.setAnimationLoop( animate );

function vertexShader() {
     return `
          varying vec3 vUv; 
          varying vec3 vNormal;
          varying vec3 vLightDir;
          varying vec3 vViewDir;
          varying vec3 vReflectDir;

          uniform vec3 uLightSourcePos;
          uniform vec3 uCameraPos;
          
          void main() {

               vUv = position; 
               vNormal = normalize(normal);
               vLightDir = normalize(vUv - uLightSourcePos);
               vViewDir = normalize(vUv - uCameraPos);
               vReflectDir = reflect(vLightDir, vNormal);

               vec4 modelViewPosition = modelViewMatrix * vec4(vUv,1.0);
               gl_Position = projectionMatrix * modelViewPosition;
          }
     `
}
   
function fragmentShader() {
     return `

          varying vec3 vUv;
          varying vec3 vNormal;
          varying vec3 vLightDir;
          varying vec3 vViewDir;
          varying vec3 vReflectDir;

          uniform vec3 uMainColor;
          uniform vec3 uAmbientLightColor;
          uniform vec3 uLightSourceColor;

          uniform float uAmbientLightIntensity;
          uniform float uShininessFactor;
          uniform float uShininessIntensity;
          uniform float uLightIntensity;
   
          void main() {
     
               float diffuseScalar = abs(min(dot(vLightDir, vNormal),0.0));
               float specularScalar = pow(abs(min(dot(vViewDir, vReflectDir),0.0)), uShininessFactor);

               vec3 ambientColor = uAmbientLightColor * uAmbientLightIntensity;
               vec3 diffuseColor = uLightSourceColor * diffuseScalar * uLightIntensity;
               vec3 specularColor = specularScalar * uLightSourceColor * uLightIntensity * uShininessIntensity;
               gl_FragColor = vec4((diffuseColor + specularColor + ambientColor) * uMainColor, 1.0);
          }
     `
}

document.addEventListener("keydown", onDocumentKeyDown, false);
function onDocumentKeyDown(event) {
     
    var keyCode = event.which;
    if (keyCode == 72) { // 'h' ascii value
        gui.show(gui._hidden);
    }
};

window.addEventListener("resize", onWindowResize,false);

function onWindowResize() {

     camera.aspect = window.innerWidth / window.innerHeight;
     camera.updateProjectionMatrix();


     renderer.setSize( window.innerWidth, window.innerHeight ); 
     

}



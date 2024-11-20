import * as THREE from 'three';
import { OrbitControls, ThreeMFLoader, UnrealBloomPass } from 'three/examples/jsm/Addons.js';
import { clamp, normalize, randFloat, randInt } from 'three/src/math/MathUtils.js';
import {GUI} from 'lil-gui';



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
}

let gui = new GUI();
gui.add(settings, "lightIntensity", 0.0, 1.0);
gui.add(settings, "lightSourceXPos", -10.0, 10.0).onChange((val) => {
     lightSourcePos.x = val;
})
gui.add(settings, "lightSourceYPos", -10.0, 10.0).onChange((val) => {
     lightSourcePos.y = val;
});
gui.add(settings, "lightSourceZPos", -10.0, 10.0).onChange((val) => {
     lightSourcePos.z = val;
});

document.body.appendChild( renderer.domElement );


let lightSourcePos = new THREE.Vector3(3.0,5.0,3.0);

let lightDependentShaderMat = new THREE.ShaderMaterial({
     vertexShader: vertexShader(),
     fragmentShader: fragmentShader(),
     uniforms: {
          uLightSourcePos: {value: lightSourcePos},
          uLightIntensity: {Valie: settings.lightIntensity},
     },
     transparent: true,
})

let sphere = new THREE.Mesh(new THREE.SphereGeometry(), lightDependentShaderMat);
scene.add(sphere);


camera.position.z = 5;


function animate() {

     lightDependentShaderMat.uniforms.uLightSourcePos.value = lightSourcePos;
     lightDependentShaderMat.uniforms.uLightIntensity.value = settings.lightIntensity;
     renderer.render( scene, camera ); 

     controls.update();

} 

renderer.setAnimationLoop( animate );

function vertexShader() {
     return `
          varying vec3 vUv; 
          varying vec3 vNormal;
          varying vec3 vLightDir;

          uniform vec3 uLightSourcePos;
          
          void main() {

               vUv = position; 
               vNormal = normalize(normal);
               vLightDir = normalize(uLightSourcePos - vUv);

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

          uniform float uLightIntensity;
   
          void main() {
     
               float dirVal = dot(vLightDir, vNormal);
               gl_FragColor = vec4(vec3(dirVal * uLightIntensity), 1.0);
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



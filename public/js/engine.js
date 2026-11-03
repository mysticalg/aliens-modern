// Renderer, post-processing, quality presets, dynamic resolution, light pool.
import * as THREE from 'three';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {UnrealBloomPass} from 'three/addons/postprocessing/UnrealBloomPass.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';
import {GTAOPass} from 'three/addons/postprocessing/GTAOPass.js';
import {ShaderPass} from 'three/addons/postprocessing/ShaderPass.js';
import {BokehPass} from 'three/addons/postprocessing/BokehPass.js';
import {RGBELoader} from 'three/addons/loaders/RGBELoader.js';
export {THREE};
export const Q=new URLSearchParams(location.search);
export const TOUCH=('ontouchstart' in window)&&matchMedia('(pointer:coarse)').matches;
export const MOBILE=TOUCH||/Android|iPhone|iPad|Mobile/i.test(navigator.userAgent);
const PRESETS={
 low:{pr:.7,prMax:1,ao:false,bloom:true,shadow:512,lights:3,tex:'lo',particles:.5},
 medium:{pr:1,prMax:1.25,ao:false,bloom:true,shadow:1024,lights:5,tex:'',particles:.8},
 high:{pr:1,prMax:1.75,ao:true,bloom:true,shadow:2048,lights:6,tex:'',particles:1,cine:1,cone:1},
 ultra:{pr:1,prMax:2,ao:true,bloom:true,shadow:4096,lights:8,tex:'hi',particles:1.7,cine:2,cone:1,dof:1,reflect:1,dust:1,shadowLamps:1}};
export const QLIST=['low','medium','high','ultra'];
// GPU sniff: desktop RTX / RX 6000+ / Arc / Apple M-Pro class get Ultra by default
export const GPU=(()=>{try{const c=document.createElement('canvas').getContext('webgl2');const x=c.getExtension('WEBGL_debug_renderer_info');return x?c.getParameter(x.UNMASKED_RENDERER_WEBGL):c.getParameter(c.RENDERER)}catch(e){return''}})();
const STRONG=/RTX|RX ?[6-9]\d{3}|Radeon Pro W|Arc\(TM\) A[57]|Arc A[57]|GTX 1080|Apple M\d (Pro|Max|Ultra)/i.test(GPU);
let qn=Q.get('q')||localStorage.getItem('hive3d_q')||(MOBILE?'low':STRONG?'ultra':'high');if(!PRESETS[qn])qn='high';
export const E={q:qn,P:PRESETS[qn],dyn:1,ft:16,fps:60,frames:0,cine:false,focus:3,gpu:GPU};
export function setQuality(n){localStorage.setItem('hive3d_q',n);location.reload()}
export const canvas=document.getElementById('c');
export const renderer=new THREE.WebGLRenderer({canvas,antialias:E.q=='high'||E.q=='ultra',powerPreference:'high-performance',stencil:false});
renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.0;renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
export const scene=new THREE.Scene();scene.background=new THREE.Color(0x020304);scene.fog=new THREE.FogExp2(0x070a0c,.045);
export const camera=new THREE.PerspectiveCamera(60,1,.08,400);scene.add(camera);
// ---- lights (fixed counts: no shader recompiles) ----
export const hemi=new THREE.HemisphereLight(0x9ab0c0,0x1a1612,.35);scene.add(hemi);
export const flash=new THREE.SpotLight(0xfff2dd,60,30,.42,.45,1.6);flash.castShadow=true;flash.shadow.mapSize.set(E.P.shadow,E.P.shadow);flash.shadow.bias=-.0004;flash.shadow.normalBias=.02;flash.shadow.camera.near=.3;flash.shadow.camera.far=30;scene.add(flash,flash.target);
export const sun=new THREE.DirectionalLight(0x8899aa,0);sun.position.set(20,40,10);scene.add(sun,sun.target);
export const muzzle=new THREE.PointLight(0xffc070,0,7,1.8);scene.add(muzzle);
export const keyL=new THREE.SpotLight(0xffeedd,0,9,.5,.6,1.2);scene.add(keyL,keyL.target); // cutscene face key light
export const rimL=new THREE.PointLight(0x88aacc,0,6,1.5);scene.add(rimL);
export const pool=[];for(let i=0;i<E.P.lights;i++){const l=new THREE.PointLight(0xffffff,0,12,1.6);if(i<(E.P.shadowLamps||0)){l.castShadow=true;l.shadow.mapSize.set(512,512);l.shadow.bias=-.002;l.shadow.normalBias=.03;l.shadow.camera.near=.2;l.shadow.camera.far=14}scene.add(l);pool.push(l)}
export const fxPool=[];for(let i=0;i<2;i++){const l=new THREE.PointLight(0xff8840,0,10,1.6);scene.add(l);fxPool.push(l)} // explosions / flame
// registry of world light sources; nearest are assigned to the pool each frame
export const LS={list:[]};
export function lightSrc(o){const s=Object.assign({c:0xffffff,i:8,d:10,pulse:0,ph:Math.random()*6},o);s.col=new THREE.Color(s.c);LS.list.push(s);return s}
const _v=new THREE.Vector3();
export function updateLights(t,focus){const L=LS.list;for(const s of L){_v.set(s.p[0],s.p[1],s.p[2]);s.dd=_v.distanceToSquared(focus)}
 const sorted=L.slice().sort((a,b)=>a.dd-b.dd);
 for(let i=0;i<pool.length;i++){const l=pool[i],s=sorted[i];if(!s||s.off){l.intensity=0;continue}l.position.set(s.p[0],s.p[1],s.p[2]);l.color.copy(s.col);l.distance=s.d;
  // emergency pulse: slow smooth sine, never a strobe
  const k=s.pulse?(.55+.45*Math.sin(t*s.pulse+s.ph)):1;const fade=Math.min(1,Math.max(0,1.3-Math.sqrt(s.dd)/(s.d*2.2)));l.intensity=s.i*k*fade;if(s.flick){const a=Math.sin(t*1.7+s.ph),b=Math.sin(t*23+s.ph*3);if(a>.95)l.intensity*=.55+.25*(b>0?1:0);else if(a>.9)l.intensity*=.85}}}
// ---- environment ----
export async function loadEnv(){const tex=await new RGBELoader().loadAsync('tex/env.hdr');const pm=new THREE.PMREMGenerator(renderer);const rt=pm.fromEquirectangular(tex);scene.environment=rt.texture;scene.environmentIntensity=.25;tex.dispose();pm.dispose()}
// ---- composer ----
export const composer=new EffectComposer(renderer);
const rp=new RenderPass(scene,camera);composer.addPass(rp);
let ao=null;if(E.P.ao){ao=new GTAOPass(scene,camera,1,1);ao.output=GTAOPass.OUTPUT.Default;ao.blendIntensity=E.q=='ultra'?1:.85;ao.updateGtaoMaterial({radius:E.q=='ultra'?.65:.5,distanceExponent:1.5,thickness:1,scale:1});if(E.q=='ultra')ao.updatePdMaterial({lumaPhi:10,depthPhi:2,normalPhi:3,radius:4,rings:2,samples:8});{const _s=ao.setSize.bind(ao);ao.setSize=(w,h)=>_s(Math.max(1,w*.5|0),Math.max(1,h*.5|0))}composer.addPass(ao)}
// depth of field, cutscenes only (Ultra)
export const dof=E.P.dof?new BokehPass(scene,camera,{focus:3,aperture:.0035,maxblur:.006}):null;if(dof){dof.enabled=false;composer.addPass(dof)}
export const bloom=new UnrealBloomPass(new THREE.Vector2(256,256),E.q=='ultra'?.45:.45,.45,.88);if(E.P.bloom)composer.addPass(bloom);
composer.addPass(new OutputPass());
// cinematic finish: screen-space light shafts toward the brightest on-screen lamp, chromatic fringe, film grain, vignette.
const CineShader={uniforms:{tDiffuse:{value:null},uT:{value:0},uGrain:{value:.03},uCA:{value:.0012},uL:{value:new THREE.Vector2(.5,.5)},uLS:{value:0},uRes:{value:new THREE.Vector2(1,1)},uSteps:{value:E.q=='ultra'?24:12}},
 vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
 fragmentShader:`uniform sampler2D tDiffuse;uniform float uT,uGrain,uCA,uLS;uniform vec2 uL,uRes;uniform int uSteps;varying vec2 vUv;
 float h(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}
 void main(){vec2 d=vUv-.5;float r2=dot(d,d);vec2 o=d*uCA*(1.+r2*4.);
  vec3 c=vec3(texture2D(tDiffuse,vUv+o).r,texture2D(tDiffuse,vUv).g,texture2D(tDiffuse,vUv-o).b);
  if(uLS>.001){vec2 st=(vUv-uL)/float(uSteps)*.9;vec2 q=vUv;float w=1.;vec3 acc=vec3(0.);float j=h(vUv*uRes+uT);q-=st*j;
   for(int i=0;i<48;i++){if(i>=uSteps)break;q-=st;vec3 s=texture2D(tDiffuse,q).rgb;acc+=max(s-vec3(.75),0.)*w;w*=.955;}
   c+=acc/float(uSteps)*uLS*1.5;}
  float g=h(vUv*uRes+fract(uT*7.13)*91.)-.5;c+=g*uGrain*(1.-dot(c,vec3(.33))*.6);
  c*=1.-r2*.55;gl_FragColor=vec4(c,1.);}`};
export const cine=E.P.cine?new ShaderPass(CineShader):null;if(cine)composer.addPass(cine);
// volumetric flashlight cone (High/Ultra): additive, fades along the beam and at grazing angles
export const cone=E.P.cone?(()=>{const g=new THREE.ConeGeometry(1,1,40,8,true);g.translate(0,-.5,0);g.rotateX(-Math.PI/2);
 const m=new THREE.ShaderMaterial({uniforms:{uI:{value:0},uC:{value:new THREE.Color(0xfff0d8)}},transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide,fog:false,
  vertexShader:'varying float vZ;varying vec3 vN,vV;void main(){vZ=-position.z;vec4 mv=modelViewMatrix*vec4(position,1.);vV=normalize(-mv.xyz);vN=normalize(normalMatrix*normal);gl_Position=projectionMatrix*mv;}',
  fragmentShader:'uniform float uI;uniform vec3 uC;varying float vZ;varying vec3 vN,vV;void main(){float e=pow(abs(dot(vN,vV)),2.5);float a=(1.-vZ)*(1.-vZ)*e*uI*smoothstep(0.,.06,vZ);gl_FragColor=vec4(uC*a,a);}'});
 const c=new THREE.Mesh(g,m);c.frustumCulled=false;c.renderOrder=5;scene.add(c);return c})():null;
// drifting dust motes that catch the light (Ultra): gives the air volume
export const dust=E.P.dust?(()=>{const n=1400,g=new THREE.BufferGeometry(),p=new Float32Array(n*3);for(let i=0;i<n*3;i++)p[i]=(Math.random()-.5)*16;g.setAttribute('position',new THREE.BufferAttribute(p,3));
 const m=new THREE.PointsMaterial({size:.018,color:0x9aa4a8,transparent:true,opacity:.55,depthWrite:false,blending:THREE.AdditiveBlending,sizeAttenuation:true});const d=new THREE.Points(g,m);d.frustumCulled=false;scene.add(d);return d})():null;
const _p=new THREE.Vector3(),_q=new THREE.Vector3();
function cinematic(){const t=performance.now()/1000;
 if(cine){cine.uniforms.uT.value=t%100;const w=renderer.domElement.width,h=renderer.domElement.height;cine.uniforms.uRes.value.set(w,h);cine.uniforms.uCA.value=E.cine?.0018:.0011;cine.uniforms.uGrain.value=E.q=='ultra'?.032:.022;
  // brightest pool light in view drives the light shafts
  let best=0;camera.getWorldDirection(_q);for(const l of pool.concat(fxPool,[muzzle])){if(l.intensity<=0)continue;_p.copy(l.position).sub(camera.position);const D=_p.length();if(D<.6||D>16||_p.dot(_q)/D<.35)continue;const s=l.intensity/(1+D*D*.08);if(s>best){best=s;_p.copy(l.position).project(camera);cine.uniforms.uL.value.set(_p.x*.5+.5,_p.y*.5+.5)}}
  const tgt=Math.min(1,best/8)*(E.q=='ultra'?.7:.5);cine.uniforms.uLS.value+=(tgt-cine.uniforms.uLS.value)*.08}
 if(cone){const I=flash.intensity;cone.visible=I>1;if(cone.visible){const L=Math.min(flash.distance||20,11);cone.position.copy(flash.position);cone.lookAt(flash.target.position);const r=Math.tan(flash.angle)*L;cone.scale.set(r,r,L);cone.material.uniforms.uI.value=Math.min(1,I/60)*(E.q=='ultra'?.075:.05)*(scene.fog.density>.02?1.25:1)}}
 if(dust){const a=dust.geometry.attributes.position.array,cx=camera.position.x,cy=camera.position.y,cz=camera.position.z;
  // wrap motes around the camera (world-fixed, so they parallax properly)
  for(let i=0;i<a.length;i+=3){a[i+1]+=Math.sin(t*.4+i)*.0008;let d=a[i]-cx;if(d>8)a[i]-=16;else if(d<-8)a[i]+=16;d=a[i+1]-cy;if(d>3)a[i+1]-=6;else if(d<-3)a[i+1]+=6;d=a[i+2]-cz;if(d>8)a[i+2]-=16;else if(d<-8)a[i+2]+=16}
  dust.geometry.attributes.position.needsUpdate=true;dust.visible=scene.fog.density>.012}
 if(dof){dof.enabled=E.cine;if(E.cine){const u=dof.uniforms;u.focus.value+= (E.focus-u.focus.value)*.2;u.aperture.value=.0045;u.maxblur.value=.007}}}
export function resize(){const w=innerWidth,h=innerHeight;const pr=Math.min(devicePixelRatio||1,E.P.prMax)*E.P.pr*E.dyn;renderer.setPixelRatio(pr);composer.setPixelRatio(pr);renderer.setSize(w,h,false);composer.setSize(w,h);
 bloom.resolution.set(w*pr/2,h*pr/2);camera.aspect=w/h;camera.updateProjectionMatrix();E.portrait=h>w}
addEventListener('resize',resize);
// dynamic resolution: keep ~55+ fps by scaling the internal resolution
let acc=0,n=0,lastAdj=0;
export function frameStat(dt,now){E.ft=E.ft*.95+dt*1000*.05;E.fps=1000/E.ft;acc+=dt;n++;E.frames++;
 if(now-lastAdj>1500&&E.frames>60&&!Q.has('nodyn')){lastAdj=now;const tgt=MOBILE?34:17.5;let d=E.dyn;if(E.ft>tgt*1.12)d=Math.max(.5,d-.1);else if(E.ft<tgt*.8)d=Math.min(1,d+.05);if(d!=E.dyn){E.dyn=d;resize()}}}
export function render(){cinematic();composer.render()}

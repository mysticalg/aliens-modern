// Renderer, post-processing, quality presets, dynamic resolution, light pool.
import * as THREE from 'three';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {UnrealBloomPass} from 'three/addons/postprocessing/UnrealBloomPass.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';
import {GTAOPass} from 'three/addons/postprocessing/GTAOPass.js';
import {RGBELoader} from 'three/addons/loaders/RGBELoader.js';
export {THREE};
export const Q=new URLSearchParams(location.search);
export const TOUCH=('ontouchstart' in window)&&matchMedia('(pointer:coarse)').matches;
export const MOBILE=TOUCH||/Android|iPhone|iPad|Mobile/i.test(navigator.userAgent);
const PRESETS={
 low:{pr:.7,prMax:1,ao:false,bloom:true,shadow:512,lights:3,tex:'lo',particles:.5},
 medium:{pr:1,prMax:1.25,ao:false,bloom:true,shadow:1024,lights:5,tex:'',particles:.8},
 high:{pr:1,prMax:1.75,ao:true,bloom:true,shadow:2048,lights:6,tex:'',particles:1}};
let qn=Q.get('q')||localStorage.getItem('hive3d_q')||(MOBILE?'low':'high');if(!PRESETS[qn])qn='high';
export const E={q:qn,P:PRESETS[qn],dyn:1,ft:16,fps:60,frames:0};
export function setQuality(n){localStorage.setItem('hive3d_q',n);location.reload()}
export const canvas=document.getElementById('c');
export const renderer=new THREE.WebGLRenderer({canvas,antialias:E.q!='high'?false:true,powerPreference:'high-performance',stencil:false});
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
export const pool=[];for(let i=0;i<E.P.lights;i++){const l=new THREE.PointLight(0xffffff,0,12,1.6);scene.add(l);pool.push(l)}
export const fxPool=[];for(let i=0;i<2;i++){const l=new THREE.PointLight(0xff8840,0,10,1.6);scene.add(l);fxPool.push(l)} // explosions / flame
// registry of world light sources; nearest are assigned to the pool each frame
export const LS={list:[]};
export function lightSrc(o){const s=Object.assign({c:0xffffff,i:8,d:10,pulse:0,ph:Math.random()*6},o);s.col=new THREE.Color(s.c);LS.list.push(s);return s}
const _v=new THREE.Vector3();
export function updateLights(t,focus){const L=LS.list;for(const s of L){_v.set(s.p[0],s.p[1],s.p[2]);s.dd=_v.distanceToSquared(focus)}
 const sorted=L.slice().sort((a,b)=>a.dd-b.dd);
 for(let i=0;i<pool.length;i++){const l=pool[i],s=sorted[i];if(!s||s.off){l.intensity=0;continue}l.position.set(s.p[0],s.p[1],s.p[2]);l.color.copy(s.col);l.distance=s.d;
  // emergency pulse: slow smooth sine, never a strobe
  const k=s.pulse?(.55+.45*Math.sin(t*s.pulse+s.ph)):1;const fade=Math.min(1,Math.max(0,1.3-Math.sqrt(s.dd)/(s.d*2.2)));l.intensity=s.i*k*fade;if(s.flick&&Math.sin(t*1.7+s.ph)>.97)l.intensity*=.75}}
// ---- environment ----
export async function loadEnv(){const tex=await new RGBELoader().loadAsync('tex/env.hdr');const pm=new THREE.PMREMGenerator(renderer);const rt=pm.fromEquirectangular(tex);scene.environment=rt.texture;scene.environmentIntensity=.25;tex.dispose();pm.dispose()}
// ---- composer ----
export const composer=new EffectComposer(renderer);
const rp=new RenderPass(scene,camera);composer.addPass(rp);
let ao=null;if(E.P.ao){ao=new GTAOPass(scene,camera,1,1);ao.output=GTAOPass.OUTPUT.Default;ao.blendIntensity=.85;ao.updateGtaoMaterial({radius:.5,distanceExponent:1.5,thickness:1,scale:1});composer.addPass(ao)}
export const bloom=new UnrealBloomPass(new THREE.Vector2(256,256),.55,.5,.82);if(E.P.bloom)composer.addPass(bloom);
composer.addPass(new OutputPass());
export function resize(){const w=innerWidth,h=innerHeight;const pr=Math.min(devicePixelRatio||1,E.P.prMax)*E.P.pr*E.dyn;renderer.setPixelRatio(pr);composer.setPixelRatio(pr);renderer.setSize(w,h,false);composer.setSize(w,h);
 bloom.resolution.set(w*pr/2,h*pr/2);camera.aspect=w/h;camera.updateProjectionMatrix();E.portrait=h>w}
addEventListener('resize',resize);
// dynamic resolution: keep ~55+ fps by scaling the internal resolution
let acc=0,n=0,lastAdj=0;
export function frameStat(dt,now){E.ft=E.ft*.95+dt*1000*.05;E.fps=1000/E.ft;acc+=dt;n++;E.frames++;
 if(now-lastAdj>1500&&E.frames>60&&!Q.has('nodyn')){lastAdj=now;const tgt=MOBILE?34:17.5;let d=E.dyn;if(E.ft>tgt*1.12)d=Math.max(.5,d-.1);else if(E.ft<tgt*.8)d=Math.min(1,d+.05);if(d!=E.dyn){E.dyn=d;resize()}}}
export function render(){composer.render()}

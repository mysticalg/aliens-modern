// Particles (steam, sparks, acid, flame, smoke, rain), tracers, muzzle flashes, decals, camera shake, explosions.
import {THREE,scene,camera,muzzle,fxPool,E,MOBILE} from './engine.js?v=11';
const rnd=Math.random;
function spriteTex(kind){const c=document.createElement('canvas');c.width=c.height=64;const x=c.getContext('2d');
 if(kind=='soft'){const g=x.createRadialGradient(32,32,0,32,32,32);g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(.35,'rgba(255,255,255,.55)');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.fillRect(0,0,64,64)}
 if(kind=='smoke'){for(let i=0;i<14;i++){const px=18+rnd()*28,py=18+rnd()*28,r=10+rnd()*14;const g=x.createRadialGradient(px,py,0,px,py,r);g.addColorStop(0,'rgba(255,255,255,.22)');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.fillRect(0,0,64,64)}}
 if(kind=='hole'){const g=x.createRadialGradient(32,32,0,32,32,30);g.addColorStop(0,'rgba(0,0,0,1)');g.addColorStop(.22,'rgba(10,8,6,.95)');g.addColorStop(.4,'rgba(30,26,22,.55)');g.addColorStop(1,'rgba(0,0,0,0)');x.fillStyle=g;x.fillRect(0,0,64,64)}
 if(kind=='scorch'){const g=x.createRadialGradient(32,32,0,32,32,32);g.addColorStop(0,'rgba(0,0,0,.95)');g.addColorStop(.6,'rgba(8,6,4,.6)');g.addColorStop(1,'rgba(0,0,0,0)');x.fillStyle=g;x.fillRect(0,0,64,64)}
 if(kind=='acid'){for(let i=0;i<6;i++){const px=20+rnd()*24,py=20+rnd()*24,r=6+rnd()*12;const g=x.createRadialGradient(px,py,0,px,py,r);g.addColorStop(0,'rgba(40,60,8,.95)');g.addColorStop(.6,'rgba(90,120,20,.6)');g.addColorStop(1,'rgba(0,0,0,0)');x.fillStyle=g;x.fillRect(0,0,64,64)}}
 if(kind=='flash'){x.translate(32,32);for(let k=0;k<5;k++){x.rotate(Math.PI*2/5+rnd()*.3);const g=x.createLinearGradient(0,0,30,0);g.addColorStop(0,'rgba(255,240,200,1)');g.addColorStop(1,'rgba(255,140,40,0)');x.fillStyle=g;x.beginPath();x.moveTo(0,-4);x.lineTo(30,0);x.lineTo(0,4);x.fill()}
  const g=x.createRadialGradient(0,0,0,0,0,14);g.addColorStop(0,'rgba(255,255,240,1)');g.addColorStop(1,'rgba(255,180,80,0)');x.fillStyle=g;x.fillRect(-32,-32,64,64)}
 const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t}
const TX={soft:spriteTex('soft'),smoke:spriteTex('smoke'),hole:spriteTex('hole'),scorch:spriteTex('scorch'),acid:spriteTex('acid'),flash:spriteTex('flash')};
// ---- GPU point particle system (CPU-simulated) ----
class PSys{constructor(n,tex,blend,fogMix=1){this.n=n;this.i=0;const g=new THREE.BufferGeometry();this.P=new Float32Array(n*3);this.C=new Float32Array(n*4);this.S=new Float32Array(n);
 g.setAttribute('position',new THREE.BufferAttribute(this.P,3));g.setAttribute('color',new THREE.BufferAttribute(this.C,4));g.setAttribute('size',new THREE.BufferAttribute(this.S,1));
 this.V=new Float32Array(n*3);this.L=new Float32Array(n);this.T=new Float32Array(n);this.K=new Uint8Array(n);this.R=new Float32Array(n);this.G=new Float32Array(n);
 this.mat=new THREE.ShaderMaterial({uniforms:{map:{value:tex},scale:{value:600},fogD:{value:.045},fogC:{value:new THREE.Color(0x070a0c)}},transparent:true,depthWrite:false,blending:blend,
  vertexShader:`attribute float size;attribute vec4 color;varying vec4 vC;varying float vF;uniform float scale;uniform float fogD;void main(){vC=color;vec4 mv=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*mv;gl_PointSize=size*scale/max(.1,-mv.z);float d=-mv.z;vF=1.-exp(-fogD*fogD*d*d);}`,
  fragmentShader:`uniform sampler2D map;varying vec4 vC;varying float vF;void main(){vec4 t=texture2D(map,gl_PointCoord);gl_FragColor=vec4(vC.rgb,vC.a*t.a*(1.-vF*.85));if(gl_FragColor.a<.004)discard;}`});
 this.pts=new THREE.Points(g,this.mat);this.pts.frustumCulled=false;this.pts.renderOrder=5;scene.add(this.pts);for(let k=0;k<n;k++)this.L[k]=0}
 emit(p,v,life,size,col,a,grow=0,grav=0){const k=this.i;this.i=(this.i+1)%this.n;this.P.set([p.x,p.y,p.z],k*3);this.V.set([v.x,v.y,v.z],k*3);this.L[k]=life;this.T[k]=0;this.S[k]=size;this.R[k]=grow;this.G[k]=grav;this.C.set([col.r,col.g,col.b,a],k*4);this.A=this.A||new Float32Array(this.n);this.A[k]=a;this.S0=this.S0||new Float32Array(this.n);this.S0[k]=size}
 update(dt,drag=0){const{P,V,L,T,C,S}=this;for(let k=0;k<this.n;k++){if(L[k]<=0){C[k*4+3]=0;continue}T[k]+=dt;const u=T[k]/L[k];if(u>=1){L[k]=0;C[k*4+3]=0;continue}
  V[k*3+1]-=this.G[k]*dt;if(drag){V[k*3]*=1-drag*dt;V[k*3+1]*=1-drag*dt;V[k*3+2]*=1-drag*dt}P[k*3]+=V[k*3]*dt;P[k*3+1]+=V[k*3+1]*dt;P[k*3+2]+=V[k*3+2]*dt;
  if(P[k*3+1]<.02&&this.G[k]>0){P[k*3+1]=.02;V[k*3+1]*=-.3;V[k*3]*=.5;V[k*3+2]*=.5}
  S[k]=this.S0[k]*(1+this.R[k]*u);C[k*4+3]=this.A[k]*(u<.15?u/.15:1)*(1-u)*(1-u*.2)}
  const g=this.pts.geometry;g.attributes.position.needsUpdate=true;g.attributes.color.needsUpdate=true;g.attributes.size.needsUpdate=true}}
export const FX={};const _c=new THREE.Color(),_v=new THREE.Vector3(),_p=new THREE.Vector3();
export function initFX(){const m=E.P.particles||1;
 FX.add=new PSys(1400*m|0,TX.soft,THREE.AdditiveBlending);   // sparks, flame, acid glow
 FX.smoke=new PSys(700*m|0,TX.smoke,THREE.NormalBlending);  // steam/smoke
 // tracers
 const tg=new THREE.BoxGeometry(.025,.025,1);tg.translate(0,0,.5);FX.tr=new THREE.InstancedMesh(tg,new THREE.MeshBasicMaterial({color:new THREE.Color(4,3,1.4),transparent:true,opacity:.9,blending:THREE.AdditiveBlending,depthWrite:false,toneMapped:false}),48);
 FX.tr.count=0;FX.tr.frustumCulled=false;scene.add(FX.tr);FX.trs=[];
 // muzzle flash sprite
 FX.mf=new THREE.Sprite(new THREE.SpriteMaterial({map:TX.flash,color:new THREE.Color(2.2,1.7,1),blending:THREE.AdditiveBlending,depthWrite:false,transparent:true,toneMapped:false}));FX.mf.scale.setScalar(.5);FX.mf.visible=false;scene.add(FX.mf);FX.mfs=[];
 for(let i=0;i<4;i++){const s=FX.mf.clone();s.material=FX.mf.material.clone();s.visible=false;scene.add(s);FX.mfs.push({s,t:0})}
 // decals
 const dg=new THREE.PlaneGeometry(1,1);FX.dec={};for(const k of['hole','scorch','acid']){const im=new THREE.InstancedMesh(dg,new THREE.MeshStandardMaterial({map:TX[k],transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-4,roughness:k=='acid'?.3:.9,metalness:0}),k=='hole'?160:60);im.count=0;im.i=0;im.receiveShadow=true;scene.add(im);FX.dec[k]=im}
 FX.shake=0;FX.booms=[];FX.flashes=0}
export function resetFX(){for(const s of[FX.add,FX.smoke]){s.L.fill(0);s.C.fill(0)}FX.trs.length=0;for(const k in FX.dec){FX.dec[k].count=0;FX.dec[k].i=0}FX.booms.length=0;FX.shake=0;
 // decals/tracers need to be re-added if scene was cleared
 for(const o of[FX.add.pts,FX.smoke.pts,FX.tr,FX.mf,...FX.mfs.map(m=>m.s),...Object.values(FX.dec)])if(!o.parent)scene.add(o)}
const M4=new THREE.Matrix4(),Q=new THREE.Quaternion(),S1=new THREE.Vector3(1,1,1),UP=new THREE.Vector3(0,0,1);
export function decal(kind,p,n,size){const im=FX.dec[kind];const k=im.i;im.i=(im.i+1)%im.instanceMatrix.count;im.count=Math.max(im.count,k+1);Q.setFromUnitVectors(UP,n);const r=new THREE.Quaternion().setFromAxisAngle(UP,rnd()*6.28);Q.multiply(r);
 _p.copy(p).addScaledVector(n,.012);S1.set(size,size,1);M4.compose(_p,Q,S1);im.setMatrixAt(k,M4);im.instanceMatrix.needsUpdate=true}
export function tracer(a,b){FX.trs.push({a:a.clone(),b:b.clone(),t:0})}
export function muzzleFlash(p,dir,big){const m=FX.mfs.find(m=>m.t<=0)||FX.mfs[0];m.s.position.copy(p).addScaledVector(dir,.08);m.s.material.rotation=rnd()*6.28;m.s.scale.setScalar((big?.75:.45)*(.8+rnd()*.4));m.t=.05;m.s.visible=true;
 muzzle.position.copy(p);muzzle.distance=7;muzzle.intensity=big?40:26;FX.muz=.05}
export function sparks(p,n,dir,col=0xffb050){_c.set(col);for(let i=0;i<n;i++){_v.set((rnd()-.5)*3,rnd()*2.5,(rnd()-.5)*3);if(dir)_v.addScaledVector(dir,2.5);FX.add.emit(p,_v,.25+rnd()*.35,.035,_c,1,-.5,9)}}
export function acidBurst(p,n=14){_c.setRGB(.5,1,.12);for(let i=0;i<n;i++){_v.set((rnd()-.5)*4,1+rnd()*3,(rnd()-.5)*4);FX.add.emit(p,_v,.6+rnd()*.5,.06,_c,.8,0,9)}
 for(let i=0;i<4;i++){_v.set((rnd()-.5)*.4,.5+rnd()*.5,(rnd()-.5)*.4);_c.setRGB(.55,.62,.4);FX.smoke.emit(p,_v,1.6,.45,_c,.35,2.5,0)}}
export function steam(p,s=1){_v.set((rnd()-.5)*.3,-.2-rnd()*.3,(rnd()-.5)*.3);_c.setRGB(.7,.74,.76);FX.smoke.emit(p,_v,2.2+rnd(),.5*s,_c,.13,3,-.25)}
export function smokePuff(p,a=.3,col=.35){_v.set((rnd()-.5)*.6,.4+rnd()*.6,(rnd()-.5)*.6);_c.setRGB(col,col,col);FX.smoke.emit(p,_v,1.8+rnd(),.6,_c,a,2.5,-.1)}
export function flame(p,dir,len){for(let i=0;i<3;i++){const sp=7+rnd()*3;_v.copy(dir).multiplyScalar(sp);_v.x+=(rnd()-.5)*1.4;_v.y+=(rnd()-.2)*1.2;_v.z+=(rnd()-.5)*1.4;_c.setRGB(1,.5+rnd()*.25,.15);FX.add.emit(p,_v,len/sp*(.7+rnd()*.5),.16,_c,.9,4,-1.5)}
 if(rnd()<.3){_v.copy(dir).multiplyScalar(4);_v.y+=1;_c.setRGB(.18,.16,.15);FX.smoke.emit(_p.copy(p).addScaledVector(dir,len*.7),_v,1.5,.5,_c,.35,3,-.4)}}
export function explosion(p){FX.booms.push({p:p.clone(),t:0});FX.shake=Math.max(FX.shake,.9);
 for(let i=0;i<70;i++){_v.set(rnd()-.5,rnd()*.9,rnd()-.5).normalize().multiplyScalar(2+rnd()*7);_c.setRGB(1,.55+rnd()*.3,.2);FX.add.emit(p,_v,.4+rnd()*.5,.25+rnd()*.3,_c,.9,2,3)}
 for(let i=0;i<24;i++){_v.set(rnd()-.5,rnd()*.8,rnd()-.5).multiplyScalar(4);_c.setRGB(.15,.13,.12);FX.smoke.emit(p,_v,2.5+rnd()*2,1,_c,.5,3,-.3)}
 sparks(p,30)}
export function shake(a){FX.shake=Math.max(FX.shake,a)}
export function updateFX(dt){FX.add.update(dt);FX.smoke.update(dt,.6);FX.add.mat.uniforms.fogD.value=FX.smoke.mat.uniforms.fogD.value=scene.fog?scene.fog.density:0;
 const s=FX.add.mat.uniforms.scale.value=FX.smoke.mat.uniforms.scale.value=innerHeight*.9;
 // tracers
 let n=0;FX.trs=FX.trs.filter(t=>(t.t+=dt)<.06);for(const t of FX.trs){if(n>=48)break;_v.subVectors(t.b,t.a);const L=_v.length();const k=Math.min(1,t.t/.06);_p.copy(t.a).addScaledVector(_v,k*.5);
  Q.setFromUnitVectors(UP,_v.normalize());S1.set(1,1,L*(1-k*.5));M4.compose(_p,Q,S1);FX.tr.setMatrixAt(n++,M4)}FX.tr.count=n;FX.tr.instanceMatrix.needsUpdate=true;
 for(const m of FX.mfs){m.t-=dt;if(m.t<=0)m.s.visible=false}
 if(FX.muz>0){FX.muz-=dt;if(FX.muz<=0)muzzle.intensity=0}
 // explosion lights
 FX.booms=FX.booms.filter(b=>(b.t+=dt)<1.4);fxPool.forEach((l,i)=>{const b=FX.booms[i];if(b){l.position.copy(b.p);l.position.y+=1;l.intensity=180*Math.pow(1-b.t/1.4,2);l.color.setRGB(1,.6,.3)}else l.intensity=0});
 FX.shake=Math.max(0,FX.shake-dt*2.2)}
// rain streaks around the camera (LineSegments)
let RAIN=null;export function rain(on,dens=1){if(!on){if(RAIN)RAIN.visible=false;return}if(!RAIN){const n=(MOBILE?900:2200);const g=new THREE.BufferGeometry();const p=new Float32Array(n*6);for(let i=0;i<n;i++){const x=(rnd()-.5)*40,y=rnd()*20,z=(rnd()-.5)*40;p.set([x,y,z,x+.05,y-.6,z],i*6)}
 g.setAttribute('position',new THREE.BufferAttribute(p,3));RAIN=new THREE.LineSegments(g,new THREE.LineBasicMaterial({color:0x8fa4b4,transparent:true,opacity:.35,depthWrite:false}));RAIN.frustumCulled=false;RAIN.userData.n=n}
 if(!RAIN.parent)scene.add(RAIN);RAIN.visible=true}
export function updateRain(dt,wind=0){if(!RAIN||!RAIN.visible)return;const p=RAIN.geometry.attributes.position.array,c=camera.position;for(let i=0;i<RAIN.userData.n;i++){const o=i*6;let y=p[o+1]-dt*22;let x=p[o]+wind*dt*3,z=p[o+2];
  if(y<0||Math.abs(x-c.x)>20||Math.abs(z-c.z)>20){y=8+rnd()*14+c.y*.3;x=c.x+(rnd()-.5)*40;z=c.z+(rnd()-.5)*40}p[o]=x;p[o+1]=y;p[o+2]=z;p[o+3]=x+.05+wind*.05;p[o+4]=y-.6;p[o+5]=z}RAIN.geometry.attributes.position.needsUpdate=true}

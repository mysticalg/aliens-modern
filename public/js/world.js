// Grid maps -> modular PBR level geometry, collision, navigation, line of sight.
import {Reflector} from 'three/addons/objects/Reflector.js';
import {THREE,scene,lightSrc,LS,E} from './engine.js?v=13';
import {pbr,boxGeo,emiss,plain,model,resinMat} from './assets.js?v=13';
export const CS=3,WH=3.4;
export const W={map:null,mw:0,mh:0,mk:{},open:{},group:null,solidSet:'#FWKtcgDXb',doors:[],steam:[],extra:[],camBlock:[]};
export function clearWorld(){if(W.reflector){W.reflector.dispose();W.reflector=null}if(W.group){W.group.traverse(o=>{if(o.isMesh||o.isInstancedMesh){o.geometry.dispose&&o.geometry.dispose()}});W.group.removeFromParent()}W.group=new THREE.Group();scene.add(W.group);LS.list.length=0;W.map=null;W.doors=[];W.steam=[];W.mk={};W.open={};W.colliders=[];W.rcol=[];W.camBlock=[];return W.group}
export function setMap(rows){const w=Math.max(...rows.map(r=>r.length));W.map=rows.map(r=>r.padEnd(w,' '));W.mw=w;W.mh=rows.length;W.mk={};W.open={};
 W.map.forEach((r,j)=>[...r].forEach((ch,i)=>{if(!'# .'.includes(ch))(W.mk[ch]=W.mk[ch]||[]).push([i*CS,j*CS])}))}
export const mk=(ch,i)=>W.mk[ch][i||0];
export function solid(x,z){if(!W.map)return colSolid(x,z);const i=Math.round(x/CS),j=Math.round(z/CS),c=(W.map[j]||'')[i]||' ';return((c==' '||W.solidSet.includes(c))&&!W.open[i+','+j])||colSolid(x,z)}
function colSolid(x,z){for(const c of W.colliders||[])if(Math.abs(x-c.x)<c.hw&&Math.abs(z-c.z)<c.hd)return true;return false}
export const solidR=(x,z,r)=>solid(x-r,z-r)||solid(x+r,z-r)||solid(x-r,z+r)||solid(x+r,z+r);
// capsule (circle in plan) vs grid cells, box colliders and round colliders
function cellS(i,j){const c=(W.map[j]||'')[i]||' ';return(c==' '||W.solidSet.includes(c))&&!W.open[i+','+j]}
export function solidC(x,z,r){if(W.map){const h=CS/2;for(let j=Math.round((z-r)/CS);j<=Math.round((z+r)/CS);j++)for(let i=Math.round((x-r)/CS);i<=Math.round((x+r)/CS);i++){if(!cellS(i,j))continue;
  const dx=Math.max(0,Math.abs(x-i*CS)-h),dz=Math.max(0,Math.abs(z-j*CS)-h);if(dx*dx+dz*dz<r*r)return true}}
 for(const c of W.colliders||[]){const dx=Math.max(0,Math.abs(x-c.x)-c.hw),dz=Math.max(0,Math.abs(z-c.z)-c.hd);if(dx*dx+dz*dz<r*r)return true}
 for(const c of W.rcol||[])if(Math.hypot(x-c.x,z-c.z)<r+c.r)return true;return false}
export function moveE(e,dx,dz,r){const n=Math.max(1,Math.ceil(Math.hypot(dx,dz)/(r*.5)));let m=false;if(solidC(e.x,e.z,r)){if(solidC(e.x,e.z,r*.4))return false;r*=.4}
 for(let k=0;k<n;k++){if(!solidC(e.x+dx/n,e.z,r)){e.x+=dx/n;m=true}if(!solidC(e.x,e.z+dz/n,r)){e.z+=dz/n;m=true}}return m}
export function bfs(tx,tz){const w=W.mw,h=W.mh,D=new Int16Array(w*h).fill(-1);const ti=Math.round(tx/CS),tj=Math.round(tz/CS);if(ti<0||tj<0||ti>=w||tj>=h)return D;const q=[ti+tj*w];D[q[0]]=0;
 for(let k=0;k<q.length;k++){const c=q[k],i=c%w,j=c/w|0;for(const[di,dj]of[[1,0],[-1,0],[0,1],[0,-1]]){const ni=i+di,nj=j+dj;if(ni<0||nj<0||ni>=w||nj>=h)continue;const n=ni+nj*w;if(D[n]>=0||solid(ni*CS,nj*CS))continue;D[n]=D[c]+1;q.push(n)}}return D}
function stepTo(D,x,z){const w=W.mw,i=Math.round(x/CS),j=Math.round(z/CS);const d0=D[i+j*w];let best=null,bd=d0<0?1e9:d0;for(const[di,dj]of[[1,0],[-1,0],[0,1],[0,-1]]){const ni=i+di,nj=j+dj;if(ni<0||nj<0||ni>=W.mw||nj>=W.mh)continue;const d=D[ni+nj*w];if(d>=0&&d<bd){bd=d;best=[ni*CS,nj*CS]}}return best}
const sameCell=(x0,z0,x1,z1)=>Math.round(x0/CS)==Math.round(x1/CS)&&Math.round(z0/CS)==Math.round(z1/CS);
export function pathDir(D,e,tx,tz){let nx=tx,nz=tz;if(W.map&&D&&!sameCell(e.x,e.z,tx,tz)){const s=stepTo(D,e.x,e.z);if(s){nx=s[0];nz=s[1];
  // if we can see the target directly, go straight
  if(los(e.x,e.z,tx,tz)){nx=tx;nz=tz}}}const dx=nx-e.x,dz=nz-e.z,l=Math.hypot(dx,dz);return l<.05?[0,0,0]:[dx/l,dz/l,l]}
export function los(x0,z0,x1,z1){const l=Math.hypot(x1-x0,z1-z0);for(let k=.4;k<l-.3;k+=.35){if(solid(x0+(x1-x0)*k/l,z0+(z1-z0)*k/l))return false}return true}
// march a 3D ray against walls/floor/ceiling; returns distance + normal
export function rayWorld(o,d,max,ceil){let t=0;const st=.12;let px=o.x,pz=o.z;while(t<max){t+=st;const x=o.x+d.x*t,y=o.y+d.y*t,z=o.z+d.z*t;
  if(y<0)return{t:(0-o.y)/d.y,n:new THREE.Vector3(0,1,0)};if(ceil&&y>ceil)return{t:(ceil-o.y)/d.y,n:new THREE.Vector3(0,-1,0)};
  if(solid(x,z)){// refine and pick axis normal
   let a=t-st,b=t;for(let k=0;k<6;k++){const m=(a+b)/2;if(solid(o.x+d.x*m,o.z+d.z*m))b=m;else a=m}const hx=o.x+d.x*b,hz=o.z+d.z*b;const sx=solid(o.x+d.x*a+(d.x>0?.02:-.02)*4,o.z+d.z*a);
   const n=Math.abs(Math.round(hx/CS)-Math.round((o.x+d.x*a)/CS))>0?new THREE.Vector3(-Math.sign(d.x),0,0):new THREE.Vector3(0,0,-Math.sign(d.z));return{t:b,n}}}return null}
// ---------- builders ----------
function inst(geo,mat,list,shadow=true){if(!list.length)return null;const m=new THREE.InstancedMesh(geo,mat,list.length);const M=new THREE.Matrix4(),q=new THREE.Quaternion(),s=new THREE.Vector3(1,1,1),p=new THREE.Vector3();
 list.forEach((t,i)=>{p.set(t[0],t[1],t[2]);q.setFromEuler(new THREE.Euler(0,t[3]||0,0));s.set(t[4]||1,t[5]||1,t[6]||1);M.compose(p,q,s);m.setMatrixAt(i,M)});m.castShadow=shadow;m.receiveShadow=true;W.group.add(m);return m}
function nearOpen(i,j){for(let dj=-1;dj<=1;dj++)for(let di=-1;di<=1;di++){const c=(W.map[j+dj]||'')[i+di];if(c&&c!='#'&&c!=' '&&!W.solidSet.includes(c))return true}return false}
const H1=n=>{const x=Math.sin(n*127.1+311.7)*43758.5453;return x-Math.floor(x)};
export function add(o){W.group.add(o);return o}
export function boxM(x,y,z,w,h,d,mat,o={}){const m=new THREE.Mesh(boxGeo(w,h,d,o.t||2,o.r||0),mat);m.position.set(x,y,z);if(o.ry)m.rotation.y=o.ry;m.castShadow=o.cast!==false;m.receiveShadow=true;W.group.add(m);return m}
function autoCol(o,round){o.updateMatrixWorld(true);const b=new THREE.Box3().setFromObject(o);if(!isFinite(b.min.x)||b.max.y<.25||b.min.y>2.2)return;const c=b.getCenter(new THREE.Vector3()),hx=(b.max.x-b.min.x)/2,hz=(b.max.z-b.min.z)/2;
 if(round)W.rcol.push({x:c.x,z:c.z,r:Math.max(hx,hz)*.92});else W.colliders.push({x:c.x,z:c.z,hw:hx+.02,hd:hz+.02})}
export function prop(name,x,z,ry=0,s=1,y=0,col=true){const m=model(name);m.position.set(x,y,z);m.rotation.y=ry;m.scale.setScalar(s);W.group.add(m);W.camBlock.push(m);if(col)autoCol(m);return m}
export function block(o,col){W.camBlock.push(o);if(col)W.colliders.push(col);else if(o&&o.position)autoCol(o,true);return o}
export function buildMap(o={}){const wallM=pbr(o.wall||'wall',{color:o.wallTint??0xb8c0c4}),floorM=pbr(o.floor||'plate',{color:o.floorTint??0x9aa0a0}),ceilM=pbr(o.ceil||'panel',{color:0x5a6066});
 const walls=[],floors=[],ceils=[],trims=[],lamps=[],pipes=[],strips=[];
 W.map.forEach((r,j)=>[...r].forEach((ch,i)=>{const x=i*CS,z=j*CS;if(ch==' ')return;
  if(ch=='#'||ch=='F'||ch=='W'||ch=='K'||ch=='X'){if(!nearOpen(i,j))return;walls.push([x,WH/2,z]);return}
  floors.push([x,0,z]);if(!o.open)ceils.push([x,WH,z]);
  // lights: ceiling panel every few cells
  const h=H1(i*31+j*17);if(!o.open&&(i*3+j*5)%(o.lightEvery||4)==0){lamps.push([x,WH-.03,z]);lightSrc({p:[x,WH-.4,z],c:o.lightCol??0xcfe6ff,i:o.lightI??10,d:9,flick:h<.3})}
  if(o.emergency&&h>.82){lightSrc({p:[x,WH-.6,z],c:0xff7a20,i:9,d:8,pulse:1.4})}
  if(!o.open&&h<.25)pipes.push([x,WH-.25,z,(r[i-1]=='#'||r[i+1]=='#')?Math.PI/2:0]);
 }));
 const wg=boxGeo(CS,WH,CS,1.5);inst(wg,wallM,walls);
 // baseboard / top trims hugging the wall blocks
 inst(boxGeo(CS+.06,.22,CS+.06,1),pbr('panel',{color:0x40464a}),walls.map(w=>[w[0],.11,w[2]]),false);
 inst(boxGeo(CS+.08,.14,CS+.08,1),pbr('panel',{color:0x2e3236}),walls.map(w=>[w[0],WH-.6,w[2]]),false);
 inst(boxGeo(CS,.1,CS,CS),floorM,floors.map(f=>[f[0],-.05,f[2]]),false);
 if(E.P.reflect&&floors.length&&!o.dry)wetFloor(floors,o.wet??.32);
 if(ceils.length)inst(boxGeo(CS,.1,CS,1.5),ceilM,ceils.map(f=>[f[0],WH+.05,f[2]]),false);
 inst(new THREE.BoxGeometry(.9,.05,.5),emiss(o.lightCol??0xdfefff,2.6),lamps,false);
 inst(new THREE.CylinderGeometry(.08,.08,CS,8).rotateZ(Math.PI/2),plain(0x3a3f42,.4,.8),pipes.map(p=>[p[0],p[1],p[2]+.5,p[3]]),false);
 inst(new THREE.CylinderGeometry(.05,.05,CS,8).rotateZ(Math.PI/2),plain(0x5a4a30,.5,.7),pipes.map(p=>[p[0],p[1]-.05,p[2]+.75,p[3]]),false);
 // scatter props next to walls
 W.map.forEach((r,j)=>[...r].forEach((ch,i)=>{if(ch!='.')return;const h=H1(i*7.3+j*3.1);if(h>(o.clutter??.9)){const x=i*CS,z=j*CS;
  let wx=0,wz=0;if(r[i-1]=='#')wx=-1;else if(r[i+1]=='#')wx=1;else if((W.map[j-1]||'')[i]=='#')wz=-1;else if((W.map[j+1]||'')[i]=='#')wz=1;else return;
  const k=H1(i+j*9);const nm=k<.4?'prop_crate':k<.7?'prop_barrel1':'prop_crate_large';prop(nm,x+wx*1.05,z+wz*1.05,H1(i*3)*.6,nm=='prop_crate_large'?.55:.7)}}));
 // steam vents
 W.map.forEach((r,j)=>[...r].forEach((ch,i)=>{if(ch=='.'&&H1(i*13+j*29)>.93)W.steam.push(new THREE.Vector3(i*CS+(H1(i)-.5),WH-.3,j*CS+(H1(j)-.5)))}))}
// sliding door at a map cell
export function door(ch,idx,o={}){const[x,z]=mk(ch,idx);const i=Math.round(x/CS),j=Math.round(z/CS);const hz=(W.map[j][i-1]=='#'&&W.map[j][i+1]=='#');
 const g=new THREE.Group();g.position.set(x,0,z);if(!hz)g.rotation.y=Math.PI/2;const fr=pbr('panel',{color:0x8a9094});
 const L=new THREE.Mesh(boxGeo(CS/2,WH-.2,.22,1,.02),fr),R=L.clone();L.position.set(-CS/4,(WH-.2)/2,0);R.position.set(CS/4,(WH-.2)/2,0);g.add(L,R);
 const haz=new THREE.MeshStandardMaterial({map:hazardTex(),roughness:.6,metalness:.2});for(const d of[L,R]){const s=new THREE.Mesh(new THREE.BoxGeometry(CS/2-.1,.3,.24),haz);s.position.y=-(WH-.2)/2+.5;d.add(s)}
 const lamp=new THREE.Mesh(new THREE.BoxGeometry(.3,.1,.3),emiss(0xff3010,3));lamp.position.set(0,WH-.05,.2);g.add(lamp);
 g.traverse(m=>{if(m.isMesh){m.castShadow=true;m.receiveShadow=true}});W.group.add(g);const D={g,L,R,open:0,target:0,key:i+','+j,lamp,ch,weld:o.weld};
 if(o.weld){const wm=emiss(0xff9a40,2.5);D.seam=new THREE.Mesh(new THREE.BoxGeometry(.04,WH-.4,.26),wm);D.seam.position.y=(WH-.2)/2;g.add(D.seam)}W.doors.push(D);return D}
export function updateDoors(dt){for(const D of W.doors){D.open+=(D.target-D.open)*Math.min(1,dt*3);D.L.position.x=-CS/4-D.open*CS*.48;D.R.position.x=CS/4+D.open*CS*.48;if(D.open>.6)W.open[D.key]=1;else delete W.open[D.key];
  D.lamp.material=D.target?greenLamp:D.lamp.material;if(D.seam)D.seam.visible=!D.cut}}
const greenLamp=emiss(0x30ff60,3);
let _haz=null;function hazardTex(){if(_haz)return _haz;const c=document.createElement('canvas');c.width=128;c.height=16;const x=c.getContext('2d');for(let i=-2;i<12;i++){x.fillStyle=i%2?'#d8a018':'#141414';x.beginPath();x.moveTo(i*16,0);x.lineTo(i*16+16,0);x.lineTo(i*16,16);x.lineTo(i*16-16,16);x.fill()}
 _haz=new THREE.CanvasTexture(c);_haz.colorSpace=THREE.SRGBColorSpace;return _haz}
export {hazardTex,H1};

// Ultra: planar reflection layered over the floor, masked into puddles and wet sheen
export function wetFloor(floors,amt){let x0=1e9,x1=-1e9,z0=1e9,z1=-1e9;for(const f of floors){x0=Math.min(x0,f[0]);x1=Math.max(x1,f[0]);z0=Math.min(z0,f[2]);z1=Math.max(z1,f[2])}
 const w=x1-x0+CS,d=z1-z0+CS;const sh={uniforms:{color:{value:null},tDiffuse:{value:null},textureMatrix:{value:null},uAmt:{value:amt}},
  vertexShader:'uniform mat4 textureMatrix;varying vec4 vUv;varying vec3 vW;void main(){vUv=textureMatrix*vec4(position,1.);vW=(modelMatrix*vec4(position,1.)).xyz;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
  fragmentShader:`uniform sampler2D tDiffuse;uniform float uAmt;varying vec4 vUv;varying vec3 vW;
  float n2(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);float a=fract(sin(dot(i,vec2(127.1,311.7)))*43758.5),b=fract(sin(dot(i+vec2(1,0),vec2(127.1,311.7)))*43758.5),c=fract(sin(dot(i+vec2(0,1),vec2(127.1,311.7)))*43758.5),e=fract(sin(dot(i+vec2(1,1),vec2(127.1,311.7)))*43758.5);return mix(mix(a,b,f.x),mix(c,e,f.x),f.y);}
  void main(){float m=n2(vW.xz*.55)*.65+n2(vW.xz*1.7)*.35;float pud=smoothstep(.5,.62,m);float sheen=.22+pud*.78;
   vec2 r=vec2(n2(vW.xz*9.)-.5,n2(vW.zx*9.+3.)-.5)*.012*(1.-pud);vec4 c=texture2DProj(tDiffuse,vUv+vec4(r*vUv.w,0.,0.));
   float a=uAmt*sheen;gl_FragColor=vec4(c.rgb,a);
   #include <tonemapping_fragment>
   #include <colorspace_fragment>
  }`};
 const R=new Reflector(new THREE.PlaneGeometry(w,d),{textureWidth:innerWidth*.35|0,textureHeight:innerHeight*.35|0,clipBias:.003,shader:sh});
 R.material.transparent=true;R.material.depthWrite=false;R.rotation.x=-Math.PI/2;R.position.set((x0+x1)/2,.004,(z0+z1)/2);R.renderOrder=1;W.group.add(R);W.reflector=R;return R}

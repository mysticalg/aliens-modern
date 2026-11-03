// Texture/material library, procedural textures, character factory (CC0 Quaternius rigs + UAL animations).
import {THREE,E,renderer} from './engine.js?v=9';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
export {RoundedBoxGeometry};
const TL=new THREE.TextureLoader(),GL=new GLTFLoader();
const ANI=renderer.capabilities.getMaxAnisotropy();
const texCache={};
function tex(file,srgb){if(texCache[file])return texCache[file];const t=TL.load(file,undefined,undefined,()=>{if(file.includes('/hi/')){const f=TL.load(file.replace('/hi/','/'),x=>{t.image=x.image;t.needsUpdate=true})}});t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=Math.min(E.q=='ultra'?16:8,ANI);if(srgb)t.colorSpace=THREE.SRGBColorSpace;return texCache[file]=t}
const MATS={};
// PBR set from public/tex: name_c (albedo), name_n (GL normal), name_arm (AO/rough/metal)
export function pbr(name,o={}){const key=name+JSON.stringify(o);if(MATS[key])return MATS[key];const d='tex/'+(E.P.tex?E.P.tex+'/':'');
 const arm=tex(d+name+'_arm.jpg');const m=new THREE.MeshStandardMaterial({map:tex(d+name+'_c.jpg',true),normalMap:tex(d+name+'_n.jpg'),roughnessMap:arm,metalnessMap:arm,aoMap:arm,aoMapIntensity:.8,
  roughness:o.rough??1,metalness:o.metal??1,color:new THREE.Color(o.color??0xffffff),normalScale:new THREE.Vector2(o.ns??1,o.ns??1)});return MATS[key]=m}
export const emiss=(c,i=3)=>new THREE.MeshStandardMaterial({color:0x000000,emissive:new THREE.Color(c),emissiveIntensity:i,roughness:.4});
export const plain=(c,r=.6,m=0,o={})=>new THREE.MeshStandardMaterial(Object.assign({color:new THREE.Color(c),roughness:r,metalness:m},o));
// ---- procedural textures (original) ----
function canvasTex(n,fn,srgb){const c=document.createElement('canvas');c.width=c.height=n;const x=c.getContext('2d');fn(x,n);const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;if(srgb)t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;return t}
function rng(s){return()=>{s=(s*16807)%2147483647;return(s-1)/2147483646}}
// height field -> normal map
function heightToNormal(h,n,str){const c=document.createElement('canvas');c.width=c.height=n;const x=c.getContext('2d');const img=x.createImageData(n,n);
 for(let j=0;j<n;j++)for(let i=0;i<n;i++){const H=(a,b)=>h[((b+n)%n)*n+((a+n)%n)];const dx=(H(i+1,j)-H(i-1,j))*str,dy=(H(i,j+1)-H(i,j-1))*str;const l=Math.hypot(dx,dy,1);const k=(j*n+i)*4;
  img.data[k]=(-dx/l*.5+.5)*255;img.data[k+1]=(dy/l*.5+.5)*255;img.data[k+2]=(1/l*.5+.5)*255;img.data[k+3]=255}x.putImageData(img,0,0);const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;return t}
function blurField(h,n,r){const o=new Float32Array(n*n);for(let j=0;j<n;j++)for(let i=0;i<n;i++){let s=0;for(let k=-r;k<=r;k++)s+=h[j*n+((i+k+n)%n)];o[j*n+i]=s/(2*r+1)}
 const p=new Float32Array(n*n);for(let j=0;j<n;j++)for(let i=0;i<n;i++){let s=0;for(let k=-r;k<=r;k++)s+=o[((j+k+n)%n)*n+i];p[j*n+i]=s/(2*r+1)}return p}
// organic ridged resin: random strands (curved tubes) on a height field
function resinField(n,seed){const R=rng(seed);const h=new Float32Array(n*n);
 for(let s=0;s<90;s++){let x=R()*n,y=R()*n,a=R()*6.28;const w=1.5+R()*5,L=40+R()*160;for(let k=0;k<L;k++){a+=(R()-.5)*.35;x+=Math.cos(a);y+=Math.sin(a);
  for(let dy=-w;dy<=w;dy++)for(let dx=-w;dx<=w;dx++){const d=Math.hypot(dx,dy)/w;if(d<1){const ii=((x+dx|0)%n+n)%n,jj=((y+dy|0)%n+n)%n;h[jj*n+ii]=Math.max(h[jj*n+ii],Math.sqrt(1-d*d)*(w/6))}}}}
 for(let i=0;i<n*n;i++)h[i]+=R()*.05;return blurField(h,n,1)}
let _resin=null;
export function resinMat(){if(_resin)return _resin;const n=256,h=resinField(n,7);
 const col=canvasTex(n,(x)=>{const img=x.createImageData(n,n);for(let i=0;i<n*n;i++){const v=h[i];img.data[i*4]=18+v*30;img.data[i*4+1]=22+v*34;img.data[i*4+2]=26+v*40;img.data[i*4+3]=255}x.putImageData(img,0,0)},true);
 const rough=canvasTex(n,(x)=>{const img=x.createImageData(n,n);for(let i=0;i<n*n;i++){const v=255*(.55-h[i]*.35);img.data[i*4]=255;img.data[i*4+1]=Math.max(30,v);img.data[i*4+2]=0;img.data[i*4+3]=255}x.putImageData(img,0,0)});
 _resin=new THREE.MeshStandardMaterial({map:col,normalMap:heightToNormal(h,n,6),roughnessMap:rough,roughness:1,metalness:.15,color:0xb0c0c8});return _resin}
let _skin=null;
export function alienSkin(){if(_skin)return _skin;const n=256,R=rng(11);const h=new Float32Array(n*n);
 for(let j=0;j<n;j++)for(let i=0;i<n;i++){const rib=Math.pow(Math.abs(Math.sin(j/n*Math.PI*14)),3);h[j*n+i]=rib*.8+R()*.04}
 const f=resinField(n,3);for(let i=0;i<n*n;i++)h[i]=h[i]*.6+f[i]*.5;
 _skin=new THREE.MeshPhysicalMaterial({color:0x0b0e12,roughness:.32,metalness:.25,clearcoat:1,clearcoatRoughness:.18,normalMap:heightToNormal(blurField(h,n,1),n,5),normalScale:new THREE.Vector2(.9,.9),envMapIntensity:1.6});return _skin}
export function huggerSkin(){return new THREE.MeshPhysicalMaterial({color:0xc9b49a,roughness:.42,metalness:0,clearcoat:.6,clearcoatRoughness:.3,sheen:.5,sheenColor:new THREE.Color(0xffd0b0),normalMap:alienSkin().normalMap,normalScale:new THREE.Vector2(.4,.4)})}
// world-scaled UV box (texture tiles every `t` metres)
export function boxGeo(w,h,d,t=2,round=0){const g=round?new RoundedBoxGeometry(w,h,d,2,round):new THREE.BoxGeometry(w,h,d);const p=g.attributes.position,n=g.attributes.normal,uv=g.attributes.uv;
 for(let i=0;i<p.count;i++){const ax=Math.abs(n.getX(i)),ay=Math.abs(n.getY(i)),az=Math.abs(n.getZ(i));const x=p.getX(i),y=p.getY(i),z=p.getZ(i);
  if(ax>=ay&&ax>=az)uv.setXY(i,z/t,y/t);else if(ay>=az)uv.setXY(i,x/t,z/t);else uv.setXY(i,x/t,y/t)}return g}
// ---- glTF ----
const G={};
export async function loadModels(list,prog){let done=0;await Promise.all(list.map(async n=>{G[n]=await GL.loadAsync('models/'+n+'.glb');done++;prog&&prog(done/list.length)}));return G}
export function model(n){const s=G[n].scene.clone(true);s.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true}});return s}
export function clips(){return G.anims.animations}
// ---- characters ----
const OUTFIT={ // shirt, pants, boots, camo strength, skin tint
 marine:{a:[.075,.085,.05],b:[.06,.07,.045],boot:[.05,.05,.05],camo:1},
 ripley:{a:[.16,.15,.12],b:[.1,.1,.09],boot:[.12,.10,.08],camo:0},
 newt:{a:[.22,.06,.07],b:[.05,.06,.09],boot:[.3,.3,.32],camo:0},
 colonist:{a:[.14,.12,.09],b:[.08,.075,.06],boot:[.1,.08,.07],camo:0},
 suit:{a:[.05,.055,.065],b:[.045,.05,.06],boot:[.03,.03,.03],camo:0},
 bishop:{a:[.55,.55,.53],b:[.06,.06,.07],boot:[.05,.05,.05],camo:0}};
const glslNoise=`float hh(vec3 p){p=fract(p*.3183099+.1);p*=17.;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}
float vn(vec3 x){vec3 i=floor(x),f=fract(x);f=f*f*(3.-2.*f);return mix(mix(mix(hh(i),hh(i+vec3(1,0,0)),f.x),mix(hh(i+vec3(0,1,0)),hh(i+vec3(1,1,0)),f.x),f.y),mix(mix(hh(i+vec3(0,0,1)),hh(i+vec3(1,0,1)),f.x),mix(hh(i+vec3(0,1,1)),hh(i+vec3(1,1,1)),f.x),f.y),f.z);}`;
function dressMat(src,o,sex){const m=src.clone();const of=OUTFIT[o.outfit||'marine'];const U={uA:{value:new THREE.Color(...of.a)},uB:{value:new THREE.Color(...of.b)},uBoot:{value:new THREE.Color(...of.boot)},uCamo:{value:of.camo},uSkin:{value:new THREE.Color(...(o.skin||[1,1,1]))},
  uNeck:{value:sex=='f'?1.40:1.50},uWrist:{value:sex=='f'?.64:.70},uWaist:{value:sex=='f'?.93:.99},uSleeve:{value:o.sleeve??(sex=='f'?.64:.70)}};
 m.onBeforeCompile=s=>{Object.assign(s.uniforms,U);s.vertexShader=s.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vBP;').replace('#include <begin_vertex>','#include <begin_vertex>\nvBP=position;');
  s.fragmentShader=s.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 vBP;uniform vec3 uA,uB,uBoot,uSkin;uniform float uCamo,uNeck,uWrist,uWaist,uSleeve;\n'+glslNoise+'\nfloat clothK;')
  .replace('#include <map_fragment>',`#include <map_fragment>
   float ax=abs(vBP.x);float skin=step(uNeck,vBP.y)*step(ax,.085)+step(uNeck+.06,vBP.y)+step(uWrist,ax)*step(1.0,vBP.y);skin=clamp(skin,0.,1.);if(ax>uSleeve&&ax<uWrist&&vBP.y>1.0)skin=0.;
   float nz=vn(vBP*7.)*.6+vn(vBP*19.)*.4;vec3 cl=vBP.y>uWaist?uA:uB;float cm=smoothstep(.47,.53,vn(vBP*6.3+3.));float cm2=smoothstep(.5,.56,vn(vBP*9.1+9.));
   cl=mix(cl,cl*vec3(1.9,1.6,1.15),cm*uCamo);cl=mix(cl,cl*.4,cm2*uCamo);cl*=.85+.3*nz;if(vBP.y<.17)cl=uBoot*(.9+.2*nz)*.5;
   clothK=1.-skin;diffuseColor.rgb=mix(diffuseColor.rgb*uSkin,cl,clothK);`)
  .replace('#include <normal_fragment_maps>',THREE.ShaderChunk.normal_fragment_maps.replace('mapN.xy *= normalScale;','mapN.xy *= normalScale*mix(1.,.18,clothK);')).replace('#include <roughnessmap_fragment>','#include <roughnessmap_fragment>\nroughnessFactor=mix(roughnessFactor,vBP.y<.17?.45:.88,clothK);')};
 m.customProgramCacheKey=()=>'dress'+(o.outfit||'marine')+sex;return m}
const hairMat={};
function getHairMat(src,col){const k=src.name+(src.map?src.map.uuid:'')+col.join(',');if(!hairMat[k]){const m=src.clone();m.color=new THREE.Color(...col);m.roughness=.75;hairMat[k]=m}return hairMat[k]}
export class Actor{constructor(o){this.o=o;const sex=o.sex||'m';const s=SkeletonUtils.clone(G[sex=='f'?'female':'male'].scene);this.root=new THREE.Group();this.body=s;this.root.add(s);
  if(o.scale)s.scale.setScalar(o.scale);this.bones={};
  s.traverse(b=>{if(b.isBone)this.bones[b.name]=b;if(b.isMesh){b.castShadow=true;b.receiveShadow=true;b.frustumCulled=false;
   const mn=b.material.name||'';if(/Superhero/.test(mn))b.material=dressMat(b.material,o,sex);else if(/Hair/.test(mn)){b.material=getHairMat(b.material,o.browCol||o.hairCol||[.15,.1,.07])}}});
  s.updateMatrixWorld(true);
  if(o.hair){const hs=SkeletonUtils.clone(G[o.hair].scene);hs.traverse(m=>{if(m.isSkinnedMesh){const bones=m.skeleton.bones.map(b=>this.bones[b.name]||b);const sk=new THREE.Skeleton(bones,m.skeleton.boneInverses);m.material=getHairMat(m.material,o.hairCol||[.15,.1,.07]);m.castShadow=true;m.frustumCulled=false;
    const mm=m;this._hair=this._hair||[];this._hair.push([mm,sk])}});for(const[mm,sk]of this._hair||[]){s.add(mm);mm.bind(sk,mm.bindMatrix)}}
  this.gear=[];if(o.armor)this.armor(o);if(o.helmet)this.helmet(o);if(o.bandana)this.bandana();if(o.glasses)this.glasses();if(o.gun)this.giveGun(o.gun);
  this.mixer=new THREE.AnimationMixer(s);this.acts={};for(const c of clips())this.acts[c.name]=this.mixer.clipAction(c);this.cur=null;this.play(o.anim||'Idle_Loop',0)}
 bpos(n){return this.bones[n].getWorldPosition(new THREE.Vector3()).sub(this.root.getWorldPosition(new THREE.Vector3()))}
 attach(bone,mesh,pos){// pos is in character (bind pose) space
  mesh.position.copy(pos);mesh.castShadow=true;mesh.receiveShadow=true;this.body.add(mesh);mesh.updateMatrixWorld(true);this.bones[bone].attach(mesh);this.gear.push(mesh);return mesh}
 armor(o){const sc=this.o.sex=='f'?.9:1;const A=armorMats(o.armorCol);const p=n=>this.bpos(n);const s3=p('spine_03'),s1=p('spine_01');
  const vest=new THREE.Mesh(boxGeo(.40*sc,.36*sc,.31*sc,1,.07),A.plate);this.attach('spine_03',vest,new THREE.Vector3(0,s3.y+.02,.0+(this.o.sex=='f'?.01:0)));
  const plate=new THREE.Mesh(boxGeo(.3*sc,.22*sc,.05,1,.02),A.plate2);this.attach('spine_03',plate,new THREE.Vector3(0,s3.y+.06,.15*sc+.01));
  const pack=new THREE.Mesh(boxGeo(.3*sc,.32*sc,.12,1,.04),A.cloth);this.attach('spine_03',pack,new THREE.Vector3(0,s3.y-.02,-.2*sc));
  const belt=new THREE.Mesh(new THREE.TorusGeometry(.155*sc,.035,6,20),A.cloth);belt.rotation.x=Math.PI/2;belt.scale.set(1,.82,1);this.attach('pelvis',belt,new THREE.Vector3(0,s1.y-.02,.0));
  for(const sd of[-1,1]){const ua=p(sd<0?'upperarm_l':'upperarm_r');const sh=new THREE.Mesh(boxGeo(.15*sc,.07,.17*sc,1,.03),A.plate);sh.rotation.z=sd*.25;this.attach(sd<0?'upperarm_l':'upperarm_r',sh,new THREE.Vector3(ua.x+(-sd)*-.05,ua.y+.07,ua.z));
   const cf=p(sd<0?'calf_l':'calf_r');const kn=new THREE.Mesh(boxGeo(.1,.11,.06,1,.025),A.plate2);this.attach(sd<0?'calf_l':'calf_r',kn,new THREE.Vector3(cf.x,cf.y+.0,cf.z+.08));
   const th=p(sd<0?'thigh_l':'thigh_r');const pouch=new THREE.Mesh(boxGeo(.07,.13,.12,1,.02),A.cloth);this.attach(sd<0?'thigh_l':'thigh_r',pouch,new THREE.Vector3(th.x*1.0+(sd<0?.09:-.09)*-1,th.y-.2,th.z))}
  // tiny status lamp on the chest (bloom)
  const lamp=new THREE.Mesh(new THREE.BoxGeometry(.03,.015,.01),emiss(0x66ff99,4));this.attach('spine_03',lamp,new THREE.Vector3(.09,s3.y+.12,.18*sc+.02))}
 helmet(o){const A=armorMats(o.armorCol);const h=this.bpos('Head');const sc=this.o.sex=='f'?.94:1;const g=new THREE.SphereGeometry(.145*sc,24,12,0,Math.PI*2,0,1.6);const m=new THREE.Mesh(g,A.plate);m.scale.set(1,.92,1.1);
  this.attach('Head',m,new THREE.Vector3(0,h.y+.13*sc,h.z-.025));const rim=new THREE.Mesh(new THREE.TorusGeometry(.143*sc,.012,6,24),A.plate2);rim.rotation.x=Math.PI/2;rim.scale.set(1,1.1,1);this.attach('Head',rim,new THREE.Vector3(0,h.y+.118*sc,h.z-.025));
  const cam=new THREE.Mesh(boxGeo(.03,.04,.07,1,.008),plain(0x111111,.4,.6));this.attach('Head',cam,new THREE.Vector3(.14*sc,h.y+.12,h.z+.04))}
 bandana(){const h=this.bpos('Head');const m=new THREE.Mesh(new THREE.TorusGeometry(.115,.03,8,24),plain(0x8a1a12,.8));m.rotation.x=Math.PI/2;m.scale.set(1,1.15,1);this.attach('Head',m,new THREE.Vector3(0,h.y+.15,h.z-.005))}
 glasses(){const h=this.bpos('Head');const g=new THREE.Group();for(const s of[-1,1]){const r=new THREE.Mesh(new THREE.TorusGeometry(.024,.004,6,16),plain(0x222222,.3,.8));r.position.x=s*.035;g.add(r)}this.attach('Head',g,new THREE.Vector3(0,h.y+.1,h.z+.12))}
 giveGun(kind){const g=model(kind=='smart'?'gun_rifle':kind=='pistol'?'gun_pistol':'gun_rifle');if(kind=='smart')g.scale.setScalar(1.3);
  const w=new THREE.Group();w.add(g);g.rotation.y=Math.PI/2;g.position.set(0,0,-.1);g.scale.multiplyScalar(.82);this.gun=w;this.root.add(w);this.aimPitch=0;this.gunMode='aim';
  this.muzzle=new THREE.Object3D();g.add(this.muzzle);this.muzzle.position.set(-.8,.1,0)}
 placeGun(){const w=this.gun;if(!w)return;if(this.gunMode=='hide'){w.visible=false;return}w.visible=true;const h=this.bones.hand_r.getWorldPosition(_t1);this.root.worldToLocal(h);
  if(this.gunMode=='aim'){w.position.set(h.x-.01,h.y+.02,h.z);w.rotation.order='YXZ';w.rotation.set(-this.aimPitch,this.twY||0,0)}
  else if(this.gunMode=='low'){w.position.set(h.x-.02,h.y+.05,h.z+.05);w.rotation.set(.35,-.25,.1)}
  else{const b=this.bones.spine_03.getWorldPosition(_t1);this.root.worldToLocal(b);w.position.set(b.x,b.y,b.z-.2);w.rotation.set(0,0,0);w.rotation.order='YXZ';w.rotation.set(-1.0,0.0,0.0)}}
 play(n,fade=.25,o={}){const a=this.acts[n];if(!a)return;if(this.lay){for(const k in this.lay)this.lay[k]&&this.lay[k].fadeOut(fade);this.lay=null}if(this.cur===a&&!o.restart)return a;a.reset();a.enabled=true;a.setEffectiveTimeScale(o.ts||1);a.setEffectiveWeight(1);
  if(o.once){a.setLoop(THREE.LoopOnce,1);a.clampWhenFinished=true}else a.setLoop(THREE.LoopRepeat);
  if(this.cur&&fade>0)a.crossFadeFrom(this.cur,fade,false);else if(this.cur)this.cur.stop();a.play();this.cur=a;this.curN=n;return a}
 _la(n,k){const key=n+'#'+k;if(this.acts[key])return this.acts[key];const c=layerClip(n,k);if(!c)return null;return this.acts[key]=this.mixer.clipAction(c)}
 loco(lo,up,f=.22,ts=1){this.locoN=[lo,up];if(this.cur){this.cur.fadeOut(f);this.cur=null;this.curN=null}this.lay=this.lay||{};
  for(const[k,n]of[['L',lo],['U',up]]){const a=this._la(n,k);if(!a)continue;if(k=='L')a.setEffectiveTimeScale(ts);const old=this.lay[k];if(old===a)continue;a.reset();a.setLoop(THREE.LoopRepeat);a.setEffectiveTimeScale(k=='L'?ts:1);a.setEffectiveWeight(1);a.play();
   if(old&&f>0){a.crossFadeFrom(old,f,false)}else if(old)old.stop();this.lay[k]=a}}
 aim(yaw,pitch){this.twY=yaw;this.twP=pitch}
 _twist(){if(!this.twY&&!this.twP)return;this.root.updateMatrixWorld(true);const right=_t2.set(1,0,0).applyQuaternion(this.root.getWorldQuaternion(_q1)).normalize();
  for(const n of['spine_01','spine_02','spine_03']){const b=this.bones[n];if(!b)continue;rotW(b,_up,(this.twY||0)/3);rotW(b,right,-(this.twP||0)/3*.85)}}
 update(dt){this.mixer.update(dt);this._twist();if(this.post)this.post(this);if(this.gun){this.root.updateMatrixWorld(true);this.placeGun()}}}
const _t1=new THREE.Vector3(),_t2=new THREE.Vector3(),_q1=new THREE.Quaternion(),_q2=new THREE.Quaternion(),_q3=new THREE.Quaternion(),_up=new THREE.Vector3(0,1,0);
function rotW(b,axis,ang){b.parent.getWorldQuaternion(_q2);const la=_t1.copy(axis).applyQuaternion(_q3.copy(_q2).invert());_q2.setFromAxisAngle(la,ang);b.quaternion.premultiply(_q2);b.updateMatrixWorld(true)}
const LOW=/^(root|pelvis|thigh|calf|foot|ball)/,LC={};
function layerClip(n,k){const key=n+k;if(LC[key])return LC[key];const c=clips().find(c=>c.name==n);if(!c)return null;const tr=c.tracks.filter(t=>{const b=t.name.split('.')[0];const lo=LOW.test(b);return k=='L'?lo:!lo});
 return LC[key]=new THREE.AnimationClip(key,c.duration,tr)}
const _am={};
function armorMats(col){const k=col?col.join():'d';if(_am[k])return _am[k];const c=new THREE.Color(...(col||[.11,.1,.06]));
 return _am[k]={plate:new THREE.MeshStandardMaterial({color:c,roughness:.55,metalness:.15}),plate2:new THREE.MeshStandardMaterial({color:c.clone().multiplyScalar(.75),roughness:.45,metalness:.3}),cloth:new THREE.MeshStandardMaterial({color:new THREE.Color(.13,.14,.1),roughness:.9})}}
// cast list
export const CAST={
 hicks:{sex:'m',hair:'hair_simpleparted',hairCol:[.12,.08,.05],skin:[1,.95,.9],armor:1,helmet:1,gun:'rifle'},
 hudson:{sex:'m',hair:'hair_buzzed',hairCol:[.22,.14,.08],skin:[1.05,.98,.92],armor:1,helmet:1,gun:'rifle'},
 apone:{sex:'m',hair:'hair_buzzed',hairCol:[.03,.03,.03],skin:[.55,.42,.34],armor:1,helmet:0,gun:'rifle'},
 vasquez:{sex:'f',hair:'hair_buzzedfemale',hairCol:[.05,.04,.03],skin:[.86,.74,.62],armor:1,bandana:1,gun:'smart'},
 drake:{sex:'m',hair:'hair_buzzed',hairCol:[.1,.08,.06],skin:[.95,.88,.82],armor:1,helmet:1,gun:'smart'},
 gorman:{sex:'m',hair:'hair_simpleparted',hairCol:[.35,.26,.16],skin:[1.05,1,.95],armor:1,helmet:0,glasses:1,gun:0},
 marine:{sex:'m',hair:'hair_buzzed',hairCol:[.1,.08,.06],armor:1,helmet:1,gun:'rifle'},
 ripley:{sex:'f',outfit:'ripley',hair:'hair_long',hairCol:[.12,.08,.05],skin:[1.05,1,.97]},
 newt:{sex:'f',outfit:'newt',hair:'hair_long',hairCol:[.62,.48,.28],skin:[1.08,1.02,.98],scale:.64},
 burke:{sex:'m',outfit:'suit',hair:'hair_simpleparted',hairCol:[.25,.18,.12],skin:[1.05,.98,.94]},
 bishop:{sex:'m',outfit:'bishop',hair:'hair_simpleparted',hairCol:[.7,.68,.62],skin:[1.15,1.12,1.1]},
 colonist:{sex:'m',outfit:'colonist',hair:'hair_beard',hairCol:[.3,.22,.15],skin:[1.1,1,.95]}};
export function actor(who,extra){return new Actor(Object.assign({},CAST[who]||CAST.marine,extra||{}))}

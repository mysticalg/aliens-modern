// shared helpers for chapters 3-8: resin hive dressing, alien spawners, timers
import * as G from './game.js?v=11';
const {THREE,rnd,WD,dist}=G;
export const TS=new URLSearchParams(location.search).has('fast')?.35:1;
// biomechanical resin growing over walls: ribs, tubes and drips, instanced
export function resinDress(o={}){const W=WD.W,CS=G.CS,WH=G.WH;const ribs=[],tubes=[],blobs=[];const H=(a)=>{const s=Math.sin(a*127.1)*43758.5453;return s-Math.floor(s)};
 W.map.forEach((r,j)=>[...r].forEach((ch,i)=>{if(ch=='#'||ch==' ')return;if(G.solid(i*CS,j*CS)&&!'cSX'.includes(ch))return;const x=i*CS,z=j*CS;
  for(const[di,dj]of[[1,0],[-1,0],[0,1],[0,-1]]){const c=(W.map[j+dj]||'')[i+di];if(c!='#')continue;const wx=x+di*CS*.5,wz=z+dj*CS*.5;const n=o.dense||4;
   for(let k=0;k<n;k++){const h=H(i*13.1+j*7.7+k*3.3+di*5+dj*11);const t=(k+.5)/n-.5+(h-.5)*.2;const px=wx+(dj?t*CS:0)-di*.08,pz=wz+(di?t*CS:0)-dj*.08;
    ribs.push([px,WH/2,pz,(h-.5)*.4,.7+h*.6]);if(h>.55)blobs.push([px-di*.1,.3+h*2.6,pz-dj*.1,h*6,.25+h*.35])}
   tubes.push([wx-di*.15,.4+H(i+j)*2.4,wz-dj*.15,di?0:Math.PI/2])}}));
 const m=_rm||(_rm=resin());const M=new THREE.Matrix4(),q=new THREE.Quaternion(),s=new THREE.Vector3(),p=new THREE.Vector3(),e=new THREE.Euler();
 const mk=(geo,arr,f)=>{if(!arr.length)return;const im=new THREE.InstancedMesh(geo,m,arr.length);arr.forEach((a,k)=>{f(a);M.compose(p,q,s);im.setMatrixAt(k,M)});im.castShadow=true;im.receiveShadow=true;W.group.add(im)};
 mk(new THREE.CylinderGeometry(.09,.16,WH,7,6),ribs,a=>{p.set(a[0],a[1],a[2]);e.set(a[3]*.3,0,a[3]);q.setFromEuler(e);s.set(a[4],1,a[4])});
 mk(new THREE.CylinderGeometry(.11,.11,CS,8,4).rotateZ(Math.PI/2),tubes,a=>{p.set(a[0],a[1],a[2]);e.set(0,a[3],0);q.setFromEuler(e);s.set(1,1,1)});
 mk(new THREE.SphereGeometry(1,10,8),blobs,a=>{p.set(a[0],a[1],a[2]);e.set(a[3],a[3]*.7,0);q.setFromEuler(e);s.set(a[4],a[4]*1.6,a[4]*.6)})}
let _rm=null;function resin(){const m=new THREE.MeshPhysicalMaterial({color:0x3a4048,roughness:.35,metalness:.2,clearcoat:.8,clearcoatRoughness:.3});
 const c=G.egg();c.traverse(o=>{if(o.isMesh&&o.material.normalMap){m.normalMap=o.material.normalMap;m.normalScale=new THREE.Vector2(.8,.8)}});return m}
// cocoon on a wall cell, optional figure inside
export function wallCocoons(ch){const W=WD.W,CS=G.CS;for(const[x,z]of W.mk[ch]||[]){const i=Math.round(x/CS),j=Math.round(z/CS);let dx=0,dz=0;for(const[a,b]of[[1,0],[-1,0],[0,1],[0,-1]])if(!G.solid((i+a)*CS,(j+b)*CS)&&(W.map[j+b]||'')[i+a]!=ch){dx=a;dz=b;break}
  const c=G.PR.cocoon();c.position.set(x+dx*.9,.1,z+dz*.9);c.rotation.y=Math.atan2(dx,dz);c.scale.setScalar(1.1);W.group.add(c);WD.block(c)}}
// spawner: keeps up to max hunters alive, emerging from points the player cannot see up close
export function spawner(pts,o={}){const S={t:0,n:0,max:o.max||5,every:o.every||1.6,on:true,total:o.total||1e9};
 S.step=(dt)=>{if(!S.on||S.n>=S.total)return;S.t-=dt;const C=G.C;const al=G.alive().filter(e=>e.k=='alien').length;if(S.t>0||al>=S.max)return;
  const cand=pts.filter(([x,z])=>Math.hypot(C.p.x-x,C.p.z-z)>(o.minD||6));if(!cand.length)return;const[x,z]=cand[(rnd()*cand.length)|0];
  const e=G.spawn(o.k||'alien',x+(rnd()-.5)*.6,z+(rnd()-.5)*.6,Object.assign({wake:99},o.opt||{}));if(o.ceil){e.y=2.4}S.n++;S.t=S.every*(.7+rnd()*.6)};return S}
export const nearest=()=>{const C=G.C;let b=null;for(const e of G.alive())if(!e.inert&&(!b||dist(C.p,e)<dist(C.p,b)))b=e;return b};
export const fmt=t=>{t=Math.max(0,Math.ceil(t));return Math.floor(t/60)+':'+String(t%60).padStart(2,'0')};
// swap the on-foot set for a fresh drive set (keeps chapter state)
export function clearForDrive(keep=[]){const C=G.C;for(const ch of[...C.g.children])if(!keep.includes(ch))ch.visible=false;G.LS.list.length=0;for(const e of C.en)e.obj.root.removeFromParent();C.en=[];C.allies.forEach(a=>a.gone=true);WD.W.colliders=[];WD.W.camBlock=[];WD.W.steam=[];C.act=null;C.goal=null;C.trk=false}
// small lit cockpit set for driver close-ups, built away from the level
export function cockpit(x,z){const g=new THREE.Group();g.position.set(x,0,z);const D=G.pbr('panel',{color:0x3a3f44}),P=G.pbr('panel',{color:0x6a7076});
 const box=(w,h,d,m,px,py,pz)=>{const b=new THREE.Mesh(G.boxGeo(w,h,d,1,.03),m);b.position.set(px,py,pz);b.receiveShadow=true;g.add(b);return b};
 box(3.2,.1,3,D,0,0,0);box(3.2,.1,3,D,0,2.1,0);box(.1,2.1,3,P,-1.6,1.05,0);box(.1,2.1,3,P,1.6,1.05,0);box(3.2,2.1,.1,P,0,1.05,-1.5);box(3.2,.9,.6,D,0,.75,-1.15);
 for(let k=0;k<4;k++){const sc=new THREE.Mesh(new THREE.PlaneGeometry(.5,.32),G.emiss([0x40ff90,0x60c0ff,0xffa040,0x40ff90][k],1.6));sc.position.set(-1.05+k*.7,1.45,-1.44);g.add(sc)}
 const sl=new THREE.Mesh(new THREE.BoxGeometry(2.4,.05,.3),G.emiss(0xcfe0ff,1.2));sl.position.set(0,2.03,.2);g.add(sl);
 G.C.g.add(g);G.LS.list.push({p:[x,1.9,z+.4],c:0xbfd6ff,col:new THREE.Color(0xbfd6ff),i:7,d:6,ph:0},{p:[x,1.3,z-1.1],c:0x50ff90,col:new THREE.Color(0x50ff90),i:2.5,d:3,ph:0,flick:1});return g}
// automated sentry gun: tracks the nearest alien in its arc, burns ammo, tracer fire
export function sentryGun(x,z,ya,ammo=500,o={}){const C=G.C;const m=G.PR.sentry();m.position.set(x,0,z);m.rotation.y=ya;C.g.add(m);const head=m.userData.head;
 const S={x,z,ya,ammo,max:ammo,on:false,t:0,m,tgt:null};
 S.step=(dt)=>{if(!S.on||S.ammo<=0)return;S.t-=dt;let b=null,bd=o.rng||22;for(const e of G.alive()){if(e.inert)continue;const d=Math.hypot(e.x-x,e.z-z);if(d>bd)continue;let a=Math.atan2(e.x-x,e.z-z)-ya;a=Math.atan2(Math.sin(a),Math.cos(a));if(Math.abs(a)>1.1||!G.los(x,z,e.x,e.z))continue;b=e;bd=d}
  S.tgt=b;if(!b){head.rotation.y*=.96;return}const want=Math.atan2(b.x-x,b.z-z)-ya;head.rotation.y+=(Math.atan2(Math.sin(want),Math.cos(want))-head.rotation.y)*Math.min(1,dt*10);
  if(S.t>0)return;S.t=.085;S.ammo-=1;const mz=new THREE.Vector3(x,.95,z);const dir=new THREE.Vector3(Math.sin(ya+head.rotation.y),0,Math.cos(ya+head.rotation.y));mz.addScaledVector(dir,.95);
  G.muzzleFlash(mz,dir);const hp=new THREE.Vector3(b.x,(b.y||0)+1,b.z);G.tracer(mz,hp);if(rnd()<.35)G.SFX.smart&&G.SFX.smart();if(rnd()<.55)G.dmgE(b,.5,hp)};return S}

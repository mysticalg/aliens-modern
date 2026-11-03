// ORIGINAL procedural creature designs, built and animated entirely in code (no film/game assets).
import {THREE} from './engine.js?v=9';
import {alienSkin,huggerSkin,plain} from './assets.js?v=9';
const V=(x,y,z)=>new THREE.Vector3(x,y,z);
function J(parent,x=0,y=0,z=0){const g=new THREE.Group();g.position.set(x,y,z);parent.add(g);return g}
function seg(parent,len,r0,r1,mat,dir=-1){const g=new THREE.CylinderGeometry(r1,r0,len,8,1);g.translate(0,dir*len/2,0);if(dir>0)g.rotateX(0);const m=new THREE.Mesh(g,mat);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m}
function ball(parent,r,mat,sx=1,sy=1,sz=1,x=0,y=0,z=0){const m=new THREE.Mesh(new THREE.SphereGeometry(r,14,10),mat);m.scale.set(sx,sy,sz);m.position.set(x,y,z);m.castShadow=true;parent.add(m);return m}
function lathe(pts,seg=20){return new THREE.LatheGeometry(pts.map(([r,y])=>new THREE.Vector2(r,y)),seg)}
// shared geometries
let HEADG=null,RIBG=null,EGGG=null;
function headGeo(){if(HEADG)return HEADG;// long smooth carapace: profile along +y, rotated later to sweep backwards
 const pts=[[0,-.02],[.07,0],[.1,.06],[.115,.16],[.12,.3],[.115,.45],[.1,.58],[.075,.7],[.045,.8],[.0,.86]];const g=lathe(pts,24);
 const p=g.attributes.position;for(let i=0;i<p.count;i++){const y=p.getY(i);p.setX(i,p.getX(i)*(1+.15*Math.sin(y*6)));p.setZ(i,p.getZ(i)*.82)}g.computeVertexNormals();return HEADG=g}
function ribGeo(){if(RIBG)return RIBG;const pts=[[.05,-.02],[.15,.04],[.2,.16],[.21,.3],[.18,.42],[.12,.5],[.06,.54]];const g=lathe(pts,20);g.scale(1,1,.78);return RIBG=g}
const TOOTH=new THREE.ConeGeometry(.008,.03,5);
export class Alien{constructor(o={}){this.o=o;const sk=o.mat||alienSkin();this.mat=sk;const R=this.root=new THREE.Group();const S=this.s=o.scale||1;const B=this.body=J(R);B.scale.setScalar(S);
  const hips=this.hips=J(B,0,.98,0);ball(hips,.15,sk,1.1,.85,1.2);
  this.legs=[-1,1].map(sd=>{const h=J(hips,sd*.14,-.02,0);const th=seg(h,.52,.095,.06,sk);const kn=J(h,0,-.52,0);ball(kn,.055,sk);seg(kn,.5,.06,.035,sk);const an=J(kn,0,-.5,0);ball(an,.04,sk);seg(an,.3,.032,.025,sk);const ft=J(an,0,-.3,0);
   for(const t of[-1,0,1]){const toe=J(ft,t*.03,0,0);toe.rotation.x=1.35;toe.rotation.z=t*.25;seg(toe,.13,.018,.004,sk)}
   const spur=J(kn,0,-.05,-.03);spur.rotation.x=-2.3;seg(spur,.12,.02,.003,sk);return{h,kn,an,ft,sd}});
  const sp=this.spine=J(hips,0,.06,-.02);for(let k=0;k<4;k++){const v=new THREE.Mesh(new THREE.TorusGeometry(.085-k*.004,.03,6,12),sk);v.position.y=.06+k*.075;v.rotation.x=Math.PI/2;v.scale.set(1,1.2,1);sp.add(v)}
  const ch=this.chest=J(sp,0,.32,0);const rib=new THREE.Mesh(ribGeo(),sk);rib.castShadow=true;ch.add(rib);
  for(let k=0;k<5;k++){const r=new THREE.Mesh(new THREE.TorusGeometry(.19-Math.abs(k-2)*.02,.012,5,16,Math.PI*1.1),sk);r.position.set(0,.1+k*.075,.0);r.rotation.set(Math.PI/2,0,-Math.PI*.05);r.scale.set(1,.8,1);ch.add(r)}
  // dorsal tubes (original motif)
  this.tubes=[];for(const sd of[-1,1])for(const k of[0,1]){const t=J(ch,sd*(.07+k*.05),.42-k*.06,-.12);t.rotation.set(-2.5+k*.25,0,sd*(.35+k*.2));seg(t,.42-k*.1,.03,.012,sk);this.tubes.push(t)}
  const nk=this.neck=J(ch,0,.52,.02);seg(nk,.16,.04,.05,sk,1);const hd=this.head=J(nk,0,.14,.04);
  const dome=new THREE.Mesh(headGeo(),sk);dome.rotation.x=-1.2;dome.position.set(0,.0,.12);dome.castShadow=true;hd.add(dome);
  // jaw + teeth
  const jaw=this.jaw=J(hd,0,-.05,.12);const jm=ball(jaw,.06,sk,.9,.55,1.3,0,-.02,.03);const tm=plain(0xbfc4c0,.25,.6);
  for(let i=0;i<9;i++){const a=(i/8-.5)*2.2;for(const row of[0,1]){const t=new THREE.Mesh(TOOTH,tm);t.position.set(Math.sin(a)*.045,row?-.035:-.005,.08+Math.cos(a)*.03);t.rotation.x=row?0:Math.PI;hd.add(t)}}
  const lip=ball(hd,.07,plain(0x1a0e10,.5,0,{}),.85,.4,1.1,0,-.02,.1);
  for(const sd of[-1,1]){const cheek=ball(hd,.055,sk,.9,.7,1.2,sd*.045,.03,.06)}
  this.arms=[-1,1].map(sd=>{const sh=J(ch,sd*.2,.43,.0);ball(sh,.05,sk);const ua=seg(sh,.42,.055,.035,sk);const el=J(sh,0,-.42,0);ball(el,.035,sk);seg(el,.44,.04,.025,sk);const wr=J(el,0,-.44,0);
   ball(wr,.035,sk,1,1.2,.7);const fs=[];for(let f=0;f<4;f++){const fj=J(wr,(f-1.5)*.022,-.03,f==0?.03:0);fj.rotation.z=(f-1.5)*.12;fj.rotation.x=f==0?-.6:0;seg(fj,.12,.012,.005,sk);const f2=J(fj,0,-.12,0);f2.rotation.x=.4;seg(f2,.1,.008,.002,sk);fs.push(fj)}
   return{sh,el,wr,sd,fs}});
  // tail
  this.tail=[];let p=J(hips,0,-.02,-.14);const n=o.tailN||16;for(let k=0;k<n;k++){const r=.06*(1-k/n)+.008;const L=.1;const s=J(p,0,0,k?-L:0);if(k==0)s.rotation.x=0;const m=new THREE.Mesh(new THREE.SphereGeometry(r,8,6),sk);m.scale.set(1,1,1.8);s.add(m);this.tail.push(s);p=s}
  const blade=new THREE.Mesh(new THREE.ConeGeometry(.04,.22,4),sk);blade.rotation.x=-Math.PI/2;blade.position.z=-.14;blade.scale.set(.3,1,1);p.add(blade);
  R.traverse(m=>{if(m.isMesh){m.castShadow=true;m.receiveShadow=true}});
  this.t=Math.random()*10;this.ph=Math.random()*6;this.speed=0;this.atk=0;this.dead=0;this.crouch=0;this.hurt=0;this.climb=0}
 update(dt,s={}){const t=this.t+=dt;const sp=s.speed??this.speed;this.ph+=dt*(2+sp*2.4);const ph=this.ph,run=Math.min(1,sp/3);const dead=s.dead??this.dead,atk=s.atk??this.atk;
  const cr=(s.crouch??this.crouch);const hips=this.hips;
  // posture: hunched sprinter, low when running
  const lean=(this.o.lean??.8)+run*.5+cr*.3;hips.position.y=.98-run*.12-cr*.35+Math.abs(Math.sin(ph))*.04*run;this.spine.rotation.x=lean;this.chest.rotation.x=.15+run*.1;
  this.neck.rotation.x=-lean*.9-.2+Math.sin(t*1.3)*.05;this.head.rotation.x=-.2+Math.sin(t*.9)*.08;this.head.rotation.y=Math.sin(t*.6)*.25*(1-run);this.head.rotation.z=Math.sin(t*.7)*.1;
  this.jaw.position.z=.12+(atk>0?.08*Math.sin(Math.min(1,atk)*Math.PI):0)+(s.hiss?.05:0);
  for(const L of this.legs){const q=ph+(L.sd>0?Math.PI:0);const sw=Math.sin(q)*.75*run;L.h.rotation.x=-.6-cr*.6+sw-run*.2;L.kn.rotation.x=1.5+cr*.6+Math.max(0,-Math.cos(q))*.6*run;L.an.rotation.x=-1.2-cr*.2;L.ft.rotation.x=.3;L.h.rotation.z=L.sd*.12}
  for(const A of this.arms){const q=ph+(A.sd>0?0:Math.PI);const reach=atk>0?Math.sin(Math.min(1,atk)*Math.PI):0;
   A.sh.rotation.x=-.4-run*.4+Math.sin(q)*.6*run-reach*1.4+Math.sin(t*1.1+A.sd)*.06;A.sh.rotation.z=A.sd*(.35+.1*Math.sin(t*.8));A.el.rotation.x=-1.0-run*.5+reach*.6;A.wr.rotation.x=-.3;
   A.fs.forEach((f,i)=>f.rotation.x=(i==0?-.6:0)-.3-reach*.4+Math.sin(t*2+i)*.05)}
  this.tail.forEach((s2,k)=>{s2.rotation.y=Math.sin(t*1.6-k*.45)*.12*(1+run*.5);s2.rotation.x=k==0?.25+run*.3:-.03+Math.sin(t*.9-k*.3)*.02});
  this.tubes.forEach((tb,i)=>tb.rotation.y=Math.sin(t*.5+i)*.03);
  // death: crumple
  if(dead>0){const d=Math.min(1,dead*1.5);this.body.rotation.z=d*1.4*(this.ph%2>1?1:-1);this.body.position.y=-d*.25;hips.position.y=lerp(hips.position.y,.35,d);this.legs.forEach(L=>{L.kn.rotation.x=lerp(L.kn.rotation.x,2.4,d)})}
  else{this.body.rotation.z=0;this.body.position.y=0}
  if(this.hurt>0){this.hurt-=dt;this.chest.rotation.x-=this.hurt*.8}
  // keep the lowest foot on the ground plane
  if(!(dead>0)&&!s.noGround){this.body.position.y=0;this.root.updateMatrixWorld(true);let mn=1e9;for(const L of this.legs){L.ft.getWorldPosition(_w);mn=Math.min(mn,_w.y)}this.root.getWorldPosition(_w2);this.body.position.y=-(mn-_w2.y)+.02*this.s}}
 dispose(){this.root.removeFromParent()}}
const lerp=(a,b,k)=>a+(b-a)*k;const _w=new THREE.Vector3(),_w2=new THREE.Vector3();
export class Hugger{constructor(){const sk=huggerSkin();const R=this.root=new THREE.Group();const B=this.body=J(R,0,.12,0);ball(B,.13,sk,1,.45,1.3);ball(B,.07,sk,.8,.6,1,0,.04,-.05);
  this.legs=[];for(const sd of[-1,1])for(let k=0;k<4;k++){const h=J(B,sd*.08,0,.09-k*.055);h.rotation.y=sd*(1.05+k*.32)-Math.PI/2*sd+(sd>0?0:0);const u=J(h);u.rotation.z=sd*-.6;seg(u,.16,.016,.012,sk);const kn=J(u,0,-.16,0);kn.rotation.z=sd*-1.4;seg(kn,.15,.012,.004,sk);
   // legs extend sideways: rotate group so -y points outward
   h.rotation.order='YXZ';this.legs.push({h,u,kn,sd,k})}
  this.tail=[];let p=J(B,0,0,-.13);for(let k=0;k<12;k++){const s=J(p,0,0,k?-.06:0);const m=new THREE.Mesh(new THREE.SphereGeometry(.028*(1-k/14)+.006,6,5),sk);m.scale.set(1,1,2);s.add(m);this.tail.push(s);p=s}
  R.traverse(m=>{if(m.isMesh)m.castShadow=true});this.t=Math.random()*9}
 update(dt,s={}){const t=this.t+=dt*(1+(s.speed||0)*1.5);const run=Math.min(1,(s.speed||0)/3);
  for(const L of this.legs){const q=t*14+L.k*1.4+(L.sd>0?Math.PI:0);L.h.rotation.z=0;L.u.rotation.z=L.sd*(-1.2+Math.sin(q)*.3*(.3+run));L.u.rotation.x=Math.cos(q)*.35*run;L.kn.rotation.z=L.sd*(1.6+(s.latch?.6:0))}
  this.tail.forEach((s2,k)=>{s2.rotation.y=Math.sin(t*6-k*.6)*.25;s2.rotation.x=Math.sin(t*3-k*.4)*.08});
  this.body.position.y=.12+Math.abs(Math.sin(t*14))*.01;if(s.dead){this.root.rotation.z=Math.min(Math.PI,s.dead*6);this.body.position.y=.05}}}
// queen: scaled warrior chassis + original fan crest + second arm pair
export class Queen extends Alien{constructor(){super({scale:2.5,tailN:26,lean:.9});const sk=this.mat;
  const sh=new THREE.Shape();sh.moveTo(0,0);const N=7;for(let i=0;i<=N;i++){const a=-1.1+i/N*2.2;const r=.75+.08*Math.cos(i*Math.PI);sh.lineTo(Math.sin(a)*r,Math.cos(a)*r)}sh.lineTo(0,0);
  const crest=new THREE.Mesh(new THREE.ExtrudeGeometry(sh,{depth:.03,bevelEnabled:true,bevelThickness:.02,bevelSize:.02,bevelSegments:2,curveSegments:4}),sk);crest.rotation.x=-1.7;crest.position.set(0,.04,.1);crest.scale.set(.42,.6,1);this.head.add(crest);this.crest=crest;
  for(let k=0;k<4;k++){const r=new THREE.Mesh(new THREE.CylinderGeometry(.012,.02,.6,6),sk);r.position.set((k-1.5)*.08,.04,-.15);r.rotation.x=-1.5;r.rotation.z=(k-1.5)*.3;this.head.add(r)}
  this.small=[-1,1].map(sd=>{const s2=J(this.chest,sd*.1,.32,.12);seg(s2,.22,.025,.015,sk);const e=J(s2,0,-.22,0);seg(e,.22,.015,.008,sk);return{s2,e,sd}})}
 update(dt,s={}){super.update(dt,s);const t=this.t;this.small.forEach(a=>{a.s2.rotation.x=-1.2+Math.sin(t*1.3+a.sd)*.2;a.e.rotation.x=-1.2})}}
export function egg(){if(!EGGG){EGGG=lathe([[0,0],[.12,.03],[.2,.14],[.22,.3],[.19,.45],[.12,.54],[.06,.57]],18)}const m=new THREE.MeshPhysicalMaterial({color:0x4a4232,roughness:.5,clearcoat:.5,normalMap:alienSkin().normalMap,normalScale:new THREE.Vector2(.6,.6)});
 const g=new THREE.Group();const b=new THREE.Mesh(EGGG,m);b.castShadow=true;g.add(b);const petals=[];for(let i=0;i<4;i++){const p=J(g,0,.55,0);p.rotation.y=i*Math.PI/2;const q=J(p,.03,0,0);const l=new THREE.Mesh(new THREE.SphereGeometry(.07,8,6,0,Math.PI),m);l.scale.set(.6,.5,1.1);l.rotation.y=Math.PI/2;q.add(l);petals.push(q)}
 g.userData.open=k=>petals.forEach(q=>q.rotation.z=-k*1.1);return g}

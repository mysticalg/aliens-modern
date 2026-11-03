// Vehicles and set dressing built procedurally from PBR primitives.
import {THREE} from './engine.js?v=7';
import {pbr,plain,emiss,boxGeo,model,resinMat} from './assets.js?v=7';
const M=(g,m,x=0,y=0,z=0)=>{const o=new THREE.Mesh(g,m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;return o};
const hullM=()=>pbr('panel',{color:0x6f7560}),darkM=()=>pbr('panel',{color:0x2c302a}),rubber=plain(0x101010,.85,0),glass=new THREE.MeshPhysicalMaterial({color:0x223038,roughness:.08,metalness:.2,transmission:0,clearcoat:1,envMapIntensity:2});
export function apc(){const g=new THREE.Group(),H=hullM(),D=darkM();
 g.add(M(boxGeo(2.6,1.3,6.2,1.5,.12),H,0,1.35,0));g.add(M(boxGeo(2.3,.6,3.2,1.5,.1),H,0,2.25,.6));
 const nose=M(boxGeo(2.5,.8,1.4,1.5,.1),H,0,1.05,3.3);nose.rotation.x=.35;g.add(nose);
 g.add(M(boxGeo(2.7,.25,6.4,1.5,.05),D,0,.82,0));
 const tur=new THREE.Group();tur.position.set(0,2.7,-.6);tur.add(M(new THREE.CylinderGeometry(.55,.65,.35,20),H));for(const s of[-.18,.18]){const b=M(new THREE.CylinderGeometry(.05,.05,1.5,10),D,s,.05,.8);b.rotation.x=Math.PI/2;tur.add(b)}g.add(tur);g.userData.tur=tur;
 const wheels=[];for(const z of[-2.2,-.75,.75,2.2])for(const s of[-1,1]){const w=new THREE.Group();w.position.set(s*1.25,.55,z);const t=M(new THREE.CylinderGeometry(.55,.55,.42,22),rubber);t.rotation.z=Math.PI/2;w.add(t);const hub=M(new THREE.CylinderGeometry(.28,.28,.44,10),D);hub.rotation.z=Math.PI/2;w.add(hub);g.add(w);wheels.push(w)}
 g.userData.wheels=wheels;
 for(const s of[-1,1]){g.add(M(new THREE.BoxGeometry(.04,.12,1.8),glass,s*1.16,2.3,.9));const hl=M(new THREE.BoxGeometry(.3,.12,.05),emiss(0xfff0d0,6),s*.85,1.25,3.95);g.add(hl);
  const tl=M(new THREE.BoxGeometry(.25,.1,.05),emiss(0xff2010,2),s*1.05,1.5,-3.12);g.add(tl)}
 g.add(M(new THREE.BoxGeometry(1.4,.1,.04),emiss(0xffa040,1.2),0,2.0,-3.12));
 return g}
export function spinWheels(g,v,dt){for(const w of g.userData.wheels)w.rotation.x+=v*dt/.55}
export function dropship(){const g=new THREE.Group(),H=pbr('panel',{color:0x5c6268}),D=darkM();
 const fus=new THREE.LatheGeometry([[0,-7],[.9,-6.4],[1.6,-4.5],[1.9,-1],[1.9,3],[1.5,5.5],[.7,7.6],[0,8]].map(p=>new THREE.Vector2(p[0],p[1])),20);const f=M(fus,H);f.rotation.x=Math.PI/2;f.scale.set(1.3,.85,1);g.add(f);
 g.add(M(boxGeo(2.8,.9,6,1.5,.2),H,0,-1.1,0));
 for(const s of[-1,1]){const w=M(boxGeo(5,.25,3,1.5,.08),H,s*3.6,.1,-1.5);w.rotation.z=s*-.12;g.add(w);
  const pod=M(new THREE.CylinderGeometry(.75,.9,4.4,16),D,s*5.6,.3,-1.6);pod.rotation.x=Math.PI/2;g.add(pod);
  const glow=M(new THREE.CircleGeometry(.65,16),emiss(0x80b4ff,5),s*5.6,.3,-3.82);glow.rotation.y=Math.PI;g.add(glow);g.userData['eng'+s]=glow;
  const fin=M(boxGeo(.2,2.2,2.4,1,.05),H,s*1.1,1.9,-6);fin.rotation.z=s*.35;g.add(fin);
  g.add(M(new THREE.SphereGeometry(.12,8,6),emiss(s<0?0xff2020:0x20ff40,6),s*6.1,.2,-.1))}
 const cock=M(new THREE.SphereGeometry(1,16,10,0,Math.PI*2,0,1.2),glass,0,.85,5.2);cock.scale.set(1.1,.6,1.6);g.add(cock);
 for(const s of[-1,1]){const gun=M(new THREE.CylinderGeometry(.08,.08,2.2,8),D,s*1.3,-1.4,4.2);gun.rotation.x=Math.PI/2;g.add(gun)}
 const bl=M(new THREE.SphereGeometry(.1,8,6),emiss(0xfff0c0,8),0,-1.6,6.3);g.add(bl);return g}
// interior: troop bay for the drop cutscene
export function troopBay(parent,x,z){const g=new THREE.Group();g.position.set(x,0,z);const P=pbr('panel',{color:0x8b9196}),D=pbr('panel',{color:0x3a3e42}),G=pbr('grid',{color:0x9a9a9a});
 g.add(M(boxGeo(4.4,.1,11,2),G,0,-.05,0));for(const s of[-1,1]){g.add(M(boxGeo(.3,3,11,2),P,s*2.25,1.5,0));g.add(M(boxGeo(.6,.12,10,2),D,s*1.6,.48,0));for(let k=-4;k<=4;k+=1.6){g.add(M(boxGeo(.08,1.1,.08,1),D,s*1.95,1.05,k));}}
 g.add(M(boxGeo(4.4,.2,11,2),D,0,3,0));for(let k=-4;k<=4;k+=2){g.add(M(new THREE.BoxGeometry(.4,.04,1),emiss(0xd8f0ff,2.5),0,2.88,k))}
 g.add(M(boxGeo(4.4,3,.2,2),P,0,1.5,-5.5));const door=M(boxGeo(4.2,2.9,.2,2),pbr('panel',{color:0x55595c}),0,1.5,5.5);g.add(door);parent.add(g);return g}
export function sentry(){const g=new THREE.Group(),D=darkM(),H=hullM();for(let k=0;k<3;k++){const l=M(new THREE.CylinderGeometry(.03,.03,1.1,6),D);l.position.set(Math.sin(k*2.1)*.35,.45,Math.cos(k*2.1)*.35);l.rotation.set(Math.cos(k*2.1)*.35,0,-Math.sin(k*2.1)*.35);g.add(l)}
 const head=new THREE.Group();head.position.y=.95;head.add(M(boxGeo(.4,.35,.6,1,.05),H));const b=M(new THREE.CylinderGeometry(.04,.05,.8,8),D,0,0,.6);b.rotation.x=Math.PI/2;head.add(b);head.add(M(new THREE.BoxGeometry(.05,.05,.02),emiss(0xff3020,4),.12,.12,.31));g.add(head);g.userData.head=head;return g}
export function specimenTank(withHugger){const g=new THREE.Group(),D=darkM();g.add(M(new THREE.CylinderGeometry(.55,.6,.35,20),D,0,.17,0));g.add(M(new THREE.CylinderGeometry(.55,.55,.25,20),D,0,2.35,0));
 const fl=new THREE.MeshPhysicalMaterial({color:0x6fa890,roughness:.1,transmission:.0,transparent:true,opacity:.35,emissive:new THREE.Color(0x1c4a3a),emissiveIntensity:1.2,depthWrite:false});
 const tube=new THREE.Mesh(new THREE.CylinderGeometry(.5,.5,2,24,1,true),fl);tube.position.y=1.25;g.add(tube);
 const gl=new THREE.MeshPhysicalMaterial({color:0xddeeff,roughness:.05,metalness:0,transparent:true,opacity:.18,clearcoat:1,envMapIntensity:2.5,depthWrite:false,side:THREE.DoubleSide});const gt=new THREE.Mesh(new THREE.CylinderGeometry(.52,.52,2,24,1,true),gl);gt.position.y=1.25;g.add(gt);g.userData.glass=gt;return g}
export function table(){const g=new THREE.Group(),D=pbr('panel',{color:0x8a8e90});g.add(M(boxGeo(1.8,.06,.9,1,.01),D,0,.78,0));for(const x of[-.8,.8])for(const z of[-.38,.38])g.add(M(new THREE.CylinderGeometry(.03,.03,.78,6),D,x,.39,z));return g}
export function cocoon(){const g=new THREE.Group();const m=M(new THREE.SphereGeometry(.5,14,12),resinMat(),0,1.3,0);m.scale.set(.9,1.9,.7);g.add(m);return g}
export function sandbags(w=2.4){const g=new THREE.Group(),m=pbr('concrete',{color:0x8a7c62,metal:0});for(let r=0;r<3;r++)for(let k=0;k<Math.round(w/.6);k++){const b=M(boxGeo(.62,.24,.42,1,.1),m,-w/2+.3+k*.6+(r%2)*.3,.12+r*.24,0);b.rotation.y=(Math.sin(k*7+r)*.08);g.add(b)}return g}
export function loader(){const g=new THREE.Group(),Y=pbr('panel',{color:0xc89a20}),D=darkM();
 g.add(M(boxGeo(1.3,.6,1.1,1,.08),Y,0,1.2,0));g.add(M(boxGeo(.9,1.2,.3,1,.05),D,0,2.1,-.45));const cage=M(new THREE.TorusGeometry(.6,.05,6,16,Math.PI),Y,0,2.3,0);g.add(cage);
 const legs=[],arms=[];for(const s of[-1,1]){const L=new THREE.Group();L.position.set(s*.55,1,0);L.add(M(boxGeo(.3,1,.4,1,.05),Y,0,-.45,0));L.add(M(boxGeo(.45,.15,.8,1,.03),D,0,-.95,.15));g.add(L);legs.push(L);
  const A=new THREE.Group();A.position.set(s*.85,2.1,0);A.add(M(boxGeo(.25,.25,1.1,1,.05),Y,0,0,.4));const cl=M(boxGeo(.35,.12,.5,1,.03),D,0,-.1,1.05);A.add(cl);g.add(A);arms.push(A)}
 g.userData.legs=legs;g.userData.arms=arms;return g}

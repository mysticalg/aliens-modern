// ===== CHAPTER 8 — SULACO =====
import * as G from './game.js?v=8';
import {fmt,TS} from './hive.js?v=8';
const {THREE,PI,rnd,LV,PR,WD,dist}=G;
const MAP8=["#################",
"#......A........#",
"#...............#",
"#..x.........x..#",
"#...............#",
"#.......D.......#",
"#...............#",
"#..x.........x..#",
"#...............#",
"#...N.......R...#",
"#################"];
let ld,L,qn,Q,nw,bi,ds,rp,hatch;
const _v=new THREE.Vector3();
LV[8]={init(){const C=G.C;G.env({fog:.018,fogCol:0x101418,hemi:.85,hemiCol:0xb8c8d8,rain:false,hum:50});C.trk=false;C.mus=1;C.flashI=40;
 WD.W.solidSet='#FWKtgX';WD.setMap(MAP8);WD.buildMap({wall:'corr',wallTint:0x9098a0,floor:'plate',floorTint:0x9a9a98,clutter:.97,lightEvery:3,lightI:12,lightCol:0xeaf2ff});
 for(const[x,z]of WD.W.mk.x){const c=G.model('prop_crate_large');c.position.set(x,0,z);C.g.add(c);WD.block&&WD.block(c)}
 const[ax,az]=WD.mk('A');hatch=new THREE.Mesh(G.boxGeo(5,.12,4,1,.04),G.pbr('plate',{color:0x777a7e}));hatch.position.set(ax,.06,az+1);C.g.add(hatch);
 const ring=new THREE.Mesh(new THREE.BoxGeometry(5.4,.05,4.4),G.emiss(0xffb040,1.2));ring.position.set(ax,.02,az+1);C.g.add(ring);
 G.LS.list.push({p:[ax,3,az+1],c:0xffb050,col:new THREE.Color(0xffb050),i:10,d:10,ph:0,pulse:.6});
 const[dx,dz]=WD.mk('D');ds=PR.dropship();ds.position.set(dx,1.6,dz);ds.scale.setScalar(.7);C.g.add(ds);
 G.LS.list.push({p:[dx+5,5,dz+4],c:0xdfe8ff,col:new THREE.Color(0xdfe8ff),i:26,d:26,ph:0},{p:[dx-5,5,dz-6],c:0xdfe8ff,col:new THREE.Color(0xdfe8ff),i:22,d:24,ph:0});
 const[nx,nz]=WD.mk('N'),[rx,rz]=WD.mk('R');
 nw=G.cast('newt','newt');G.place(nw,dx-2,dz+3,0);rp=G.cast('ripley','ripley');G.place(rp,dx-1,dz+3.4,PI*.2);rp.play('Idle_Loop',0);
 bi=G.cast('bishop','bishop');G.place(bi,dx+1.5,dz+3,PI);bi.play('Idle_Talking_Loop',0);
 qn=new G.Queen();qn.root.position.set(dx,0,dz-12);qn.root.visible=false;C.g.add(qn.root);
 ld=PR.loader();ld.position.set(rx,0,rz);ld.rotation.y=PI;C.g.add(ld);
 C.pa=rp;C.weaps=['none'];G.updGun();
 const sc=(e,c,fov=46)=>()=>({e,c,fov});
 G.cut([{d:3.4,sub:'The Sulaco. The dropship settles into the hangar, engines ticking as they cool.',cam:u=>({e:[dx+8-u,3,dz+9],c:[dx,1.5,dz],fov:48}),flash:20},
  {d:3,sub:'Bishop: "Tight timing, I know. I did my best."',cam:()=>G.CU(bi,.85,.28,.02,32)},
  {d:3,sub:'Acid hisses on the deck. Something drips from the landing gear.',cam:sc([dx+1,.5,dz+1.2],[dx,.4,dz],36)},
  {d:3.2,sub:'The queen unfolds from the undercarriage. She seizes Bishop and hurls him across the hangar.',setup:()=>{qn.root.visible=true;qn.root.position.set(dx+1,0,dz);G.place(bi,dx+6,dz+5,-.4);bi.play('Death01',.1,{once:1});G.shake(.5)},cam:sc([dx-3,2,dz+8],[dx+1,3,dz],46),key:30},
  {d:3,sub:'Ripley: "Newt — get under the floor!" Newt dives beneath the deck plating.',setup:()=>{G.place(nw,nx,nz,PI)},cam:()=>G.CU(rp,.62,-.2,.02,28)},
  {d:3.2,sub:'The queen tears at the grating, hunting the child.',setup:()=>{qn.root.position.set(nx+2.5,0,nz-2.5);qn.root.rotation.y=Math.atan2(nx-qn.root.position.x,nz-qn.root.position.z);nw.root.visible=false},cam:sc([nx+5,1.2,nz+2],[nx+2,2.4,nz-2],44)},
  {d:3.4,sub:'A cargo door rolls up. Ripley strides out, strapped into a power loader. "Back off from her!"',setup:()=>{rp.root.visible=false},cam:sc([rx-2.5,2.4,rz-4],[rx,2.4,rz],38),key:40}],
  ()=>{L={x:rx,z:rz,ya:PI,v:0,punch:0,arm:0,cd:0};Q={x:nx+2.5,z:nz-2.5,ya:0,hp:60,st:'stalk',t:0,hitT:0};C.p.hp=100;G.play('loader');LV[8].stage(0)})},
 stage(n){const C=G.C;C.stage=n;
  if(n==0){C.obj='Fight the queen — punch with FIRE, back off when she rears up';C.bar=()=>['QUEEN',Q.hp/60,'#9fd0c0'];G.say(G.TOUCH?'Stick drives the loader · drag turns · FIRE punches':'W/S drive · A/D or mouse turn · click / Space punches',5)}
  if(n==1){C.bar=null;this.grapple()}
  if(n==2){const[ax,az]=WD.mk('A');C.obj='Drag her into the airlock pit';C.goal={x:ax,z:az+1};C.bar=null}
  if(n==3){C.obj='Release the outer doors — hold FIRE';C.actP=0;C.bar=()=>['AIRLOCK RELEASE',C.actP,'#e0a040']}
  if(n==4){C.bar=null;this.ending()}},
 grapple(){const C=G.C;
  G.cut([{d:3,sub:'The queen lunges and locks onto the loader. Steel shrieks.',setup:()=>G.shake(.6),cam:()=>({e:[L.x+4,2.5,L.z+3],c:[L.x,2.2,L.z],fov:44}),key:30},
   {d:2.8,sub:'Ripley, teeth gritted, grips the claws tight. She will not let go.',cam:()=>({e:[L.x+Math.sin(L.ya)*1.6,2.4,L.z+Math.cos(L.ya)*1.6],c:[L.x,2.25,L.z],fov:34}),flash:30}],()=>{G.play('loader');this.stage(2)})},
 ending(){const C=G.C;const[ax,az]=WD.mk('A');
  G.cut([{d:3,sub:'The outer doors split open. The air goes with them in a roar.',upd:(u,dt)=>{hatch.position.x=ax+u*3;G.shake(.3)},cam:()=>({e:[ax+6,3,az+7],c:[ax,0,az+1],fov:46})},
   {d:3,sub:'The queen claws for the edge — and is gone into the dark.',upd:(u,dt)=>{qn.root.position.y-=dt*6},cam:()=>({e:[ax+2,4,az+5],c:[ax,-2,az+1],fov:44})},
   {d:3,sub:'The doors seal. Silence. Newt scrambles out from the plating and runs to her.',setup:()=>{qn.root.visible=false;G.place(rp,ax+2,az+6,PI*.9);rp.play('Idle_Loop',0);G.place(nw,ax+2.7,az+7.6,PI*1.1);nw.play('Jog_Fwd_Loop',0)},upd:(u,dt)=>{nw.root.position.z-=dt*.4},cam:()=>G.CU(rp,.85,.3,.02,32),flash:40},
   {d:3.2,sub:'Newt calls her "Mum". Ripley holds her and does not let go.',setup:()=>nw.play('Idle_Loop',.3),cam:()=>G.CU(nw,.5,.14,.03,24),flash:40},
   {d:3.4,sub:'Hypersleep. Newt asks if they can dream on the long way home. Ripley says yes — they both can.',setup:()=>{for(const a of[rp,nw])a.play('Sitting_Idle_Loop',.3)},cam:()=>G.CU(nw,.55,-.16,.03,26),flash:25}],G.winCh)},
 modeStep(dt,I){const C=G.C;const cam=G.camera;
  const slow=C.stage==2?.45:1;L.ya-=I.sx*1.6*dt*(C.stage==2?.6:1)+(I.lx||0)*.003;
  const tv=(I.fw||0)*3.2*slow;L.v+=(tv-L.v)*Math.min(1,dt*4);const nx=L.x+Math.sin(L.ya)*L.v*dt,nz=L.z+Math.cos(L.ya)*L.v*dt;if(!G.solid(nx,L.z))L.x=nx;if(!G.solid(L.x,nz))L.z=nz;
  ld.position.set(L.x,0,L.z);ld.rotation.y=L.ya;const sw=Math.sin(C.t*6)*Math.min(1,Math.abs(L.v))*.35;ld.userData.legs[0].rotation.x=sw;ld.userData.legs[1].rotation.x=-sw;
  L.cd-=dt;L.punch=Math.max(0,L.punch-dt*3.2);for(let k=0;k<2;k++)ld.userData.arms[k].position.z=(k==L.arm?L.punch:0)*.9;
  C.p.x=L.x;C.p.z=L.z;C.p.ya=L.ya;
  const dq=Math.hypot(Q.x-L.x,Q.z-L.z);
  if(C.stage==0){
   // punches
   if(I.fire&&L.cd<=0){L.cd=.65;L.punch=1;L.arm^=1;G.SFX.click();let a=Math.atan2(Q.x-L.x,Q.z-L.z)-L.ya;a=Math.atan2(Math.sin(a),Math.cos(a));
    if(dq<3.4&&Math.abs(a)<.8){Q.hp-=Q.st=='wind'?6:4;Q.hitT=.3;G.SFX.boom();G.shake(.3);G.sparks(new THREE.Vector3(Q.x,2.2,Q.z),14,null,0xffc070);G.acidBurst(new THREE.Vector3(Q.x,2,Q.z),6);if(Q.st=='wind'){Q.st='reel';Q.t=1}}}
   // queen: stalk, wind up (telegraphed), strike, recover
   Q.t-=dt;const tq=Math.atan2(L.x-Q.x,L.z-Q.z);Q.ya+=Math.atan2(Math.sin(tq-Q.ya),Math.cos(tq-Q.ya))*Math.min(1,dt*3);
   if(Q.st=='stalk'){if(dq>2.6){Q.x+=Math.sin(Q.ya)*2.1*dt;Q.z+=Math.cos(Q.ya)*2.1*dt}if(dq<3.6&&Q.t<=0){Q.st='wind';Q.t=1.1;G.SFX.screech();G.say('She is rearing back — reverse or hit her first!',1.3)}}
   else if(Q.st=='wind'){if(Q.t<=0){Q.st='rec';Q.t=1.4;if(dq<3.9){G.churt(14);G.sparks(new THREE.Vector3(L.x,2.2,L.z),18,null,0xffd080)}}}
   else if(Q.st=='rec'||Q.st=='reel'){if(Q.st=='reel'){Q.x-=Math.sin(Q.ya)*1.6*dt;Q.z-=Math.cos(Q.ya)*1.6*dt}if(Q.t<=0){Q.st='stalk';Q.t=.6+rnd()*.6}}
   if(Q.hp<=21)this.stage(1)}
  if(C.stage>=2){Q.x=L.x+Math.sin(L.ya)*2.2;Q.z=L.z+Math.cos(L.ya)*2.2;Q.ya=L.ya+PI;
   if(C.stage==2&&dist(C.p,C.goal)<2.2)this.stage(3);
   if(C.stage==3){if(I.fire){C.actP+=dt/(3*TS);G.SFX.weld();if(rnd()<.4)G.sparks(new THREE.Vector3(L.x,1.2,L.z),3,null,0xffc070)}if(C.actP>=1)this.stage(4)}}
  if(!G.solid(Q.x,Q.z)||C.stage>=2){qn.root.position.set(Q.x,0,Q.z)}else{Q.x=qn.root.position.x;Q.z=qn.root.position.z}
  qn.root.rotation.set(0,Q.ya,0);qn.update(dt,{speed:Q.st=='stalk'&&dq>2.6?2.1:0,atk:Q.st=='wind'&&Q.t<.35?1:0,hiss:1});
  // chase camera behind and above the loader, framing the queen
  const bx=L.x-Math.sin(L.ya)*5.2,bz=L.z-Math.cos(L.ya)*5.2;_v.set(bx,3.4,bz);cam.position.lerp(_v,Math.min(1,dt*5));cam.lookAt((L.x+Q.x)/2,2,(L.z+Q.z)/2);
  G.flash.position.set(L.x,3,L.z);G.flash.target.position.set(Q.x,1.8,Q.z);G.flash.intensity=30;G.flash.distance=24;G.flash.angle=.6;
  C.scoreTxt=C.stage==0?'LOADER  '+Math.max(0,C.p.hp|0)+'%':''},
 ap(){const C=G.C;if(!L)return{};const I={sx:0,fw:0,fire:false,lx:0,ly:0};let tx=Q.x,tz=Q.z;
  if(C.stage==2){tx=C.goal.x;tz=C.goal.z}let a=Math.atan2(tx-L.x,tz-L.z)-L.ya;a=Math.atan2(Math.sin(a),Math.cos(a));I.sx=Math.max(-1,Math.min(1,-a*2));const d=Math.hypot(tx-L.x,tz-L.z);
  if(C.stage==0){I.fw=Q.st=='wind'&&Q.t<.6?-1:d>2.8?1:0;I.fire=d<3.3&&Math.abs(a)<.6}
  else if(C.stage==2){I.fw=Math.abs(a)<.6?1:0}else if(C.stage==3)I.fire=true;return I}};

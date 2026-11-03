// ===== CHAPTER 4 — OPS SIEGE =====
import * as G from './game.js?v=13';
import {spawner,fmt,TS,sentryGun} from './hive.js?v=13';
const {THREE,PI,rnd,LV,PR,WD,dist}=G;
const MAP4=["#######################",
"###########N###########",
"###########.###########",
"###########.###########",
"###########.###########",
"###########.###########",
"###########.###########",
"#######.....b.....#####",
"#W.........a.....D.E###",
"#######..t..O..t..#####",
"#######....R.P....#####",
"#######...........#####",
"#######################"];
let sA,sB,spW,spN,spC,hu,va,rp,nw,bi,bk,door;
LV[4]={init(){const C=G.C;G.env({fog:.035,fogCol:0x0c1014,hemi:.55,hemiCol:0x9aa8b8,rain:false,hum:80});C.trk=true;C.mus=1;C.flashI=60;
 WD.W.solidSet='#FWKtgDX';WD.setMap(MAP4);WD.buildMap({wall:'panel',wallTint:0x8a9098,floor:'plate',floorTint:0x8a8a84,clutter:.9,lightEvery:3,lightI:9,lightCol:0xe8f0ff});
 for(const[x,z]of WD.W.mk.t){const t=PR.table();t.position.set(x,0,z);C.g.add(t)}
 // ops screens glow
 const[ox,oz]=WD.mk('O');G.LS.list.push({p:[ox,2.4,oz],c:0x8fd0ff,col:new THREE.Color(0x8fd0ff),i:8,d:10,ph:0,flick:1},{p:[ox-6,2.4,oz+3],c:0xffe0b0,col:new THREE.Color(0xffe0b0),i:7,d:9,ph:1});
 door=WD.door('D',0,{weld:true});
 const[px,pz]=WD.mk('P');Object.assign(C.p,{x:px,z:pz,ya:PI,pitch:-.05});C.pa=G.cast('player','hicks');G.place(C.pa,px,pz,PI);C.pa.loco('Idle_Loop','Pistol_Idle_Loop',0);
 C.weaps=['rifle','gren'];G.updGun();
 const[rx,rz]=WD.mk('R');
 hu=G.ally('hudson',px-1.8,pz-1,{ya:PI});va=G.ally('vasquez',px+1.8,pz-1,{ya:PI,gun:'smart'});
 rp=G.cast('ripley','ripley');G.place(rp,rx,rz,PI*.8);rp.play('Idle_Talking_Loop',0);
 nw=G.cast('newt','newt');G.place(nw,rx-.9,rz+.6,PI*.7);nw.play('Idle_Loop',0);
 bi=G.cast('bishop','bishop');G.place(bi,ox-2.2,oz,PI/2);bi.play('Interact',0);
 bk=G.cast('burke','burke');G.place(bk,ox+2.4,oz+.6,-PI/2);bk.play('Idle_Loop',0);
 const[ax,az]=WD.mk('a'),[bx,bz]=WD.mk('b');sA=sentryGun(ax-3,az,-PI/2);sB=sentryGun(bx-3,bz-3,PI);
 sA.m.visible=sB.m.visible=false;
 spW=spawner(WD.W.mk.W,{max:4,every:1.3,minD:4});spN=spawner(WD.W.mk.N,{max:4,every:1.4,minD:4});spW.on=spN.on=false;
 spC=spawner([[ox-5,oz-1],[ox+5,oz+2],[ox,oz+3],[ox-3,oz+4]],{max:4,every:1.6,minD:3,ceil:1});spC.on=false;
 const pl=C.pa;
 G.cut([{d:3.6,sub:'Operations. The dropship is wreckage on the landing field. No way off this rock.',cam:u=>({e:[ox+6-u,3,oz+6],c:[ox,1.3,oz],fov:50}),flash:30},
  {d:3,sub:'Hudson paces, shouting that they are finished, that it is all over.',setup:()=>hu.a.play('Idle_Talking_Loop',.2),cam:()=>G.CU(hu.a,.9,.3)},
  {d:3.4,sub:'Ripley: "Rescue is seventeen days out. We seal ourselves in and we hold."',cam:()=>G.CU(rp,.85,-.28,.02,32)},
  {d:3,sub:'Newt, quietly: "They mostly come at night. Mostly."',cam:()=>G.CU(nw,.62,.16,.02,28)},
  {d:3.2,sub:'Hicks: "Sentry guns in both service corridors. Weld the east door. Move."',cam:()=>G.CU(pl,.9,.3)}],
  ()=>{for(const a of[hu,va]){a.x=a.a.root.position.x;a.z=a.a.root.position.z}G.play();LV[4].stage(0)})},
 stage(n){const C=G.C;C.stage=n;
  if(n==0){C.obj='Set up the sentry gun in the west corridor';const[x,z]=[sA.x,sA.z];C.act={x:x+1.5,z,r:2,dur:2.2*TS,label:'HOLD FIRE — DEPLOY SENTRY A',done:()=>{sA.m.visible=true;G.SFX.click();G.say('Sentry A online. 500 rounds.',2.5);this.stage(1)}};C.goal=C.act;
   G.say(G.TOUCH?'Stick move · drag to look · hold FIRE to work':'WASD move · mouse look · hold click / Space to work',4)}
  if(n==1){C.obj='Set up the sentry gun in the north corridor';C.act={x:sB.x,z:sB.z+1.5,r:2,dur:2.2*TS,label:'HOLD FIRE — DEPLOY SENTRY B',done:()=>{sB.m.visible=true;G.SFX.click();G.say('Sentry B online.',2.5);this.stage(2)}};C.goal=C.act}
  if(n==2){const[dx,dz]=WD.mk('D');C.obj='Weld the east door shut';C.act={x:dx-1.6,z:dz,r:2.2,dur:4*TS,weld:1,wx:dx-.6,wz:dz,label:'HOLD FIRE — WELD',done:()=>{G.say('Door sealed.',2);this.wait()}};C.goal=C.act}
  if(n==3){C.obj='Watch the sentry counters. If they get through, you are next.';sA.on=sB.on=true;spW.on=spN.on=true;C.endT=C.t+70*TS;
   C.bar=()=>['SIEGE  '+fmt(C.endT-C.t),1-(C.endT-C.t)/(70*TS),'#d0a040'];G.say('Sentry A firing! Sentry B firing!',3);hu.hold=va.hold=false}
  if(n==4){C.bar=null;spW.on=spN.on=false;spC.on=true;spC.total=10;C.kc=C.kills;C.obj='They are in the ceiling! Kill them all';
   G.say('Hudson: "Movement — it\'s inside the room!"',3);G.shake(.5);for(const s of[sA,sB])s.on=false}
  if(n==5){C.obj='';this.endCut()}},
 wait(){const C=G.C;const[ax,az]=[sA.x,sA.z];
  G.cut([{d:3,sub:'Hours pass. The rounds counters sit at full. Then, far off, the first one ticks down.',cam:u=>({e:[ax+2.5,1.2,az+1.3],c:[ax-6,1,az],fov:40}),flash:0},
   {d:2.8,sub:'Vasquez watches the readout, chewing her lip.',cam:()=>G.CU(va.a,.7,-.3,.02,32)}],()=>{G.play();this.stage(3)})},
 endCut(){const C=G.C;
  G.cut([{d:3,sub:'Silence, except for the hiss of acid eating through the floor.',cam:u=>({e:[C.p.x+3,2.2,C.p.z+3],c:[C.p.x,1,C.p.z],fov:48})},
   {d:3,sub:'Ripley turns. The vent grille hangs open.',setup:()=>{nw.root.visible=false;rp.play('Idle_Loop',.2)},cam:()=>G.CU(rp,.8,.3,.02,32)},
   {d:3,sub:'Ripley: "Newt? ... Newt!"',cam:()=>G.CU(rp,.62,-.2,.02,28)}],G.winCh)},
 step(dt){const C=G.C;if(C.mode!='foot')return;
  for(const s of[sA,sB])s.step(dt);spW.step(dt);spN.step(dt);spC.step(dt);
  if(C.stage==3){if(C.t>=C.endT||sA.ammo+sB.ammo<=0)this.stage(4)}
  if(C.stage==4&&spC.n>=10&&G.alive().length==0)this.stage(5);
  C.scoreTxt=C.stage==3?'SENTRY A  '+sA.ammo+'   ·   B  '+sB.ammo:C.stage==4?'BREACH  '+Math.max(0,10-(C.kills-C.kc)):''}};

// ===== CHAPTER 5 — MEDLAB =====
import * as G from './game.js?v=9';
import {fmt,TS} from './hive.js?v=9';
const {THREE,PI,rnd,LV,PR,WD,dist}=G;
const MAP5=["###############",
"#.....k.k.....#",
"#.............#",
"#..t.......t..#",
"#......P......#",
"#.............#",
"#..t.......t..#",
"#Z............#",
"#######D#######",
"#######.#######",
"#######H#######"];
let rp,nw,bk,hk,hu,tanks=[],door;
LV[5]={init(){const C=G.C;tanks=[];G.env({fog:.03,fogCol:0x0e1416,hemi:.6,hemiCol:0xa8c0c8,rain:false,hum:70});C.trk=false;C.mus=1;C.flashI=55;
 WD.W.solidSet='#FWKtgDXk';WD.setMap(MAP5);WD.buildMap({wall:'panel',wallTint:0xb8c0c4,floor:'plate',floorTint:0x9aa0a0,clutter:.95,lightEvery:3,lightI:9,lightCol:0xe0f4ff});
 for(const[x,z]of WD.W.mk.t){const t=PR.table();t.position.set(x,0,z);C.g.add(t)}
 for(const[x,z]of WD.W.mk.k){const tk=PR.specimenTank(false);tk.position.set(x,0,z+.6);C.g.add(tk);tanks.push(tk);G.LS.list.push({p:[x,1.4,z+.6],c:0x6cffc0,col:new THREE.Color(0x6cffc0),i:3,d:4,ph:0,pulse:.8})}
 door=WD.door('D',0,{weld:true});
 const[zx,zz]=WD.mk('Z');const sen=new THREE.Mesh(new THREE.BoxGeometry(.25,.25,.1),G.emiss(0xffb040,2));sen.position.set(zx+1.4,2.3,zz);C.g.add(sen);
 const[px,pz]=WD.mk('P');Object.assign(C.p,{x:px,z:pz,ya:PI,pitch:-.05});C.pa=G.cast('player','ripley');G.place(C.pa,px,pz,0);C.pa.loco('Idle_Loop','Idle_Loop',0);
 C.weaps=['none'];G.updGun();
 nw=G.ally('newt',px+1,pz+.6,{gun:'none'});
 bk=G.cast('burke','burke');G.place(bk,-60,-60,0);
 const[hx,hz]=WD.mk('H');hk=G.cast('hicks','hicks');G.place(hk,hx,hz+20,PI);hu=G.cast('hudson','hudson');G.place(hu,hx+1,hz+21,PI);
 const pl=C.pa;
 G.cut([{d:3.4,sub:'Medlab. Ripley and Newt sleep beneath a gurney while the others ready the dropship call.',setup:()=>{pl.play('Sitting_Idle_Loop',0);nw.a.play('Sitting_Idle_Loop',0)},cam:u=>({e:[px+2.4,1.1,pz+2.4-u*.3],c:[px,.7,pz],fov:44}),flash:40},
  {d:3,sub:'Ripley wakes. Both specimen tanks are open. Empty.',setup:()=>pl.play('Idle_Loop',.3),cam:()=>({e:[px,1.6,pz+1],c:[tanks[0].position.x,1.2,tanks[0].position.z],fov:44})},
  {d:3,sub:'Her pulse rifle is gone from where she left it.',cam:()=>G.CU(pl,.75,.24,.02,30)},
  {d:3.2,sub:'Newt clutches her sleeve. Something skitters under the cabinets.',cam:()=>G.CU(nw.a,.58,-.16,.02,26)}],
  ()=>{nw.x=nw.a.root.position.x;nw.z=nw.a.root.position.z;G.play();LV[5].stage(0)})},
 stage(n){const C=G.C;C.stage=n;
  if(n==0){C.obj='The door is locked from outside. Hit the door panel';const[dx,dz]=WD.mk('D');C.act={x:dx,z:dz-2.4,r:1.8,dur:1.4*TS,label:'HOLD FIRE — DOOR PANEL',done:()=>{G.say('Locked out. Card access revoked.',3);this.stage(1)}};C.goal=C.act;
   G.say(G.TOUCH?'Stick move · drag to look · hold FIRE to interact or tear free':'WASD move · mouse look · hold click / Space to interact or tear free',5)}
  if(n==1){C.obj='Signal the others — Ripley waves at the camera. Nobody is watching.';const[px,pz]=WD.mk('P');C.goal=null;
   this.burkeCut()}
  if(n==2){const[zx,zz]=WD.mk('Z');C.obj='Huggers! Reach the fire sensor and hold a flame to it';for(const t of tanks){G.spawn('hugger',t.position.x,t.position.z+1)}
   C.act={x:zx+1,z:zz,r:1.6,dur:2.5*TS,label:'HOLD FIRE — LIGHTER TO SENSOR',done:()=>this.stage(3)};C.goal=C.act;G.say('Hold FIRE if one latches on — tear it off!',3)}
  if(n==3){C.obj='Sprinklers on. Survive until help arrives';G.rain(true);G.SFX.hiss();C.endT=C.t+45*TS;C.bar=()=>['ALARM  '+fmt(C.endT-C.t),1-(C.endT-C.t)/(45*TS),'#60a0d0'];
   G.say('Fire alarm — the sprinklers douse the lab. Ops will see this!',3);C.extraH=0}
  if(n==4){C.bar=null;C.goal=null;C.act=null;G.rain(false);this.rescue()}},
 burkeCut(){const C=G.C;const[dx,dz]=WD.mk('D');
  G.cut([{d:3.2,sub:'On the security monitor feed, a hand reaches for the camera switch.',setup:()=>{G.place(bk,dx,dz+3,PI);bk.play('Interact',0)},cam:()=>G.CU(bk,.8,.28,.02,32)},
   {d:2.6,sub:'The screen in Ops goes dark. No one notices.',cam:()=>G.CU(bk,.65,-.2,.04,28)}],()=>{G.place(bk,-60,-60,0);G.play();this.stage(2)})},
 rescue(){const C=G.C;const[dx,dz]=WD.mk('D');door.target=1;for(const e of G.alive())G.killE(e);
  G.place(hk,dx,dz+.5,PI);G.place(hu,dx+1,dz+1.4,PI);hk.loco('Idle_Loop','Pistol_Idle_Loop',0);hu.loco('Idle_Loop','Pistol_Idle_Loop',0);
  G.cut([{d:3,sub:'The door gives. Hicks and Hudson burst in, rifles up, through the falling water.',cam:u=>({e:[dx+2,1.6,dz-4],c:[dx,1.3,dz],fov:46}),flash:30},
   {d:3,sub:'They blast the last hugger off Newt. Ripley drags in a breath.',cam:()=>G.CU(hk,.9,.3)},
   {d:3.4,sub:'Ripley: "Burke. He locked us in with them. He wanted them carried home — in us."',setup:()=>C.pa.play('Idle_Talking_Loop',.2),cam:()=>G.CU(C.pa,.8,-.26,.02,32)},
   {d:3,sub:'Hicks says nothing. His hand closes on his rifle grip.',cam:()=>G.CU(hk,.8,-.25)}],G.winCh)},
 step(dt){const C=G.C;if(C.mode!='foot')return;
  if(C.stage==3){C.extraH-=dt;if(C.extraH<=0&&G.alive().length<2){C.extraH=6*TS;const[px,pz]=[C.p.x,C.p.z];const t=tanks[(rnd()*2)|0];G.spawn('hugger',t.position.x,t.position.z+1)}if(C.t>=C.endT)this.stage(4)}
  C.scoreTxt=C.stage>=2&&C.stage<4?'HUGGERS  '+G.alive().length:''}};

// ===== CHAPTER 2 — HADLEY'S HOPE =====
import * as G from './game.js?v=6';
const {THREE,PI,lerp,sm,rnd,LV,PR,WD,dist}=G;
const MAP2=["###############",
"#.....#.......#",
"#..N..#..g.g..#",
"#.....#.......#",
"#...t.#..g.g..#",
"##.####...M...#",
" #.#  ####.####",
" #.#     #.#   ",
" #.#######D### ",
" #...........# ",
" #.....S.....# ",
" #####.#####.# ",
"     #.#   #.# ",
"   ###B###.#.# ",
"   #.......#.# ",
"   #...P.....# ",
"   ###########"];
let tanks=[];
LV[2]={init(){const C=G.C;G.env({fog:.05,fogCol:0x0b0f12,hemi:.22,hemiCol:0x7d8c98,rain:false,hum:50});C.trk=true;C.mus=1;
 WD.W.solidSet='#FWKtcgDXbB';WD.setMap(MAP2);WD.buildMap({wall:'wall',floor:'plate',emergency:true,clutter:.86,lightEvery:3,lightI:9});
 const W=WD.W,CS=G.CS;
 // barricade: sandbags + toppled crates, already torn open from the far side
 const[bx,bz]=WD.mk('B');const sb=PR.sandbags(1.3);sb.position.set(bx-.85,0,bz+.4);sb.rotation.y=.25;C.g.add(sb);WD.prop('prop_crate_large',bx+3.2,bz-4.6,.4,.6);WD.prop('prop_crate',bx+1.0,bz-1.9,1.2,.6);WD.W.colliders.push({x:bx-.85,z:bz+.4,hw:.65,hd:.3});
 // acid burns in the floor
 for(const[x,z]of[[18,27],[30,33],[12,42]]){G.decal('acid',new THREE.Vector3(x,.012,z),new THREE.Vector3(0,1,0),1.3)}
 // ops table + vent where Newt hides
 const[nx,nz]=WD.mk('N');const tb=PR.table();tb.position.set(nx-1.5,0,nz-2.2);C.g.add(tb);const vent=new THREE.Mesh(new THREE.BoxGeometry(1.2,.8,.08),G.pbr('grid',{color:0x888888}));vent.position.set(nx+.4,.5,nz-CS*1.48);C.g.add(vent);
 WD.prop('prop_desk_medium',nx+1.6,nz+1.5,PI,1);WD.prop('prop_chair',nx+1.2,nz+.7,2.5,1);WD.prop('prop_locker',nx-2,nz+3.4,0,1);
 // 't' table cell
 const[tx,tz]=WD.mk('t');const t2=PR.table();t2.position.set(tx,0,tz);C.g.add(t2);
 // medlab tanks with floating huggers
 tanks=[];for(const[x,z]of W.mk.g){const tk=PR.specimenTank();tk.position.set(x,0,z);C.g.add(tk);const h=new G.Hugger();h.root.position.set(x,1.1,z);h.root.rotation.x=-1.1;C.g.add(h.root);tanks.push({h,ph:rnd()*6});G.LS.list.push({p:[x,1.3,z],c:0x6cffc0,col:new THREE.Color(0x6cffc0),i:3,d:4,ph:0,pulse:.9})}
 const[mx,mz]=WD.mk('M');
 // welded door
 C.door=WD.door('D',0,{weld:true});
 // player + squad
 const[px,pz]=WD.mk('P');Object.assign(C.p,{x:px,z:pz,ya:PI,pitch:-.05});C.pa=G.cast('player','hicks');G.place(C.pa,px,pz,PI);C.pa.loco('Idle_Loop','Pistol_Idle_Loop',0);
 const hu=G.ally('hudson',px-1.8,pz+1.2,{ya:PI}),va=G.ally('vasquez',px+1.8,pz+1.2,{ya:PI,gun:'smart'});
 for(const[x,z]of[[6,27],[36,27],[33,42]])G.spawn('hugger',x,z,{idle:1,wake:7});C.en.forEach(e=>e.obj.root.visible=false);
 const pl=C.pa;
 G.cut([{d:3.6,sub:'The marines fan out into the silent colony, rain hammering the walls.',actors:1,setup:()=>{for(const a of[pl,hu.a,va.a])a.loco('Walk_Loop','Idle_Loop',0)},
   upd:(u,dt)=>{const k=dt*.7;for(const a of[pl,hu.a,va.a])a.root.position.z-=k},cam:u=>({e:[px+4.2,2.2,pz-5.5+u*.4],c:[px,1.2,pz],fov:52}),flash:30},
  {d:2.7,sub:'Hudson sweeps the motion tracker. Nothing. Yet.',setup:()=>{hu.a.loco('Idle_Loop','Idle_Loop',.2);hu.a.root.rotation.y=PI},cam:()=>G.CU(hu.a,1.0,.3)},
  {d:2.7,sub:'Hicks keeps his voice low and his rifle up.',setup:()=>{pl.loco('Idle_Loop','Idle_Loop',.2)},cam:()=>G.CU(pl,1.0,-.32)}],
  ()=>{for(const a of[hu,va]){a.x=a.a.root.position.x;a.z=a.a.root.position.z}C.p.z=pl.root.position.z;G.play();C.en.forEach(e=>e.obj.root.visible=true);LV[2].stage(0)})},
 stage(n){const C=G.C;C.stage=n;
  if(n==0){C.goal=G.g('B');C.obj='Sweep the colony: reach the barricade';G.say(G.TOUCH?'Left stick move · drag right side to look · FIRE to shoot':'WASD move · mouse look (click to lock) · click / Space fire',5)}
  if(n==1){C.goal=null;const[dx,dz]=WD.mk('D');C.act={x:dx,z:dz+2.2,wx:dx,wz:dz+.3,r:2.2,dur:3.2,label:'CUTTING WELDED DOOR',weld:1,done:()=>{C.door.target=1;C.door.cut=1;G.SFX.door();G.shake(.3);LV[2].stage(2)}};C.obj='The corridor door is welded shut — cut through it';G.say('Barricade torn open from inside. Acid holes in the floor…',4)}
  if(n==2){C.goal=G.g('M');C.obj='Check the medlab';G.say('Door open. Medlab ahead.',3)}
  if(n==3){C.goal=null;C.obj='Kill the loose facehuggers';const[mx,mz]=WD.mk('M');const fresh=[[mx-4.5,mz-9],[mx+4.5,mz-9],[mx,mz-10.5]].map(([x,z])=>G.spawn('hugger',x,z,{idle:1,wake:30}));fresh.forEach(e=>e.obj.root.visible=true);
   const h=C.pa;G.cut([{d:3.4,sub:'Specimen tanks. Pale, spider-like things float inside — two still alive.',cam:u=>({e:[mx+.9,1.7,mz-1.5-u*.2],c:[mx-1.5,1.2,mz-8],fov:48})},
    {d:2.4,sub:'Hicks sees the cracked glass a second too late.',setup:()=>{h.loco('Idle_Loop','Idle_Loop',.2)},cam:()=>G.CU(h,1.0,.3)}],()=>{G.play();fresh.forEach(e=>e.idle=0);G.say('Huggers! Shoot them before they leap on you',3)})}
  if(n==4){C.goal=G.g('N');C.obj='Motion! Follow the tracker blip';G.say('Tracker: a blip, small and fast… follow it',4)}},
 step(dt){const C=G.C,p=C.p;if(C.stage==0&&dist(p,C.goal)<2.4)this.stage(1);if(C.stage==2&&dist(p,C.goal)<2.3)this.stage(3);
  if(C.stage==3){const a=G.alive();if(a.length){let b=a[0];a.forEach(e=>{if(dist(p,e)<dist(p,b))b=e});C.goal=(G.AUTO||C.auto)?{x:b.x,z:b.z}:null;C.showBeacon=false}
   if(C.pt>1&&!a.length){C.showBeacon=true;this.stage(4)}else if(C.pt>1&&a.every(e=>e.idle))a.forEach(e=>e.idle=0)}
  if(C.stage==4&&dist(p,C.goal)<3){C.stage=5;this.newt()}},
 newt(){const C=G.C;const[nx,nz]=WD.mk('N');const nw=G.cast('newt','newt');G.place(nw,nx-1.4,nz-2.2,0);nw.play('Crouch_Idle_Loop',0);const rp=G.cast('ripley','ripley');G.place(rp,nx-1.2,nz+.6,PI);rp.play('Idle_Loop',0);
  C.pa.root.visible=false;C.pa.hideLock=1;C.allies.forEach(a=>a.gone=true);
  G.cut([{d:3.2,sub:'Under a table, behind a vent grille: a little girl, filthy and terrified.',cam:()=>G.CU(nw,.56,.15,.03,26)},
   {d:3,sub:'She bolts into the vents. Ripley crawls in after her.',setup:()=>{rp.play('Crouch_Fwd_Loop',.3);nw.play('Crouch_Fwd_Loop',.2);nw.root.rotation.y=-PI/2},upd:(u,dt)=>{nw.root.position.x+=dt*.5;rp.root.position.z-=dt*.4},cam:()=>({e:[nx+.3,1.15,nz+.4],c:[nx-1,.55,nz-1.8],fov:44})},
   {d:3.4,sub:'Her name is Newt. The only survivor of Hadley\'s Hope.',setup:()=>{nw.root.position.set(nx+.6,0,nz-1.2);nw.play('Crouch_Idle_Loop',.3);nw.root.rotation.y=.4;rp.play('Crouch_Idle_Loop',.3)},cam:()=>G.CU(nw,.55,-.15,.03,26)}],G.winCh)},
 always(dt){for(const t of tanks){t.ph+=dt;t.h.root.position.y=1.1+Math.sin(t.ph*.8)*.06;t.h.update(dt,{speed:.3})}}};

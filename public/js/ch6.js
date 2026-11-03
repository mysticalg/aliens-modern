// ===== CHAPTER 6 — ESCAPE =====
import * as G from './game.js?v=5';
import {resinDress,wallCocoons,spawner,fmt,TS} from './hive.js?v=5';
const {THREE,PI,rnd,LV,PR,WD,dist}=G;
const MAP6=["#########################",
"#S.......#######.......J#",
"########.#######.########",
"#P.......#######.########",
"#.##############...######",
"#.#######...........#####",
"#.......#.#########.#####",
"#######.#.#########.#####",
"#######.....S######.#####",
"###################.#####",
"###################.#####",
"#########S.........L#####",
"#########.###############",
"#########.###############",
"###c..........S##########",
"####..###################",
"###c.R.c#################",
"#####S###################",
"#########################"];
let sp1,sp2,rp,nw,hk,bi,ds;
LV[6]={init(){const C=G.C;G.env({fog:.05,fogCol:0x120c08,hemi:.32,hemiCol:0xb08a6a,rain:false,hum:90});C.trk=true;C.mus=1;C.flashI=80;
 WD.W.solidSet='#FWKtgDXc';WD.setMap(MAP6);WD.buildMap({wall:'grid',wallTint:0x707068,floor:'grid',floorTint:0x6a6a64,emergency:true,clutter:.96,lightEvery:4,lightI:7,lightCol:0xffc890});
 resinDress({dense:2});wallCocoons('c');
 // slow amber warning beacons (no strobe): gentle pulse
 for(const[x,z]of[[57,33],[30,42],[15,48]])G.LS.list.push({p:[x,2.6,z],c:0xff9a30,col:new THREE.Color(0xff9a30),i:10,d:12,ph:rnd()*6,pulse:1.1});
 const[px,pz]=WD.mk('P');Object.assign(C.p,{x:px,z:pz,ya:PI/2,pitch:-.05});C.pa=G.cast('player','hicks');G.place(C.pa,px,pz,PI/2);C.pa.loco('Idle_Loop','Pistol_Idle_Loop',0);
 C.weaps=['rifle'];G.updGun();
 rp=G.ally('ripley',px-1.2,pz,{ya:PI/2,gun:'none'});nw=G.ally('newt',px-2.2,pz,{ya:PI/2,gun:'none'});
 sp1=spawner([WD.W.mk.S[0],WD.W.mk.S[1]],{max:3,every:3,minD:8});sp1.on=false;
 sp2=spawner(WD.W.mk.S.slice(2),{max:4,every:2.4,minD:8});sp2.on=false;
 bi=G.cast('bishop','bishop');G.place(bi,-60,-40,0);bi.play('Interact',0);
 ds=PR.dropship();ds.position.set(-90,9,-90);C.g.add(ds);G.LS.list.push({p:[-90,4,-84],c:0xdfe8ff,col:new THREE.Color(0xdfe8ff),i:30,d:30,ph:0});
 const pl=C.pa;
 G.cut([{d:3.4,sub:'They are coming through the walls. Hicks, Ripley and Newt crawl into the service ducts.',cam:u=>({e:[px+3.5,1.2,pz+1.2],c:[px-1,1,pz],fov:46}),flash:45},
  {d:2.8,sub:'Hicks: "Stay close. The dropship pad is past the next junction."',cam:()=>G.CU(pl,.85,.28)},
  {d:2.8,sub:'Newt: "This way — I know these tunnels."',cam:()=>G.CU(nw.a,.55,.15,.02,26)}],
  ()=>{for(const a of[rp,nw]){a.x=a.a.root.position.x;a.z=a.a.root.position.z}G.play();LV[6].stage(0)})},
 stage(n){const C=G.C;C.stage=n;
  if(n==0){C.goal=G.g('J');sp1.on=true;C.obj='Get through the ducts to the landing-pad junction';G.say(G.TOUCH?'Stick move · drag to look · FIRE shoots':'WASD move · mouse look · click / Space fire · Q swaps weapon',4)}
  if(n==1){C.goal=null;sp1.on=false;this.fall()}
  if(n==2){C.goal=G.g('R');C.obj='Follow Newt\'s locator to the hive before the reactor blows';sp2.on=true;C.endT=C.t+150*TS;
   C.bar=()=>['REACTOR  '+fmt(C.endT-C.t),1-(C.endT-C.t)/(150*TS),'#e08a30'];G.say('Automated voice: "Emergency. All personnel to evacuate. Fifteen minutes to detonation."',4)}
  if(n==3){C.goal=null;sp2.on=false;C.bar=null;this.bracelet()}},
 fall(){const C=G.C;const[jx,jz]=WD.mk('J');
  G.cut([{d:3,sub:'The duct floor gives way. Newt slides down a chute into the dark.',setup:()=>{nw.a.play('Roll',.2)},cam:()=>G.CU(nw.a,.7,.2,.06,30),flash:30},
   {d:2.8,sub:'Ripley screams her name. The grating has swallowed her.',cam:()=>G.CU(rp.a,.8,-.24,.02,32)},
   {d:3,sub:'An alien bursts through the hatch. Hicks fires point-blank — acid sprays across his armour.',setup:()=>{G.acidBurst(new THREE.Vector3(jx,1.4,jz),26);C.pa.play('Hit_Chest',.1)},cam:()=>G.CU(C.pa,.9,.3),key:30},
   {d:3.2,sub:'Bishop, alone at a terminal, flies the second dropship down by remote.',cam:()=>G.CU(bi,.85,.28,.02,32)},
   {d:3.2,sub:'The dropship descends through the storm, landing lights blazing.',setup:()=>G.env({hemi:.6}),upd:(u,dt)=>{ds.position.y=Math.max(1.6,9-u*7.4)},cam:u=>({e:[-74,3,-76],c:[-90,ds.position.y,-90],fov:48}),flash:0},
   {d:3,sub:'Ripley tapes a flamethrower beneath a pulse rifle, and loads a belt of grenades.',setup:()=>rp.a.play('Fixing_Kneeling',.2),cam:()=>G.CU(rp.a,.85,.3,.06,34),key:40},
   {d:3.2,sub:'Ripley: "Bishop — circle the pad. I am not leaving without her."',setup:()=>rp.a.play('Idle_Talking_Loop',.2),cam:()=>G.CU(rp.a,.62,-.18,.02,28)}],
   ()=>{const[lx,lz]=WD.mk('L');C.pa.root.removeFromParent();rp.gone=nw.gone=true;C.pa=G.cast('player2','ripley');G.place(C.pa,lx,lz,PI);C.pa.loco('Idle_Loop','Pistol_Idle_Loop',0);
    Object.assign(C.p,{x:lx,z:lz,ya:-PI/2,hp:100});C.weaps=['rifle','flame','gren'];C.wi=0;G.updGun();G.env({fog:.06,fogCol:0x140a06,hemi:.28});G.play();this.stage(2)})},
 bracelet(){const C=G.C;const[rx,rz]=WD.mk('R');const br=new THREE.Mesh(new THREE.TorusGeometry(.06,.015,6,16),G.emiss(0x40ff80,2));br.position.set(rx,.03,rz);br.rotation.x=PI/2;C.g.add(br);
  G.cut([{d:3.2,sub:'The locator signal is strong. Ripley drops to one knee.',setup:()=>C.pa.play('Crouch_Idle_Loop',.3),cam:()=>G.CU(C.pa,.8,.3,.02,32),flash:40},
   {d:3,sub:'Newt\'s bracelet lies in the resin. Just the bracelet.',cam:()=>({e:[rx+.5,.6,rz+.4],c:[rx,.03,rz],fov:30})},
   {d:3,sub:'Then, from deeper in, a small voice screams.',cam:()=>G.CU(C.pa,.62,-.2,.03,28)}],G.winCh)},
 step(dt){const C=G.C,p=C.p;if(C.mode!='foot')return;sp1.step(dt);sp2.step(dt);
  if(C.stage==0&&dist(p,C.goal)<3)this.stage(1);
  if(C.stage==2){if(dist(p,C.goal)<2.4)this.stage(3);else if(C.t>=C.endT){C.p.hp=0;G.churt(999)}}
  C.scoreTxt=C.stage==2?'LOCATOR  '+dist(p,C.goal).toFixed(0)+' m':''}};

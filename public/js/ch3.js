// ===== CHAPTER 3 — THE NEST =====
import * as G from './game.js?v=11';
import {resinDress,wallCocoons,spawner,fmt,clearForDrive,cockpit,TS} from './hive.js?v=11';
const {THREE,PI,rnd,LV,PR,WD,dist}=G;
const MAP3=["###################",
"#S...c.......c...S#",
"#.................#",
"#c.......Y.......c#",
"#.................#",
"#S...c.......c...S#",
"########...########",
"       ##.##       ",
"  #######.#        ",
"  #.......#        ",
"  #.#######        ",
"  #.#              ",
"  #.########       ",
"  #........#####   ",
"  #######.....c#   ",
"        #c.....#   ",
"        ####.###   ",
"           #.#     ",
"         ###.###   ",
"         #..A..#   ",
"         #..P..#   ",
"         #######   "];
let sp=null,ck=null,col=null,rp=null,gm=null,hk,hu,ap;
LV[3]={init(){const C=G.C;G.env({fog:.05,fogCol:0x0a100e,hemi:.3,hemiCol:0x7a9488,rain:false,hum:60});C.trk=true;C.mus=1;C.flashI=75;
 WD.W.solidSet='#FWKtcgDXbY';WD.setMap(MAP3);WD.buildMap({wall:'wall',wallTint:0x6a7068,floor:'grid',floorTint:0x7a7a70,emergency:true,clutter:.93,lightEvery:5,lightI:6,lightCol:0xbfe8d0});
 resinDress({dense:4});wallCocoons('c');
 // the colonist sealed into a resin pillar
 const[yx,yz]=WD.mk('Y');const pil=PR.cocoon();pil.scale.set(1.6,1.25,1.4);pil.position.set(yx,.05,yz-.35);C.g.add(pil);WD.block(pil);
 col=G.cast('colonist','colonist');G.place(col,yx,yz+.15,0);col.play('Idle_Loop',0);col.root.scale.multiplyScalar(.98);
 for(const[x,z]of[[yx-1.6,yz+1.2],[yx+1.8,yz+.9],[yx-.4,yz+2.4]])G.decal('acid',new THREE.Vector3(x,.012,z),new THREE.Vector3(0,1,0),1.1);
 // eerie light in the chamber
 G.LS.list.push({p:[yx,3,yz+1.5],c:0x7fe0c0,col:new THREE.Color(0x7fe0c0),i:9,d:12,ph:0,pulse:.5});
 ck=cockpit(-80,-80);rp=G.cast('ripley','ripley');G.place(rp,-80.35,-79.9+.2,PI);rp.play('Driving_Loop',0);gm=G.cast('gorman','gorman');G.place(gm,-79.3,-79.4,PI-.4);gm.play('Sitting_Idle_Loop',0);
 const[px,pz]=WD.mk('P');Object.assign(C.p,{x:px,z:pz,ya:PI,pitch:-.05});C.pa=G.cast('player','vasquez');G.place(C.pa,px,pz,PI);C.pa.loco('Idle_Loop','Pistol_Idle_Loop',0);
 C.weaps=['smart','rifle'];C.ammo.smart=320;G.updGun();
 hk=G.ally('hicks',px-1.6,pz+1,{ya:PI});hu=G.ally('hudson',px+1.6,pz+1,{ya:PI});ap=G.ally('apone',px,pz+2,{ya:PI});
 const sps=WD.W.mk.S;sp=spawner(sps,{max:5,every:2.2,minD:7});sp.on=false;
 const pl=C.pa;
 G.cut([{d:3.6,sub:'Beneath the atmosphere processor, the corridors are grown over with glossy, ribbed resin.',actors:1,setup:()=>{for(const a of[pl,hk.a,hu.a,ap.a])a.loco('Walk_Loop','Idle_Loop',0)},
   upd:(u,dt)=>{for(const a of[pl,hk.a,hu.a,ap.a])a.root.position.z-=dt*.6},cam:u=>({e:[px+.3,1.75,pz-5.4+u*.4],c:[px,1.3,pz],fov:50}),flash:40},
  {d:3,sub:'Over the radio, Gorman orders them to hold fire near the cooling plant.',setup:()=>{for(const a of[pl,hk.a,hu.a,ap.a])a.loco('Idle_Loop','Idle_Loop',.2);ap.a.root.rotation.y=PI},cam:()=>G.CU(ap.a,1.0,.3)},
  {d:2.8,sub:'Vasquez ignores him and keeps the smartgun hot.',cam:()=>G.CU(pl,.95,-.3)},
  {d:3,sub:'In the APC, Ripley watches the helmet feeds, uneasy.',cam:()=>G.CU(rp,.9,.3,.02,36)}],
  ()=>{for(const a of[hk,hu,ap]){a.x=a.a.root.position.x;a.z=a.a.root.position.z}C.p.z=pl.root.position.z;G.play();LV[3].stage(0)})},
 stage(n){const C=G.C;C.stage=n;
  if(n==0){C.goal=G.g('Y');C.obj='Push through the resin tunnels to the heat signatures';G.say(G.TOUCH?'Stick move · drag to look · FIRE shoots':'WASD move · mouse look · click / Space fire · Q swaps weapon',5);
   for(const[x,z]of[[27,39],[9,30],[27,18]])G.spawn('alien',x,z,{idle:1,wake:8})}
  if(n==1){C.goal=null;this.colonist()}
  if(n==2){C.obj='Hold the chamber — they are coming out of the walls';C.endT=C.t+70*TS;sp.on=true;C.bar=()=>['HOLD OUT  '+fmt(C.endT-C.t),1-(C.endT-C.t)/(70*TS),'#d06a3a'];G.say('Contact! Multiple signals, all directions!',3);G.shake(.4)}
  if(n==3){C.bar=null;sp.max=4;sp.every=3;C.goal=G.g('A');C.obj='Fall back to the exit — Ripley is bringing the APC';G.say('Ripley: "I\'m coming in. Get back to the entrance!"',4)}
  if(n==4){C.goal=null;sp.on=false;this.rescue()}},
 colonist(){const C=G.C;const[yx,yz]=WD.mk('Y');
  G.cut([{d:3.2,sub:'A colonist, sealed into the wall, opens her eyes.',setup:()=>{col.play('Idle_Loop',0)},cam:()=>G.CU(col,.85,.22,.02,32)},
   {d:3,sub:'She whispers for them to end it.',setup:()=>col.play('Hit_Chest',.3),cam:()=>G.CU(col,.7,-.2,.0,30)},
   {d:2.6,sub:'Something stirs inside her chest. Hicks turns away.',cam:()=>G.CU(hk.a,.95,.3)},
   {d:2.8,sub:'The tracker floods with signals. They were never alone in here.',cam:u=>({e:[yx+4,2.6,yz+6-u],c:[yx,1.4,yz-1],fov:52}),flash:30}],
   ()=>{col.root.visible=false;G.play();this.stage(2)})},
 rescue(){const C=G.C;const apc=PR.apc();apc.position.set(-80,0,-120);apc.rotation.y=PI;C.g.add(apc);
  G.cut([{d:3,sub:'Ripley shoves Gorman aside and takes the APC controls.',cam:()=>G.CU(rp,.85,.28,.02,34)},
   {d:3,sub:'She drives straight into the nest to get them out.',upd:(u,dt)=>{apc.position.z+=dt*14},cam:u=>({e:[-84,1.2,-100],c:[-80,1.3,apc.position.z],fov:46}),flash:25,key:45}],
   ()=>{clearForDrive([ck]);G.env({fog:.022,fogCol:0x141a20,hemi:1.15,sun:.7});G.setupDrive(480*Math.max(TS,.5),{gap:18,noRock:1});G.buildRoad(480*Math.max(TS,.5),true);G.play('drive');C.obj='Ram through! FIRE boosts — smash the aliens off the road';G.say('Ripley at the wheel — crush them, avoid the wrecks',4)})},
 driveDone(){const C=G.C,D=C.drv;
  G.cut([{d:3.4,sub:'The APC smashes out through the barricade, survivors clinging on inside.',upd:(u,dt)=>{D.z-=dt*8;D.apc.position.z=D.z;PR.spinWheels(D.apc,8,dt)},cam:u=>({e:[D.x+5,2.2,D.z-14],c:[D.x,1.2,D.z],fov:48}),key:55,flash:20},
   {d:3,sub:'Ripley exhales. Behind them, the nest screams.',upd:(u,dt)=>{D.z-=dt*4;D.apc.position.z=D.z;PR.spinWheels(D.apc,4,dt)},cam:u=>({e:[D.x-4.5,1.9,D.z-6+u*.5],c:[D.x,1.4,D.z],fov:42}),key:50,flash:20}],G.winCh)},
 step(dt){const C=G.C,p=C.p;if(C.mode!='foot')return;
  if(C.stage==0&&dist(p,C.goal)<3.2)this.stage(1);
  if(C.stage>=2&&C.stage<4)sp.step(dt);
  if(C.stage==2){if(!ap.gone&&C.t>C.endT-50*TS){ap.gone=true;G.say('Apone is down — dragged into the dark!',3)}if(C.t>=C.endT)this.stage(3)}
  if(C.stage==3&&dist(p,C.goal)<2.4)this.stage(4);
  if(C.weaps[0]=='smart'&&C.ammo.smart<=0){C.weaps=['rifle'];C.wi=0;G.updGun();G.say('Smartgun dry — switching to the pulse rifle',2.5)}
  const a=G.alive();C.scoreTxt=C.stage>=2&&C.stage<4?'SIGNALS  '+a.length:''}};

// ===== CHAPTER 7 — THE QUEEN'S LAIR =====
import * as G from './game.js?v=14';
import {resinDress,wallCocoons,spawner,fmt,TS} from './hive.js?v=14';
const {THREE,PI,rnd,LV,PR,WD,dist}=G;
const MAP7=["#####################",
"#c.......c.Q.c.....c#",
"#..e..e.........e...#",
"#....e....e...e..e..#",
"#S........e........S#",
"#c.......e.e.......c#",
"#########...#########",
"#########...#########",
"########c.N.c########",
"#########...#########",
"#########.###########",
"#######S..###########",
"#########.###########",
"#########L###########",
"#####################"];
let sp,nw,qn,eggs=[],qe=null;
LV[7]={init(){const C=G.C;eggs=[];qe=null;G.env({fog:.055,fogCol:0x0c0a08,hemi:.26,hemiCol:0x9a8a70,rain:false,hum:100});C.trk=true;C.mus=1;C.flashI=90;
 WD.W.solidSet='#FWKtgDXc';WD.setMap(MAP7);WD.buildMap({wall:'rock',wallTint:0x5a564e,floor:'grid',floorTint:0x5a5850,emergency:true,clutter:1,lightEvery:5,lightI:6,lightCol:0xffb070});
 resinDress({dense:5});wallCocoons('c');
 // steam vents glow amber around the chamber (gentle pulse, never strobing)
 for(const[x,z]of[[9,6],[51,6],[30,12],[30,27]])G.LS.list.push({p:[x,2.4,z],c:0xff8a30,col:new THREE.Color(0xff8a30),i:9,d:11,ph:rnd()*6,pulse:.7});
 const[qx,qz]=WD.mk('Q');G.LS.list.push({p:[qx,4,qz+5],c:0x9fd0c0,col:new THREE.Color(0x9fd0c0),i:14,d:16,ph:0,pulse:.4});
 // the queen on her egg sac (a long ribbed mass behind her)
 qn=new G.Queen();qn.root.position.set(qx,0,qz+.4);C.g.add(qn.root);const sac=new THREE.Mesh(new THREE.CapsuleGeometry(1.1,4,8,16),qn.mat);sac.rotation.x=PI/2;sac.position.set(qx,1.1,qz-2.2);C.g.add(sac);
 for(const[x,z]of WD.W.mk.e){const g=G.egg();g.scale.setScalar(1.5);g.position.set(x+(rnd()-.5),0,z+(rnd()-.5));C.g.add(g);eggs.push(g)}
 const[nx,nz]=WD.mk('N');const coc=PR.cocoon();coc.position.set(nx,.05,nz-.2);coc.scale.set(.75,.75,.75);C.g.add(coc);C.coc=coc;
 nw=G.cast('newt','newt');G.place(nw,nx,nz+.1,0);nw.play('Idle_Loop',0);
 const[px,pz]=WD.mk('L');Object.assign(C.p,{x:px,z:pz-.5,ya:PI,pitch:-.05});C.pa=G.cast('player','ripley',{gun:'combo'});G.place(C.pa,px,pz,PI);C.pa.loco('Idle_Loop','Pistol_Idle_Loop',0);
 C.weaps=['rifle','flame','gren'];C.ammo.gren=12;G.updGun();
 sp=spawner(WD.W.mk.S,{max:4,every:2,minD:7});sp.on=false;
 for(const[x,z]of[[27,33],[30,21]])G.spawn('alien',x,z,{idle:1,wake:7});
 const pl=C.pa;
 G.cut([{d:3.4,sub:'The freight lift grinds down into the heat and steam beneath the processor.',cam:u=>G.CU(pl,1.7-u*.15,.55,.12,40),flash:40},
  {d:3,sub:'Ripley checks the flare, the flamethrower, the counter. Ninety-nine rounds.',cam:()=>G.CU(pl,.75,.26,.02,30)},
  {d:2.8,sub:'Somewhere ahead, the locator chirps.',cam:()=>G.CU(pl,.6,-.2,.03,27)}],()=>{G.play();LV[7].stage(0)})},
 stage(n){const C=G.C;C.stage=n;
  if(n==0){const[nx,nz]=WD.mk('N');C.obj='Find Newt';C.act={x:nx,z:nz+1.2,r:1.6,dur:2.6*TS,label:'HOLD FIRE — TEAR HER FREE',done:()=>this.freed()};C.goal=C.act;
   G.say(G.TOUCH?'Stick move · drag to look · FIRE shoots · ⇄ swaps weapon':'WASD move · mouse look · click / Space fire · Q swaps weapon',4)}
  if(n==1){C.obj='Torch the eggs';C.weaps=['flame','rifle','gren'];C.wi=0;G.updGun();
   for(const g of eggs){const e=G.spawn('hugger',g.position.x,g.position.z,{inert:1,hp:2.5});e.obj.root.removeFromParent();e.obj={root:g,update(){}};e.egg=1}
   C.goal=null;G.say('Ripley: "Burn them. All of them."',3)}
  if(n==2){C.obj='The queen is screaming for her guard — hold them off';sp.on=true;sp.total=9;C.kc=C.kills;qn.crest&&(qn.crest.rotation.x=-1.3);G.shake(.5);G.say('The queen tears free of the egg sac!',3)}
  if(n==3){C.obj='Run for the lift!';sp.on=false;C.goal=G.g('L');const[qx,qz]=WD.mk('Q');qn.root.visible=false;qe=G.spawn('queen',qx,qz+1,{wake:99});qe.sp=2.2;
   C.endT=C.t+60*TS;C.bar=()=>['REACTOR  '+fmt(C.endT-C.t),1-(C.endT-C.t)/(60*TS),'#e08a30']}
  if(n==4){C.goal=null;C.bar=null;this.lift()}},
 freed(){const C=G.C;const[qx,qz]=WD.mk('Q');C.coc.visible=false;nw.play('Idle_Loop',.2);
  G.cut([{d:2.8,sub:'Newt, half-sealed in resin, opens her eyes. Ripley pulls her free.',cam:()=>G.CU(nw,.55,.16,.03,26),flash:50},
   {d:2.6,sub:'Newt: "I knew you would come."',cam:()=>G.CU(nw,.5,-.14,.03,24)},
   {d:3.2,sub:'They turn. Rows of leathery eggs. And above them, something vast unfolds.',cam:u=>({e:[qx+2,1.4,qz+16-u*2],c:[qx,3,qz],fov:44}),key:40},
   {d:3,sub:'The queen lowers her head. Her guards wait for a signal.',cam:u=>({e:[qx+1.2,3.6,qz+5],c:[qx,3.4,qz],fov:40}),key:45,flash:20},
   {d:3.2,sub:'Ripley levels the flamethrower at an egg. A standoff. The queen hisses — and an egg begins to open.',setup:()=>{eggs[0].userData.open&&eggs[0].userData.open(.6)},cam:()=>G.CU(C.pa,.7,.26,.02,30)}],
   ()=>{nw.root.visible=false;const a=G.ally('newt',C.p.x+1,C.p.z+.5,{gun:'none'});G.play();this.stage(1)})},
 lift(){const C=G.C;const[lx,lz]=WD.mk('L');
  G.cut([{d:3,sub:'The lift cage slams shut. The queen\'s jaws slam into the mesh, inches away.',setup:()=>{if(qe){qe.x=lx;qe.z=lz-3}},cam:()=>G.CU(C.pa,.75,.28,.02,30),flash:40},
   {d:3,sub:'The cage climbs. Below, fire races through the hive.',upd:(u,dt)=>{C.pa.root.position.y+=dt*1.5},cam:()=>G.CU(C.pa,1.3,.45,.1,38),key:14,flash:30},
   {d:3.4,sub:'On the pad, Bishop and the dropship. They lift off as the processor goes up behind them.',setup:()=>{G.explosion&&G.explosion(new THREE.Vector3(lx,1,lz-10))},cam:()=>G.CU(C.pa,.9,-.3,.02,32),key:8,flash:40}],G.winCh)},
 step(dt){const C=G.C,p=C.p;if(C.mode!='foot')return;sp.step(dt);
  if(C.stage==1){const eg=G.alive().filter(e=>e.egg);const left=eg.length;if(left){let b=eg[0];for(const e of eg)if(dist(p,e)<dist(p,b))b=e;const d=Math.max(.01,dist(p,b));C.goal=d>3.5?{x:b.x+(p.x-b.x)/d*3,z:b.z+(p.z-b.z)/d*3}:null}C.scoreTxt='EGGS  '+left;if(!left)this.stage(2)}
  else if(C.stage==2){C.scoreTxt='GUARDS  '+Math.max(0,9-(C.kills-C.kc));if(sp.n>=9&&!G.alive().length)this.stage(3)}
  else if(C.stage==3){C.scoreTxt='';if(dist(p,C.goal)<2.2)this.stage(4);else if(C.t>=C.endT)G.churt(999)}
  else C.scoreTxt=''}};

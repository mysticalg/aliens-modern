// ===== CHAPTER 1 — DROP =====
import * as G from './game.js?v=6';
const {THREE,PI,lerp,sm,rnd,LV,PR,WD}=G;
const BX=90; // troop bay location (off-road)
const SEATS=[['apone',-1,-3,'r'],['hudson',-1,-1,'r'],['hicks',-1,1.4,'r'],['drake',-1,3,'r'],['vasquez',1,-1.6,'l'],['ripley',1,.6,'l'],['gorman',1,2.6,'l']];
function colony(z0){const g=G.C.g;const M=G.pbr('corr',{color:0x8c9496}),Cc=G.pbr('concrete',{color:0x9a9890,metal:0});
 for(let k=0;k<12;k++){const s=k%2?1:-1,x=s*(17+((k*37)%9)),z=z0-k*9,h=4+((k*53)%7);const b=new THREE.Mesh(G.boxGeo(10,h,7,3,.1),k%3?M:Cc);b.position.set(x,h/2,z);b.castShadow=b.receiveShadow=true;g.add(b);
  for(let w=0;w<3;w++){const win=new THREE.Mesh(new THREE.BoxGeometry(.06,.6,1.1),new THREE.MeshStandardMaterial({color:0x101418,roughness:.1,metalness:.6}));win.position.set(x-s*5.02,h*.6,z-2.2+w*2.2);g.add(win)}}
 const gate=new THREE.Group();const P=G.pbr('panel',{color:0x5a6064});const bar=new THREE.Mesh(G.boxGeo(20,.9,.9,2),P);bar.position.y=7;gate.add(bar);for(const s of[-1,1]){const c=new THREE.Mesh(G.boxGeo(.9,7,.9,2),P);c.position.set(s*10,3.5,0);gate.add(c)}
 const sign=new THREE.Mesh(new THREE.BoxGeometry(9,1.2,.1),new THREE.MeshStandardMaterial({map:signTex(),roughness:.6}));sign.position.set(0,7,.5);gate.add(sign);gate.position.set(0,0,z0+6);gate.traverse(m=>{if(m.isMesh){m.castShadow=m.receiveShadow=true}});g.add(gate);
 const tower=new THREE.Mesh(new THREE.CylinderGeometry(4,7,40,16),G.pbr('corr',{color:0x6a6e70}));tower.position.set(-12,20,z0-95);g.add(tower);
 for(let k=0;k<4;k++){const st=new THREE.Mesh(new THREE.CylinderGeometry(1.2,1.4,30,10),G.pbr('corr',{color:0x5a5e60}));st.position.set(-12+Math.cos(k*1.57)*7,15,z0-95+Math.sin(k*1.57)*7);g.add(st)}
 G.LS.list.push({p:[-12,38,z0-95],c:0xff4020,col:new THREE.Color(0xff4020),i:30,d:40,ph:0,pulse:.8})}
function signTex(){const c=document.createElement('canvas');c.width=512;c.height=64;const x=c.getContext('2d');x.fillStyle='#1c2226';x.fillRect(0,0,512,64);x.fillStyle='#c8ccc4';x.font='bold 38px sans-serif';x.textAlign='center';x.fillText('HADLEY\'S HOPE  ·  POP. 158',256,46);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t}
LV[1]={init(){const C=G.C;const len=1500;G.env({fog:.011,fogCol:0x2c3640,hemi:1.3,hemiCol:0xa8bccf,sun:1.8,sunCol:0xb8c8d8,rain:true,wind:1,hum:38});C.open=true;C.mus=1;
 const D=G.setupDrive(len,{gap:22,noAlien:true});G.buildRoad(len);colony(-len-40);C.obj='Drive the APC to Hadley\'s Hope';C.fireMsg='HOLD FIRE = BOOST';
 // the dropship and the troop bay
 const ds=PR.dropship();C.g.add(ds);ds.traverse(m=>{if(m.isMesh)m.castShadow=true});const bay=PR.troopBay(C.g,BX,0);
 const seated={};for(const[who,sd,z,f]of SEATS){const a=G.cast(who,who,who=='vasquez'||who=='drake'?{gun:0}:{gun:0});G.place(a,BX+sd*1.55,z,sd<0?PI/2:-PI/2,0);a.play('Sitting_Idle_Loop',0);seated[who]=a}
 const shipL={p:[0,80,-120],c:0xbfd8ff,col:new THREE.Color(0xbfd8ff),i:95,d:40,ph:0};G.LS.list.push(shipL);const shipPos=u=>[0,lerp(80,9,sm(u/4.2)),lerp(-120,14,sm(u/4.2))];const hide=v=>{for(const k in seated)seated[k].root.visible=v};
 const L=G.WD.W;const bayL=[];
 G.cut([
  {d:4.2,sub:'The dropship falls out of the Sulaco\'s belly and dives into the storm.',setup:()=>{hide(false);D.apc.visible=false;ds.visible=true},upd:u=>{const p=shipPos(u);ds.position.set(...p);shipL.p=[p[0]+5,p[1]+3,p[2]+8];ds.rotation.set(.3*(1-sm(u/4)),0,Math.sin(u*1.3)*.06)},cam:u=>{const p=shipPos(u);return{e:[p[0]+8,p[1]+2.5,p[2]+13],c:p,fov:50}},key:40},
  {d:4,sub:'Strapped in, the marines ride out the turbulence.',setup:()=>{hide(true);bayLights(true)},cam:u=>({e:[BX+.2*Math.sin(u*9),1.55,lerp(4.8,0,sm(u/4))],c:[BX,1.05,-4],fov:55}),key:8},
  {d:2.6,sub:'Sergeant Apone barks out the drop orders.',cam:()=>G.CU(seated.apone,.95,.3,-.02)},
  {d:2.6,sub:'Hudson brags that this squad can handle anything.',cam:()=>G.CU(seated.hudson,.95,.3)},
  {d:2.4,sub:'Vasquez just stares him down.',cam:()=>G.CU(seated.vasquez,.95,-.3)},
  {d:2.4,sub:'Corporal Hicks dozes through all of it.',cam:()=>G.CU(seated.hicks,.95,.3)},
  {d:3,sub:'Ripley grips her harness. She knows what is down there.',cam:()=>G.CU(seated.ripley,.95,-.3)},
  {d:4.2,sub:'Wheels down. The APC rolls out into the wind.',setup:()=>{hide(false);bayLights(false);ds.position.set(0,6.5,24);ds.rotation.set(0,0,0);D.apc.visible=true},upd:u=>{D.apc.position.set(0,0,lerp(14,0,sm(u/4)));PR.spinWheels(D.apc,8,1/60)},cam:u=>({e:[7,1.6,-9],c:[0,1.6,lerp(12,0,u/4)],fov:52})}
 ],()=>{ds.position.set(0,6.5,26);G.play('drive');G.say('A/D or mouse to steer · hold FIRE / click to boost',4)});
 function bayLights(on){if(on){if(!bayL.length)for(let z=-4;z<=4;z+=2.6)bayL.push(G.LS.list.push({p:[BX,2.6,z],c:0xcfe6ff,col:new THREE.Color(0xcfe6ff),i:7,d:6,ph:z})&&G.LS.list[G.LS.list.length-1]);bayL.forEach(l=>l.off=false)}else bayL.forEach(l=>l.off=true)}},
 driveDone(){const C=G.C,D=C.drv;D.v=0;const z=D.z;const h=G.cast('hicksOut','hicks');G.place(h,D.x+2.2,z-3.5,0);h.play('Idle_Loop',0);h.gunMode='low';
  G.cut([{d:4,sub:'Hadley\'s Hope. No lights. No answer on any channel.',cam:u=>({e:[D.x*.5+2,4.2,z+11-u*.4],c:[0,4,z-40],fov:55})},
   {d:3,sub:'Hicks checks his rifle. Time to go in on foot.',cam:()=>G.CU(h,1.05,.35)}],G.winCh)},
 ap(){return null}};
LV[1].ap=undefined;

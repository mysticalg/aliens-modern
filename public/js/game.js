// Campaign runtime: input, over-the-shoulder controller, combat, AI, allies, drive mode, cutscenes, HUD, menu.
import {THREE,Q,TOUCH,MOBILE,E,setQuality,canvas,scene,camera,hemi,flash,sun,keyL,rimL,muzzle,updateLights,resize,frameStat,render,LS,renderer} from './engine.js?v=14';
import {pbr,plain,emiss,boxGeo,model,actor,Actor} from './assets.js?v=14';
import {Alien,Hugger,Queen,egg} from './creatures.js?v=14';
import * as WD from './world.js?v=14';import {W,CS,WH,solid,solidR,solidC,moveE,bfs,pathDir,los,rayWorld,clearWorld} from './world.js?v=14';
import {FX,initFX,resetFX,updateFX,tracer,muzzleFlash,sparks,acidBurst,decal,flame,explosion,shake,steam,smokePuff,rain,updateRain} from './fx.js?v=14';
import {audioInit,SFX,tone,noise,music,ambience} from './audio.js?v=14';
import * as PR from './props.js?v=14';
export const PI=Math.PI,lerp=(a,b,k)=>a+(b-a)*k,cl=(v,a,b)=>Math.max(a,Math.min(b,v)),sm=x=>{x=cl(x,0,1);return x*x*(3-2*x)},rnd=Math.random;
export const dist=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
export const AUTO=Q.has('auto');
export const CHN=['','DROP','HADLEY\'S HOPE','THE NEST','OPS SIEGE','MEDLAB','ESCAPE','QUEEN\'S LAIR','SULACO'];
const SAVEK='hive_unlock';let UNL=1;try{UNL=Math.max(1,+localStorage.getItem(SAVEK)||1)}catch(e){}if(Q.has('all'))UNL=8;
export const LV={};export let C=null;const $=id=>document.getElementById(id);
export const WPN={rifle:{n:'M41A PULSE RIFLE',rate:.09,mag:95,dmg:1,rng:28},smart:{n:'M56 SMARTGUN',rate:.065,mag:500,dmg:1,rng:30,auto:1},flame:{n:'M240 INCINERATOR',rate:.1,mag:300,dmg:3.5,rng:8},gren:{n:'GRENADE LAUNCHER',rate:.8,mag:6,dmg:6,rng:22},none:{n:'UNARMED',rate:1,mag:0,dmg:0,rng:0}};
// ---------------- input ----------------
const K={};const IN={mfire:false,tfire:false,skip:false,switch:false,dx:0,dy:0,stick:null};let lastMouse=-1e9;
addEventListener('keydown',e=>{K[e.code]=true;if(e.code=='KeyQ'||e.code=='Tab'){IN.switch=true;e.preventDefault()}if(C&&C.mode=='cut'&&(e.code=='Space'||e.code=='Enter'||e.code=='Escape'))IN.skip=true;if(e.code=='Space')e.preventDefault()});
addEventListener('keyup',e=>{K[e.code]=false});addEventListener('blur',()=>{for(const k in K)K[k]=false;IN.mfire=false});
canvas.addEventListener('mousedown',e=>{audioInit();lastMouse=performance.now();if(C&&C.mode=='cut'){IN.skip=true;return}if(e.button==0)IN.mfire=true;if(e.button==2)IN.aimHeld=true;
 if(C&&C.mode!='cut'&&C.mode!='done'&&!document.pointerLockElement&&canvas.requestPointerLock){try{const r=canvas.requestPointerLock();r&&r.catch&&r.catch(()=>{})}catch(err){}}});
addEventListener('mouseup',e=>{if(e.button==0)IN.mfire=false;if(e.button==2)IN.aimHeld=false});canvas.addEventListener('contextmenu',e=>e.preventDefault());
addEventListener('mousemove',e=>{lastMouse=performance.now();// pointer-locked: always; unlocked: while a button is held (drag to look)
 if(document.pointerLockElement===canvas||e.buttons){IN.dx+=e.movementX||0;IN.dy+=e.movementY||0}IN.mx=e.clientX/innerWidth*2-1});
// touch: left stick, right drag look, fire + swap buttons
const stickEl=$('stick'),knob=$('knob');let stickId=null,lookId=null,lookLast=null;
function stickMove(t){const r=stickEl.getBoundingClientRect();let dx=(t.clientX-(r.left+r.width/2))/(r.width/2),dy=(t.clientY-(r.top+r.height/2))/(r.height/2);const l=Math.hypot(dx,dy);if(l>1){dx/=l;dy/=l}IN.stick={dx,dy};knob.style.transform=`translate(${dx*45}px,${dy*45}px)`}
stickEl.addEventListener('touchstart',e=>{e.preventDefault();audioInit();const t=e.changedTouches[0];stickId=t.identifier;stickMove(t)},{passive:false});
$('look').addEventListener('touchstart',e=>{e.preventDefault();audioInit();const t=e.changedTouches[0];lookId=t.identifier;lookLast=[t.clientX,t.clientY]},{passive:false});
addEventListener('touchmove',e=>{for(const t of e.changedTouches){if(t.identifier===stickId)stickMove(t);if(t.identifier===lookId&&lookLast){IN.dx+=(t.clientX-lookLast[0])*1.6;IN.dy+=(t.clientY-lookLast[1])*1.6;lookLast=[t.clientX,t.clientY]}}},{passive:false});
const tend=e=>{for(const t of e.changedTouches){if(t.identifier===stickId){stickId=null;IN.stick=null;knob.style.transform=''}if(t.identifier===lookId){lookId=null;lookLast=null}}};addEventListener('touchend',tend);addEventListener('touchcancel',tend);
$('tfire').addEventListener('touchstart',e=>{e.preventDefault();audioInit();IN.tfire=true},{passive:false});$('tfire').addEventListener('touchend',e=>{e.preventDefault();IN.tfire=false},{passive:false});
$('tsw').addEventListener('touchstart',e=>{e.preventDefault();IN.switch=true},{passive:false});
document.getElementById('stage').addEventListener('touchstart',e=>{if(C&&C.mode=='cut'&&!e.target.closest('.scr'))IN.skip=true},{passive:true});
if(TOUCH)document.body.classList.add('touch');
function input(){const sx=(K.KeyD||K.ArrowRight?1:0)-(K.KeyA||K.ArrowLeft?1:0),fw=(K.KeyW||K.ArrowUp?1:0)-(K.KeyS||K.ArrowDown?1:0);let I={sx,fw,fire:!!(IN.mfire||IN.tfire||K.Space),sprint:!!(K.ShiftLeft||K.ShiftRight)};
 if(IN.stick){I.sx=IN.stick.dx;I.fw=-IN.stick.dy;if(Math.hypot(I.sx,I.fw)>.92)I.sprint=true}const l=Math.hypot(I.sx,I.fw);if(l>1){I.sx/=l;I.fw/=l}
 I.lx=IN.dx;I.ly=IN.dy;IN.dx=IN.dy=0;return I}
// ---------------- state ----------------
function newC(n){return{n,mode:'cut',t:0,pt:0,p:{x:0,z:0,ya:PI,pitch:0,hp:100,vis:true,fy:PI},allies:[],en:[],nades:[],weaps:['rifle'],wi:0,ammo:{},rel:0,fireT:-9,kills:0,obj:'',hint:'',msgT:0,hurtT:0,act:null,actP:0,goal:null,
 trk:false,stage:0,latch:null,beepT:0,cast:{},cam:{p:new THREE.Vector3(),t:new THREE.Vector3(),init:false},mus:1,fireN:0,shotN:0,hitN:0}}
export function startCh(n){audioInit();for(const id of['menu','over'])$(id).style.display='none';if(document.pointerLockElement)document.exitPointerLock();
 C=newC(n);window.__game.C=C;for(const w in WPN)C.ammo[w]=WPN[w].mag;C.g=clearWorld();resetFX();rain(false);scene.fog.color.set(0x070a0c);scene.fog.density=.045;scene.background.set(0x020304);
 hemi.intensity=.3;sun.intensity=0;sun.castShadow=false;flash.intensity=0;keyL.intensity=0;rimL.intensity=0;camera.fov=60;camera.updateProjectionMatrix();
 LV[n].init();C.chapT=0;prewarm();updHUD(true)}
// compile every shader variant the chapter will need (creatures, FX, shadows, post) before play, so the first spawn or flame does not hitch
function prewarm(){try{const tmp=[new Alien(),new Hugger(),new Queen(),egg()].map(o=>o.root||o);const fw=new THREE.Vector3();camera.getWorldDirection(fw);tmp.forEach((r,i)=>{r.position.copy(camera.position).addScaledVector(fw,3+i);r.position.y=0;scene.add(r)});
 const vis=[];scene.traverse(o=>{if((o.isMesh||o.isPoints||o.isSprite||o.isInstancedMesh)&&!o.visible){o.visible=true;vis.push(o)}});
 const li=[flash,keyL,rimL,muzzle].map(l=>[l,l.intensity]);for(const[l]of li)l.intensity=Math.max(l.intensity,.001);
 renderer.compile(scene,camera);render();
 for(const o of vis)o.visible=false;for(const[l,v]of li)l.intensity=v;for(const r of tmp)scene.remove(r)}catch(e){console.warn('prewarm',e)}}
export function env(o){if(o.fog!=null)scene.fog.density=o.fog;if(o.fogCol!=null){scene.fog.color.set(o.fogCol);scene.background.set(o.bg??o.fogCol)}if(o.hemi!=null)hemi.intensity=o.hemi;if(o.hemiCol!=null)hemi.color.set(o.hemiCol);
 if(o.sun!=null){sun.intensity=o.sun;if(o.sunCol)sun.color.set(o.sunCol)}if(o.rain!=null)rain(o.rain);C.wind=o.wind||0;ambience({rain:o.rain,wind:o.wind,hum:o.hum})}
export function cut(list,next){C.mode='cut';for(const k in C.cast){const a=C.cast[k];if(a.gun&&a.gunMode=='aim'){a._gm='aim';a.gunMode='low';if(a.locoN&&a.locoN[1]=='Pistol_Idle_Loop'&&!a.curN)a.loco(a.locoN[0],'Idle_Loop',.2)}}C.cut={list,i:-1,u:0,next};nextShot();document.body.classList.add('cut');document.body.classList.remove('play');if(document.pointerLockElement)document.exitPointerLock()}
function nextShot(){const c=C.cut;c.i++;c.u=0;if(c.i>=c.list.length){C.cut=null;document.body.classList.remove('cut');c.next();return}const sh=c.list[c.i];if(sh.setup)sh.setup();$('sub').textContent=sh.sub||'';C.cam.init=false}
export function play(mode){for(const k in C.cast){const a=C.cast[k];if(a._gm){a.gunMode=a._gm;a._gm=null}}C.mode=mode||'foot';E.cine=false;C.pt=0;C.cut=null;document.body.classList.remove('cut');document.body.classList.add('play');C.cam.init=false;keyL.intensity=0;rimL.intensity=0}
export function say(h,t){C.hint=h;C.msgT=t||4}
export function churt(n){if(C.mode=='done')return;if(AUTO)n*=.3;C.p.hp-=n;C.hurtT=.6;shake(.25);if(C.p.hp<=0){C.p.hp=0;C.mode='done';SFX.over();if(C.pa)C.pa.play('Death01',.2,{once:1});setTimeout(()=>overC(false),1600)}else if(rnd()<.5)SFX.hurt()}
export function winCh(){if(C.mode=='done')return;C.mode='done';SFX.win();unlock(C.n+1);overC(true)}
function overC(win){if(document.pointerLockElement)document.exitPointerLock();document.body.classList.remove('play','cut');$('over').style.display='flex';const n=C.n;$('ovt').textContent=win?(n==8?'THE END':'CHAPTER '+n+' COMPLETE'):'MISSION FAILED';
 $('ovs').textContent=win?(n==8?'The queen is gone. Ripley, Newt, Hicks and Bishop sleep the long way home. Thanks for playing.':`${CHN[n]} — ${C.kills} kills. Next: ${CHN[n+1]}`):`${CHN[n]}: try again.`;
 $('next').style.display=win&&n<8&&LV[n+1]?'inline-block':'none';$('restart').textContent=win?'REPLAY':'RETRY'}
export function unlock(n){if(n>UNL){UNL=n;try{localStorage.setItem(SAVEK,String(n))}catch(e){}}}
// ---------------- cast / actors ----------------
export function cast(name,who,extra){const a=actor(who,extra);C.g.add(a.root);C.cast[name]=a;return a}
export function place(a,x,z,ya=0,y=0){a.root.position.set(x,y,z);a.root.rotation.y=ya;a.root.visible=true;return a}
export function headPos(a){a.root.updateMatrixWorld(true);const B=a.vb||a.bones;return B.head?B.head.getWorldPosition(new THREE.Vector3()):B.Head.getWorldPosition(new THREE.Vector3())}
// face close-up camera: in front of the actor's face, slightly to the side
export function CU(a,d=1.05,side=.28,dy=.02,fov=34){const h=headPos(a);const ya=a.root.rotation.y;const f=[Math.sin(ya),Math.cos(ya)],r=[-Math.cos(ya),Math.sin(ya)];
 return{e:[h.x+f[0]*d+r[0]*side,h.y+dy,h.z+f[1]*d+r[1]*side],c:[h.x,h.y-.02,h.z],fov,face:h}}
// ---------------- enemies ----------------
export function spawn(k,x,z,o={}){if(W.map&&solid(x,z)){let b=null,bd=1e9;W.map.forEach((r,j)=>[...r].forEach((c,i)=>{if(!solid(i*CS,j*CS)){const d=Math.hypot(i*CS-x,j*CS-z);if(d<bd){bd=d;b=[i*CS,j*CS]}}}));if(b){x=b[0];z=b[1]}}
 const obj=k=='hugger'?new Hugger():k=='queen'?new Queen():new Alien(o.look||{});C.g.add(obj.root);
 const e=Object.assign({k,x,z,y:0,hp:k=='hugger'?1:k=='queen'?60:3,ya:rnd()*6,dead:0,atkT:0,sp:k=='hugger'?5.6:k=='queen'?2.6:4.3,obj,r:k=='hugger'?.3:k=='queen'?1.1:.42},o);if(AUTO&&k=='alien')e.sp*=.85;C.en.push(e);syncE(e,0);return e}
export const alive=()=>C.en.filter(e=>!e.dead);
export function killE(e){if(e.dead)return;e.dead=.01;C.kills++;SFX.kill();const p=new THREE.Vector3(e.x,e.k=='hugger'?.2:1,e.z);acidBurst(p,e.k=='hugger'?8:18);decal('acid',new THREE.Vector3(e.x+(rnd()-.5)*.4,.01,e.z+(rnd()-.5)*.4),new THREE.Vector3(0,1,0),e.k=='hugger'?.6:1.4);if(C.latch===e){C.latch=null}}
export function dmgE(e,d,hp){e.hp-=d;e.hitT=C.t;if(e.obj)e.obj.hurt=.25;if(hp){sparks(hp,3,null,0x9cff40)}if(e.idle)e.idle=0;if(e.hp<=0)killE(e)}
export function boom(x,z,r,d,y=.6){SFX.boom();explosion(new THREE.Vector3(x,y,z));decal('scorch',new THREE.Vector3(x,.01,z),new THREE.Vector3(0,1,0),r*1.2);C.en.forEach(e=>{if(!e.dead&&Math.hypot(e.x-x,e.z-z)<r)dmgE(e,d)});if(Math.hypot(C.p.x-x,C.p.z-z)<r*.6&&C.mode=='foot')churt(10)}
function syncE(e,dt){const o=e.obj;o.root.position.set(e.x,e.y,e.z);
 if(e===C.latch){const pa=C.pa;const h=headPos(pa);o.root.position.copy(h);o.root.position.y-=.12;o.root.rotation.set(-1.45,C.p.fy,0);o.root.translateZ(-.12);o.update(dt,{latch:1});return}
 o.root.rotation.set(0,e.ya,0);if(e.k=='hugger')o.update(dt,{speed:e.moving?e.sp:0,dead:e.dead});else o.update(dt,{speed:e.moving?e.sp*(e.k=='queen'?1:1):0,dead:e.dead,atk:C.t-e.atkT<.45?1:0,hiss:e.idle?0:1})}
// ---------------- player / aiming ----------------
const _ray=new THREE.Raycaster(),_v=new THREE.Vector3(),_v2=new THREE.Vector3(),_d=new THREE.Vector3();
export function aimDir(p){return new THREE.Vector3(Math.sin(p.ya)*Math.cos(p.pitch),Math.sin(p.pitch),Math.cos(p.ya)*Math.cos(p.pitch))}
function hitEnemy(o,d,max){let best=null,bt=max;for(const e of C.en){if(e.dead||e===C.latch)continue;const cy=e.k=='hugger'?.18+e.y:e.k=='queen'?2.4:1.05;const rr=e.k=='hugger'?.38:e.k=='queen'?1.5:.6;
  // test vertical capsule: sample 3 centres
  for(const yy of e.k=='hugger'?[cy]:[cy-.45,cy,cy+.4].map(v=>v*(e.k=='queen'?1:1))){_v.set(e.x-o.x,yy-o.y,e.z-o.z);const t=_v.dot(d);if(t<0||t>bt)continue;const pd=_v.lengthSq()-t*t;if(pd<rr*rr){bt=t;best=e}}}return best?{e:best,t:bt}:null}
export function aimPoint(){// ray from the camera through the crosshair
 const o=camera.position.clone(),d=new THREE.Vector3(0,0,-1).applyQuaternion(camera.quaternion);const max=60;const hw=rayWorld(o,d,max,C.open?null:WH);const he=hitEnemy(o,d,hw?hw.t:max);
 if(he)return{p:o.clone().addScaledVector(d,he.t),e:he.e,t:he.t,d};if(hw)return{p:o.clone().addScaledVector(d,hw.t),n:hw.n,t:hw.t,d};return{p:o.clone().addScaledVector(d,max),t:max,d}}
function assist(p,dt,strength){// soft aim assist: rotate toward the enemy nearest the crosshair
 const d=aimDir(p);let best=null,ba=strength;const head=new THREE.Vector3(p.x,1.5,p.z);for(const e of alive()){if(e.idle&&e.k!='queen')continue;const cy=e.k=='hugger'?.2+e.y:e.k=='queen'?2.4:1.1;_v.set(e.x-p.x,cy-1.5,e.z-p.z);const L=_v.length();if(L>32)continue;_v.normalize();const a=Math.acos(cl(_v.dot(d),-1,1));if(a<ba&&los(p.x,p.z,e.x,e.z)){ba=a;best=[_v.clone(),L]}}
 if(best){const ty=Math.atan2(best[0].x,best[0].z),tp=Math.asin(best[0].y);let dy=((ty-p.ya+PI*3)%(PI*2))-PI;const k=Math.min(1,dt*8);p.ya+=dy*k;p.pitch+=(tp-p.pitch)*k;return true}return false}
const PR_R=.42,_cr=new THREE.Raycaster(),_fd=new Set();
function camHit(o,d,L){_cr.set(o,d);_cr.far=L;const hs=W.camBlock.length?_cr.intersectObjects(W.camBlock,true):[];return hs.length?hs[0]:null}
function camUpdate(dt,snap){const p=C.p,cm=C.cam;// over-the-shoulder camera: spherecast against walls and props, min distance, occluder fade
 const f=aimDir(p),r=new THREE.Vector3(-Math.cos(p.ya),0,Math.sin(p.ya));const port=E.portrait;const back=port?3.6:3.0,sideO=port?.38:.6,up=port?1.95:1.78,CR=.28;
 const piv=new THREE.Vector3(p.x,up,p.z);let so=sideO;for(;so>0;so-=.1){if(!solidC(p.x+r.x*so,p.z+r.z*so,CR))break}piv.addScaledVector(r,Math.max(0,so));
 const fl=new THREE.Vector3(f.x,0,f.z).normalize();const want=piv.clone().addScaledVector(fl,-back);want.y+=.22-Math.sin(p.pitch)*back*.35;want.y=Math.max(1.25,Math.min(C.open?4:WH-.3,want.y));const dir=want.clone().sub(piv);const L=dir.length();dir.normalize();let ok=L;
 for(let t=.05;t<=L;t+=.05){const q=piv.clone().addScaledVector(dir,t);if(solidC(q.x,q.z,CR)||(!C.open&&q.y>WH-.2)||q.y<.15){ok=t-.05;break}}
 const h=camHit(piv,dir,L+CR);if(h)ok=Math.min(ok,h.distance-CR);ok=Math.max(.05,ok);
 let cp=piv.clone().addScaledVector(dir,ok);{const hd=new THREE.Vector3(p.x,1.6,p.z),v=cp.clone().sub(hd),l=v.length();if(l>.05){v.normalize();const hh=camHit(hd,v,l+CR);if(hh&&hh.distance<l+CR)cp=hd.addScaledVector(v,Math.max(.05,hh.distance-CR))}}const tgt=piv.clone().addScaledVector(f,20);
 if(!cm.init||snap){cm.p.copy(cp);cm.t.copy(tgt);cm.init=true}else{if(cm.p.distanceTo(piv)>ok+.02)cm.p.copy(cp);else cm.p.lerp(cp,1-Math.exp(-dt*16));cm.t.lerp(tgt,1-Math.exp(-dt*30))}
 // never leave the camera inside a wall
 if(solidC(cm.p.x,cm.p.z,.12))cm.p.copy(piv);
 // fade props between camera and player
 const ch=new THREE.Vector3(p.x,1.2,p.z),od=ch.clone().sub(cm.p);const ol=od.length();od.normalize();_cr.set(cm.p,od);_cr.far=ol;const now=new Set();
 for(const x of W.camBlock.length?_cr.intersectObjects(W.camBlock,true):[]){const o=x.object;if(o.isInstancedMesh||!o.material||Array.isArray(o.material))continue;if(!o.userData.fm){o.userData.om=o.material;o.userData.fm=o.material.clone();o.userData.fm.transparent=true}now.add(o)}
 for(const o of now){o.material=o.userData.fm;o.userData.fm.opacity=.25;_fd.add(o)}for(const o of _fd)if(!now.has(o)){o.material=o.userData.om;_fd.delete(o)}
 const cd=cm.p.distanceTo(new THREE.Vector3(p.x,cm.p.y,p.z));C.camMin=Math.min(C.camMin??9,cd);if(C.pa)C.pa.root.visible=cd>.75;setCam(cm.p,cm.t,port?66:58)}
const _shk=new THREE.Vector3();
export function setCam(e,c,fov){camera.position.copy(e);if(FX.shake>0){const s=FX.shake*FX.shake*.12;_shk.set((rnd()-.5)*s,(rnd()-.5)*s,(rnd()-.5)*s);camera.position.add(_shk)}camera.lookAt(c);if(Math.abs(camera.fov-fov)>.01){camera.fov=fov;camera.updateProjectionMatrix()}}
function anyAlert(){return C.en.some(e=>!e.dead&&!e.idle)}
function footStep(dt,I){const p=C.p,pa=C.pa;
 if(IN.switch&&C.weaps.length>1){C.wi=(C.wi+1)%C.weaps.length;say(WPN[C.weaps[C.wi]].n,1.2);SFX.click();updGun()}
 const wn=C.weaps[C.wi],W0=WPN[wn];
 // look
 const sens=TOUCH?.0042:.0024;p.ya-=I.lx*sens;p.pitch=cl(p.pitch-I.ly*sens,-.75,.7);
 if(I.fire||W0.auto)assist(p,dt,W0.auto?.5:TOUCH?.22:.06);
 // move (camera-relative)
 const f=[Math.sin(p.ya),Math.cos(p.ya)],r=[-Math.cos(p.ya),Math.sin(p.ya)];let wx=r[0]*I.sx+f[0]*I.fw,wz=r[1]*I.sx+f[1]*I.fw;if(I.wx!=null){wx=I.wx;wz=I.wz}
 const ml=Math.hypot(wx,wz);const aiming=I.fire||C.t-C.fireT<.6||IN.aimHeld;const sp=(C.speed||(I.sprint&&!aiming?6.4:4.6))*(C.latch?.35:1)*(aiming?.8:1);
 if(ml>.05){moveE(p,wx*sp*dt,wz*sp*dt,PR_R);if(((C.t*(sp>5?3:2.2))|0)!=((C.t-dt)*(sp>5?3:2.2)|0))SFX.step()}
 // body facing: toward aim, legs turn toward movement (with spine counter-twist)
 let off=0,lo='Idle_Loop',ts=1;if(ml>.05){const mya=Math.atan2(wx,wz);let rel=((mya-p.ya+PI*3)%(PI*2))-PI;if(Math.abs(rel)>PI*.62){lo='Walk_Loop';ts=-1.25;rel=((rel+PI*2)%(PI*2))-PI;rel=((rel+PI+PI*3)%(PI*2))-PI}else lo=sp>5.5?'Sprint_Loop':'Jog_Fwd_Loop';off=cl(rel,-1.1,1.1);if(lo=='Jog_Fwd_Loop')ts=sp/4.6}
 p.off=lerp(p.off||0,off,1-Math.exp(-dt*10));p.fy=p.ya+p.off;pa.root.position.set(p.x,0,p.z);pa.root.rotation.y=p.fy;pa.loco(lo,pa.gun&&pa.gun.visible?'Pistol_Idle_Loop':'Idle_Loop',.2,ts);pa.aim(-p.off,p.pitch);pa.aimPitch=p.pitch;pa.root.visible=true;
 // latch / interaction zones take FIRE first
 let fire=I.fire;C.actOn=false;
 if(C.latch){if(fire){C.latchP=(C.latchP||0)+dt;if(C.latchP>1){const e=C.latch;C.latch=null;e.x=p.x+f[0]*1.2;e.z=p.z+f[1]*1.2;killE(e);C.latchP=0;say('Tore it off!',1.5)}}else C.latchP=Math.max(0,(C.latchP||0)-dt*.5);if(C.latch){churt(7*dt)}fire=false}
 if(C.act&&dist(p,C.act)<C.act.r){C.actOn=true;if(fire){C.actP+=dt/C.act.dur;if(C.act.weld){SFX.weld();if(rnd()<.6)sparks(new THREE.Vector3(C.act.wx??C.act.x,1+rnd()*1.4,C.act.wz??C.act.z),3,null,0xffc070)}else if(((C.t*6)|0)%2)noise(.05,.05,C.act.snd||2500,3);if(C.actP>=1){const a=C.act;C.act=null;C.actP=0;a.done()}}fire=false}
 // reload + fire
 C.firing=false;if(C.rel>0){C.rel-=dt;if(C.rel<=0){C.ammo[wn]=W0.mag;say('Reloaded',1)}}
 if(fire&&wn!='none'&&C.rel<=0){if(C.ammo[wn]<=0){if(wn=='rifle'){C.rel=1.4;SFX.reload();say('Reloading…',1.3)}else if(C.t-(C.clickT||0)>.4){C.clickT=C.t;SFX.click()}}
  else if(C.t-C.fireT>W0.rate){C.fireT=C.t;C.ammo[wn]--;C.firing=true;C.shotN++;fireW(wn)}}
 if(K.KeyR&&wn=='rifle'&&C.rel<=0&&C.ammo.rifle<W0.mag){C.rel=1.4;SFX.reload();say('Reloading…',1.3)}
 // enemies
 C.flowT=(C.flowT||0)-dt;if(C.flowT<=0||!C.D){C.flowT=.3;C.D=W.map?bfs(p.x,p.z):null}
 for(const e of C.en){if(e.dead){e.dead+=dt;e.moving=0;if(e.dead>2.2)e.obj.root.position.y=-(e.dead-2.2)*.6;continue}
  if(e.y>0){e.y=Math.max(0,e.y-dt*3.5)}
  if(e.inert)continue;if(e.idle){e.moving=0;if(dist(p,e)<(e.wake||9)&&los(p.x,p.z,e.x,e.z)){e.idle=0;if(e.k!='hugger')SFX.screech();else SFX.hiss()}continue}
  if(e===C.latch)continue;
  const d=dist(p,e);if(e.k=='hugger'&&d<3.6&&!C.latch&&C.t-(e.jT||-9)>2){e.jT=C.t;e.y=.8;if(d<1.7){C.latch=e;C.latchP=0;SFX.hiss();say('FACEHUGGER! Hold FIRE to tear it off!',2.5);continue}}
  const reach=e.k=='hugger'?.6:e.k=='queen'?2.6:1.5;e.moving=0;
  if(d>reach){const dir=pathDir(C.D,e,p.x,p.z);const s=e.sp*(e.hitT&&C.t-e.hitT<.15?.35:1);moveE(e,dir[0]*s*dt,dir[1]*s*dt,e.r);if(dir[2]>0){const ty=Math.atan2(dir[0],dir[1]);e.ya+=((((ty-e.ya)+PI*3)%(PI*2))-PI)*Math.min(1,dt*8);e.moving=1}}
  else if(e.k!='hugger'){e.ya=Math.atan2(p.x-e.x,p.z-e.z);if(C.t-e.atkT>.9){e.atkT=C.t;setTimeout(()=>{if(C&&!e.dead&&dist(C.p,e)<reach+.4)churt(e.k=='queen'?16:9)},250)}}}
 C.en=C.en.filter(e=>{if(e.dead>3.5){e.obj.root.removeFromParent();return false}return true});
 allies(dt);
 // grenades
 for(const n of C.nades){n.t+=dt;n.vy-=12*dt;n.x+=n.vx*dt;n.y+=n.vy*dt;n.z+=n.vz*dt;n.m.position.set(n.x,n.y,n.z);n.m.rotation.x+=dt*10;const hitE=C.en.some(e=>!e.dead&&Math.hypot(e.x-n.x,e.z-n.z)<e.r+.3&&n.y<2);if(n.y<.08||solid(n.x,n.z)||hitE||n.t>3){n.dead=1;n.m.removeFromParent();boom(n.x,n.z,4.2,6)}}C.nades=C.nades.filter(n=>!n.dead);
 // tracker
 if(C.trk){let nd=1e9;alive().forEach(e=>nd=Math.min(nd,dist(p,e)));C.trkD=nd;C.beepT-=dt;if(nd<34&&C.beepT<=0){C.beepT=.22+nd/34*1.1;SFX.beep(nd<12)}}}
function fireW(wn){const p=C.p,pa=C.pa,W0=WPN[wn];pa.root.updateMatrixWorld(true);const mz=pa.muzzle.getWorldPosition(new THREE.Vector3());const ap=aimPoint();
 const d=ap.p.clone().sub(mz);const L=Math.min(d.length(),W0.rng);d.normalize();
 if(wn=='rifle'||wn=='smart'){wn=='smart'?SFX.smart():SFX.rifle();muzzleFlash(mz,d,wn=='smart');shake(.12);
  // spread
  d.x+=(rnd()-.5)*.012;d.y+=(rnd()-.5)*.012;d.z+=(rnd()-.5)*.012;d.normalize();
  const hw=rayWorld(mz,d,W0.rng,C.open?null:WH);const he=hitEnemy(mz,d,hw?hw.t:W0.rng);let end;
  if(he){end=mz.clone().addScaledVector(d,he.t);dmgE(he.e,W0.dmg,end);C.hitN++}
  else if(hw){end=mz.clone().addScaledVector(d,hw.t);if(rnd()<.5)decal('hole',end,hw.n,.13);sparks(end,4,hw.n)}else end=mz.clone().addScaledVector(d,W0.rng);
  if(C.shotN%2==0||wn=='smart')tracer(mz,end);if(rnd()<.25)smokePuff(mz,.12,.5)}
 else if(wn=='flame'){if(C.shotN%2==0)SFX.flame();flame(mz,d,W0.rng);muzzle.position.copy(mz).addScaledVector(d,2.2);muzzle.position.y+=.2;muzzle.intensity=30+rnd()*18;muzzle.distance=12;muzzle.color.setRGB(1,.55,.2);FX.muz=.12;
  for(const e of alive()){const rx=e.x-mz.x,rz=e.z-mz.z;const along=rx*d.x+rz*d.z;const perp=Math.abs(rx*d.z-rz*d.x);if(along>0&&along<W0.rng&&perp<.8+along*.3&&los(mz.x,mz.z,e.x,e.z))dmgE(e,W0.dmg*W0.rate)}
  if(rnd()<.15){const hw=rayWorld(mz,d,W0.rng,WH);if(hw)decal('scorch',mz.clone().addScaledVector(d,hw.t),hw.n,.9)}}
 else if(wn=='gren'){SFX.gren();muzzleFlash(mz,d,0);const m=new THREE.Mesh(new THREE.SphereGeometry(.06,8,6),plain(0x353a2c,.5,.6));C.g.add(m);const v=d.clone().multiplyScalar(18);v.y+=2.5;C.nades.push({x:mz.x,y:mz.y,z:mz.z,vx:v.x,vy:v.y,vz:v.z,t:0,m})}}
// ---------------- allies ----------------
export function ally(who,x,z,o={}){const a=cast('ally'+C.allies.length,who,o.extra);const A=Object.assign({who,a,x,z,ya:o.ya??PI,gun:o.gun??(a.gun?'rifle':'none'),fT:0},o);place(a,x,z,A.ya);a.loco('Idle_Loop','Pistol_Idle_Loop',0);C.allies.push(A);return A}
function allies(dt){const p=C.p;C.allies.forEach((A,i)=>{if(A.gone){A.a.root.visible=false;return}const a=A.a;const off=[[-1.8,-1.6],[1.8,-1.6],[0,-2.6],[-2.4,.4]][i%4];
 const f=[Math.sin(p.ya),Math.cos(p.ya)],r=[-Math.cos(p.ya),Math.sin(p.ya)];let tx=p.x+r[0]*off[0]+f[0]*off[1],tz=p.z+r[1]*off[0]+f[1]*off[1];if(solid(tx,tz)){tx=p.x-f[0]*1.6;tz=p.z-f[1]*1.6}
 let moving=0,mya=A.ya;if(!A.hold){const d=Math.hypot(tx-A.x,tz-A.z);if(d>.7){const dir=d>3.5&&C.D&&!los(A.x,A.z,p.x,p.z)?pathDir(C.D,A,p.x,p.z):[(tx-A.x)/d,(tz-A.z)/d,d];const s=Math.min(6.4,d*2.2);moveE(A,dir[0]*s*dt,dir[1]*s*dt,.32);moving=s;mya=Math.atan2(dir[0],dir[1])}}
 let t=null;if(A.gun!='none'){let bd=20;alive().forEach(e=>{if(e.idle||e===C.latch)return;const d=dist(A,e);if(d<bd&&los(A.x,A.z,e.x,e.z)){bd=d;t=e}})}
 let fy=moving?mya:A.ya;if(t){fy=Math.atan2(t.x-A.x,t.z-A.z)}A.ya+=((((fy-A.ya)+PI*3)%(PI*2))-PI)*Math.min(1,dt*7);
 a.root.position.set(A.x,0,A.z);a.root.rotation.y=A.ya;a.loco(moving>.5?(moving>4.8?'Jog_Fwd_Loop':'Walk_Loop'):'Idle_Loop',a.gun&&a.gun.visible?'Pistol_Idle_Loop':'Idle_Loop',.25,1);
 if(t&&C.t-A.fT>(A.gun=='smart'?.1:.2)){A.fT=C.t;a.root.updateMatrixWorld(true);const mz=a.muzzle.getWorldPosition(new THREE.Vector3());const tp=new THREE.Vector3(t.x+(rnd()-.5)*.3,t.k=='hugger'?.2:1.1,t.z+(rnd()-.5)*.3);dmgE(t,.5,tp);const d=tp.clone().sub(mz).normalize();muzzleFlash(mz,d,A.gun=='smart');tracer(mz,tp);if(i==0&&rnd()<.5)SFX.rifle()}})}
// ---------------- interactions ----------------
export function g(k,i){const[x,z]=WD.mk(k,i);return{x,z}}
// ---------------- drive mode ----------------
export function setupDrive(len,o={}){const D=C.drv=Object.assign({x:0,z:0,v:0,len,obs:[],t:0,wind:0,inside:false},o);let z=-40;
 const rockG=new THREE.IcosahedronGeometry(1,1);const pa=rockG.attributes.position;for(let i=0;i<pa.count;i++){const v=_v.fromBufferAttribute(pa,i);v.multiplyScalar(.8+((Math.sin(v.x*7.1+v.y*3.3)*43758.5)%1+1)%1*.4);pa.setXYZ(i,v.x,v.y,v.z)}rockG.computeVertexNormals();
 const rm=pbr('rock',{color:0x8a8070});D.rockG=rockG;D.rockM=rm;
 while(z>-len+20){const k=rnd(),x=(rnd()-.5)*12;let ob;if(k<.45&&!o.noRock){ob={k:'rock',x,z,m:new THREE.Mesh(rockG,rm)};ob.m.scale.set(1.3+rnd()*.6,1+rnd()*.5,1.3+rnd()*.5);ob.m.rotation.set(rnd(),rnd()*6,rnd())}
  else if(k<.7){ob={k:'wreck',x,z,m:wreck()}}else if(!o.noAlien){const a=new Alien();ob={k:'alien',x,z,ph:rnd()*6,vx:(rnd()-.5)*2,a,m:a.root}}else{z-=10;continue}
  ob.m.position.set(x,ob.k=='rock'?.5:0,z);ob.m.traverse(m=>{if(m.isMesh){m.castShadow=true;m.receiveShadow=true}});C.g.add(ob.m);D.obs.push(ob);z-=(o.gap||22)*(.6+rnd()*.8)}
 D.apc=PR.apc();C.g.add(D.apc);D.apc.position.set(0,0,0);D.apc.rotation.y=PI;return D}
function wreck(){const g=new THREE.Group();const m=pbr('corr',{color:0x7a6a58});const b=new THREE.Mesh(boxGeo(2.4,1.2,3.6,1.5,.1),m);b.position.y=.6;b.rotation.set(.15,.4,.3);g.add(b);const c=new THREE.Mesh(boxGeo(1.6,.9,1.6,1.5,.05),m);c.position.set(.3,1.3,.4);c.rotation.set(.2,.5,.4);g.add(c);return g}
export function buildRoad(len,inside){const D=C.drv;const ground=new THREE.Mesh(boxGeo(inside?16:22,.1,len+120,4),pbr(inside?'grid':'ground',{color:inside?0x9a9a9a:0x9a8e7c}));ground.position.set(0,-.05,-len/2+20);ground.receiveShadow=true;C.g.add(ground);
 const rg=D.rockG,rm=D.rockM;const n=Math.ceil((len+100)/5)*2;const im=new THREE.InstancedMesh(inside?new THREE.BoxGeometry(1,1,1):rg,inside?pbr('wall',{color:0xb0b8bc}):rm,n);const M=new THREE.Matrix4(),q=new THREE.Quaternion(),s=new THREE.Vector3(),p=new THREE.Vector3();let k=0;
 for(let z=30;z>-len-70&&k<n;z-=5)for(const sd of[-1,1]){const h=inside?WH+.5:3+Math.abs(Math.sin(z*.071+sd))*7;p.set(sd*(inside?9:11+Math.sin(z*.05)*2),h/2-(inside?0:.5),z);q.setFromEuler(new THREE.Euler(inside?0:z*.3,inside?0:z,0));s.set(inside?2:4,h*(inside?1:.6),inside?5.1:4);M.compose(p,q,s);im.setMatrixAt(k++,M)}
 im.count=k;im.castShadow=!inside;im.receiveShadow=true;C.g.add(im);
 if(!inside)for(let z=0;z>-len;z-=48)for(const sd of[-1,1]){const pole=new THREE.Mesh(new THREE.CylinderGeometry(.08,.1,5,8),plain(0x3a3e40,.5,.8));pole.position.set(sd*8,2.5,z);C.g.add(pole);const lamp=new THREE.Mesh(new THREE.BoxGeometry(.8,.12,.25),emiss(0xffe0a0,5));lamp.position.set(sd*7.6,5,z);C.g.add(lamp);LS.list.push({p:[sd*7.4,4.6,z],c:0xffd8a0,col:new THREE.Color(0xffd8a0),i:30,d:16,ph:0})}
 else for(let z=0;z>-len;z-=16){const lamp=new THREE.Mesh(new THREE.BoxGeometry(3,.1,.5),emiss(0xd8f0ff,3));lamp.position.set(0,WH-.05,z);C.g.add(lamp);LS.list.push({p:[0,WH-.5,z],c:0xd8f0ff,col:new THREE.Color(0xd8f0ff),i:14,d:12,ph:0})}
 if(inside){const ceil=new THREE.Mesh(boxGeo(16,.1,len+120,4),pbr('panel',{color:0x55595c}));ceil.position.set(0,WH+.5,-len/2+20);C.g.add(ceil)}}
function driveStep(dt,I){const D=C.drv;D.t+=dt;const boost=I.fire;D.v=lerp(D.v,boost?31:19,dt*1.5);D.z-=D.v*dt;D.wind=Math.sin(D.t*.7)*Math.sin(D.t*.23)*(C.wind?2.2:0);
 let sx=I.sx;if(I.lx&&!AUTO)D.mouseX=cl((D.mouseX||0)+I.lx*.004,-1,1);if(!AUTO&&!sx&&D.mouseX!=null&&performance.now()-lastMouse<2500)sx=cl((D.mouseX*6.5-D.x)*.6,-1,1);if(I.apSX!=null)sx=I.apSX;
 D.x=cl(D.x+(sx*10+D.wind)*dt,-6.8,6.8);D.steer=lerp(D.steer||0,sx,dt*6);D.boost=boost;
 for(const o of D.obs){if(o.k=='alien'&&!o.hit){o.x=cl(o.x+o.vx*dt+(D.x-o.x)*dt*.4,-6.6,6.6);o.z+=dt*3;o.m.position.set(o.x,0,o.z);o.m.rotation.y=Math.atan2(D.x-o.x,D.z-o.z);o.a.update(dt,{speed:5})}
  if(o.k=='alien'&&o.hit){o.dead=(o.dead||0)+dt;o.a.update(dt,{dead:o.dead})}
  if(!o.hit&&Math.abs(o.z-D.z)<3.6&&Math.abs(o.x-D.x)<(o.k=='rock'?2.6:2.8)){o.hit=C.t;if(o.k=='alien'){if(boost){C.kills++;SFX.kill();acidBurst(new THREE.Vector3(o.x,1,o.z),20);o.vx=0}else{churt(10);SFX.hiss();say('It\'s on the hull — BOOST (FIRE) to ram them!',2)}}else{churt(o.k=='rock'?12:9);D.v*=.5;SFX.boom();shake(.8);sparks(new THREE.Vector3(o.x,1,o.z+1),20)}}}
 D.apc.position.set(D.x,0,D.z);D.apc.rotation.set(0,PI-D.steer*.25,-D.steer*.05);PR.spinWheels(D.apc,D.v,dt);if(rnd()<dt*20)smokePuff(new THREE.Vector3(D.x+(rnd()-.5)*2,.3,D.z+3.4),.18,.45);
 // headlights via the flashlight spot
 flash.position.set(D.x,2.4,D.z-3.6);flash.target.position.set(D.x+D.steer*3,0,D.z-24);flash.intensity=420;flash.distance=70;flash.angle=.55;
 if(-D.z>=D.len&&!C.dd){C.dd=1;(C.onDrive||LV[C.n].driveDone)()}}
function driveCam(dt){const D=C.drv,port=E.portrait;const e=new THREE.Vector3(D.x*.6,port?7.5:4.2,D.z+(port?12:8.5)),c=new THREE.Vector3(D.x,1.2,D.z-10);const cm=C.cam;if(!cm.init){cm.p.copy(e);cm.t.copy(c);cm.init=true}cm.p.lerp(e,1-Math.exp(-dt*6));cm.t.lerp(c,1-Math.exp(-dt*8));setCam(cm.p,cm.t,(port?70:62)+(D.boost?6:0))}
function apDrive(){const D=C.drv;let best=0,bs=-1e9;for(let x=-6;x<=6;x+=1.5){let s=-Math.abs(x-D.x)*.3;for(const o of D.obs){if(o.hit)continue;const ah=D.z-o.z;if(ah<0||ah>50)continue;const w=o.k=='alien'?-1:1;if(Math.abs(o.x-x)<3.4)s-=w*(52-ah)}if(s>bs){bs=s;best=x}}
 const sx=cl((best-D.x)*1.2,-1,1);const al=D.obs.some(o=>!o.hit&&o.k=='alien'&&D.z-o.z>0&&D.z-o.z<24);return{apSX:sx,fire:al||D.v<20,sx:0,fw:0}}
// ---------------- autopilot ----------------
function navTo(x,z){const p=C.p;const Dg=bfs(x,z);const d=pathDir(Dg,p,x,z);return{wx:d[0],wz:d[1],l:d[2]}}
let apCache={};function apFoot(){const p=C.p;if(C.mode=='drive')return apDrive();const I={sx:0,fw:0,fire:false,lx:0,ly:0,wx:0,wz:0};if(C.latch){I.fire=true;return I}
 const g=C.act||C.goal;if(C.act&&dist(p,C.act)<C.act.r*.8){I.fire=true;return I}
 if(g){const key=Math.round(g.x)+','+Math.round(g.z)+','+Math.round(p.x/CS)+','+Math.round(p.z/CS);if(apCache.k!==key||C.t-apCache.t>.4){apCache={k:key,t:C.t,n:navTo(g.x,g.z)}}const n=apCache.n;if(n.l>.3){I.wx=n.wx;I.wz=n.wz}}
 const near=alive().filter(e=>!e.idle&&dist(p,e)<14&&los(p.x,p.z,e.x,e.z)&&e!==C.latch);
 if(near.length&&C.weaps[C.wi]!='none'){let b=near[0];near.forEach(e=>{if(dist(p,e)<dist(p,b))b=e});const cy=b.k=='hugger'?.2:1.1;p.ya=Math.atan2(b.x-p.x,b.z-p.z);p.pitch=Math.atan2(cy-1.5,dist(p,b));I.fire=true;if(C.act&&dist(p,C.act)<C.act.r)I.fire=false}
 else if(I.wx||I.wz){const ty=Math.atan2(I.wx,I.wz);p.ya+=((((ty-p.ya)+PI*3)%(PI*2))-PI)*.15;p.pitch*=.9}
 return I}
// ---------------- HUD ----------------
const trk=$('trkc').getContext('2d');let hudT=0;
function updHUD(force){if(!C)return;const p=C.p;const wn=C.weaps[C.wi];$('obj').textContent=C.obj||'';$('hint').textContent=C.hint;$('hint').style.opacity=C.msgT>0?1:0;
 const pb=C.bar&&C.mode!='cut'?C.bar():null;$('pbar').style.display=pb?'block':'none';if(pb){$('pbl').textContent=pb[0];$('pbf').style.width=(cl(pb[1],0,1)*100)+'%';$('pbf').style.background=pb[2]||'#e0a030'}$('score').textContent=C.mode=='cut'?'':(C.scoreTxt||'');
 $('hp').style.width=Math.max(0,p.hp)+'%';$('wpn').textContent=C.mode=='drive'?'APC · '+(C.fireMsg||'FIRE = BOOST'):(WPN[wn].n+(WPN[wn].mag?'  '+(C.rel>0?'RELOADING':String(C.ammo[wn]).padStart(3,'0')):''));
 $('hurt').style.boxShadow=`inset 0 0 ${120}px ${30}px rgba(120,10,0,${C.hurtT>0?.45*Math.min(1,C.hurtT*2):(p.hp<35?.18:0)})`;
 const showAct=C.mode=='foot'&&((C.act&&C.actOn)||C.latch);$('act').style.display=showAct?'block':'none';if(showAct){$('actl').textContent=C.latch?'HOLD FIRE — TEAR IT OFF':(C.act.label+' — HOLD FIRE');$('actb').style.width=((C.latch?C.latchP||0:C.actP)*100)+'%'}
 $('xh').style.display=C.mode=='foot'?'block':'none';$('trk').style.display=C.trk&&C.mode=='foot'?'block':'none';
 if(C.trk&&C.mode=='foot'){const R=80;trk.clearRect(0,0,160,160);trk.fillStyle='rgba(0,20,10,.55)';trk.beginPath();trk.moveTo(80,80);trk.arc(80,80,R-2,-PI*.5-1.1,-PI*.5+1.1);trk.fill();trk.strokeStyle='rgba(120,255,170,.35)';for(const rr of[25,50,75]){trk.beginPath();trk.arc(80,80,rr,-PI*.5-1.1,-PI*.5+1.1);trk.stroke()}
  const sw=(C.t*1.4)%1;trk.strokeStyle='rgba(140,255,180,.5)';trk.beginPath();trk.arc(80,80,sw*R,-PI*.5-1.1,-PI*.5+1.1);trk.stroke();
  const pts=alive().map(e=>[e.x,e.z,1]);if(C.goal&&C.trkGoal!==false)pts.push([C.goal.x,C.goal.z,2]);for(const[x,z,k]of pts){const dx=x-p.x,dz=z-p.z;const fx=dx*Math.sin(p.ya)+dz*Math.cos(p.ya),rx=-(dx*-Math.cos(p.ya)+dz*Math.sin(p.ya));const d=Math.hypot(fx,rx);if(d>34)continue;const a=Math.atan2(rx,fx);if(Math.abs(a)>1.1&&k==1)continue;
   const s=d/34*R;trk.fillStyle=k==2?'rgba(120,200,255,.9)':'rgba(170,255,190,'+(.5+.5*Math.sin(C.t*8))+')';trk.beginPath();trk.arc(80+Math.sin(a)*s,80-Math.cos(a)*s,k==2?4:5,0,PI*2);trk.fill()}
  $('trkd').textContent=C.trkD<99?Math.round(C.trkD)+'m':'--m'}}
// objective beacon in the world
let beacon=null;function updBeacon(){if(!beacon){beacon=new THREE.Mesh(new THREE.CylinderGeometry(.35,.35,6,16,1,true),new THREE.MeshBasicMaterial({color:new THREE.Color(.2,1.2,.6),transparent:true,opacity:.12,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide}));beacon.raycast=()=>{};scene.add(beacon)}
 const gl=C&&C.mode=='foot'?(C.act||C.goal):null;beacon.visible=!!gl&&C.showBeacon!==false;if(gl){beacon.position.set(gl.x,1.5,gl.z);const cd=Math.hypot(camera.position.x-gl.x,camera.position.z-gl.z);const nf=Math.min(1,Math.max(0,(cd-2.5)/4));beacon.visible=beacon.visible&&nf>0;beacon.material.opacity=(.08+.05*Math.sin(C.t*2.5))*nf}}
// ---------------- main update ----------------
const _focus=new THREE.Vector3();
export function update(dt){if(!C)return;C.t+=dt;
 if(C.mode=='cut'){const c=C.cut,sh=c.list[c.i];c.u+=dt;if(sh.upd)sh.upd(c.u,dt);for(const k in C.cast){const a=C.cast[k];if(a.root.visible)a.update(dt)}
  if(LV[C.n].cutUpd)LV[C.n].cutUpd(dt,sh,c.u);for(const e of C.en)if(e.obj.root.visible&&sh.actors)syncE(e,dt);
  const cm=sh.cam(c.u);const ev=new THREE.Vector3(...cm.e),cv=new THREE.Vector3(...cm.c);setCam(ev,cv,cm.fov||50);E.cine=true;E.focus=cm.face?ev.distanceTo(cm.face):ev.distanceTo(cv);
  // key light from camera side so faces always read; soft rim from behind
  const fw=cv.clone().sub(ev).normalize();const rt=new THREE.Vector3().crossVectors(fw,new THREE.Vector3(0,1,0)).normalize();keyL.position.copy(ev).addScaledVector(rt,.7).add(new THREE.Vector3(0,.6,0));keyL.target.position.copy(cv);keyL.intensity=sh.key??(cm.face?5.5:12);keyL.distance=cm.face?6:30;keyL.angle=cm.face?.45:.7;
  if(cm.face){rimL.position.copy(cv).addScaledVector(fw,.8).add(new THREE.Vector3(0,.4,0));rimL.intensity=4}else rimL.intensity=0;flash.intensity=(sh.flash??0)*(cm.face?.45:1);
  if(IN.skip&&C.t-(C.skipT||0)>.3){C.skipT=C.t;c.u=sh.d+1}IN.skip=false;IN.switch=false;if(c.u>=sh.d)nextShot();_focus.copy(cv);finish(dt);return}
 IN.skip=false;if(C.mode=='done'){if(C.pa)C.pa.update(dt);finish(dt);return}
 C.pt+=dt;if(C.msgT>0)C.msgT-=dt;if(C.hurtT>0)C.hurtT-=dt;
 let I=input();if(AUTO||C.auto){const a=LV[C.n].ap?LV[C.n].ap():apFoot();Object.assign(I,a)}C.in=I;if(I.fire)C.fireN++;
 if(C.mode=='foot'){footStep(dt,I);C.pa.update(dt);camUpdate(dt);
  // flashlight from the player's shoulder along the aim
  const d=aimDir(C.p);flash.position.set(C.p.x,1.75,C.p.z).addScaledVector(new THREE.Vector3(-Math.cos(C.p.ya),0,Math.sin(C.p.ya)),.25);flash.target.position.copy(flash.position).addScaledVector(d,10);flash.intensity=C.flashI??55;flash.distance=30;flash.angle=.5;_focus.set(C.p.x,1.5,C.p.z)}
 else if(C.mode=='drive'){driveStep(dt,I);driveCam(dt);_focus.set(C.drv.x,1,C.drv.z-6)}
 else if(LV[C.n].modeStep){LV[C.n].modeStep(dt,I);_focus.copy(camera.position)}
 for(const A of C.allies)A.a.update(dt);for(const e of C.en)syncE(e,dt);
 if(C.mode!='done'&&LV[C.n].step)LV[C.n].step(dt,I);IN.switch=false;finish(dt)}
function finish(dt){updateFX(dt);updateRain(dt,C.wind||0);WD.updateDoors(dt);for(const s of W.steam)if(rnd()<dt*5)steam(s);updateLights(C.t,_focus);updBeacon();if(LV[C.n].always)LV[C.n].always(dt);
 music(C.mode=='cut'?1:anyAlert()?3:C.mus);hudT+=dt;if(hudT>.05){hudT=0;updHUD()}}
export function updGun(){const wn=C.weaps[C.wi];if(!C.pa)return;if(C.pa.gun)C.pa.gun.visible=wn!='none';}
// ---------------- menu ----------------
export function buildMenu(){const ch=$('chaps');ch.innerHTML='';for(let n=1;n<=8;n++){const b=document.createElement('button');b.textContent=n+'. '+CHN[n]+(LV[n]?'':' (soon)');b.disabled=n>UNL||!LV[n];b.onclick=()=>{SFX.ui();startCh(n)};ch.appendChild(b)}
 const qb=$('qbtn');qb.textContent='QUALITY: '+E.q.toUpperCase();qb.onclick=()=>{const o=['low','medium','high','ultra'];setQuality(o[(o.indexOf(E.q)+1)%4])}}
export function goMenu(){E.cine=false;if(document.pointerLockElement)document.exitPointerLock();C=null;window.__game.C=null;document.body.classList.remove('play','cut');$('over').style.display='none';buildMenu();$('menu').style.display='flex';
 clearWorld();resetFX();rain(false);menuScene()}
let menuT=0;function menuScene(){const gr=W.group;const fl=new THREE.Mesh(boxGeo(30,.1,30,3),pbr('grid',{color:0x6a6a6a}));fl.position.y=-.05;fl.receiveShadow=true;gr.add(fl);
 for(let i=0;i<9;i++){const e=egg();const a=i/9*PI*2;e.position.set(Math.cos(a)*(3+i%3),0,Math.sin(a)*(3+i%3)-2);e.rotation.y=a;if(i%4==0)e.userData.open(.8);gr.add(e)}
 const a=new Alien();a.root.position.set(0,0,-6);gr.add(a.root);menuT=0;window.__menuAlien=a;scene.fog.density=.07;scene.fog.color.set(0x0a1410);hemi.intensity=.25;
 WD.W.colliders=[];LS.list.push({p:[0,3,-3],c:0x7fd0b0,col:new THREE.Color(0x7fd0b0),i:16,d:14,ph:0,pulse:.6},{p:[-4,1,0],c:0x30a070,col:new THREE.Color(0x30a070),i:10,d:10,ph:1});for(const e of FX.dec?[]:[]);}
export function menuUpdate(dt){menuT+=dt;const a=window.__menuAlien;if(a)a.update(dt,{speed:0,hiss:1});camera.position.set(Math.sin(menuT*.08)*6,1.6,Math.cos(menuT*.08)*6+2);camera.lookAt(0,1.2,-3);keyL.intensity=0;flash.position.set(2,4,4);flash.target.position.set(0,1,-4);flash.intensity=40;
 for(let i=0;i<2;i++)if(rnd()<dt*3)steam(new THREE.Vector3((rnd()-.5)*8,.2,(rnd()-.5)*8-2),1.5);updateFX(dt);updateLights(menuT,new THREE.Vector3(0,1,0))}
export {K,IN,W,CS,WH,WD,PR,FX,SFX,THREE,scene,camera,hemi,flash,sun,keyL,rimL,muzzle,LS,pbr,plain,emiss,boxGeo,model,actor,Alien,Hugger,Queen,egg,sparks,acidBurst,decal,explosion,shake,steam,smokePuff,rain,flame,tracer,muzzleFlash,solid,los,bfs,moveE,ambience,tone,noise,E,TOUCH,MOBILE};

// automated test: walk the player into every wall face, check capsule penetration and camera placement
function wallTest(o={}){if(!C||C.mode!='foot'||!W.map)return{err:'not on foot',mode:C&&C.mode};const p=C.p,sv={x:p.x,z:p.z,ya:p.ya,pitch:p.pitch},res={cells:0,pushes:0,pen:[],meshPen:[],camIn:[],camOcc:[],minMesh:9,minCam:9};
 const cells=[];W.map.forEach((r,j)=>[...r].forEach((c,i)=>{if(solid(i*CS,j*CS))return;for(const[a,b]of[[1,0],[-1,0],[0,1],[0,-1]])if(solid((i+a)*CS,(j+b)*CS)){cells.push([i,j,a,b])}}));
 const step=Math.max(1,Math.floor(cells.length/(o.max||160)));const dirs=[];for(let k=0;k<16;k++)dirs.push(new THREE.Vector3(Math.sin(k/16*PI*2),0,Math.cos(k/16*PI*2)));
 for(let n=0;n<cells.length;n+=step){const[i,j,a,b]=cells[n];res.cells++;for(const sl of[-.35,0,.35]){
  p.x=i*CS+(b?sl*CS:0);p.z=j*CS+(a?sl*CS:0);if(solidC(p.x,p.z,PR_R))continue;
  for(let k=0;k<60;k++)moveE(p,a*.1+(rnd()-.5)*.04,b*.1+(rnd()-.5)*.04,PR_R);res.pushes++;
  if(solidC(p.x,p.z,PR_R-.02))res.pen.push([C.n,i,j,+p.x.toFixed(2),+p.z.toFixed(2)]);
  for(const y of[.35,.9,1.5])for(const d of dirs){const h=camHit(new THREE.Vector3(p.x,y,p.z),d,PR_R+.3);if(h){res.minMesh=Math.min(res.minMesh,h.distance);if(h.distance<PR_R-.14)res.meshPen.push([C.n,i,j,y,+h.distance.toFixed(2),(h.object.name||h.object.type)+':'+h.object.geometry.type+':'+(h.object.parent&&h.object.parent.name)+':'+JSON.stringify(h.object.geometry.parameters)+':'+h.object.isInstancedMesh+':'+(h.object.material.color&&h.object.material.color.getHexString())+'@'+h.point.x.toFixed(1)+','+h.point.z.toFixed(1)])}}
  for(const[ya,pi]of[[Math.atan2(-a,-b),0],[Math.atan2(-a,-b),.6],[Math.atan2(-a,-b),-.7],[Math.atan2(b,-a),0],[Math.atan2(-b,a),0]]){p.ya=ya;p.pitch=pi;camUpdate(.016,true);const cp=camera.position;
   if(solidC(cp.x,cp.z,.08)||cp.y<.08||(!C.open&&cp.y>WH-.05))res.camIn.push([C.n,i,j,+cp.x.toFixed(2),+cp.y.toFixed(2),+cp.z.toFixed(2)]);
   const hd=new THREE.Vector3(p.x,1.6,p.z),dv=cp.clone().sub(hd),L=dv.length();if(L>.05){const h=camHit(hd,dv.normalize(),L);if(h&&h.distance<L-.02)res.camOcc.push([C.n,i,j,+(L-h.distance).toFixed(2),h.object.name||h.object.type])}
   res.minCam=Math.min(res.minCam,Math.hypot(cp.x-p.x,cp.z-p.z))}}}
 Object.assign(p,sv);camUpdate(.016,true);return res}
window.__game={wallTest,startCh,LV,C:null,setAuto:v=>{if(C)C.auto=v},skip:()=>{IN.skip=true},goMenu};

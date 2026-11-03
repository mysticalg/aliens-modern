import {THREE,Q,E,resize,render,loadEnv,frameStat,renderer} from './engine.js?v=9';
import {loadModels} from './assets.js?v=9';
import {initFX} from './fx.js?v=9';
import * as GM from './game.js?v=9';
import './ch1.js?v=9';import './ch2.js?v=9';import './ch3.js?v=9';import './ch4.js?v=9';import './ch5.js?v=9';import './ch6.js?v=9';import './ch7.js?v=9';import './ch8.js?v=9';
const $=id=>document.getElementById(id);
const MODELS=['male','female','anims','hair_buzzed','hair_long','hair_simpleparted','hair_buns','hair_beard','hair_buzzedfemale','gun_rifle','gun_pistol','prop_crate','prop_crate_large','prop_barrel1','prop_locker','prop_desk_medium','prop_chair','prop_ammo','prop_shelves_widetall','prop_crate_tarp_large','prop_healthpack'];
window.__errs=[];addEventListener('error',e=>window.__errs.push(String(e.message)));
async function boot(){$('load').style.display='flex';resize();
 await Promise.all([loadEnv(),loadModels(MODELS,k=>{$('lbar').style.width=(k*100|0)+'%'})]);initFX();
 $('next').onclick=()=>GM.startCh(GM.C.n+1);$('restart').onclick=()=>GM.startCh(GM.C.n);$('tomenu').onclick=()=>GM.goMenu();
 $('load').style.display='none';if(Q.has('ch'))GM.startCh(+Q.get('ch'));else GM.goMenu();
 let last=performance.now();function loop(now){requestAnimationFrame(loop);const rdt=Math.min(.1,(now-last)/1000);let dt=Math.min(.05,rdt);last=now;if(Q.has('auto'))dt=.05;
  try{if(GM.C)GM.update(dt);else GM.menuUpdate(dt)}catch(err){console.error(err);window.__errs.push(String(err.stack||err))}render();frameStat(rdt,now)}requestAnimationFrame(loop);
 window.ready=1;window.__E=E;window.__R=renderer}
boot();

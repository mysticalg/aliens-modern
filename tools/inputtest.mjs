// Automated input test: injects keyboard/mouse events and checks the player moves, turns, fires and switches weapons.
// node tools/inputtest.mjs [baseURL] [chapters] [extraQuery]   (HEADFUL=1 CHROME=path for a real GPU window)
import puppeteer from 'puppeteer-core';
const [,,BASE='http://localhost:8123/',CHS='2,3,4,5,6,7',XQ='']=process.argv;
const exe=process.env.CHROME||'/usr/bin/google-chrome';const head=!!process.env.HEADFUL;const SH=process.env.SHOTS||'/tmp';
const args=head?['--use-angle=d3d11','--enable-gpu','--ignore-gpu-blocklist','--window-size=1300,820']:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader'];
const b=await puppeteer.launch({executablePath:exe,headless:head?false:'new',args,defaultViewport:{width:1280,height:720}});
const sleep=t=>new Promise(r=>setTimeout(r,t));let fails=0;
for(const ch of CHS.split(',')){const pg=await b.newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));pg.on('console',m=>m.type()=='error'&&errs.push(m.text()));
 await pg.goto(BASE+'?ch='+ch+'&q='+(process.env.Q||'low')+XQ,{waitUntil:'load'});await pg.waitForFunction('window.ready',{timeout:180000});
 for(let i=0;i<160;i++){const m=await pg.evaluate(()=>window.__game.C&&window.__game.C.mode);if(m=='foot')break;await pg.evaluate(()=>window.__game.skip());await sleep(250)}
 const st=()=>pg.evaluate(()=>{const C=window.__game.C;return{m:C.mode,x:C.p.x,z:C.p.z,ya:C.p.ya,pitch:C.p.pitch,shots:C.shotN||0,wi:C.wi,nw:C.weaps[C.wi]=='none'?0:C.weaps.length,fy:C.pa&&C.pa.root.rotation.y,act:!!C.actOn||!!C.latch,ap:C.actP||0}});
 const s0=await st();if(s0.m!='foot'){console.log(JSON.stringify({ch,skip:'mode '+s0.m}));await pg.close();continue}
 await sleep(400);
 const hold=async(k,ms)=>{await pg.keyboard.down(k);await sleep(ms);await pg.keyboard.up(k);await sleep(150)};
 const F=(a,c)=>(c.x-a.x)*Math.sin(a.ya)+(c.z-a.z)*Math.cos(a.ya),R=(a,c)=>-(c.x-a.x)*Math.cos(a.ya)+(c.z-a.z)*Math.sin(a.ya);
 const T={};let a=await st(),c;
 await hold('KeyW',1600);c=await st();T.W=F(a,c)>.4;
 a=c;await hold('KeyS',700);c=await st();T.S=F(a,c)<-.3;if(process.env.DBG)console.log('S',a,c);
 a=c;await hold('KeyD',700);c=await st();T.D=R(a,c)>.25;
 a=c;await hold('ArrowLeft',700);c=await st();T.ArrowL=R(a,c)<-.25;
 a=c;await hold('ArrowUp',700);c=await st();T.ArrowUp=F(a,c)>.3;
 a=c;await hold('KeyW',600);c=await st();const dw=Math.hypot(c.x-a.x,c.z-a.z);a=c;await pg.keyboard.down('ShiftLeft');await hold('KeyW',600);await pg.keyboard.up('ShiftLeft');c=await st();const ds=Math.hypot(c.x-a.x,c.z-a.z);T.sprint=ds>dw*1.08||dw<.2;
 a=await st();await pg.evaluate(()=>{for(let i=0;i<10;i++)dispatchEvent(new MouseEvent('mousemove',{movementX:20,movementY:0,buttons:1,clientX:400,clientY:300}))});await sleep(300);c=await st();T.lookX=c.ya<a.ya-.2;
 a=c;await pg.evaluate(()=>{for(let i=0;i<10;i++)dispatchEvent(new MouseEvent('mousemove',{movementX:0,movementY:10,buttons:1,clientX:400,clientY:300}))});await sleep(300);c=await st();T.lookY=c.pitch<a.pitch-.05;
 await sleep(600);c=await st();T.facing=Math.abs(((c.fy-c.ya+Math.PI*3)%(Math.PI*2))-Math.PI)<.35;
 a=await st();await pg.mouse.move(640,360);await pg.mouse.down();await sleep(700);await pg.mouse.up();await sleep(200);c=await st();T.click=c.shots>a.shots||c.nw==0||c.ap>a.ap||c.act;
 a=c;await hold('Space',600);c=await st();T.space=c.shots>a.shots||c.nw==0||c.ap>a.ap||c.act;
 a=c;if(a.nw>1){await hold('KeyQ',80);c=await st();T.switchQ=c.wi!=a.wi}
 await pg.mouse.down({button:'right'});await sleep(300);await pg.mouse.up({button:'right'});
 // move + aim screenshot in third person
 await pg.keyboard.down('KeyW');await sleep(500);await pg.screenshot({path:`${SH}/input_c${ch}.jpg`,quality:80});await pg.keyboard.up('KeyW');
 T.noErr=errs.length==0;const bad=Object.entries(T).filter(([k,v])=>!v).map(([k])=>k);if(bad.length)fails++;
 console.log(JSON.stringify({ch,pass:!bad.length,bad,errs:errs.slice(0,3)}));await pg.close()}
await b.close();console.log(fails?'FAIL':'PASS');process.exit(fails?1:0)

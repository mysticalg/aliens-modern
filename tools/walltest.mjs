// Automated wall/camera test: for each chapter, skip to on-foot play and run __game.wallTest().
import puppeteer from 'puppeteer-core';
const URL=process.argv[2]||'http://localhost:8123/',CH=(process.argv[3]||'1,2,3,4,5,6,7,8').split(',');
const b=await puppeteer.launch({executablePath:process.env.CHROME||'/usr/bin/google-chrome',headless:'new',args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader','--window-size=960,540']});
let fail=0;const out={};
for(const ch of CH){const pg=await b.newPage();await pg.setViewport({width:960,height:540});const errs=[];pg.on('pageerror',e=>errs.push(e.message));
 await pg.goto(URL+'?ch='+ch+'&q=low',{waitUntil:'load'});await pg.waitForFunction('window.ready',{timeout:120000});
 let r=null;for(let k=0;k<240&&!r;k++){r=await pg.evaluate(()=>{const g=window.__game;if(!g.C)return null;if(g.C.mode!='foot'){g.skip();return null}return g.wallTest({max:140})});if(!r)await new Promise(z=>setTimeout(z,500))}
 if(!r){out[ch]={err:'never reached on-foot mode'};console.log('ch'+ch,'no foot mode');await pg.close();continue}
 const bad=r.pen.length+r.meshPen.length+r.camIn.length+r.camOcc.length;if(bad||errs.length)fail++;
 out[ch]={cells:r.cells,pushes:r.pushes,pen:r.pen.length,meshPen:r.meshPen.length,camIn:r.camIn.length,camOcc:r.camOcc.length,minMesh:+r.minMesh.toFixed(2),minCam:+r.minCam.toFixed(2),ex:[...r.pen,...r.meshPen,...r.camIn,...r.camOcc].slice(0,4),errs:errs.slice(0,2)};
 console.log('ch'+ch,JSON.stringify(out[ch]));await pg.close()}
await b.close();console.log(fail?'FAIL '+fail:'PASS');process.exit(fail?1:0)

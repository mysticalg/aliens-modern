import puppeteer from 'puppeteer-core';
const [,,url,ch,q='low',times='4,8,12',out='/workspace/shots/t']=process.argv;
const b=await puppeteer.launch({executablePath:'/usr/bin/google-chrome',headless:'new',args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const pg=await b.newPage();await pg.setViewport({width:960,height:540});const errs=[];pg.on('pageerror',e=>errs.push(e.message));pg.on('console',m=>m.type()=='error'&&errs.push(m.text()));
await pg.goto(url+'?ch='+ch+'&q='+q,{waitUntil:'load'});await pg.waitForFunction('window.ready',{timeout:180000});
const t0=Date.now();for(const t of times.split(',').map(Number)){while(Date.now()-t0<t*1000)await new Promise(r=>setTimeout(r,200));await pg.screenshot({path:`${out}_c${ch}_${t}.jpg`,quality:80});}
console.log('errs',JSON.stringify(errs.slice(0,5)));await b.close();

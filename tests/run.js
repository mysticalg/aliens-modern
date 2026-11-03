const pp=require('/tmp/pp/node_modules/puppeteer-core');
const [ch,secs,shots]=[process.argv[2]||'3',+(process.argv[3]||60),process.argv[4]||''];
(async()=>{const b=await pp.launch({executablePath:require('fs').existsSync('/usr/bin/google-chrome')?'/usr/bin/google-chrome':'/usr/bin/chromium',args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'],headless:'new'});
const p=await b.newPage();await p.setViewport({width:960,height:540});const errs=[];p.on('console',m=>{if(m.type()=='error'||m.type()=='warning')errs.push(m.text())});p.on('pageerror',e=>errs.push('PE '+e.message));
await p.goto(`http://localhost:8765/?ch=${ch}&auto&fast&all&q=${process.env.Q||"low"}&nodyn`,{waitUntil:'load'});
await p.waitForFunction('window.ready',{timeout:90000});let last='';
for(let s=0;s<secs;s+=3){await new Promise(r=>setTimeout(r,3000));const st=await p.evaluate(()=>{const C=window.__game.C;return C?`${C.mode} st${C.stage} t${(C.chapT||0).toFixed(0)} hp${C.p.hp|0} k${C.kills} ${document.getElementById('sub').textContent.slice(0,40)}|${C.obj.slice(0,40)} errs${window.__errs.length}`:'menu/over '+document.getElementById('ovt').textContent});if(st!=last)console.log(s,st);last=st;
 if(shots&&s%15==0)await p.screenshot({path:`/tmp/shot_${ch}_${s}.png`});if(st.includes('COMPLETE')||st.includes('FAILED')||st.includes('THE END'))break}
console.log('ERRS',JSON.stringify((await p.evaluate(()=>window.__errs)).concat(errs).slice(0,8)));await b.close()})();

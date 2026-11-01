// Original WebAudio synthesis: SFX, ambient drones, adaptive score. No sampled audio.
let AC=null,MG,SG,RV,NB,AMB=null;export const AU={on:false,level:1};
export function audioInit(){if(AC){AC.resume&&AC.resume();return}try{AC=new (window.AudioContext||window.webkitAudioContext)();const comp=AC.createDynamicsCompressor();comp.threshold.value=-14;comp.ratio.value=4;comp.connect(AC.destination);
 MG=AC.createGain();MG.gain.value=.13;SG=AC.createGain();SG.gain.value=.55;RV=AC.createConvolver();RV.buffer=impulse(2.6);const rg=AC.createGain();rg.gain.value=.32;
 MG.connect(comp);SG.connect(comp);MG.connect(RV);SG.connect(RV);RV.connect(rg);rg.connect(comp);NB=nbuf();AU.on=true}catch(e){AC=null}}
function impulse(sec){const n=AC.sampleRate*sec,b=AC.createBuffer(2,n,AC.sampleRate);for(let c=0;c<2;c++){const d=b.getChannelData(c);for(let i=0;i<n;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/n,3.2)}return b}
function nbuf(){const b=AC.createBuffer(1,AC.sampleRate*2,AC.sampleRate),d=b.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;return b}
export function tone(f,d,type,g,t0,dest,f2){if(!AC)return;const t=AC.currentTime+(t0||0),o=AC.createOscillator(),a=AC.createGain();o.type=type||'sine';o.frequency.setValueAtTime(f,t);if(f2)o.frequency.exponentialRampToValueAtTime(f2,t+d);
 a.gain.setValueAtTime(0,t);a.gain.linearRampToValueAtTime(g,t+.006);a.gain.exponentialRampToValueAtTime(.0005,t+d);o.connect(a);a.connect(dest||SG);o.start(t);o.stop(t+d+.03)}
export function noise(d,g,fq,q,t0,f2,type){if(!AC)return;const t=AC.currentTime+(t0||0),s=AC.createBufferSource();s.buffer=NB;s.loop=true;const f=AC.createBiquadFilter();f.type=type||'bandpass';f.frequency.setValueAtTime(fq,t);if(f2)f.frequency.exponentialRampToValueAtTime(f2,t+d);f.Q.value=q||1;
 const a=AC.createGain();a.gain.setValueAtTime(0,t);a.gain.linearRampToValueAtTime(g,t+.008);a.gain.exponentialRampToValueAtTime(.0005,t+d);s.connect(f);f.connect(a);a.connect(SG);s.start(t,Math.random()*1.5);s.stop(t+d+.05)}
export const SFX={
 rifle:()=>{noise(.09,.32,2400,.7,0,900);noise(.05,.3,300,.8,0,0,'lowpass');tone(110,.07,'square',.08,0,0,60)},
 smart:()=>{noise(.07,.28,1700,.8,0,700);tone(90,.06,'square',.07,0,0,50)},
 click:()=>tone(1800,.025,'square',.08),flame:()=>noise(.22,.14,700,.5,0,260),
 gren:()=>{tone(380,.12,'triangle',.12,0,0,140);noise(.08,.2,900,1)},
 boom:()=>{noise(1.4,.55,240,.6,0,40,'lowpass');tone(55,.9,'sine',.5,0,0,25);noise(.4,.3,1200,.6,0,200)},
 hiss:()=>{noise(1.1,.22,3400,2.4,0,1400);noise(.6,.1,5200,3,.1,2200)},
 screech:()=>{tone(1300,.5,'sawtooth',.05,0,0,700);noise(.6,.15,2600,4,0,1400)},
 hurt:()=>{tone(150,.2,'sawtooth',.1,0,0,80);noise(.12,.15,500,1)},
 kill:()=>{noise(.45,.22,1100,1.4,0,180);tone(520,.3,'sawtooth',.04,0,0,90);noise(.5,.08,4000,2,.05,900)},
 step:()=>noise(.06,.05,320,1.2),metal:()=>{tone(320+Math.random()*80,.4,'triangle',.06);noise(.1,.08,2600,3)},
 weld:()=>{noise(.08,.07,3600+Math.random()*900,4)},door:()=>{noise(.9,.18,240,.8,0,120,'lowpass');tone(70,.8,'triangle',.12)},
 beep:(n)=>{tone(n?1560:1180,.08,'sine',.1);tone((n?1560:1180)*2,.05,'sine',.02)},
 egg:()=>noise(.5,.1,500,1.5,0,1500),reload:()=>{tone(900,.03,'square',.06);tone(600,.04,'square',.06,.22);noise(.05,.12,1500,2,.4)},
 engine:()=>{},ui:()=>tone(880,.06,'sine',.08),
 win:()=>[0,7,12,16].forEach((n,i)=>tone(220*2**(n/12),1.4,'triangle',.1,i*.22)),over:()=>[7,3,0,-5].forEach((n,i)=>tone(196*2**(n/12),1,'triangle',.14,i*.3))};
// ambience: wind/rain bed, rumbling hum, adaptive score
export function ambience(o){if(!AC)return;if(AMB){AMB.forEach(n=>{try{n.stop()}catch(e){}});AMB=null}AMB=[];
 const bed=(fq,g,type,q)=>{const s=AC.createBufferSource();s.buffer=NB;s.loop=true;const f=AC.createBiquadFilter();f.type=type;f.frequency.value=fq;f.Q.value=q||.7;const a=AC.createGain();a.gain.value=g;s.connect(f);f.connect(a);a.connect(SG);s.start();AMB.push(s);return a};
 if(o.rain)bed(2600,.05,'highpass');if(o.wind){const a=bed(420,.07,'bandpass',.6);const l=AC.createOscillator(),lg=AC.createGain();l.frequency.value=.13;lg.gain.value=.05;l.connect(lg);lg.connect(a.gain);l.start();AMB.push(l)}
 if(o.hum!==false){const h=AC.createOscillator(),a=AC.createGain();h.frequency.value=o.hum||52;h.type='sine';a.gain.value=.04;h.connect(a);a.connect(SG);h.start();AMB.push(h);bed(90,.05,'lowpass')}}
let mStep=0,mNext=0;const PADS=[[45,52,57],[44,51,56],[46,53,58],[41,48,53]];const ARP=[0,3,7,10,12,10,7,3];
export function music(lvl){if(!AC)return;const now=AC.currentTime;if(mNext<now)mNext=now+.05;const bpm=[70,76,96,128][lvl]||70,st=60/bpm/2;
 while(mNext<now+.25){const i=mStep%16,bar=(mStep>>4)%4,ch=PADS[bar],t0=mNext-now;
  if(i==0)ch.forEach(n=>tone(440*2**((n-69)/12),st*16,'sine',.07,t0,MG));
  if(i==0||i==8)tone(440*2**((ch[0]-24-69)/12),st*7,'triangle',.4,t0,MG);
  if(lvl>=1&&i%2==0)tone(440*2**((ch[0]+ARP[(i/2)%8]-57)/12),st*1.6,'triangle',.06+lvl*.02,t0,MG);
  if(lvl>=2&&(i%4==0))noise(.12,.12,120,1,t0,0,'lowpass');if(lvl>=3&&i%2==1)noise(.04,.05,6000,1,t0,0,'highpass');
  mNext+=st;mStep++}}

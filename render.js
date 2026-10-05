const {createCanvas, GlobalFonts} = require('@napi-rs/canvas');
const {spawn, spawnSync} = require('child_process');
const fs = require('fs');
const path = require('path');
const ffmpeg = require('@ffmpeg-installer/ffmpeg').path;

const W=1280,H=720,FPS=30,DURATION=15,FRAMES=FPS*DURATION;
const C={ink:'#0b0b0d', paper:'#f2f0e8', orange:'#ff4b22', blue:'#5048ff', grey:'#232329'};
GlobalFonts.registerFromPath('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf','Display');
GlobalFonts.registerFromPath('/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf','Mono');
GlobalFonts.registerFromPath('/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf','Serif');
const canvas=createCanvas(W,H),ctx=canvas.getContext('2d');
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const ease=x=>{x=clamp(x);return 1-Math.pow(1-x,4)};
const smooth=x=>{x=clamp(x);return x*x*(3-2*x)};
const lerp=(a,b,t)=>a+(b-a)*t;
const rgba=(hex,a)=>{const n=parseInt(hex.slice(1),16);return `rgba(${n>>16},${(n>>8)&255},${n&255},${a})`};
function bg(c){ctx.fillStyle=c;ctx.fillRect(0,0,W,H)}
function text(s,x,y,size,color=C.paper,align='left',font='Display'){ctx.font=`${size}px ${font}`;ctx.textAlign=align;ctx.textBaseline='middle';ctx.fillStyle=color;ctx.fillText(s,x,y)}
function tracking(s,x,y,size,space,color=C.paper,align='left',font='Display'){
 ctx.font=`${size}px ${font}`;ctx.textBaseline='middle';ctx.fillStyle=color;
 const chars=[...s], widths=chars.map(ch=>ctx.measureText(ch).width), total=widths.reduce((a,b)=>a+b,0)+space*(chars.length-1);
 let xx=align==='center'?x-total/2:align==='right'?x-total:x;
 for(let i=0;i<chars.length;i++){ctx.fillText(chars[i],xx,y);xx+=widths[i]+space}
}
function meta(light=false,label='SHOWREEL / 2026'){
 const c=light?C.ink:C.paper;ctx.strokeStyle=rgba(c,.42);ctx.lineWidth=1;
 ctx.strokeRect(24,24,W-48,H-48);text('ROHAN RATHOD',42,43,11,c,'left','Mono');
 text(label,W/2,43,11,c,'center','Mono');text('15 SEC / 30 FPS',W-42,43,11,c,'right','Mono');
 ctx.fillStyle=C.orange;ctx.fillRect(24,24,30,3);ctx.fillRect(W-54,H-27,30,3);
}
function sceneCurve(t){
 bg(C.ink); meta(false,'MOTION SYSTEM / 01');
 const p=ease(t/1.75); text('EVERY MOVE HAS INTENT',W/2,112,17,C.paper,'center','Mono');
 const x=270,y=190,w=740,h=390;ctx.strokeStyle='#33333b';ctx.lineWidth=1;
 for(let i=0;i<=8;i++){ctx.beginPath();ctx.moveTo(x+i*w/8,y);ctx.lineTo(x+i*w/8,y+h);ctx.stroke()}
 for(let i=0;i<=5;i++){ctx.beginPath();ctx.moveTo(x,y+i*h/5);ctx.lineTo(x+w,y+i*h/5);ctx.stroke()}
 ctx.strokeStyle=C.orange;ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(x,y+h);ctx.bezierCurveTo(x+w*.18,y+h*.98,x+w*.62,y+h*.88,x+w,y);ctx.stroke();
 const q=smooth(p),px=lerp(x,x+w,q),py=y+h-(h*(q*q*(3-2*q)));
 for(const [nx,ny] of [[x,y+h],[px,py],[x+w,y]]){ctx.fillStyle=C.paper;ctx.fillRect(nx-6,ny-6,12,12);ctx.fillStyle=C.orange;ctx.fillRect(nx-3,ny-3,6,6)}
 text(`progress: ${p.toFixed(3)}  /  easing: cubic-bezier`,x,y+h+40,13,'#aaaab4','left','Mono');
}
function sceneMotion(t){
 bg(C.orange);meta(true,'KINETIC TYPE / 02');
 const p=ease(t/1.35);ctx.save();ctx.beginPath();ctx.rect(0,H*(1-p),W,H*p);ctx.clip();
 const scale=lerp(1.6,1,p);ctx.translate(W/2,H/2);ctx.scale(scale,scale);text('MOTION',0,0,154,C.ink,'center');ctx.restore();
 const off=lerp(500,0,ease((t-.2)/.8));text('DESIGNED TO',W/2-off,510,18,C.ink,'center','Mono');tracking('MOVE',W/2+off,553,18,10,C.ink,'center','Mono');
}
function sceneType(t){
 bg(C.ink);meta(false,'TYPE IN MOTION / 03');
 const words=['DESIGN','SYSTEMS','THAT MOVE'];
 words.forEach((w,i)=>{
  const p=ease((t-i*.25)/.75), yy=220+i*145;
  ctx.save();ctx.beginPath();ctx.rect(70,yy-62,W-140,124);ctx.clip();
  text(w,lerp(-500,82,p),yy,112,i===1?C.orange:C.paper,'left');ctx.restore();
 });
 ctx.strokeStyle=C.blue;ctx.lineWidth=8;ctx.beginPath();ctx.moveTo(75,625);ctx.lineTo(75+(W-150)*ease((t-.6)/.9),625);ctx.stroke();
}
function petal(x,y,s,rot,color){ctx.save();ctx.translate(x,y);ctx.rotate(rot);ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(s,0);ctx.arc(s,s,s,-Math.PI/2,Math.PI,true);ctx.closePath();ctx.fill();ctx.restore()}
function scenePattern(t){
 bg(C.paper);meta(true,'MODULAR GRID / 04');
 const size=72,cols=15,rows=7,ox=100,oy=105;
 for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){
  const i=r*cols+c, delay=(c+r)*.035, p=ease((t-delay)/.65), x=ox+c*size,y=oy+r*size;
  const palette=[C.orange,C.blue,C.ink,C.paper]; const color=palette[(i*7+r*3)%palette.length];
  ctx.save();ctx.translate(x+size/2,y+size/2);ctx.scale(p,p);ctx.rotate((1-p)*Math.PI/2);
  ctx.fillStyle=(i%5===0)?C.ink:'#d9d7d0';ctx.fillRect(-size/2+2,-size/2+2,size-4,size-4);
  petal(-size/2+2,-size/2+2,size-4,((i+r)%4)*Math.PI/2,color);ctx.restore();
 }
}
function sceneIso(t){
 bg(C.ink);meta(false,'FORM / DEPTH / 05');
 const p=ease(t/.9), tile=28;ctx.save();ctx.translate(W/2,165);ctx.transform(1,.5,-1,.5,0,0);
 for(let y=0;y<13;y++)for(let x=0;x<18;x++){
   const d=Math.hypot(x-8.5,y-6), wave=Math.sin(t*5-d*.8), h=clamp((p-d*.035))*22 + wave*5;
   const col=((x*3+y*5)%11<2)?C.orange:((x+y*2)%9<2)?C.blue:C.paper;
   ctx.fillStyle=rgba(col,.9);ctx.fillRect((x-9)*tile,(y-6)*tile-h,tile-3,tile-3);
 }
 ctx.restore();
 text('DIMENSION',W/2,625,19,C.paper,'center','Mono');
}
let seed=19; const rand=()=>((seed=(seed*1664525+1013904223)>>>0)/4294967296);
const particles=Array.from({length:850},()=>{const z=rand()*2-1,a=rand()*Math.PI*2,r=Math.sqrt(1-z*z);return {x:r*Math.cos(a),y:z,z:r*Math.sin(a),q:rand()}});
function sceneSphere(t){
 bg(C.ink);meta(false,'PARTICLE FIELD / 06');const p=ease(t/.65),ang=t*1.2;
 ctx.save();ctx.translate(W/2,H/2);
 const pts=particles.map(o=>{const xx=o.x*Math.cos(ang)-o.z*Math.sin(ang),zz=o.x*Math.sin(ang)+o.z*Math.cos(ang);return {...o,xx,zz}}).sort((a,b)=>a.zz-b.zz);
 for(const o of pts){const perspective=1+o.zz*.18, x=o.xx*220*p*perspective,y=o.y*220*p*perspective,sz=(1.2+o.q*2.8)*(1+o.zz*.35);ctx.fillStyle=o.q>.82?C.orange:o.q>.62?C.blue:rgba(C.paper,.82);ctx.beginPath();ctx.arc(x,y,sz,0,Math.PI*2);ctx.fill()}
 ctx.restore();text('IDEAS, IN ORBIT',W/2,635,16,C.paper,'center','Mono');
}
function sceneImpact(t){
 const cuts=[['RHYTHM',C.orange,C.ink],['COLOR',C.blue,C.paper],['IMPACT',C.paper,C.ink]];const ix=Math.min(2,Math.floor(t/.6)),local=(t-ix*.6)/.6,[word,b,c]=cuts[ix];bg(b);meta(b===C.paper,'THE CRAFT / 07');
 const p=ease(local/.38);ctx.save();ctx.translate(W/2,H/2);ctx.rotate((1-p)*-.07);ctx.scale(lerp(1.5,1,p),lerp(.3,1,p));text(word,0,0,150,c,'center');ctx.restore();
 for(let i=0;i<10;i++){ctx.fillStyle=c;ctx.fillRect((i*167+t*400)%W,610,70,4)}
}
function sceneEnd(t){
 bg(C.ink);meta(false,'AVAILABLE FOR WORK');const p=ease(t/.75);
 ctx.fillStyle=C.orange;ctx.fillRect(0,0,W,lerp(H,0,p));
 ctx.save();ctx.globalAlpha=p;text('ROHAN',W/2,286,154,C.paper,'center');tracking('RATHOD',W/2,415,102,18,C.paper,'center');
 ctx.strokeStyle=C.orange;ctx.lineWidth=9;ctx.beginPath();ctx.moveTo(300,500);ctx.lineTo(300+680*ease((t-.35)/.7),500);ctx.stroke();
 text('MOTION DESIGNER',W/2,555,23,C.paper,'center','Mono');text('EVERY FRAME HAS A JOB.',W/2,612,13,'#aaaab4','center','Mono');ctx.restore();
 const blink=Math.sin(t*8)>0;ctx.fillStyle=blink?C.orange:C.paper;ctx.beginPath();ctx.arc(1040,555,7,0,Math.PI*2);ctx.fill();
}
function render(f){
 const t=f/FPS;
 if(t<1.8)sceneCurve(t);else if(t<3.3)sceneMotion(t-1.8);else if(t<5.2)sceneType(t-3.3);else if(t<7.2)scenePattern(t-5.2);else if(t<9.2)sceneIso(t-7.2);else if(t<11.2)sceneSphere(t-9.2);else if(t<13.0)sceneImpact(t-11.2);else sceneEnd(t-13);
 // transition flash accents
 const boundaries=[1.8,3.3,5.2,7.2,9.2,11.2,13];for(const b of boundaries){const d=Math.abs(t-b);if(d<.045){ctx.fillStyle=rgba(C.paper,(.045-d)/.045*.4);ctx.fillRect(0,0,W,H)}}
}
function writeWav(file){
 const sr=48000,n=sr*DURATION,data=Buffer.alloc(n*2*2), bpm=128, beat=60/bpm;
 for(let i=0;i<n;i++){const t=i/sr, phase=t%beat, bar=Math.floor(t/beat);let v=0;
  // kick, click, sub and airy tonal pulses
  if(phase<.18)v+=Math.sin(2*Math.PI*(72-38*phase/.18)*phase)*Math.exp(-phase*24)*.55;
  const hphase=(t%(beat/2));if(hphase<.035)v+=(rand()*2-1)*Math.exp(-hphase*110)*.14;
  v+=Math.sin(2*Math.PI*(55+(bar%4)*9)*t)*Math.max(0,1-phase/beat)*.055;
  // risers before transitions
  for(const b of [1.8,3.3,5.2,7.2,9.2,11.2,13]){const d=b-t;if(d>0&&d<.35)v+=(rand()*2-1)*(.35-d)*.12}
  const env=Math.min(1,t*3, (DURATION-t)*2);v=Math.tanh(v*1.5)*env;
  const s=Math.max(-32767,Math.min(32767,Math.round(v*32767)));data.writeInt16LE(s,i*4);data.writeInt16LE(s,i*4+2);
 }
 const h=Buffer.alloc(44);h.write('RIFF');h.writeUInt32LE(36+data.length,4);h.write('WAVE',8);h.write('fmt ',12);h.writeUInt32LE(16,16);h.writeUInt16LE(1,20);h.writeUInt16LE(2,22);h.writeUInt32LE(sr,24);h.writeUInt32LE(sr*4,28);h.writeUInt16LE(4,32);h.writeUInt16LE(16,34);h.write('data',36);h.writeUInt32LE(data.length,40);fs.writeFileSync(file,Buffer.concat([h,data]));
}
async function main(){
 const out=process.argv[2]||'showreel.mp4', wav='.soundtrack.wav';writeWav(wav);
 const args=['-y','-f','rawvideo','-pix_fmt','rgba','-s',`${W}x${H}`,'-r',String(FPS),'-i','-','-i',wav,'-c:v','libx264','-preset','medium','-crf','17','-pix_fmt','yuv420p','-c:a','aac','-b:a','192k','-t',String(DURATION),'-movflags','+faststart',out];
 const proc=spawn(ffmpeg,args,{stdio:['pipe','inherit','inherit']});
 for(let f=0;f<FRAMES;f++){render(f);const img=ctx.getImageData(0,0,W,H);if(!proc.stdin.write(Buffer.from(img.data.buffer)))await new Promise(r=>proc.stdin.once('drain',r));if(f%30===0)process.stdout.write(`\rRendering ${Math.round(f/FRAMES*100)}%`)}
 proc.stdin.end();await new Promise((res,rej)=>proc.on('close',c=>c===0?res():rej(new Error(`ffmpeg exit ${c}`))));fs.unlinkSync(wav);console.log(`\nCreated ${out}`);
}
main().catch(e=>{console.error(e);process.exit(1)});

(()=>{
  const reduced=matchMedia('(prefers-reduced-motion: reduce)'),hero=document.querySelector('.hero'),band=document.querySelector('.arc-stage'),cards=[...document.querySelectorAll('.arc-card')];
  let width=innerWidth,step=width*.263,offset=step*.33,last=0,raf=0,paused=false,visible=true,selected=-1;
  const scales=cards.map(()=>1),mod=(n,m)=>(n%m+m)%m;
  function position(){
    const cycle=step*cards.length;
    cards.forEach((card,i)=>{
      const x=mod(i*step-offset+step,cycle)-step,center=x+width*.115,n=(center-width*.5)/(width*.5),factor=.50+.36*n*n;
      card.style.setProperty('--card-x',`${x.toFixed(2)}px`);card.style.setProperty('--card-yaw',`${(-Math.max(-1.4,Math.min(1.4,n))*22).toFixed(2)}deg`);card.style.setProperty('--card-scale',scales[i].toFixed(4));card.style.setProperty('--curve-height',factor.toFixed(4));
      card.dataset.curve=n.toFixed(5);card.style.visibility=x>width+step?'hidden':'visible';card.classList.toggle('is-selected',selected===i);
      // Individual curved outlines also remain available when WebGL is unavailable.
      const outline=[];
      for(let j=0;j<=20;j++){const u=j/20,global=n+(u*2-1)*.23,f=.50+.36*global*global;outline.push(`${(u*100).toFixed(2)}% ${((1-f)*50).toFixed(2)}%`);}
      for(let j=20;j>=0;j--){const u=j/20,global=n+(u*2-1)*.23,f=.50+.36*global*global;outline.push(`${(u*100).toFixed(2)}% ${((1+f)*50).toFixed(2)}%`);}
      card.style.setProperty('--panel-outline',`polygon(${outline.join(',')})`);
    });
    band.dataset.speed=paused?'0':reduced.matches?'0':'175';band.dataset.offset=offset.toFixed(3);band.dataset.selected=String(selected);band.dataset.paused=String(paused);band.dataset.geometry='individual-curved-surfaces';
    document.dispatchEvent(new Event('hero-curve-frame'));
  }
  function tick(time){raf=0;if(!visible||document.hidden){last=0;return;}const dt=last?Math.min((time-last)/1000,.05):1/60;last=time;let scaling=false;scales.forEach((s,i)=>{const target=!reduced.matches&&i===selected?1.14:1;scales[i]=Math.abs(target-s)<.0005?target:s+(target-s)*(1-Math.exp(-dt*13));if(scales[i]!==target)scaling=true;});if(!paused&&!reduced.matches)offset=mod(offset+175*dt,step*cards.length);position();if((!paused&&!reduced.matches)||scaling)raf=requestAnimationFrame(tick);else last=0;}
  function start(){if(!raf&&visible&&!document.hidden)raf=requestAnimationFrame(tick);}
  function choose(e){const r=hero.getBoundingClientRect(),y=e.clientY-r.top;paused=y>r.height*.15&&y<r.height*.88;selected=-1;if(paused){selected=cards.findIndex(card=>{if(card.style.visibility==='hidden')return false;const c=card.getBoundingClientRect();const lx=(e.clientX-c.left)/c.width*2-1,ly=(e.clientY-c.top)/c.height*2-1,n=Number(card.dataset.curve)+lx*.23;return Math.abs(lx)<=1&&Math.abs(ly)<=.50+.36*n*n;});}position();start();}
  hero.addEventListener('pointermove',e=>{const r=hero.getBoundingClientRect();band.style.setProperty('--look-x',`${-(e.clientX/width-.5)*20}px`);band.style.setProperty('--look-y',`${-((e.clientY-r.top)/innerHeight-.5)*12}px`);choose(e);},{passive:true});hero.addEventListener('pointerleave',()=>{band.style.setProperty('--look-x','0px');band.style.setProperty('--look-y','0px');paused=false;selected=-1;position();start();});
  cards.forEach((card,i)=>{card.addEventListener('focus',()=>{paused=true;selected=i;position();start();});card.addEventListener('blur',()=>{paused=false;selected=-1;start();});});
  new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(!visible){cancelAnimationFrame(raf);raf=0;last=0;paused=false;selected=-1;}else start();}).observe(hero);
  addEventListener('resize',()=>{const f=offset/step;width=innerWidth;step=width*.263;offset=f*step;position();start();},{passive:true});document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(raf);raf=0;last=0;}else start();});reduced.addEventListener('change',()=>{cancelAnimationFrame(raf);raf=0;last=0;scales.fill(1);position();start();});position();start();
})();
(()=>{
  const section=document.querySelector('.trail-section'),area=section.querySelector('.trail-area'),images=[...area.querySelectorAll('.trail-photo')],reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const lerp=(a,b,t)=>a+(b-a)*t;
  let active=false,inside=false,raf=0,index=0,z=1,emitted=0,point={x:0,y:0},cached={x:0,y:0},last={x:0,y:0},timers=[];
  const running=new Map(),tones=new Map();
  function sampleTone(image){if(!image.naturalWidth)return;const canvas=document.createElement('canvas');canvas.width=canvas.height=24;const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(image,0,0,24,24);const pixels=ctx.getImageData(0,0,24,24).data,bins=new Map();
    for(let i=0;i<pixels.length;i+=4){const r=pixels[i],g=pixels[i+1],b=pixels[i+2],max=Math.max(r,g,b),min=Math.min(r,g,b),chroma=max-min;if(max<65||chroma<35)continue;const bucket=[r,g,b].map(c=>Math.floor(c/48)).join('-'),entry=bins.get(bucket)||{r:0,g:0,b:0,w:0},weight=chroma/255;entry.r+=r*weight;entry.g+=g*weight;entry.b+=b*weight;entry.w+=weight;bins.set(bucket,entry);}
    const dominant=[...bins.values()].sort((a,b)=>b.w-a.w)[0],rgb=dominant?[dominant.r,dominant.g,dominant.b].map(c=>Math.round(c/dominant.w)):[226,143,185];tones.set(image,rgb);image.dataset.tone=rgb.join(' ');
  }
  images.forEach(image=>{if(image.complete)sampleTone(image);else image.addEventListener('load',()=>sampleTone(image),{once:true});});
  function clear(){cancelAnimationFrame(raf);raf=0;timers.forEach(clearTimeout);timers=[];running.forEach(a=>a.cancel());running.clear();images.forEach(i=>{i.style.opacity='0';i.style.zIndex='1';});z=1;section.dataset.live='0';}
  function show(x,y,fromX,fromY){
    const image=images[index];index=(index+1)%images.length;
    running.get(image)?.cancel();image.style.zIndex=String(z++);
    const rgb=tones.get(image)||[226,143,185];section.style.setProperty('--ink-color',`rgb(${rgb.join(' ')})`);section.dataset.tone=rgb.join(' ');section.dataset.toneSource=image.getAttribute('src');
    const w=image.offsetWidth,h=image.offsetHeight,startX=fromX-w/2,startY=fromY-h/2,endX=x-w/2,endY=y-h/2,frames=[];
    // Reference timing: 0.9s exponential catch-up, hold 0.4s, then 1s fade and shrink.
    for(let t=0;t<=1400;t+=20){const s=t/1000,p=Math.min(s/.9,1),move=p===1?1:1-Math.pow(2,-10*p),exit=Math.max(0,Math.min(1,(s-.4))),scale=1-.8*(1-Math.pow(1-exit,5));frames.push({offset:t/1400,opacity:Math.pow(1-exit,2),transform:`translate3d(${lerp(startX,endX,move)}px,${lerp(startY,endY,move)}px,0) scale(${scale})`});}
    const animation=image.animate(frames,{duration:1400,fill:'none',easing:'linear'});running.set(image,animation);
    section.dataset.emitted=String(++emitted);section.dataset.live=String(running.size);
    animation.onfinish=()=>{if(running.get(image)===animation)running.delete(image);section.dataset.live=String(running.size);if(!running.size)z=1;};
  }
  function tick(){raf=0;if(!active||reduced.matches||document.hidden)return;
    cached.x=lerp(cached.x,point.x,.1);cached.y=lerp(cached.y,point.y,.1);
    if(Math.hypot(point.x-last.x,point.y-last.y)>100){show(point.x,point.y,cached.x,cached.y);last={...point};}
    if(Math.hypot(cached.x-point.x,cached.y-point.y)>.1)raf=requestAnimationFrame(tick);
  }
  function schedule(){if(!raf&&active&&!reduced.matches&&!document.hidden)raf=requestAnimationFrame(tick);}
  function presence(){const r=area.getBoundingClientRect(),hit=document.elementFromPoint(point.x+r.left,point.y+r.top),next=inside&&!!hit?.closest('.trail-section')&&!document.querySelector('dialog[open]')&&!document.hidden;
    if(!next&&active)clear();if(next&&!active){last={...point};cached={...point};}active=next;section.dataset.active=String(active);}
  area.addEventListener('pointerenter',e=>{const r=area.getBoundingClientRect();point={x:e.clientX-r.left,y:e.clientY-r.top};inside=true;presence();});
  area.addEventListener('pointermove',e=>{if(e.pointerType==='touch')return;const r=area.getBoundingClientRect();point={x:e.clientX-r.left,y:e.clientY-r.top};inside=true;if(!active)presence();schedule();},{passive:true});
  area.addEventListener('pointerleave',()=>{inside=false;presence();});
  addEventListener('scroll',()=>{inside=false;presence();},{passive:true});
  addEventListener('resize',()=>{inside=false;presence();},{passive:true});
  document.addEventListener('visibilitychange',()=>{if(document.hidden){active=false;clear();}});reduced.addEventListener('change',()=>{clear();active=false;});
  area.addEventListener('keydown',e=>{if(e.code==='Space'){e.preventDefault();if(reduced.matches)return;clear();images.forEach((_,i)=>timers.push(setTimeout(()=>show(area.clientWidth*(.24+i*.105),area.clientHeight*.5,area.clientWidth*(.18+i*.105),area.clientHeight*.5),i*110)));}if(e.key==='Escape')clear();});
  section.dataset.live='0';section.dataset.emitted='0';section.dataset.threshold='100';
})();
(()=>{
  const logo=document.querySelector('.wet-wordmark'),word=logo.querySelector('.wet-word'),base=logo.querySelector('.wet-base'),canvas=logo.querySelector('.wet-rain'),ctx=canvas.getContext('2d');
  let frame=0;
  function paintRain(){frame=0;const r=word.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,2);if(!r.width||!r.height)return;canvas.width=Math.round(r.width*dpr);canvas.height=Math.round(r.height*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,r.width,r.height);
    let seed=1834;const random=()=>{seed=(seed*16807)%2147483647;return (seed-1)/2147483646;};
    for(let i=0;i<210;i++){const x=random()*r.width,y=random()*r.height,size=1.2+Math.pow(random(),2)*6.5,rx=size*(.68+random()*.26),ry=size*(1.05+random()*.6);
      ctx.save();ctx.translate(x,y);ctx.rotate((random()-.5)*.32);ctx.scale(rx,ry);
      const drop=ctx.createRadialGradient(-.25,-.35,.1,0,0,1);drop.addColorStop(0,'rgba(221,245,255,.02)');drop.addColorStop(.65,'rgba(16,30,50,.14)');drop.addColorStop(.88,'rgba(9,17,31,.4)');drop.addColorStop(1,'rgba(223,247,255,.3)');ctx.fillStyle=drop;ctx.beginPath();ctx.arc(0,0,1,0,Math.PI*2);ctx.fill();ctx.lineWidth=.13;ctx.strokeStyle='rgba(230,250,255,.55)';ctx.beginPath();ctx.arc(-.08,-.04,.79,3.55,5.35);ctx.stroke();ctx.strokeStyle='rgba(205,232,255,.23)';ctx.lineWidth=.11;ctx.beginPath();ctx.arc(.04,.04,.85,.4,1.35);ctx.stroke();ctx.restore();
      if(i%23===0){ctx.strokeStyle='rgba(202,225,245,.11)';ctx.lineWidth=.65;ctx.beginPath();ctx.moveTo(x,y+ry);ctx.bezierCurveTo(x+1,y+16,x-1,y+30,x,y+38+random()*24);ctx.stroke();}
    }
    // Mask droplets to the actual type, keeping the glass treatment inside the word.
    const style=getComputedStyle(base);ctx.globalCompositeOperation='destination-in';ctx.fillStyle='#fff';ctx.font=`${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;ctx.letterSpacing=style.letterSpacing;
    const brand=base.textContent.trim(),metrics=ctx.measureText(brand),ascent=metrics.fontBoundingBoxAscent||metrics.actualBoundingBoxAscent,descent=metrics.fontBoundingBoxDescent||metrics.actualBoundingBoxDescent;ctx.textBaseline='alphabetic';ctx.fillText(brand,0,(r.height-ascent-descent)/2+ascent);ctx.globalCompositeOperation='source-over';logo.dataset.drops='210';
  }
  function schedule(){if(!frame)frame=requestAnimationFrame(paintRain);}
  logo.addEventListener('pointermove',e=>{const r=word.getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top;word.style.setProperty('--wet-x',`${x}px`);word.style.setProperty('--wet-y',`${y}px`);word.style.setProperty('--wet-angle',`${35+x/r.width*140}deg`);word.style.setProperty('--wet-active','1');logo.dataset.prismatic='true';},{passive:true});
  logo.addEventListener('pointerleave',()=>{word.style.setProperty('--wet-active','0');logo.dataset.prismatic='false';});
  new ResizeObserver(schedule).observe(word);document.fonts.ready.then(schedule);schedule();
})();

(()=>{
  const reduced=matchMedia('(prefers-reduced-motion: reduce)'),hero=document.querySelector('.hero'),band=document.querySelector('.arc-stage'),cards=[...document.querySelectorAll('.arc-card')];
  let width=innerWidth,step=width*.316,offset=step*.33,last=0,raf=0,paused=false,visible=true,selected=-1;
  const scales=cards.map(()=>1),mod=(n,m)=>(n%m+m)%m;
  function position(){const cycle=step*cards.length;cards.forEach((card,i)=>{const x=mod(i*step-offset+step,cycle)-step,center=x+width*.125,n=(center-width*.5)/(width*.5);card.style.setProperty('--card-x',`${x.toFixed(2)}px`);card.style.setProperty('--card-y',`${(-Math.min(n*n,2)*58).toFixed(2)}px`);card.style.setProperty('--card-yaw',`${(-Math.max(-1.4,Math.min(1.4,n))*24).toFixed(2)}deg`);card.style.setProperty('--card-scale',scales[i].toFixed(4));card.style.visibility=x>width+step?'hidden':'visible';card.classList.toggle('is-selected',selected===i);});band.dataset.speed=paused?'0':reduced.matches?'0':'175';band.dataset.offset=offset.toFixed(3);band.dataset.selected=String(selected);band.dataset.paused=String(paused);}
  function tick(time){raf=0;if(!visible||document.hidden){last=0;return;}const dt=last?Math.min((time-last)/1000,.05):1/60;last=time;let scaling=false;scales.forEach((s,i)=>{const target=!reduced.matches&&i===selected?1.14:1;scales[i]=Math.abs(target-s)<.0005?target:s+(target-s)*(1-Math.exp(-dt*13));if(scales[i]!==target)scaling=true;});if(!paused&&!reduced.matches)offset=mod(offset+175*dt,step*cards.length);position();if((!paused&&!reduced.matches)||scaling)raf=requestAnimationFrame(tick);else last=0;}
  function start(){if(!raf&&visible&&!document.hidden)raf=requestAnimationFrame(tick);}
  function choose(e){const r=hero.getBoundingClientRect(),y=e.clientY-r.top;paused=y>r.height*.15&&y<r.height*.88;selected=-1;if(paused){selected=cards.findIndex(card=>{if(card.style.visibility==='hidden')return false;const c=card.getBoundingClientRect();return e.clientX>=c.left&&e.clientX<=c.right&&e.clientY>=c.top&&e.clientY<=c.bottom;});}position();start();}
  hero.addEventListener('pointermove',choose,{passive:true});hero.addEventListener('pointerleave',()=>{paused=false;selected=-1;position();start();});
  cards.forEach((card,i)=>{card.addEventListener('focus',()=>{paused=true;selected=i;position();start();});card.addEventListener('blur',()=>{paused=false;selected=-1;start();});});
  new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(!visible){cancelAnimationFrame(raf);raf=0;last=0;paused=false;selected=-1;}else start();}).observe(hero);
  addEventListener('resize',()=>{const f=offset/step;width=innerWidth;step=width*.316;offset=f*step;position();start();},{passive:true});document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(raf);raf=0;last=0;}else start();});reduced.addEventListener('change',()=>{cancelAnimationFrame(raf);raf=0;last=0;scales.fill(1);position();start();});position();start();
})();
(()=>{
  const section=document.querySelector('.trail-section'),area=section.querySelector('.trail-area'),images=[...area.querySelectorAll('.trail-photo')],reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const lerp=(a,b,t)=>a+(b-a)*t;
  let active=false,inside=false,raf=0,index=0,z=1,emitted=0,point={x:0,y:0},cached={x:0,y:0},last={x:0,y:0},timers=[];
  const running=new Map();
  function clear(){cancelAnimationFrame(raf);raf=0;timers.forEach(clearTimeout);timers=[];running.forEach(a=>a.cancel());running.clear();images.forEach(i=>{i.style.opacity='0';i.style.zIndex='1';});z=1;section.dataset.live='0';}
  function show(x,y,fromX,fromY){
    const image=images[index];index=(index+1)%images.length;
    running.get(image)?.cancel();image.style.zIndex=String(z++);
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

(()=>{
  const reduced=matchMedia('(prefers-reduced-motion: reduce)'),hero=document.querySelector('.hero'),band=document.querySelector('.arc-stage'),cards=[...document.querySelectorAll('.arc-card')];
  let width=innerWidth,step=width*.303,offset=step*.4,last=0,raf=0,hover=false,visible=true,speed=104;
  function position(){const cycle=step*cards.length;cards.forEach((card,i)=>{const x=((i*step-offset+step)%cycle+cycle)%cycle-step,center=x+width*.145,n=(center-width*.5)/(width*.5);card.style.setProperty('--card-x',`${x.toFixed(2)}px`);card.style.setProperty('--card-y',`${(-Math.min(n*n,2)*16).toFixed(2)}px`);card.style.setProperty('--card-z',`${(-Math.min(n*n,2)*38).toFixed(2)}px`);card.style.setProperty('--card-yaw',`${(-n*10).toFixed(2)}deg`);card.style.visibility=(x>width+step||x<-step)?'hidden':'visible';});band.dataset.speed=speed.toFixed(2);band.dataset.offset=offset.toFixed(2);}
  function tick(time){raf=0;if(!visible||document.hidden||reduced.matches){last=0;return;}const dt=last?Math.min((time-last)/1000,.05):0;last=time;const desired=hover?19:104;speed+=Math.sign(desired-speed)*Math.min(Math.abs(desired-speed),dt*180);offset=(offset+speed*dt)%(step*cards.length);position();raf=requestAnimationFrame(tick);}
  function start(){if(!raf&&visible&&!document.hidden&&!reduced.matches)raf=requestAnimationFrame(tick);}
  // The title is visually above the gallery; the entire gallery band still slows beneath it.
  hero.addEventListener('pointermove',e=>{const r=hero.getBoundingClientRect();hover=e.clientY-r.top>r.height*.23&&e.clientY-r.top<r.height*.81;},{passive:true});hero.addEventListener('pointerleave',()=>hover=false);
  new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(!visible){cancelAnimationFrame(raf);raf=0;last=0;}else start();}).observe(hero);
  addEventListener('resize',()=>{const fraction=offset/step;width=innerWidth;step=width*.303;offset=fraction*step;position();},{passive:true});document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(raf);raf=0;last=0;}else start();});reduced.addEventListener('change',()=>{cancelAnimationFrame(raf);raf=0;last=0;position();start();});position();start();
})();
(()=>{
  const viewport=document.querySelector('.block-viewport'),board=document.querySelector('.block-board'),fallback=board.querySelector('img'),reset=document.querySelector('.reset-blocks'),reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const cols=18,rows=10,blocks=[],occupied=Array.from({length:rows},()=>Array(cols).fill(false));let W=1,H=1,unit=1,raf=0,last=0,visible=false,pointer=null,keyMode=false;
  const random=n=>{const x=Math.sin(n*127.1+311.7)*43758.5453;return x-Math.floor(x);};
  for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){
    if(occupied[y][x])continue;const seed=x+y*cols,choice=random(seed);let w=1,h=1;
    if(choice>.62&&x+1<cols&&!occupied[y][x+1])w=2;else if(choice>.31&&y+1<rows&&!occupied[y+1][x])h=2;
    for(let yy=y;yy<y+h;yy++)for(let xx=x;xx<x+w;xx++)occupied[yy][xx]=true;
    const el=document.createElement('div');el.className='inspiration-block';el.dataset.shape=w===h?'cube':'cuboid';
    for(const name of ['front','back','left','right','top','bottom-face']){const face=document.createElement('span');face.className=`block-face block-${name}`;if(name==='back'&&seed%5===0)face.textContent='✳';el.append(face);}board.append(el);
    blocks.push({el,x,y,w,h,seed,depth:0,value:0,velocity:0,target:0,release:0});
  }
  function layout(){W=board.clientWidth;H=board.clientHeight;unit=W/cols;const ar=fallback.naturalWidth/fallback.naturalHeight||1.5,bw=Math.max(W,H*ar),bh=bw/ar,ox=(W-bw)/2,oy=(H-bh)/2;
    blocks.forEach(b=>{const {el,x,y,w,h}=b,bw0=w*unit-1.2,bh0=h*unit-1.2,d=w===1&&h===1?unit-1.2:unit*(.55+random(b.seed+1)*.3);b.depth=d;Object.assign(el.style,{left:`${x*unit}px`,top:`${y*unit}px`,width:`${bw0}px`,height:`${bh0}px`});const [front,back,left,right,top,bottom]=el.children;
      front.style.transform=`translateZ(${d/2}px)`;front.style.backgroundSize=`${bw}px ${bh}px`;front.style.backgroundPosition=`${ox-x*unit}px ${oy-y*unit}px`;back.style.transform=`rotateY(180deg) translateZ(${d/2}px)`;
      for(const side of [left,right])Object.assign(side.style,{width:`${d}px`,height:`${bh0}px`,top:'0',left:`${(bw0-d)/2}px`});left.style.transform=`rotateY(-90deg) translateZ(${bw0/2}px)`;right.style.transform=`rotateY(90deg) translateZ(${bw0/2}px)`;
      for(const side of [top,bottom])Object.assign(side.style,{width:`${bw0}px`,height:`${d}px`,left:'0',top:`${(bh0-d)/2}px`});top.style.transform=`rotateX(90deg) translateZ(${bh0/2}px)`;bottom.style.transform=`rotateX(-90deg) translateZ(${bh0/2}px)`;paintBlock(b);
    });board.classList.add('is-built');viewport.dataset.blocks=blocks.length;viewport.dataset.cubes=blocks.filter(b=>b.w===b.h).length;viewport.dataset.cuboids=blocks.filter(b=>b.w!==b.h).length;
  }
  function paintBlock(b){const a=b.value,s1=random(b.seed+7)*2-1,s2=random(b.seed+19)*2-1,dx=(b.x+b.w/2-cols/2)*unit*.10*a,dy=(b.y+b.h/2-rows/2)*unit*.15*a,z=(68+random(b.seed+23)*125)*a-b.depth/2,rx=(s1>0?1:-1)*(48+Math.abs(s1)*70)*a,ry=s2*155*a,rz=s1*22*a;b.el.style.transform=`translate3d(${dx.toFixed(2)}px,${dy.toFixed(2)}px,${z.toFixed(2)}px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg) rotateZ(${rz.toFixed(2)}deg)`;}
  function tick(time){raf=0;const dt=last?Math.min((time-last)/1000,.035):1/60;last=time;let moving=false,active=0,peak=0;
    blocks.forEach(b=>{let aim=0;if(pointer&&!reduced.matches){const dx=(b.x+b.w/2)*unit-pointer.x,dy=(b.y+b.h/2)*unit-pointer.y,distance=Math.hypot(dx,dy),radius=unit*3.6;aim=Math.max(0,1-distance/radius);aim=aim*aim*(3-2*aim);if(aim>.02){b.release=time+200+random(b.seed)*220;b.target=Math.max(aim,b.target*.99);}}if(!pointer||time>b.release)b.target=aim;if(keyMode)b.target=.32+random(b.seed)*.68;
      const acceleration=(b.target-b.value)*64-b.velocity*15;b.velocity+=acceleration*dt;b.value+=b.velocity*dt;
      if(Math.abs(b.value-b.target)<.0005&&Math.abs(b.velocity)<.001){b.value=b.target;b.velocity=0;}else moving=true;
      if(b.value>.025)active++;peak=Math.max(peak,b.value);paintBlock(b);
    });viewport.dataset.active=active;viewport.dataset.peak=peak.toFixed(4);if(visible&&!document.hidden&&(moving||pointer||keyMode)&&!reduced.matches)raf=requestAnimationFrame(tick);else last=0;
  }
  function schedule(){if(!raf&&visible&&!document.hidden)raf=requestAnimationFrame(tick);}
  viewport.addEventListener('pointermove',e=>{const r=board.getBoundingClientRect(),v=viewport.getBoundingClientRect();pointer={x:e.clientX-r.left,y:e.clientY-r.top};viewport.style.setProperty('--cursor-x',`${e.clientX-v.left}px`);viewport.style.setProperty('--cursor-y',`${e.clientY-v.top}px`);keyMode=false;schedule();},{passive:true});
  function restore(){pointer=null;keyMode=false;blocks.forEach(b=>{b.target=0;b.release=0;});schedule();}viewport.addEventListener('pointerleave',restore);reset.addEventListener('click',restore);
  viewport.addEventListener('keydown',e=>{if(e.code==='Space'){e.preventDefault();keyMode=!keyMode;pointer=null;schedule();}if(e.key==='Escape')restore();});viewport.addEventListener('blur',restore);
  new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible)schedule();else{cancelAnimationFrame(raf);raf=0;last=0;pointer=null;keyMode=false;blocks.forEach(b=>{b.value=b.target=b.velocity=0;paintBlock(b);});viewport.dataset.active=0;}}).observe(viewport);
  addEventListener('scroll',()=>{if(visible){const r=viewport.getBoundingClientRect();board.style.setProperty('--board-y',`${reduced.matches?0:Math.max(-24,Math.min(24,(r.top+r.height/2-innerHeight/2)*-.045))}px`);}},{passive:true});
  new ResizeObserver(layout).observe(board);if(fallback.complete)layout();else fallback.addEventListener('load',layout,{once:true});reduced.addEventListener('change',()=>{restore();if(reduced.matches){blocks.forEach(b=>{b.value=b.velocity=0;paintBlock(b);});viewport.dataset.active=0;}});document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(raf);raf=0;last=0;}else schedule();});
})();

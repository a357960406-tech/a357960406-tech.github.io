(()=>{
  const canvas=document.querySelector('.color-cursor-trail'),ctx=canvas?.getContext('2d',{alpha:true});
  if(!ctx)return;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)'),fine=matchMedia('(hover:hover) and (pointer:fine)'),works=document.querySelector('.works');
  const life=1200,maxPoints=80;let points=[],head=null,target=null,raf=0,lastTime=0,lastMove=0,hue=305,pathLength=0,width=innerWidth,height=innerHeight;
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  function clear(){cancelAnimationFrame(raf);raf=0;points=[];head=target=null;lastTime=0;ctx.clearRect(0,0,width,height);canvas.dataset.active='false';canvas.dataset.points='0';canvas.dataset.running='false';}
  function resize(){clear();width=innerWidth;height=innerHeight;const dpr=Math.min(devicePixelRatio||1,1.5,Math.sqrt(2200000/(width*height)));canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);}
  function allowed(element){
    if(document.hidden||reduced.matches||!fine.matches||document.querySelector('dialog[open]'))return false;
    return !!element?.closest?.('.cinematic,.outro-layer')||!!(element?.closest?.('.horizontal-works')&&Number(works.dataset.zoom)>.6);
  }
  function schedule(){if(!raf){canvas.dataset.running='true';raf=requestAnimationFrame(draw);}}
  function color(h,a){return `hsla(${h},92%,64%,${a})`;}
  function draw(now){
    raf=0;const dt=lastTime?clamp((now-lastTime)/16.667,.3,2.5):1;lastTime=now;
    if(document.hidden||reduced.matches||!fine.matches||document.querySelector('dialog[open]')){clear();return;}
    ctx.clearRect(0,0,width,height);
    if(target&&head&&now-lastMove<160){
      const dx=target.x-head.x,dy=target.y-head.y,d=Math.hypot(dx,dy),t=1-Math.pow(.61,dt);
      if(d>.65){head.x+=dx*t;head.y+=dy*t;pathLength+=d*t;hue=305+pathLength*.095;points.push({x:head.x,y:head.y,time:now,hue,width:clamp(9+d*.12,9,22)});}
    }
    points=points.filter(p=>now-p.time<life).slice(-maxPoints);
    // Midpoint quadratic segments keep the layered ribbons continuous through sharp turns.
    for(let lane=2;lane>=0;lane--){
      const lag=lane*2,list=points.slice(0,Math.max(0,points.length-lag));
      for(let i=1;i<list.length-1;i++){
        const p=list[i],a=list[i-1],b=list[i+1],age=clamp((now-p.time)/life,0,1),fade=Math.pow(1-age,1.6);
        const dx=b.x-a.x,dy=b.y-a.y,n=Math.max(1,Math.hypot(dx,dy)),offset=(lane-1)*6*fade,ox=-dy/n*offset,oy=dx/n*offset;
        const sx=(a.x+p.x)*.5+ox,sy=(a.y+p.y)*.5+oy,ex=(p.x+b.x)*.5+ox,ey=(p.y+b.y)*.5+oy;
        const h=p.hue+lane*48;
        ctx.lineCap=ctx.lineJoin='round';
        ctx.beginPath();ctx.moveTo(sx,sy);ctx.quadraticCurveTo(p.x+ox,p.y+oy,ex,ey);
        ctx.lineWidth=(p.width+24)*fade;ctx.strokeStyle=color(h,.08*fade);ctx.stroke();
        const gradient=ctx.createLinearGradient(sx,sy,ex===sx?ex+.01:ex,ey);gradient.addColorStop(0,color(a.hue+lane*48,.76*fade));gradient.addColorStop(1,color(b.hue+lane*48,.9*fade));
        ctx.lineWidth=Math.max(.2,p.width*fade*.8);ctx.strokeStyle=gradient;ctx.stroke();
      }
    }
    canvas.dataset.points=String(points.length);canvas.dataset.active=points.length?'true':'false';
    if(points.length||(target&&head&&now-lastMove<160))schedule();else{canvas.dataset.running='false';lastTime=0;}
  }
  addEventListener('pointermove',e=>{
    if(e.pointerType==='touch'||!allowed(e.target)){if(points.length||target)clear();return;}
    const now=performance.now(),next={x:e.clientX,y:e.clientY};
    if(!head||!target||Math.hypot(next.x-target.x,next.y-target.y)>260){points=[];head={...next};}
    target=next;lastMove=now;canvas.dataset.zone=e.target.closest('.cinematic')?'portrait':e.target.closest('.outro-layer')?'outro':'expanded';schedule();
  },{passive:true});
  addEventListener('scroll',clear,{passive:true});addEventListener('resize',resize,{passive:true});
  document.documentElement.addEventListener('pointerleave',clear);addEventListener('blur',clear);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)clear();});
  document.querySelectorAll('dialog').forEach(dialog=>new MutationObserver(()=>{if(dialog.open)clear();}).observe(dialog,{attributes:true,attributeFilter:['open']}));
  reduced.addEventListener('change',clear);fine.addEventListener('change',clear);resize();
})();

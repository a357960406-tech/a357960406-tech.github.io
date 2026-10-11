(() => {
  const items={
    architecture:{title:'建筑之美',category:'ARCHITECTURE',description:'线条、光影与留白，让熟悉的空间拥有新的视角。'},
    'night-sky':{title:'霓虹巷口',category:'PHOTOGRAPHY',description:'沿着光线走进夜色，寻找城市里不一样的视角。'},
    'neon-city':{title:'霓虹夜行',category:'PHOTOGRAPHY',description:'当城市慢下来，光与色彩开始讲述另一段故事。'},
    desert:{title:'荒野的形状',category:'NATURE',description:'起伏的沙丘，是自然写下的线条与色彩。'},
    geometry:{title:'几何秩序',category:'ARCHITECTURE',description:'在日常的建筑里，发现秩序、重复与意外的美。'},
    fashion:{title:'风格不定义',category:'STYLE',description:'跟随你的审美，寻找属于自己的色彩与表达。'},
    interior:{title:'理想的空间',category:'INTERIORS',description:'把喜欢的光线、材质和生活，放进一个理想的空间。'},
    'concrete-curves':{title:'建筑的弧线',category:'ARCHITECTURE',description:'让柔软的曲线，重新定义空间与天空的边界。'},
    'minimal-architecture':{title:'留白的艺术',category:'ARCHITECTURE',description:'光穿过弧形的建筑，在留白里发现形状。'},
    'still-life':{title:'物件之间',category:'OBJECTS',description:'从简单的器物与几何，找到日常里的美感。'},
    'ceramic-forms':{title:'光与器物',category:'OBJECTS',description:'细腻的材质与克制的色彩，组成新的灵感。'},
    'blue-alley':{title:'蓝色夜行',category:'PHOTOGRAPHY',description:'越过一道蓝色的门，走进夜色、光影与想象。'},
    'sculptural-vase':{title:'雕塑般的日常',category:'OBJECTS',description:'喜欢的轮廓与质感，让日常拥有更多可能。'}
  };
  const reduced=matchMedia('(prefers-reduced-motion: reduce)'),fine=matchMedia('(hover:hover) and (pointer:fine)');
  const hero=document.querySelector('.hero'),stage=document.querySelector('.space-stage'),field=document.querySelector('.space-field');
  const cards=Array.from(document.querySelectorAll('.space-card')),focused=document.querySelector('.focused-card');
  const collection=document.getElementById('collections'),boards=Array.from(document.querySelectorAll('.board'));
  const stories=document.querySelector('.stories'),storyCards=Array.from(document.querySelectorAll('.story-card'));
  const mood=document.querySelector('.moodboard'),tiles=Array.from(document.querySelectorAll('.mood-tile')),closing=document.querySelector('.closing');
  const toggle=document.querySelector('.motion-toggle'),dialog=document.getElementById('image-preview');
  const clamp=(value,min,max)=>Math.max(min,Math.min(max,value)),lerp=(a,b,t)=>a+(b-a)*t,ease=t=>t*t*(3-2*t);
  let width=stage.clientWidth,height=stage.clientHeight,mobile=width<=720,heroVisible=true;
  let paused=reduced.matches,raf=0,lastTime=0,time=0,scrollTarget=window.scrollY,smoothScroll=window.scrollY;
  let pointer={x:0,y:0},camera={x:0,y:0},active=null,leaveTimer=0,hideTimer=0,focusSerial=0;
  const sectionBounds=new Map();
  const grid=collection.querySelector('.board-grid'),portal=collection.querySelector('.portal-frame'),portalImage=portal.querySelector('img'),portalCopy=collection.querySelector('.portal-copy');
  let rail={end:0,run:0,zoom:0,hold:0,total:1,visible:[],source:null,sourceRect:null};
  function measureRail(){
    const visible=boards.filter(board=>!board.hidden),last=visible.at(-1);
    boards.forEach(board=>{board.style.opacity='1';board.querySelector('.board-photo').style.opacity='1';});
    portal.style.opacity='0';portalCopy.style.opacity='0';portalCopy.style.visibility='hidden';collection.classList.remove('is-portal');
    if(reduced.matches){collection.style.height='auto';rail={...rail,visible,source:null};return;}
    const end=last?Math.max(0,grid.offsetLeft+last.offsetLeft+last.offsetWidth/2-innerWidth/2):0;
    const run=end*1.12,zoom=last?innerHeight*1.05:0,hold=last?innerHeight*.65:0;
    collection.style.height=`${innerHeight+run+zoom+hold}px`;
    let sourceRect=null;
    if(last){
      const photo=last.querySelector('.board-photo'),r=photo.getBoundingClientRect(),g=grid.getBoundingClientRect();
      sourceRect={x:grid.offsetLeft+r.left-g.left-end,y:grid.offsetTop+r.top-g.top-30,width:r.width,height:r.height};
      portalImage.src=last.querySelector('img').src;
    }
    rail={end,run,zoom,hold,total:run+zoom+hold||1,visible,source:last,sourceRect};
    collection.dataset.railEnd=end.toFixed(1);collection.dataset.railRun=run.toFixed(1);collection.dataset.zoomRun=zoom.toFixed(1);
  }
  function measure(){
    width=stage.clientWidth;height=stage.clientHeight;mobile=width<=720;
    
    cards.forEach(card=>{const w=mobile?72:Number(card.dataset.w),h=w*Number(card.dataset.h)/Number(card.dataset.w);card.style.width=`${w}px`;card.style.height=`${h}px`;card.hidden=mobile&&card.dataset.mobile==='0';});
    window.DribbbleSpace?.resize();measureRail();
    [collection,stories,mood,closing].forEach(section=>sectionBounds.set(section,{top:section.getBoundingClientRect().top+window.scrollY,height:section.offsetHeight}));
    scrollTarget=window.scrollY;smoothScroll=window.scrollY;clearFocus();renderSpace();renderScroll();
  }
  // The immersive field uses physical textured planes; the enlarged view has its own isolated layer.
  function renderSpace(){
    const perspective=1350,heroProgress=clamp(smoothScroll/hero.offsetHeight,0,1);
    if(window.DribbbleSpace){
      window.DribbbleSpace.update(camera,heroProgress,time,active,reduced.matches);
      hero.style.setProperty('--copy-x',`${reduced.matches?0:-camera.x*20}px`);
      hero.style.setProperty('--copy-y',`${reduced.matches?0:-heroProgress*140-camera.y*14}px`);
      return;
    }
    cards.forEach(card=>{const w=mobile?72:Number(card.dataset.w);card.style.width=`${w}px`;card.style.height=`${w*Number(card.dataset.h)/Number(card.dataset.w)}px`;card.style.left='50%';card.style.top='50%';});
    const yaw=reduced.matches?0:camera.x*.23,pitch=reduced.matches?0:camera.y*.13;
    const cameraX=camera.x*(mobile?35:110),cameraY=camera.y*(mobile?25:60);
    cards.forEach((card,index)=>{
      if(card.hidden)return;
      const baseZ=Number(card.dataset.z)*(mobile?.72:1),initialProjection=perspective/(perspective-baseZ);
      const x0=Number(card.dataset[mobile?'mx':'x'])*width/initialProjection;
      const y0=Number(card.dataset[mobile?'my':'y'])*height/initialProjection;
      const wx=x0-cameraX,wy=y0-cameraY,wz=baseZ+heroProgress*(reduced.matches?0:160);
      const rx=wx*Math.cos(yaw)+wz*Math.sin(yaw),rz=-wx*Math.sin(yaw)+wz*Math.cos(yaw);
      const ry=wy*Math.cos(pitch)-rz*Math.sin(pitch),depth=wy*Math.sin(pitch)+rz*Math.cos(pitch);
      const projection=clamp(perspective/(perspective-depth),.42,1.4);
      const float=reduced.matches?0:Math.sin(time*.38+index*1.7)*(mobile?1.2:2.5);
      const x=rx*projection,y=ry*projection+float-heroProgress*(mobile?15:30)*(1+projection);
      const roll=Number(card.dataset.roll)+(reduced.matches?0:camera.x*1.5);
      card.style.transform=`translate3d(${x.toFixed(2)}px,${y.toFixed(2)}px,0) translate(-50%,-50%) rotateZ(${roll.toFixed(2)}deg) rotateY(${(-yaw*45).toFixed(2)}deg) scale(${projection.toFixed(4)})`;
      card.style.zIndex=String(Math.round((depth+2000)/16));
      card.style.setProperty('--depth-opacity',(clamp(.65+projection*.30,.72,1)*(active?.86:1)).toFixed(3));
      card.style.setProperty('--projected-scale',projection.toFixed(4));
    });
    hero.style.setProperty('--copy-x',`${reduced.matches?0:-camera.x*6}px`);
    hero.style.setProperty('--copy-y',`${reduced.matches?0:-heroProgress*42-camera.y*4}px`);
    stage.style.setProperty('--floor-y',`${reduced.matches?0:heroProgress*65}px`);
  }
  function sectionProgress(section){const b=sectionBounds.get(section);return clamp((smoothScroll-b.top)/Math.max(1,b.height-innerHeight),0,1);}
  function drawLines(section,progress){
    const paths=section.querySelectorAll('.flow-path'),bend=ease(progress),lift=110*Math.sin(progress*Math.PI);
    paths.forEach((path,i)=>{const y=290+i*135;path.setAttribute('d',`M -80 ${y+lift} C ${320+bend*90} ${y-210-lift},${800-bend*120} ${y+250},1520 ${y-60-lift}`);path.style.strokeDashoffset=String(-progress*480-i*12);});
  }
  function renderScroll(){
    const b=sectionBounds.get(collection),distance=clamp(smoothScroll-b.top,0,rail.total);
    const travel=reduced.matches?0:rail.run?clamp(distance/rail.run,0,1):1;
    const zoom=reduced.matches||!rail.source?0:clamp((distance-rail.run)/Math.max(1,rail.zoom),0,1),expand=ease(zoom);
    const cp=reduced.matches?0:distance/rail.total;
    collection.style.setProperty('--scroll-progress',cp.toFixed(4));
    collection.style.setProperty('--rail-x',`${reduced.matches?0:-rail.end*travel}px`);
    collection.style.setProperty('--title-shift',`${reduced.matches?0:-travel*55}px`);
    collection.style.setProperty('--row-shift',`${reduced.matches?0:(.5-travel)*60}px`);
    collection.style.setProperty('--rail-ui-opacity',String(1-ease(clamp(zoom*3,0,1))));
    collection.querySelector('.rail-counter').textContent=`${String(Math.max(1,Math.round(travel*(rail.visible.length-1))+1)).padStart(2,'0')} / ${String(rail.visible.length).padStart(2,'0')}`;
    boards.forEach(board=>{
      const r=board.getBoundingClientRect(),offset=clamp((innerWidth/2-r.left-r.width/2)/innerWidth,-1,1)*25;
      board.style.setProperty('--image-x',`${reduced.matches?0:offset}px`);
      board.style.setProperty('--image-y',`${reduced.matches?0:(travel-.5)*88}px`);
      board.style.opacity=zoom>0?String(1-clamp(zoom*3,0,1)):'1';
    });
    collection.classList.toggle('is-portal',zoom>.01);
    collection.dataset.phase=zoom>=.999?'fullscreen':zoom>0?'zoom':'horizontal';
    collection.dataset.railProgress=travel.toFixed(4);collection.dataset.zoomProgress=zoom.toFixed(4);
    if(zoom>0&&rail.sourceRect){
      const r=rail.sourceRect;
      portal.style.opacity='1';portal.style.left=`${lerp(r.x,0,expand)}px`;portal.style.top=`${lerp(r.y,0,expand)}px`;
      portal.style.width=`${lerp(r.width,innerWidth,expand)}px`;portal.style.height=`${lerp(r.height,innerHeight,expand)}px`;portal.style.borderRadius=`${13*(1-expand)}px`;
      portalImage.style.width=`${lerp(116,100,expand)}%`;portalImage.style.height=`${lerp(124,100,expand)}%`;
      portalImage.style.left=`${lerp(-8,0,expand)}%`;portalImage.style.top=`${lerp(-12,0,expand)}%`;
      portalImage.style.transform=`translateY(${44*(1-expand)}px) scale(${1+expand*.025})`;
      const reveal=ease(clamp((zoom-.62)/.38,0,1));
      portal.style.setProperty('--portal-shade',String(reveal));portalCopy.style.opacity=String(reveal);portalCopy.style.visibility=reveal>0?'visible':'hidden';
      portalCopy.style.setProperty('--portal-copy-y',`${(1-reveal)*45}px`);
      rail.source.querySelector('.board-photo').style.opacity='0';
    }else{
      portal.style.opacity='0';portalCopy.style.opacity='0';portalCopy.style.visibility='hidden';
      if(rail.source)rail.source.querySelector('.board-photo').style.opacity='1';
    }
    drawLines(collection,cp);
    const sp=reduced.matches?1:sectionProgress(stories),spread=ease(clamp(sp*1.5,0,1));
    stories.style.setProperty('--story-title-y',`${reduced.matches?0:(.5-sp)*100}px`);
    const gap=mobile?width*.265:Math.min(width*.287,425);
    storyCards.forEach((card,i)=>{
      const x=(i-1)*gap*lerp(.44,1,spread),y=reduced.matches?0:lerp([42,-10,55][i],[8,-15,8][i],spread)-(sp-.5)*(i===1?95:45);
      const rotate=lerp([-14,8,15][i],[-3,0,3][i],spread),scale=lerp(.86,1,spread);
      card.style.transform=`translate3d(${x.toFixed(2)}px,${y.toFixed(2)}px,0) rotate(${rotate.toFixed(2)}deg) scale(${scale.toFixed(3)})`;
      card.style.zIndex=i===1?'3':String(2-i);
      card.style.setProperty('--story-image-y',`${reduced.matches?0:(sp-.5)*(i===1?75:110)}px`);
    });
    drawLines(stories,sp);
    const mp=reduced.matches?1:sectionProgress(mood),assemble=ease(clamp((mp-.05)/.8,0,1));
    mood.style.setProperty('--mood-copy-y',`${reduced.matches?0:(.5-mp)*100}px`);
    mood.style.setProperty('--panel-y',`${reduced.matches?0:(.5-mp)*-150}px`);
    mood.style.setProperty('--panel-roll',`${reduced.matches?0:(1-assemble)*2.8}deg`);
    const offsets=[[-50,-28,-10],[8,25,9],[44,-22,15],[-31,22,8],[23,-27,-12],[45,35,-8]];
    tiles.forEach((tile,i)=>{const [x,y,r]=offsets[i],remain=1-assemble;tile.style.left=`${(i%3)*34.5}%`;tile.style.top=`${Math.floor(i/3)*53}%`;tile.style.transform=`translate3d(${x*remain}px,${y*remain}px,0) rotate(${r*remain}deg) scale(${lerp(.87,1,assemble)})`;tile.style.zIndex=String(i+1);});
    document.querySelectorAll('.mood-steps span').forEach((step,i)=>step.classList.toggle('is-current',i===Math.min(2,Math.floor(mp*3))));
    drawLines(mood,mp);
    const cb=sectionBounds.get(closing),closingProgress=clamp((smoothScroll-cb.top+innerHeight)/(innerHeight+cb.height),0,1);
    closing.style.setProperty('--closing-y',`${reduced.matches?0:(.5-closingProgress)*120}px`);
    const ambient=document.querySelectorAll('.ambient-lines path');
    ambient.forEach((path,i)=>{const drift=reduced.matches?0:smoothScroll*.045+camera.x*25,y=170+i*230;path.setAttribute('d',`M -100 ${y+drift} C ${420+drift} ${y-250},${1010-drift} ${y+390},1540 ${y-45-drift}`);});
  }
  function tick(now){
    const dt=lastTime?Math.min((now-lastTime)/1000,.05):0;lastTime=now;
    if(!paused&&!reduced.matches)time+=dt;
    camera.x+=(pointer.x-camera.x)*.045;camera.y+=(pointer.y-camera.y)*.045;
    smoothScroll=lerp(smoothScroll,scrollTarget,.12);
    if(heroVisible)renderSpace();renderScroll();raf=requestAnimationFrame(tick);
  }
  function syncToggle(){toggle.setAttribute('aria-pressed',String(paused));toggle.setAttribute('aria-label',paused?'播放空间动效':'暂停空间动效');toggle.querySelector('.motion-text').textContent=paused?'播放动效':'暂停动效';toggle.querySelector('.motion-symbol').textContent=paused?'▷':'Ⅱ';document.body.classList.toggle('motion-paused',paused);}
  toggle.addEventListener('click',()=>{paused=!paused;syncToggle();});
  function cancelLeave(){clearTimeout(leaveTimer);leaveTimer=0;}
  function clearFocus(){
    cancelLeave();focusSerial++;if(active)active.classList.remove('is-selected');active=null;field.classList.remove('has-focus');
    focused.classList.remove('is-open');focused.setAttribute('aria-hidden','true');
    focused.style.removeProperty('--tilt-x');focused.style.removeProperty('--tilt-y');
    document.dispatchEvent(new CustomEvent('Dribbble:blur'));
    clearTimeout(hideTimer);hideTimer=setTimeout(()=>{if(!active)focused.hidden=true;},220);
  }
  function scheduleLeave(){cancelLeave();leaveTimer=setTimeout(clearFocus,130);}
  function select(card){
    cancelLeave();clearTimeout(hideTimer);if(active===card)return;
    if(active)active.classList.remove('is-selected');active=card;active.classList.add('is-selected');field.classList.add('has-focus');
    const serial=++focusSerial,item=items[card.dataset.image],r=card.getBoundingClientRect(),s=stage.getBoundingClientRect();
    focused.hidden=false;focused.setAttribute('aria-hidden','false');focused.tabIndex=0;
    const targetWidth=focused.offsetWidth,targetHeight=focused.offsetHeight,sourceX=r.left+r.width/2-s.left,sourceY=r.top+r.height/2-s.top;
    const endX=clamp(sourceX,targetWidth/2+18,width-targetWidth/2-18),endY=clamp(sourceY,targetHeight/2+12,height-targetHeight/2-12);
    focused.style.transition='none';focused.classList.remove('is-open');
    focused.style.setProperty('--focus-start-x',`${sourceX}px`);focused.style.setProperty('--focus-start-y',`${sourceY}px`);focused.style.setProperty('--focus-start-scale',(r.width/targetWidth).toFixed(4));
    focused.style.setProperty('--focus-end-x',`${endX}px`);focused.style.setProperty('--focus-end-y',`${endY}px`);
    focused.style.removeProperty('--tilt-x');focused.style.removeProperty('--tilt-y');
    const image=focused.querySelector('img');image.src=`assets/${card.dataset.image}.jpg`;image.alt=item.title;
    focused.querySelector('.focus-title').textContent=item.title;focused.setAttribute('aria-label',`打开${item.title}图片预览`);
    void focused.offsetWidth;focused.style.transition='';
    requestAnimationFrame(()=>{if(serial===focusSerial)focused.classList.add('is-open');});
    document.dispatchEvent(new CustomEvent('Dribbble:focus',{detail:{src:image.src,mode:card.dataset.image==='desert'?1:card.dataset.image.includes('neon')||card.dataset.image==='night-sky'?2:0}}));
  }
  stage.addEventListener('pointermove',event=>{
    if(!fine.matches||event.pointerType==='touch')return;
    const r=stage.getBoundingClientRect();pointer={x:clamp((event.clientX-r.left)/r.width-.5,-.6,.6),y:clamp((event.clientY-r.top)/r.height-.5,-.6,.6)};
    if(event.target.closest('.focused-card')){cancelLeave();return;}
    if(event.target.closest('.hero-copy a,.motion-toggle'))return;
    const card=document.body.classList.contains('scene-ready')?window.DribbbleSpace?.pick(event.clientX,event.clientY):event.target.closest('.space-card');
    if(card)select(card);else if(active&&!focused.matches(':hover'))scheduleLeave();
  },{passive:true});
  stage.addEventListener('click',event=>{
    if(event.target.closest('a,button,.focused-card'))return;
    const card=window.DribbbleSpace?.pick(event.clientX,event.clientY);if(!card)return;
    if(fine.matches)openPreview(card.dataset.image);else select(card);
  });
  stage.addEventListener('pointerleave',()=>{pointer={x:0,y:0};clearFocus();});
  cards.forEach(card=>{
    card.addEventListener('pointerenter',event=>{if(fine.matches&&event.pointerType!=='touch')select(card);});
    card.addEventListener('focus',()=>{if(card.matches(':focus-visible'))select(card);});
    card.addEventListener('blur',()=>{if(!focused.contains(document.activeElement))scheduleLeave();});
    card.addEventListener('click',event=>{if(!fine.matches||event.pointerType==='touch'){select(card);return;}openPreview(card.dataset.image);});
  });
  focused.addEventListener('pointerenter',cancelLeave);focused.addEventListener('pointerleave',scheduleLeave);
  focused.addEventListener('pointermove',event=>{if(reduced.matches)return;const r=focused.getBoundingClientRect();focused.style.setProperty('--tilt-x',`${clamp(-((event.clientY-r.top)/r.height-.5)*9,-4.5,4.5)}deg`);focused.style.setProperty('--tilt-y',`${clamp(((event.clientX-r.left)/r.width-.5)*11,-5.5,5.5)}deg`);});
  focused.addEventListener('click',()=>{if(active)openPreview(active.dataset.image);});
  document.addEventListener('pointerdown',event=>{if(active&&!event.target.closest('.space-card,.focused-card,.space-stage'))clearFocus();});
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!dialog.open)clearFocus();});
  reduced.addEventListener('change',()=>{paused=reduced.matches;pointer={x:0,y:0};camera={x:0,y:0};syncToggle();measure();});
  const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.target===hero){heroVisible=entry.isIntersecting;if(!heroVisible)clearFocus();}}));observer.observe(hero);
  window.addEventListener('scroll',()=>{scrollTarget=window.scrollY;},{passive:true});window.addEventListener('resize',measure,{passive:true});
  document.addEventListener('visibilitychange',()=>{cancelAnimationFrame(raf);raf=0;if(!document.hidden){lastTime=0;raf=requestAnimationFrame(tick);}});
  boards.forEach(board=>board.addEventListener('pointermove',event=>{if(!fine.matches||reduced.matches)return;const r=board.getBoundingClientRect();board.style.setProperty('--glass-x',`${(event.clientX-r.left)/r.width*100}%`);board.style.setProperty('--glass-y',`${(event.clientY-r.top)/r.height*100}%`);},{passive:true}));
  boards.forEach(board=>board.addEventListener('focus',()=>{
    if(reduced.matches||!board.matches(':focus-visible'))return;
    const index=rail.visible.indexOf(board);if(index<0)return;
    const target=clamp(grid.offsetLeft+board.offsetLeft+board.offsetWidth/2-innerWidth/2,0,rail.end);
    window.scrollTo({top:sectionBounds.get(collection).top+(rail.end?target/rail.end*rail.run:0),behavior:'instant'});
  }));
  let currentImage='';const saved=new Set(),saveButton=document.getElementById('save-image'),message=dialog.querySelector('.saved-message');
  function openPreview(name){const item=items[name];if(!item)return;currentImage=name;clearFocus();dialog.querySelector('.preview-image').src=`assets/${name}.jpg`;dialog.querySelector('.preview-image').alt=item.title;document.getElementById('preview-title').textContent=item.title;document.getElementById('preview-category').textContent=item.category;document.getElementById('preview-description').textContent=item.description;saveButton.textContent=saved.has(name)?'已收藏 ✓':'收藏这份灵感 ＋';message.textContent='';dialog.showModal();}
  document.querySelectorAll('[data-image]:not(.space-card)').forEach(element=>element.addEventListener('click',()=>openPreview(element.dataset.image)));
  dialog.querySelector('.close-preview').addEventListener('click',()=>dialog.close());dialog.addEventListener('click',event=>{const r=dialog.getBoundingClientRect();if(event.target===dialog&&(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom))dialog.close();});
  saveButton.addEventListener('click',()=>{saved.add(currentImage);saveButton.textContent='已收藏 ✓';message.textContent='已收藏到本次预览';});
  const chips=Array.from(document.querySelectorAll('.chips button')),search=document.getElementById('search-input');let filter='all';
  function filterBoards(){const query=search.value.trim().toLowerCase();let count=0;boards.forEach(board=>{const visible=(filter==='all'||board.dataset.category===filter)&&(!query||board.dataset.keywords.includes(query)||board.textContent.toLowerCase().includes(query));board.hidden=!visible;if(visible)count++;});document.querySelector('.empty').hidden=Boolean(count);document.querySelector('.collection-status').textContent=query?`“${search.value.trim()}” · ${count} 个灵感集`:'';measure();}
  chips.forEach(chip=>chip.addEventListener('click',()=>{filter=chip.dataset.filter;chips.forEach(c=>c.setAttribute('aria-pressed',String(c===chip)));filterBoards();}));search.addEventListener('input',filterBoards);
  document.querySelector('.search').addEventListener('submit',event=>{event.preventDefault();collection.scrollIntoView({behavior:reduced.matches?'instant':'smooth'});});
  const closingInner=document.createElement('div');closingInner.className='closing-inner';while(closing.firstChild)closingInner.append(closing.firstChild);closing.append(closingInner);
  measure();syncToggle();field.classList.add('ready');raf=requestAnimationFrame(tick);
})();

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
  const mood=document.querySelector('.moodboard'),tiles=Array.from(document.querySelectorAll('.mood-tile')),closing=document.querySelector('.closing');
  const dialog=document.getElementById('image-preview');
  const clamp=(value,min=0,max=1)=>Math.max(min,Math.min(max,value)),lerp=(a,b,t)=>a+(b-a)*t,ease=t=>t*t*(3-2*t);
  let width=stage.clientWidth,height=stage.clientHeight,mobile=false,heroVisible=true;
  let raf=0,scrollTarget=window.scrollY,smoothScroll=window.scrollY,intro=reduced.matches?1:0,introStart=0,enteredOnce=false;
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
      sourceRect={x:grid.offsetLeft+r.left-g.left-end,y:grid.offsetTop+r.top-g.top,width:r.width,height:r.height};
      portalImage.src=last.querySelector('img').src;
    }
    rail={end,run,zoom,hold,total:run+zoom+hold||1,visible,source:last,sourceRect};
    collection.dataset.railEnd=end.toFixed(1);collection.dataset.railRun=run.toFixed(1);collection.dataset.zoomRun=zoom.toFixed(1);
  }
  function measure(){
    width=stage.clientWidth;height=stage.clientHeight;mobile=false;
    
    cards.forEach(card=>{const w=mobile?72:Number(card.dataset.w),h=w*Number(card.dataset.h)/Number(card.dataset.w);card.style.width=`${w}px`;card.style.height=`${h}px`;card.hidden=false;});
    window.DribbbleSpace?.resize();measureRail();
    [hero,collection,mood,closing].forEach(section=>sectionBounds.set(section,{top:section.getBoundingClientRect().top+window.scrollY,height:section.offsetHeight}));
    scrollTarget=window.scrollY;smoothScroll=window.scrollY;clearFocus();renderSpace();renderScroll();
  }
  function schedule(){if(!raf&&!document.hidden)raf=requestAnimationFrame(tick);}
  function renderSpace(){
    const b=sectionBounds.get(hero),progress=reduced.matches?0:clamp((smoothScroll-b.top)/Math.max(1,b.height-innerHeight),0,1);
    const explore=clamp(progress/.44),creation=clamp((progress-.41)/.55),exit=ease(clamp((progress-.93)/.07,0,1));
    if(window.DribbbleSpace){
      window.DribbbleSpace.update(camera,progress,intro,active,reduced.matches);
      const narrative=window.DribbbleSpace.narrative();
      if(narrative.hand){
        stage.style.setProperty('--touch-x',`${narrative.hand.x}px`);stage.style.setProperty('--touch-y',`${narrative.hand.y}px`);
        stage.style.setProperty('--floor-x',`${narrative.foot.x}px`);stage.style.setProperty('--floor-top',`${narrative.foot.y}px`);
        stage.style.setProperty('--halo-x',`${narrative.visitor.x}px`);stage.style.setProperty('--halo-y',`${narrative.visitor.y}px`);
        stage.style.setProperty('--visitor-opacity',String(narrative.opacity));
        stage.style.setProperty('--ink-opacity',String(narrative.resolve*.65*narrative.opacity));
      }
      const trailCards=[cards[1],cards[3],cards[8]].map(c=>window.DribbbleSpace.projection(c));
      if(trailCards.every(Boolean)){
        const [a,b,c]=trailCards;
        stage.querySelector('.idea-trail-path').setAttribute('d',`M${a.x},${a.y} C${a.x+120},${a.y-50} ${b.x-100},${b.y-50} ${b.x},${b.y} S${c.x-90},${c.y-60} ${c.x},${c.y}`);
      }
    }else{
      cards.forEach((card,i)=>{
        const z=Number(card.dataset.z),scale=1350/(1350-z),x=width*(.5+Number(card.dataset.x)),y=height*(.5+Number(card.dataset.y));
        card.style.left=`${x}px`;card.style.top=`${y}px`;card.style.width=`${Number(card.dataset.w)*scale}px`;card.style.height=`${Number(card.dataset.h)*scale}px`;card.style.transform=`translate(-50%,-50%) rotate(${card.dataset.roll}deg)`;card.style.setProperty('--depth-opacity',String(1-exit));
      });
      stage.style.setProperty('--visitor-opacity',String(intro*(1-exit)));
    }
    const firstFade=reduced.matches?0:ease(clamp((progress-.36)/.10,0,1));
    hero.style.setProperty('--copy-x',`${reduced.matches?0:-camera.x*7}px`);hero.style.setProperty('--copy-y',`${reduced.matches?0:-progress*75}px`);hero.style.setProperty('--copy-opacity',String(1-firstFade));
    hero.style.setProperty('--creation-opacity',String(reduced.matches?0:ease(clamp((progress-.45)/.09,0,1))*(1-exit)));
    hero.style.setProperty('--creation-y',`${(1-ease(clamp((progress-.45)/.09,0,1)))*25-exit*80}px`);
    stage.style.setProperty('--room-y',`${reduced.matches?0:-progress*27}px`);stage.style.setProperty('--room-opacity',String(.6*(1-exit*.45)));
    stage.style.setProperty('--gallery-opacity',String(1-exit));
    const touch=ease(clamp((explore-.40)/.20,0,1))*(1-ease(clamp((explore-.8)/.2,0,1)));
    const palm=ease(clamp(creation/.12,0,1))*(1-ease(clamp((creation-.74)/.18,0,1)));
    stage.style.setProperty('--touch-opacity',String(reduced.matches?0:Math.max(touch,palm)*.75*(1-exit)));
    const trail=ease(clamp((explore-.3)/.35,0,1))*(1-ease(clamp((explore-.8)/.2,0,1)));
    stage.style.setProperty('--trail-opacity',String(reduced.matches?0:trail*.58));stage.style.setProperty('--trail-dash',String(1-ease(clamp((explore-.2)/.55,0,1))));
    hero.style.setProperty('--story-progress',progress.toFixed(4));hero.dataset.progress=progress.toFixed(4);hero.dataset.chapter=creation>0?'create':'explore';
    hero.querySelector('.hero-copy').setAttribute('aria-hidden',String(firstFade>.999));hero.querySelector('.creation-copy').setAttribute('aria-hidden',String(creation===0));field.setAttribute('aria-hidden',String(creation>0));cards.forEach(card=>card.tabIndex=creation>0?-1:0);
    hero.querySelector('.label-left').textContent=creation>0?'02 / FROM IDEA TO EXPRESSION':'01 / THE INSPIRATION GALLERY';
  }
  function renderScroll(){
    const b=sectionBounds.get(collection),distance=clamp(smoothScroll-b.top,0,rail.total);
    const travel=reduced.matches?0:rail.run?clamp(distance/rail.run,0,1):1;
    const zoom=reduced.matches||!rail.source?0:clamp((distance-rail.run)/Math.max(1,rail.zoom),0,1),expand=ease(zoom);
    const cp=reduced.matches?0:distance/rail.total;
    collection.style.setProperty('--scroll-progress',cp.toFixed(4));
    collection.style.setProperty('--rail-x',`${reduced.matches?0:-rail.end*travel}px`);
    collection.style.setProperty('--title-shift','0px');
    collection.style.setProperty('--row-shift','0px');
    collection.style.setProperty('--rail-ui-opacity',String(1-ease(clamp(zoom*3,0,1))));
    collection.querySelector('.rail-counter').textContent=`${String(Math.max(1,Math.round(travel*(rail.visible.length-1))+1)).padStart(2,'0')} / ${String(rail.visible.length).padStart(2,'0')}`;
    boards.forEach(board=>{board.style.setProperty('--image-x','0px');board.style.setProperty('--image-y','0px');board.style.opacity=zoom>0?String(1-clamp(zoom*3,0,1)):'1';});
    collection.classList.toggle('is-portal',zoom>.01);
    collection.dataset.phase=zoom>=.999?'fullscreen':zoom>0?'zoom':'horizontal';
    collection.dataset.railProgress=travel.toFixed(4);collection.dataset.zoomProgress=zoom.toFixed(4);
    if(zoom>0&&rail.sourceRect){
      const r=rail.sourceRect;
      portal.style.opacity='1';portal.style.left=`${lerp(r.x,0,expand)}px`;portal.style.top=`${lerp(r.y,0,expand)}px`;
      portal.style.width=`${lerp(r.width,innerWidth,expand)}px`;portal.style.height=`${lerp(r.height,innerHeight,expand)}px`;portal.style.borderRadius=`${13*(1-expand)}px`;
      portalImage.style.width=`${100}%`;portalImage.style.height=`${100}%`;
      portalImage.style.left=`${0}%`;portalImage.style.top=`${0}%`;
      portalImage.style.transform=`scale(${1+expand*.025})`;
      const reveal=ease(clamp((zoom-.62)/.38,0,1));
      portal.style.setProperty('--portal-shade',String(reveal));portalCopy.style.opacity=String(reveal);portalCopy.style.visibility=reveal>0?'visible':'hidden';
      portalCopy.style.setProperty('--portal-copy-y',`${(1-reveal)*45}px`);
      rail.source.querySelector('.board-photo').style.opacity='0';
    }else{
      portal.style.opacity='0';portalCopy.style.opacity='0';portalCopy.style.visibility='hidden';
      if(rail.source)rail.source.querySelector('.board-photo').style.opacity='1';
    }
  }
  function tick(now){
    raf=0;
    if(enteredOnce&&intro<1)intro=reduced.matches?1:ease(clamp((now-introStart)/1100,0,1));
    camera.x=lerp(camera.x,pointer.x,.09);camera.y=lerp(camera.y,pointer.y,.09);smoothScroll=lerp(smoothScroll,scrollTarget,.15);
    if(heroVisible)renderSpace();renderScroll();
    const moving=Math.abs(smoothScroll-scrollTarget)>.04||Math.abs(camera.x-pointer.x)>.0001||Math.abs(camera.y-pointer.y)>.0001;
    if(moving||heroVisible&&intro<1)schedule();
  }
  function cancelLeave(){clearTimeout(leaveTimer);leaveTimer=0;}
  function clearFocus(){
    cancelLeave();focusSerial++;if(active)active.classList.remove('is-selected');active=null;field.classList.remove('has-focus');
    focused.classList.remove('is-open');focused.setAttribute('aria-hidden','true');
    focused.style.removeProperty('--tilt-x');focused.style.removeProperty('--tilt-y');schedule();
    document.dispatchEvent(new CustomEvent('Dribbble:blur'));
    clearTimeout(hideTimer);hideTimer=setTimeout(()=>{if(!active)focused.hidden=true;},220);
  }
  function scheduleLeave(){cancelLeave();leaveTimer=setTimeout(clearFocus,130);}
  function select(card){
    cancelLeave();clearTimeout(hideTimer);if(active===card)return;schedule();
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
    schedule();if(event.target.closest('.focused-card')){cancelLeave();return;}
    if(event.target.closest('.hero-copy a,.motion-toggle'))return;
    const card=document.body.classList.contains('scene-ready')?window.DribbbleSpace?.pick(event.clientX,event.clientY):event.target.closest('.space-card');
    if(card)select(card);else if(active&&!focused.matches(':hover'))scheduleLeave();
  },{passive:true});
  stage.addEventListener('click',event=>{
    if(event.target.closest('a,button,.focused-card'))return;
    const card=window.DribbbleSpace?.pick(event.clientX,event.clientY);if(!card)return;
    if(fine.matches)openPreview(card.dataset.image);else select(card);
  });
  stage.addEventListener('pointerleave',()=>{pointer={x:0,y:0};clearFocus();schedule();});
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
  reduced.addEventListener('change',()=>{if(reduced.matches)intro=1;pointer={x:0,y:0};camera={x:0,y:0};measure();schedule();});
  const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{
    if(entry.target===hero){heroVisible=entry.isIntersecting;if(heroVisible&&!enteredOnce){enteredOnce=true;introStart=performance.now();hero.dataset.entryPlayed='true';}if(!heroVisible)clearFocus();schedule();}
  }));observer.observe(hero);
  window.addEventListener('scroll',()=>{scrollTarget=window.scrollY;if(active)clearFocus();schedule();},{passive:true});
  window.addEventListener('resize',()=>{measure();schedule();},{passive:true});
  document.addEventListener('Dribbble:scene-update',schedule);
  document.addEventListener('visibilitychange',()=>{cancelAnimationFrame(raf);raf=0;if(!document.hidden)schedule();});
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
  function filterBoards(){const query=search.value.trim().toLowerCase();let count=0;boards.forEach(board=>{const visible=(filter==='all'||board.dataset.category===filter)&&(!query||board.dataset.keywords.includes(query)||board.textContent.toLowerCase().includes(query));board.hidden=!visible;if(visible)count++;});document.querySelector('.empty').hidden=Boolean(count);document.querySelector('.collection-status').textContent=query?`“${search.value.trim()}” · ${count} 个灵感集`:'';measure();schedule();}
  chips.forEach(chip=>chip.addEventListener('click',()=>{filter=chip.dataset.filter;chips.forEach(c=>c.setAttribute('aria-pressed',String(c===chip)));filterBoards();}));search.addEventListener('input',filterBoards);
  document.querySelector('.search').addEventListener('submit',event=>{event.preventDefault();collection.scrollIntoView({behavior:reduced.matches?'instant':'smooth'});});
  const closingInner=document.createElement('div');closingInner.className='closing-inner';while(closing.firstChild)closingInner.append(closing.firstChild);closing.append(closingInner);
  measure();field.classList.add('ready');schedule();
})();

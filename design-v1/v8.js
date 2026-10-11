(()=>{
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v)),lerp=(a,b,t)=>a+(b-a)*t,ease=v=>{const t=clamp(v);return t*t*(3-2*t);};
  const hero=document.querySelector('.hero'),works=document.querySelector('.works'),slots=[...document.querySelectorAll('.work-slot')],rows=[...document.querySelectorAll('.journey-row')],cinema=document.querySelector('.cinematic'),mood=document.querySelector('.moodboard');
  let raf=0,smooth=scrollY,target=scrollY,pointer=0,mouse=0,bounds={};
  const box=e=>({top:e.getBoundingClientRect().top+scrollY,height:e.offsetHeight});
  function measure(){bounds={hero:box(hero),works:box(works),slots:slots.map(box),rows:rows.map(box),cinema:box(cinema),mood:box(mood)};smooth=target=scrollY;schedule();}
  function schedule(){if(!raf&&!document.hidden)raf=requestAnimationFrame(tick);}
  function paint(){
    const h=innerHeight,quiet=reduced.matches,p=clamp(smooth/bounds.hero.height);
    hero.style.setProperty('--hero-copy-y',`${quiet?0:smooth*.28}px`);hero.style.setProperty('--hero-copy-opacity',String(quiet?1:1-ease((p-.23)/.65)));
    hero.style.setProperty('--arc-y',`${quiet?0:smooth*.10}px`);hero.style.setProperty('--arc-x',`${quiet?0:-smooth*.12+mouse*45}px`);
    works.style.setProperty('--marquee-x',`${quiet?0:(bounds.works.top-smooth)*.22-160}px`);
    bounds.slots.forEach((b,i)=>{const position=(smooth+h-b.top)/(h+b.height),appear=ease(position/.55),card=slots[i].firstElementChild;card.style.setProperty('--work-scale',(quiet?1:.86+appear*.14).toFixed(4));card.style.setProperty('--work-y',`${quiet?0:(1-appear)*65}px`);card.style.setProperty('--photo-y',`${quiet?0:clamp((smooth+h*.5-b.top-b.height*.5)*.07,-b.height*.06,b.height*.06)}px`);});
    bounds.rows.forEach((b,i)=>{const p=ease((smooth+h*.9-b.top)/(h*.65)),row=rows[i];row.style.setProperty('--row-x',`${quiet?0:(1-p)*Number(row.style.getPropertyValue('--entry'))*innerWidth*.21}px`);row.style.setProperty('--row-opacity',String(quiet?1:.15+p*.85));});
    const c=clamp((smooth+h-bounds.cinema.top)/(h+bounds.cinema.height));
    cinema.style.setProperty('--cinema-scale',(quiet?1:1.28-c*.28).toFixed(4));cinema.style.setProperty('--cinema-y',`${quiet?0:(c-.5)*-120}px`);cinema.style.setProperty('--cinema-radius',`${quiet?35:65*(1-ease((c-.05)/.65))}px`);cinema.style.setProperty('--cinema-copy-y',`${quiet?0:(1-ease((c-.12)/.38))*65}px`);cinema.style.setProperty('--cinema-copy-opacity',String(quiet?1:ease((c-.12)/.38)));
    const m=clamp((smooth+h-bounds.mood.top)/(h+bounds.mood.height));mood.style.setProperty('--mood-y',`${quiet?0:(.5-m)*100}px`);mood.style.setProperty('--mood-angle',`${quiet?0:(1-ease(m/.6))*3}deg`);
    document.body.dataset.scrollPosition=smooth.toFixed(2);document.body.dataset.motion=reduced.matches?'reduced':'active';
  }
  function tick(){raf=0;smooth=target;mouse=pointer;paint();}
  addEventListener('scroll',()=>{target=scrollY;schedule();},{passive:true});addEventListener('resize',measure,{passive:true});hero.addEventListener('pointermove',e=>{pointer=e.clientX/innerWidth-.5;schedule();},{passive:true});hero.addEventListener('pointerleave',()=>{pointer=0;schedule();});document.addEventListener('visibilitychange',()=>{cancelAnimationFrame(raf);raf=0;if(!document.hidden)schedule();});reduced.addEventListener('change',measure);
  slots.forEach(slot=>slot.firstElementChild.addEventListener('pointermove',e=>{const card=slot.firstElementChild,r=card.getBoundingClientRect();card.style.setProperty('--hover-x',`${clamp(e.clientX-r.left,60,r.width-60)}px`);card.style.setProperty('--hover-y',`${clamp(e.clientY-r.top,60,r.height-60)}px`);},{passive:true}));
  const menu=document.getElementById('site-menu'),toggle=document.querySelector('.menu-toggle');let menuReturn=null;
  function closeMenu(){menu.close();toggle.setAttribute('aria-expanded','false');toggle.focus({preventScroll:true});}
  toggle.addEventListener('click',()=>{menuReturn=document.activeElement;menu.showModal();toggle.setAttribute('aria-expanded','true');});document.querySelector('.menu-close').addEventListener('click',closeMenu);menu.addEventListener('close',()=>toggle.setAttribute('aria-expanded','false'));menu.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{menu.close();toggle.setAttribute('aria-expanded','false');}));
  const items={
    'hd-portrait':{title:'情绪的形状',category:'PORTRAITS / 人物',description:'眼神、衣料与柔和的灰蓝色。让人物的情绪，成为表达的起点。'},
    'hd-landscape':{title:'山野之间',category:'LANDSCAPES / 自然',description:'群山与湖泊写下自然的配色。在更广阔的画面里，找到新的视角。'},
    'hd-interior':{title:'理想的日常',category:'INTERIORS / 空间',description:'光线、材质与留白。把喜欢的感觉，放进一个理想的空间。'},
    'hd-cyber':{title:'未来的切片',category:'CYBER VISIONS / 未来',description:'光轨划过未来的城市。从一种氛围，延伸出一个尚未发生的故事。'}
  };
  const dialog=document.getElementById('image-preview'),save=document.getElementById('save-image'),message=dialog.querySelector('.saved-message'),saved=new Set();let current='';
  document.querySelectorAll('[data-image]').forEach(button=>button.addEventListener('click',()=>{const key=button.dataset.image,item=items[key];if(!item)return;current=key;dialog.querySelector('.preview-image').src=`assets/${key}.jpg`;dialog.querySelector('.preview-image').alt=item.title;document.getElementById('preview-title').textContent=item.title;document.getElementById('preview-category').textContent=item.category;document.getElementById('preview-description').textContent=item.description;save.textContent=saved.has(key)?'已收藏 ✓':'收藏灵感 ＋';message.textContent=saved.has(key)?'已加入本次预览的灵感板。':'';dialog.showModal();}));
  dialog.querySelector('.close-preview').addEventListener('click',()=>dialog.close());dialog.addEventListener('click',e=>{const r=dialog.getBoundingClientRect();if(e.target===dialog&&(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom))dialog.close();});
  save.addEventListener('click',()=>{saved.add(current);save.textContent='已收藏 ✓';message.textContent='已加入本次预览的灵感板。';document.querySelector('.saved-count').textContent=`已收藏 ${saved.size} 份灵感`;document.querySelectorAll('.mood-tiles [data-image]').forEach(tile=>tile.classList.toggle('is-saved',saved.has(tile.dataset.image)));});
  measure();document.fonts.ready.then(measure);
})();

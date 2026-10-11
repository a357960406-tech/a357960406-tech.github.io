(()=>{
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v)),lerp=(a,b,t)=>a+(b-a)*t,ease=v=>{const t=clamp(v);return t*t*(3-2*t);};
  const hero=document.querySelector('.hero'),trail=document.querySelector('.trail-section'),works=document.querySelector('.works'),slots=[...document.querySelectorAll('.work-slot')],cinema=document.querySelector('.cinematic'),outro=document.querySelector('.outro-layer'),stage=document.querySelector('.work-stage');
  let raf=0,smooth=scrollY,target=scrollY,pointer=0,mouse=0,bounds={};
  const layers=[...document.querySelectorAll('main>section')];
  const box=e=>{let top=0,n=e;while(n){top+=n.offsetTop;n=n.offsetParent;}return {top,height:e.offsetHeight};};
  layers.forEach((el,i)=>{el.classList.add('page-layer');el.style.zIndex=String(layers.length-i);});
  function measure(){bounds={hero:box(hero),trail:box(trail),works:box(works),cinema:box(cinema),outro:box(outro)};smooth=target=scrollY;schedule();}
  function schedule(){if(!raf&&!document.hidden)raf=requestAnimationFrame(tick);}
  function paint(){
    const h=innerHeight,w=innerWidth,quiet=reduced.matches,p=clamp(smooth/bounds.hero.height);
    hero.style.setProperty('--hero-copy-y','0px');hero.style.setProperty('--hero-copy-opacity','1');hero.style.setProperty('--arc-y','0px');hero.style.setProperty('--layer-radius','0px');
    const range=Math.max(1,bounds.works.height-h),progress=clamp((smooth-bounds.works.top)/range),horizontal=clamp(progress/.54),flip=ease((progress-.55)/.20),zoom=ease((progress-.58)/.25),retreat=ease((progress-.75)/.21),cw=w*.45,ch=Math.max(330,Math.min(580,h*.52)),gap=w*.038,start=w*.3,distance=(cw+gap)*3+start-w*.5;
    works.dataset.flip=flip.toFixed(4);works.dataset.retreat=retreat.toFixed(4);works.dataset.progress=progress.toFixed(4);works.dataset.horizontal=horizontal.toFixed(4);works.dataset.zoom=zoom.toFixed(4);stage.style.setProperty('--gallery-ui',String(1-ease(zoom/.3)));stage.style.setProperty('--gallery-progress',String(Math.max(.08,horizontal)));works.querySelector('.gallery-count').textContent=`0${Math.min(4,1+Math.floor(horizontal*3.99))} / 04`;
    works.style.setProperty('--marquee-x',`${quiet?0:-horizontal*w*.3}px`);
    slots.forEach((slot,i)=>{
      const last=i===slots.length-1,card=slot.firstElementChild;
      if(quiet){if(last){card.dataset.image='hd-cyber';card.dataset.face='front';card.setAttribute('aria-label','查看未来的切片');}return;}
      const sw=last?lerp(cw,w,zoom):cw,sh=last?lerp(ch,h,zoom):ch;
      slot.style.left=`${start+i*(cw+gap)-horizontal*distance}px`;slot.style.width=`${sw}px`;slot.style.height=`${sh}px`;slot.style.top=`${lerp(h*.52,h*.5,last?zoom:0)}px`;
      slot.style.opacity=String(last?1:1-ease((progress-.55)/.10));slot.style.pointerEvents=!last&&progress>.56?'none':'';
      card.style.setProperty('--tilt-strength',String(last?1-ease((progress-.54)/.06):1));card.style.setProperty('--card-radius',`${22*(1-(last?zoom:0))}px`);
      if(last){
        const swing=Math.sin(flip*Math.PI);
        slot.style.perspective=`${lerp(1250,2400,zoom)}px`;
        card.style.setProperty('--flip-y',`${flip*180}deg`);card.style.setProperty('--flip-x',`${-9*swing}deg`);card.style.setProperty('--flip-roll',`${-5*swing}deg`);card.style.setProperty('--flip-z',`${130*swing}px`);
        card.style.setProperty('--scene-z',`${lerp(520,0,retreat)}px`);card.style.setProperty('--scene-y',`${lerp(28,0,retreat)}px`);
        card.style.setProperty('--last-labels',String(1-ease((progress-.55)/.08)));card.style.setProperty('--final-copy',String(ease((progress-.82)/.11)));card.style.setProperty('--final-y',`${(1-retreat)*35}px`);card.style.setProperty('--photo-scale','1.03');
        const back=flip>.5;card.dataset.image=back?'future-digital20':'hd-cyber';card.setAttribute('aria-label',back?'查看数字灵感空间':'查看未来的切片');card.dataset.face=back?'back':'front';
      }
    });
    const c=clamp((smooth+h-bounds.cinema.top)/h),inside=clamp((smooth-bounds.cinema.top)/Math.max(h,bounds.cinema.height));cinema.style.setProperty('--cinema-inset',`${quiet?0:(1-ease(c))*72}%`);cinema.style.setProperty('--cinema-radius',`${quiet?0:32*(1-c)}px`);cinema.style.setProperty('--cinema-scale',String(quiet?1:1.12-c*.12));cinema.style.setProperty('--cinema-y',`${quiet?0:lerp(55,-55,clamp((smooth+h-bounds.cinema.top)/(h+bounds.cinema.height)))}px`);cinema.style.setProperty('--cinema-copy-y',`${quiet?0:(1-ease((c-.2)/.7))*55}px`);cinema.style.setProperty('--cinema-copy-opacity',String(quiet?1:ease((c-.2)/.7)));
    const o=ease((smooth+h-bounds.outro.top)/(h*.7));outro.style.setProperty('--outro-opacity',String(quiet?1:o));outro.style.setProperty('--outro-y',`${quiet?0:(1-o)*60}px`);outro.style.setProperty('--footer-y',`${quiet?0:clamp((bounds.outro.top+bounds.outro.height-smooth-h)*.08,0,65)}px`);
    document.body.dataset.scrollPosition=smooth.toFixed(2);document.body.dataset.motion=quiet?'reduced':'active';
  }
  function tick(){raf=0;smooth=target;mouse=pointer;paint();}
  addEventListener('scroll',()=>{target=scrollY;schedule();},{passive:true});addEventListener('resize',measure,{passive:true});document.addEventListener('visibilitychange',()=>{cancelAnimationFrame(raf);raf=0;if(!document.hidden)schedule();});reduced.addEventListener('change',measure);
  const finePointer=matchMedia('(hover:hover) and (pointer:fine)');
  function resetTilt(card){
    for(const prop of ['--tilt-x','--tilt-y'])card.style.setProperty(prop,'0deg');
    for(const prop of ['--card-x','--card-y','--pan-x','--pan-y','--surface-x','--surface-y','--label-x','--label-y'])card.style.setProperty(prop,'0px');
    card.style.setProperty('--hover-depth','0px');card.style.setProperty('--hovered','0');card.dataset.tilt='rest';
  }
  slots.forEach(slot=>{const card=slot.firstElementChild;
    slot.addEventListener('pointermove',e=>{
      // Measure the unrotated slot: the moving surface must not feed its own coordinates back into the tilt.
      const r=slot.getBoundingClientRect(),x=clamp((e.clientX-r.left)/r.width)-.5,y=clamp((e.clientY-r.top)/r.height)-.5;
      const enabled=finePointer.matches&&!reduced.matches&&e.pointerType!=='touch';
      if(!enabled){resetTilt(card);return;}
      card.style.setProperty('--tilt-x',`${-y*24}deg`);card.style.setProperty('--tilt-y',`${x*30}deg`);
      card.style.setProperty('--card-x',`${x*14}px`);card.style.setProperty('--card-y',`${y*10}px`);
      card.style.setProperty('--surface-x',`${x*10}px`);card.style.setProperty('--surface-y',`${y*8}px`);
      card.style.setProperty('--pan-x',`${-x*42}px`);card.style.setProperty('--pan-y',`${-y*34}px`);
      card.style.setProperty('--label-x',`${x*17}px`);card.style.setProperty('--label-y',`${y*14}px`);
      card.style.setProperty('--hover-depth','14px');card.style.setProperty('--hovered','1');card.dataset.tilt='active';
      card.style.setProperty('--gloss-x',`${(x+.5)*100}%`);card.style.setProperty('--gloss-y',`${(y+.5)*100}%`);
    },{passive:true});
    slot.addEventListener('pointerleave',()=>resetTilt(card));card.addEventListener('blur',()=>resetTilt(card));
  });
  addEventListener('scroll',()=>slots.forEach(slot=>resetTilt(slot.firstElementChild)),{passive:true});
  reduced.addEventListener('change',()=>slots.forEach(slot=>resetTilt(slot.firstElementChild)));
  const menu=document.getElementById('site-menu'),toggle=document.querySelector('.menu-toggle');let menuReturn=null;
  function closeMenu(){menu.close();toggle.setAttribute('aria-expanded','false');toggle.focus({preventScroll:true});}
  toggle.addEventListener('click',()=>{menuReturn=document.activeElement;menu.showModal();toggle.setAttribute('aria-expanded','true');});document.querySelector('.menu-close').addEventListener('click',closeMenu);menu.addEventListener('close',()=>toggle.setAttribute('aria-expanded','false'));menu.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{menu.close();toggle.setAttribute('aria-expanded','false');}));
  const items={
    'future-digital20':{title:'数字灵感空间',category:'DIGITAL ART / 数字艺术',description:'巨型弧形结构、柔和光带与镜面水景，在人物的尺度衬托下延伸成未来空间。从建筑、光影和构图中，发现下一次创作的灵感。'},
    'gallery-sculpture':{title:'形态的平衡',category:'ART / 艺术',description:'在留白与微妙的平衡中，发现形态的可能。'},
    'desert-architecture':{title:'光的建筑',category:'ARCHITECTURE / 建筑',description:'暖色的墙面与光影，将建筑变成一幅画。'},
    'mirror-desert':{title:'镜像之间',category:'LANDSCAPES / 自然',description:'让建筑与山野对话，换一个视角看世界。'},
    'hd-blue-building':{title:'向上的秩序',category:'ARCHITECTURE / 建筑',description:'建筑的曲线与天空，带来全新的视觉秩序。'},
    'sharp-portrait':{title:'凝视的力量',category:'PORTRAITS / 人物',description:'清晰的光影与细节，让每一种表达被看见。'},
    'hd-mountain':{title:'山林的呼吸',category:'NATURE / 自然',description:'山林、湖面与光影，构成自然的灵感。'},
    'hd-loft':{title:'生活里的诗',category:'INTERIORS / 家居',description:'从光线与生活细节里，收集日常的美感。'},
    'hd-portrait':{title:'情绪的形状',category:'PORTRAITS / 人物',description:'眼神、衣料与柔和的灰蓝色。让人物的情绪，成为表达的起点。'},
    'hd-landscape':{title:'山野之间',category:'LANDSCAPES / 自然',description:'群山与湖泊写下自然的配色。在更广阔的画面里，找到新的视角。'},
    'hd-interior':{title:'理想的日常',category:'INTERIORS / 空间',description:'光线、材质与留白。把喜欢的感觉，放进一个理想的空间。'},
    'hd-cyber':{title:'未来的切片',category:'CYBER VISIONS / 未来',description:'光轨划过未来的城市。从一种氛围，延伸出一个尚未发生的故事。'}
  };
  const dialog=document.getElementById('image-preview'),save=document.getElementById('save-image'),message=dialog.querySelector('.saved-message'),saved=new Set();let current='';
  document.querySelectorAll('[data-image]').forEach(button=>button.addEventListener('click',()=>{const key=button.dataset.image,item=items[key];if(!item)return;current=key;dialog.querySelector('.preview-image').src=`assets/${key}.jpg`;dialog.querySelector('.preview-image').alt=item.title;document.getElementById('preview-title').textContent=item.title;document.getElementById('preview-category').textContent=item.category;document.getElementById('preview-description').textContent=item.description;save.textContent=saved.has(key)?'已收藏 ✓':'收藏灵感 ＋';message.textContent=saved.has(key)?'已收藏这份灵感。':'';dialog.showModal();}));
  dialog.querySelector('.close-preview').addEventListener('click',()=>dialog.close());dialog.addEventListener('click',e=>{const r=dialog.getBoundingClientRect();if(e.target===dialog&&(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom))dialog.close();});
  save.addEventListener('click',()=>{saved.add(current);save.textContent='已收藏 ✓';message.textContent='已收藏这份灵感。';});
  function anchorTarget(hash){try{return document.getElementById(decodeURIComponent(hash.slice(1)));}catch{return null;}}
  document.addEventListener('click',e=>{const link=e.target.closest('a[href^="#"]');if(!link)return;const hash=link.getAttribute('href'),destination=anchorTarget(hash);if(!destination)return;e.preventDefault();history.pushState(null,'',hash);scrollTo({top:box(destination).top,behavior:reduced.matches?'instant':'smooth'});});
  function restoreHash(){const destination=anchorTarget(location.hash);if(destination)scrollTo({top:box(destination).top,behavior:'instant'});}
  history.scrollRestoration='manual';addEventListener('hashchange',restoreHash);addEventListener('load',()=>{measure();requestAnimationFrame(restoreHash);});
  measure();document.fonts.ready.then(()=>{measure();restoreHash();});
})();

(() => {
  const examples = {
    new: {prompt:'$landing-page-iteration\n\n帮我做一个图片素材产品的单页落地页，主要展示高清作品和图片探索交互。\n参考网址：[在这里填写网址]。先确认影响方向的需求，再做一版可以预览的页面。\n目标设备：桌面端；不要新增二级页面。',result:'关键需求对齐 → 可运行首版 → 浏览器验证 → 预览链接'},
    edit: {prompt:'$landing-page-iteration\n\n基于当前最新版本修改：首屏文案往视觉中心移动，作品卡片间距缩小一些。\n保留现有图片、颜色和交互，其他区块保持不变。\n请检查实际卡片间距和相邻区块，完成后给我预览链接。',result:'定位最新入口 → 最小范围修改 → 检查受影响区域 → 更新预览'},
    motion: {prompt:'$landing-page-iteration\n\n作品区卡片在鼠标倾斜时与邻卡穿模，请检查坐标计算、堆叠层级和裁切。\n把滚动位移、卡片翻转和悬停倾斜分开控制。\n验证卡片中心、四角和翻转中间态，修好后给我可预览页面。',result:'复现问题 → 分离动效控制层 → 修复穿模与抖动 → 浏览器验证'},
    publish: {prompt:'$landing-page-iteration\n\n将当前确认的版本 Git Commit，并同步到项目已有的 GitHub 仓库。\n通过 GitHub Pages 发布，保留已有内容，统一发布目录与入口。\n检查部署结果、正式网址、图片资源和关键交互，完成后给我仓库和网站链接。',result:'确认提交范围 → 同步 GitHub → Pages 发布 → 线上验收'}
  };
  const tabs=[...document.querySelectorAll('[data-example]')],panel=document.getElementById('example-panel');
  function activate(tab,focus=false){tabs.forEach(t=>{const selected=t===tab;t.setAttribute('aria-selected',String(selected));t.tabIndex=selected?0:-1;});const example=examples[tab.dataset.example];document.getElementById('example-prompt').textContent=example.prompt;document.getElementById('example-result').textContent=example.result;panel.setAttribute('aria-labelledby',tab.id);if(focus)tab.focus();}
  tabs.forEach((tab,index)=>{tab.addEventListener('click',()=>activate(tab));tab.addEventListener('keydown',e=>{let next;if(e.key==='ArrowRight')next=(index+1)%tabs.length;if(e.key==='ArrowLeft')next=(index+tabs.length-1)%tabs.length;if(e.key==='Home')next=0;if(e.key==='End')next=tabs.length-1;if(next!==undefined){e.preventDefault();activate(tabs[next],true);}});});
  const toast=document.querySelector('.toast');let toastTimer;
  function announce(message){clearTimeout(toastTimer);toast.textContent=message;toast.classList.add('visible');toastTimer=setTimeout(()=>toast.classList.remove('visible'),2500);}
  async function copy(text){if(navigator.clipboard&&window.isSecureContext){try{await navigator.clipboard.writeText(text);return;}catch{}}const input=document.createElement('textarea');input.value=text;input.style.cssText='position:fixed;left:-9999px;top:0';document.body.append(input);input.select();const success=document.execCommand('copy');input.remove();if(!success)throw Error('copy unavailable');}
  document.querySelectorAll('[data-copy]').forEach(button=>{const original=button.innerHTML;button.addEventListener('click',async()=>{try{await copy(document.getElementById(button.dataset.copy).textContent.trim());button.textContent='已复制 ✓';announce('已复制，可以粘贴到 Codex 中使用');setTimeout(()=>button.innerHTML=original,1800);}catch{announce('复制暂不可用，请选中文字后手动复制');}});});
})();

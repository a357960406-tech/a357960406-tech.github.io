(()=>{
  const reduced=matchMedia('(prefers-reduced-motion: reduce)'),fine=matchMedia('(hover:hover) and (pointer:fine)'),effects=[];
  const vertex=`attribute vec2 aPosition;varying vec2 vUv;void main(){vUv=aPosition*.5+.5;gl_Position=vec4(aPosition,0.,1.);}`;
  const fragment=`precision highp float;
    varying vec2 vUv;uniform sampler2D uImage,uSoftImage;uniform vec2 uResolution,uCover;uniform float uTime;uniform int uCount;uniform bool uPhoto,uBackground;uniform vec3 uPointer;uniform vec4 uDrops[10];
    void main(){
      float aspect=uResolution.x/uResolution.y;vec2 displacement=vec2(0.);float reflection=0.;
      for(int i=0;i<10;i++){
        if(i>=uCount)break;float age=uTime-uDrops[i].z;if(age<0.||age>2.8)continue;
        vec2 delta=(vUv-uDrops[i].xy)*vec2(aspect,1.);float distance=length(delta),front=age*.30;
        float band=(distance-front)*17.;float envelope=exp(-band*band)*exp(-age*1.30)*(1.-smoothstep(2.1,2.8,age));
        float phase=(distance-front)*72.;float wave=sin(phase)*envelope*uDrops[i].w;
        displacement+=delta/max(distance,.003)/vec2(aspect,1.)*wave*.021;reflection+=cos(phase)*envelope*uDrops[i].w;
      }
      if(uPhoto){vec2 uv=.5+(vUv+displacement-.5)*uCover;vec2 fringe=displacement*uCover*.055;
        vec3 color=vec3(texture2D(uImage,clamp(uv+fringe,.001,.999)).r,texture2D(uImage,clamp(uv,.001,.999)).g,texture2D(uImage,clamp(uv-fringe,.001,.999)).b);
        color+=reflection*.026;gl_FragColor=vec4(color,1.);
      }else if(uBackground){
        vec2 uv=.5+(vUv+displacement-.5)*uCover;
        float distance=length((vUv-uPointer.xy)*vec2(aspect,1.));
        float clarity=exp(-pow(distance*3.2,2.))*uPointer.z;
        clarity=clamp(clarity+abs(reflection)*.18,0.,1.);
        vec3 blurred=texture2D(uSoftImage,clamp(uv,.001,.999)).rgb;
        vec3 sharp=texture2D(uImage,clamp(uv,.001,.999)).rgb;
        vec3 color=mix(blurred,sharp,clarity)*mix(.48,.82,clarity);
        color+=reflection*.022;
        gl_FragColor=vec4(color,1.);
      }else{float alpha=clamp(abs(reflection)*.16,0.,.21);gl_FragColor=vec4(mix(vec3(.1,.28,.25),vec3(.37,.61,.55),max(reflection,0.)),alpha);}
    }`;
  function create(host,img=null){
    const ambient=host.classList.contains('ambient-water'),background=ambient&&!!img,canvas=ambient?host:document.createElement('canvas');if(!ambient){canvas.className='water-canvas';canvas.setAttribute('aria-hidden','true');host.append(canvas);}
    const gl=canvas.getContext('webgl',{alpha:ambient,antialias:false,preserveDrawingBuffer:true,premultipliedAlpha:false,powerPreference:'low-power'});if(!gl)return;
    function shader(type,source){const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)){canvas.dataset.error=gl.getShaderInfoLog(s);return null;}return s;}
    const vs=shader(gl.VERTEX_SHADER,vertex),fs=shader(gl.FRAGMENT_SHADER,fragment);if(!vs||!fs)return;
    const program=gl.createProgram();gl.attachShader(program,vs);gl.attachShader(program,fs);gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS)){canvas.dataset.error=gl.getProgramInfoLog(program);return;}gl.useProgram(program);
    const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);const attribute=gl.getAttribLocation(program,'aPosition');gl.enableVertexAttribArray(attribute);gl.vertexAttribPointer(attribute,2,gl.FLOAT,false,0,0);
    const u=Object.fromEntries(['uImage','uSoftImage','uBackground','uPointer','uResolution','uCover','uTime','uCount','uPhoto','uDrops[0]'].map(n=>[n,gl.getUniformLocation(program,n)]));
    const texture=gl.createTexture();gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,texture);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);
    if(img)gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,img);else gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,1,1,0,gl.RGBA,gl.UNSIGNED_BYTE,new Uint8Array([0,0,0,0]));
    if(background){
      const soft=document.createElement('canvas'),size=Math.min(1,1600/img.naturalWidth);soft.width=Math.round(img.naturalWidth*size);soft.height=Math.round(img.naturalHeight*size);
      const ctx=soft.getContext('2d');ctx.filter='blur(22px)';ctx.drawImage(img,-28,-28,soft.width+56,soft.height+56);
      const softTexture=gl.createTexture();gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,softTexture);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,soft);gl.uniform1i(u.uSoftImage,1);gl.activeTexture(gl.TEXTURE0);
    }
    gl.uniform1i(u.uBackground,background);gl.uniform3f(u.uPointer,.5,.5,0);
    gl.uniform1i(u.uImage,0);gl.uniform1i(u.uPhoto,!ambient);let width=1,height=1,drops=[],raf=0,last=null,lost=false,frames=0;
    function draw(now){raf=0;if(lost||document.hidden)return;const time=now/1000;drops=drops.filter(d=>time-d.time<2.8);const values=new Float32Array(40);drops.forEach((d,i)=>values.set([d.x,d.y,d.time,d.strength],i*4));gl.uniform1f(u.uTime,time);gl.uniform1i(u.uCount,drops.length);gl.uniform4fv(u['uDrops[0]'],values);gl.drawArrays(gl.TRIANGLES,0,6);canvas.dataset.frame=String(++frames);canvas.dataset.drops=String(drops.length);if(drops.length&&!reduced.matches)raf=requestAnimationFrame(draw);}
    function resize(){width=ambient?innerWidth:host.clientWidth;height=ambient?innerHeight:host.clientHeight;const dpr=Math.min(devicePixelRatio||1,ambient?1:1.45,Math.sqrt(1100000/(width*height)));canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);gl.viewport(0,0,canvas.width,canvas.height);gl.uniform2f(u.uResolution,width,height);const aspect=width/height,photoAspect=img?img.naturalWidth/img.naturalHeight:aspect;gl.uniform2f(u.uCover,photoAspect>aspect?aspect/photoAspect:1,photoAspect>aspect?1:photoAspect/aspect);cancelAnimationFrame(raf);draw(performance.now());}
    function pulse(e){if(background&&!lost){const enabled=!e.target.closest?.('.trail-section')&&!document.querySelector('dialog[open]');gl.uniform3f(u.uPointer,e.clientX/innerWidth,1-e.clientY/innerHeight,enabled?1:0);canvas.dataset.reveal=enabled?'true':'false';}if(lost||reduced.matches||!fine.matches||e.pointerType==='touch')return;const r=ambient?{left:0,top:0,width:innerWidth,height:innerHeight}:canvas.getBoundingClientRect(),time=performance.now()/1000;const x=(e.clientX-r.left)/r.width,y=1-(e.clientY-r.top)/r.height;if(x<0||x>1||y<0||y>1)return;const distance=last?Math.hypot((x-last.x)*width,(y-last.y)*height):20;if(last&&(time-last.time<.045||distance<4))return;drops.push({x,y,time,strength:ambient?.8:Math.min(1.4,.75+distance/90)});if(drops.length>10)drops.shift();last={x,y,time};if(!raf)raf=requestAnimationFrame(draw);}
    const eventHost=window;eventHost.addEventListener('pointermove',pulse,{passive:true});eventHost.addEventListener('pointerleave',()=>{last=null;if(background){gl.uniform3f(u.uPointer,.5,.5,0);draw(performance.now());}});
    function clear(){if(background){gl.uniform3f(u.uPointer,.5,.5,0);canvas.dataset.reveal='false';}drops=[];last=null;cancelAnimationFrame(raf);raf=0;draw(performance.now());}
    canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();lost=true;cancelAnimationFrame(raf);canvas.classList.remove('is-ready');});effects.push({resize,clear});resize();canvas.classList.add('is-ready');
  }
  const backdrop=new Image();backdrop.onload=()=>create(document.querySelector('.ambient-water'),backdrop);backdrop.src='assets/hd-cyber.jpg';
  document.querySelectorAll('.arc-card.ripple-photo').forEach(host=>{const img=host.querySelector('img');let initialized=false;function initialize(){if(initialized||!img.naturalWidth)return;initialized=true;create(host,img);}if(img.complete)initialize();else img.addEventListener('load',initialize,{once:true});});
  addEventListener('resize',()=>effects.forEach(e=>e.resize()),{passive:true});addEventListener('scroll',()=>effects.forEach(e=>e.clear()),{passive:true});reduced.addEventListener('change',()=>effects.forEach(e=>e.clear()));document.addEventListener('visibilitychange',()=>{if(document.hidden)effects.forEach(e=>e.clear());});
})();

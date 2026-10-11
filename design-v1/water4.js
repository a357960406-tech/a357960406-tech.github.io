(()=>{
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const fine=matchMedia('(hover:hover) and (pointer:fine)');
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const vertex=`attribute vec2 aPosition;varying vec2 vUv;void main(){vUv=aPosition*.5+.5;gl_Position=vec4(aPosition,0.,1.);}`;
  const fragment=`
    precision mediump float;
    varying vec2 vUv;
    uniform sampler2D uImage;
    uniform vec2 uResolution;
    uniform vec2 uCover;
    uniform float uTime;
    uniform int uCount;
    uniform bool uPhoto;
    uniform vec4 uDrops[10];
    void main(){
      float aspect=uResolution.x/uResolution.y;
      vec2 displacement=vec2(0.);
      float shine=0.;
      for(int i=0;i<10;i++){
        if(i>=uCount)break;
        float age=uTime-uDrops[i].z;
        if(age<0.||age>2.7)continue;
        vec2 delta=(vUv-uDrops[i].xy)*vec2(aspect,1.);
        float distance=length(delta);
        float front=age*.34;
        float band=(distance-front)*16.;
        float falloff=exp(-band*band)*exp(-age*1.55);
        falloff*=1.-smoothstep(2.,2.7,age);
        float phase=(distance-front)*68.;
        float wave=sin(phase)*falloff*uDrops[i].w;
        displacement+=(delta/max(distance,.003))/vec2(aspect,1.)*wave*.015;
        shine+=cos(phase)*falloff*uDrops[i].w;
      }
      vec2 warped=clamp(vUv+displacement,vec2(.001),vec2(.999));
      vec3 color;
      if(uPhoto){
        vec2 uv=.5+(warped-.5)*uCover;
        vec2 aberration=displacement*uCover*.06;
        color=vec3(texture2D(uImage,uv+aberration).r,texture2D(uImage,uv).g,texture2D(uImage,uv-aberration).b);
        color+=shine*.018;
      }else{
        vec2 dots=fract(warped*uResolution/29.)-.5;
        float grain=1.-smoothstep(.018,.045,length(dots));
        color=vec3(.0627,.0667,.0745)+grain*.012;
        color+=vec3(.065,.080,.048)*max(shine,0.)-vec3(.008)*max(-shine,0.);
      }
      gl_FragColor=vec4(clamp(color,0.,1.),1.);
    }`;
  const effects=[];
  function createEffect(host,image,background=false){
    const canvas=document.createElement('canvas');
    canvas.className=background?'surface-water':'water-canvas';
    canvas.setAttribute('aria-hidden','true');
    if(image&&image.classList.contains('alternate-crop'))canvas.classList.add('alternate-water');
    const gl=canvas.getContext('webgl',{alpha:false,antialias:false,preserveDrawingBuffer:true,powerPreference:'low-power'});
    if(!gl)return null;
    function shader(type,source){const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)){gl.deleteShader(s);return null;}return s;}
    const vs=shader(gl.VERTEX_SHADER,vertex),fs=shader(gl.FRAGMENT_SHADER,fragment);
    if(!vs||!fs)return null;
    const program=gl.createProgram();gl.attachShader(program,vs);gl.attachShader(program,fs);gl.linkProgram(program);
    if(!gl.getProgramParameter(program,gl.LINK_STATUS))return null;
    gl.useProgram(program);
    const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
    const attribute=gl.getAttribLocation(program,'aPosition');gl.enableVertexAttribArray(attribute);gl.vertexAttribPointer(attribute,2,gl.FLOAT,false,0,0);
    const uniforms={};['uImage','uResolution','uCover','uTime','uCount','uPhoto','uDrops[0]'].forEach(name=>uniforms[name]=gl.getUniformLocation(program,name));
    const texture=gl.createTexture();gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,texture);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);
    if(image)gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,image);
    else gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,1,1,0,gl.RGBA,gl.UNSIGNED_BYTE,new Uint8Array([16,17,19,255]));
    gl.uniform1i(uniforms.uImage,0);gl.uniform1i(uniforms.uPhoto,!background);
    const board=host.classList.contains('board-photo');
    let cssWidth=1,cssHeight=1,drops=[],raf=0,lastPoint=null,lost=false;
    if(background)host.prepend(canvas);else host.append(canvas);
    function resize(){
      if(!host.clientWidth||!host.clientHeight)return;
      cssWidth=canvas.clientWidth||host.clientWidth;cssHeight=canvas.clientHeight||host.clientHeight;
      const dpr=Math.min(window.devicePixelRatio||1,background?1:1.5);
      canvas.width=Math.round(cssWidth*dpr);canvas.height=Math.round(cssHeight*dpr);gl.viewport(0,0,canvas.width,canvas.height);gl.uniform2f(uniforms.uResolution,cssWidth,cssHeight);
      const aspect=cssWidth/cssHeight,imgAspect=image?image.naturalWidth/image.naturalHeight:aspect;
      gl.uniform2f(uniforms.uCover,imgAspect>aspect?aspect/imgAspect:1,imgAspect>aspect?1:imgAspect/aspect);
      draw(performance.now());
    }
    function draw(now){
      if(lost)return;
      const time=now/1000;drops=drops.filter(d=>time-d.time<2.7);
      const values=new Float32Array(40);drops.forEach((d,i)=>values.set([d.x,d.y,d.time,d.strength],i*4));
      gl.useProgram(program);gl.uniform1f(uniforms.uTime,time);gl.uniform1i(uniforms.uCount,drops.length);gl.uniform4fv(uniforms['uDrops[0]'],values);gl.drawArrays(gl.TRIANGLES,0,6);
    }
    function animate(now){raf=0;draw(now);if(drops.length&&!document.hidden&&!reduced.matches)raf=requestAnimationFrame(animate);}
    function pulse(event){
      if(lost||reduced.matches||!fine.matches||document.body.classList.contains('motion-paused'))return;
      const r=canvas.getBoundingClientRect();if(!r.width||!r.height)return;
      const x=clamp((event.clientX-r.left)/r.width,0,1),y=1-clamp((event.clientY-r.top)/r.height,0,1),time=performance.now()/1000;
      const distance=lastPoint?Math.hypot((x-lastPoint.x)*cssWidth,(y-lastPoint.y)*cssHeight):12;
      if(lastPoint&&time-lastPoint.time<.045&&distance<18)return;
      if(lastPoint&&distance<3&&time-lastPoint.time<.18)return;
      drops.push({x,y,time,strength:background?.85:clamp(.75+distance/60,.75,1.3)});if(drops.length>10)drops.shift();lastPoint={x,y,time};
      if(!raf)raf=requestAnimationFrame(animate);
    }
    canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();lost=true;cancelAnimationFrame(raf);canvas.classList.remove('is-ready');});
    host.addEventListener('pointermove',pulse,{passive:true});host.addEventListener('pointerenter',pulse,{passive:true});host.addEventListener('pointerleave',()=>{lastPoint=null;});
    const effect={resize,pulse,clear(){drops=[];lastPoint=null;cancelAnimationFrame(raf);raf=0;draw(performance.now());}};effects.push(effect);
    resize();if(!background)canvas.classList.add('is-ready');return effect;
  }
  const stage=document.querySelector('.orbit-stage');
  if(!document.querySelector('.world-background')&&!reduced.matches&&fine.matches)createEffect(stage,null,true);
  document.querySelectorAll('.orbit-card-inner,.board-photo').forEach(host=>{
    let effect=null,attempted=false;
    function initialize(event){
      if(effect){effect.pulse(event);return;}
      if(attempted||reduced.matches||!fine.matches)return;
      const image=host.querySelector('img');if(!image.complete||!image.naturalWidth)return;
      attempted=true;effect=createEffect(host,image);if(effect)effect.pulse(event);
    }
    host.addEventListener('pointerenter',initialize,{passive:true});host.addEventListener('pointermove',initialize,{passive:true});
  });
  window.addEventListener('resize',()=>effects.forEach(effect=>effect.resize()),{passive:true});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)effects.forEach(effect=>effect.clear());});
  reduced.addEventListener('change',()=>{if(reduced.matches)effects.forEach(effect=>effect.clear());});
})();

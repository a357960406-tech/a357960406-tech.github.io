(() => {
  const canvas = document.querySelector('.background-water');
  if (!canvas) return;
  const gl = canvas.getContext('webgl', {alpha:false, antialias:false, preserveDrawingBuffer:true, powerPreference:'low-power'});
  if (!gl) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const fine = matchMedia('(hover:hover) and (pointer:fine)');
  const vertex = `attribute vec2 aPosition;varying vec2 vUv;void main(){vUv=aPosition*.5+.5;gl_Position=vec4(aPosition,0.,1.);}`;
  const fragment = `
    precision highp float;
    varying vec2 vUv;
    uniform sampler2D uImage,uBlurImage;
    uniform vec2 uResolution,uCover,uMouse;
    uniform float uTime,uHover,uScroll;
    uniform int uCount;
    uniform vec4 uDrops[8];
    vec3 photograph(vec2 uv){return texture2D(uImage,clamp(uv,vec2(.001),vec2(.999))).rgb;}
    void main(){
      float aspect=uResolution.x/uResolution.y;
      vec2 displacement=vec2(0.);
      float reflection=0.;
      for(int i=0;i<8;i++){
        if(i>=uCount)break;
        float age=uTime-uDrops[i].z;
        if(age<0.||age>3.)continue;
        vec2 delta=(vUv-uDrops[i].xy)*vec2(aspect,1.);
        float distance=length(delta),front=age*.27,band=(distance-front)*16.;
        float envelope=exp(-band*band)*exp(-age*1.45)*(1.-smoothstep(2.3,3.,age));
        float phase=(distance-front)*62.;
        displacement+=delta/max(distance,.004)/vec2(aspect,1.)*sin(phase)*envelope*.014*uDrops[i].w;
        reflection+=cos(phase)*envelope*uDrops[i].w;
      }
      vec2 uv=.5+(vUv+displacement-.5)*uCover*.87+vec2(0.,uScroll*.016);
      vec3 blurred=texture2D(uBlurImage,clamp(uv,vec2(.001),vec2(.999))).rgb;
      vec2 cursorDistance=(vUv-uMouse)*uResolution;
      float lens=exp(-dot(cursorDistance,cursorDistance)/(230.*230.))*uHover;
      vec3 ambient=blurred*.36+vec3(.016,.025,.045);
      vec3 revealed=photograph(uv)*.72+vec3(.014,.020,.035);
      vec3 color=mix(ambient,revealed,lens*.86);
      color+=vec3(.03,.055,.07)*reflection*.18;
      color+=vec3(.014,.021,.022)*lens;
      gl_FragColor=vec4(color,1.);
    }`;
  function shader(type, source) {
    const shader=gl.createShader(type);gl.shaderSource(shader,source);gl.compileShader(shader);
    return gl.getShaderParameter(shader,gl.COMPILE_STATUS)?shader:null;
  }
  const vs=shader(gl.VERTEX_SHADER,vertex),fs=shader(gl.FRAGMENT_SHADER,fragment);
  if(!vs||!fs)return;
  const program=gl.createProgram();gl.attachShader(program,vs);gl.attachShader(program,fs);gl.linkProgram(program);
  if(!gl.getProgramParameter(program,gl.LINK_STATUS))return;
  gl.useProgram(program);
  const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
  gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
  const position=gl.getAttribLocation(program,'aPosition');gl.enableVertexAttribArray(position);gl.vertexAttribPointer(position,2,gl.FLOAT,false,0,0);
  const uniforms={};['uImage','uBlurImage','uResolution','uCover','uMouse','uTime','uHover','uScroll','uCount','uDrops[0]'].forEach(name=>uniforms[name]=gl.getUniformLocation(program,name));
  const texture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,texture);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);gl.uniform1i(uniforms.uImage,0);gl.uniform1i(uniforms.uBlurImage,1);
  const blurTexture=gl.createTexture();gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,blurTexture);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
  gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,texture);
  let width=1,height=1,ready=false,lost=false,raf=0,lastFrame=0,clock=0,lastTime=0;
  let pointer={x:.5,y:.5},smooth={x:.5,y:.5},hover=0,targetHover=0,scroll=window.scrollY/innerHeight,drops=[],lastPoint=null;
  const image=new Image();image.src='assets/night-sky.jpg';
  function resize(){
    width=innerWidth;height=innerHeight;
    const dpr=Math.min(devicePixelRatio||1,1,Math.sqrt(1100000/(width*height)));
    canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);gl.viewport(0,0,canvas.width,canvas.height);
    gl.uniform2f(uniforms.uResolution,width,height);
    const aspect=width/height,photoAspect=image.naturalWidth/image.naturalHeight;
    if(ready){
      const coverX=photoAspect>aspect?aspect/photoAspect:1;
      gl.uniform2f(uniforms.uCover,coverX,photoAspect>aspect?1:photoAspect/aspect);
      const blurred=document.createElement('canvas');blurred.width=640;blurred.height=Math.round(640/photoAspect);
      const context=blurred.getContext('2d',{alpha:false});
      context.filter=`blur(${27*640*coverX/width}px)`;context.drawImage(image,0,0,blurred.width,blurred.height);
      gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,blurTexture);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,blurred);
      gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,texture);
    }
  }
  function draw(now){
    raf=0;if(!ready||lost||document.hidden)return;
    if(now-lastFrame<32){raf=requestAnimationFrame(draw);return;}lastFrame=now;
    const dt=lastTime?Math.min((now-lastTime)/1000,.1):0;lastTime=now;
    const paused=reduced.matches||document.body.classList.contains('motion-paused');
    if(!paused)clock+=dt;
    smooth.x+=(pointer.x-smooth.x)*.18;smooth.y+=(pointer.y-smooth.y)*.18;hover+=(targetHover-hover)*.12;
    scroll+=(window.scrollY/height-scroll)*.06;
    drops=drops.filter(drop=>clock-drop.time<3);
    const values=new Float32Array(32);drops.forEach((drop,i)=>values.set([drop.x,drop.y,drop.time,drop.strength],i*4));
    gl.uniform2f(uniforms.uMouse,smooth.x,smooth.y);gl.uniform1f(uniforms.uHover,hover);gl.uniform1f(uniforms.uScroll,reduced.matches?0:Math.min(scroll,4));
    gl.uniform1f(uniforms.uTime,clock);gl.uniform1i(uniforms.uCount,paused?0:drops.length);gl.uniform4fv(uniforms['uDrops[0]'],values);
    gl.drawArrays(gl.TRIANGLES,0,6);canvas.classList.add('is-ready');raf=requestAnimationFrame(draw);
  }
  window.addEventListener('pointermove',event=>{
    if(!fine.matches||event.pointerType==='touch'||reduced.matches)return;
    pointer={x:event.clientX/width,y:1-event.clientY/height};targetHover=1;
    if(document.body.classList.contains('motion-paused'))return;
    const distance=lastPoint?Math.hypot(event.clientX-lastPoint.x,event.clientY-lastPoint.y):20;
    if(lastPoint&&(clock-lastPoint.time<.055||distance<4))return;
    drops.push({x:pointer.x,y:pointer.y,time:clock,strength:Math.min(1,distance/35+.45)});
    if(drops.length>8)drops.shift();lastPoint={x:event.clientX,y:event.clientY,time:clock};
  },{passive:true});
  document.documentElement.addEventListener('pointerleave',()=>{targetHover=0;lastPoint=null;});
  window.addEventListener('blur',()=>{targetHover=0;lastPoint=null;});
  window.addEventListener('resize',resize,{passive:true});
  reduced.addEventListener('change',()=>{drops=[];targetHover=0;});
  document.addEventListener('visibilitychange',()=>{
    cancelAnimationFrame(raf);raf=0;lastTime=0;
    if(!document.hidden&&ready&&!lost)raf=requestAnimationFrame(draw);
  });
  canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();lost=true;cancelAnimationFrame(raf);canvas.classList.remove('is-ready');});
  image.onload=()=>{if(ready)return;gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,image);ready=true;resize();raf=requestAnimationFrame(draw);};
  if(image.complete&&image.naturalWidth)image.onload();
})();

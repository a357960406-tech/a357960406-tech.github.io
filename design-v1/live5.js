(() => {
  const host=document.querySelector('.focus-photo'),canvas=host?.querySelector('.live-canvas');
  if(!canvas)return;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const gl=canvas.getContext('webgl',{alpha:false,antialias:false,preserveDrawingBuffer:true,powerPreference:'low-power'});
  if(!gl)return;
  const vertex=`attribute vec2 aPosition;varying vec2 vUv;void main(){vUv=aPosition*.5+.5;gl_Position=vec4(aPosition,0.,1.);}`;
  const fragment=`
    precision highp float;
    varying vec2 vUv;
    uniform sampler2D uImage;
    uniform vec2 uCover,uResolution;
    uniform float uTime,uMode;
    uniform int uCount;
    uniform vec4 uDrops[8];
    void main(){
      float aspect=uResolution.x/uResolution.y;
      vec2 distortion=vec2(0.);float reflection=0.;
      for(int i=0;i<8;i++){
        if(i>=uCount)break;
        float age=uTime-uDrops[i].z;
        if(age<0.||age>2.3)continue;
        vec2 delta=(vUv-uDrops[i].xy)*vec2(aspect,1.);
        float distance=length(delta),front=age*.32,band=(distance-front)*19.;
        float envelope=exp(-band*band)*exp(-age*1.9),phase=(distance-front)*68.;
        distortion+=delta/max(distance,.003)/vec2(aspect,1.)*sin(phase)*envelope*.009*uDrops[i].w;
        reflection+=cos(phase)*envelope;
      }
      float push=1.065+sin(uTime*.43)*.018;
      vec2 motion=vec2(sin(uTime*.36)*.012,cos(uTime*.29)*.009);
      float sky=smoothstep(.45,.92,vUv.y);
      if(uMode>.5&&uMode<1.5)motion.x+=sin(vUv.y*15.+uTime*.62)*sky*.003;
      vec2 uv=.5+((vUv-.5)/push+motion+distortion)*uCover;
      vec3 color=texture2D(uImage,clamp(uv,vec2(.002),vec2(.998))).rgb;
      float light=sin(vUv.x*2.5+uTime*.6)*.009;
      if(uMode>1.5)light+=sin(uTime*1.3+vUv.y*12.)*.009;
      color+=light+reflection*.014;
      gl_FragColor=vec4(clamp(color,0.,1.),1.);
    }`;
  function shader(type,source){const shader=gl.createShader(type);gl.shaderSource(shader,source);gl.compileShader(shader);return gl.getShaderParameter(shader,gl.COMPILE_STATUS)?shader:null;}
  const vs=shader(gl.VERTEX_SHADER,vertex),fs=shader(gl.FRAGMENT_SHADER,fragment);if(!vs||!fs)return;
  const program=gl.createProgram();gl.attachShader(program,vs);gl.attachShader(program,fs);gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))return;
  gl.useProgram(program);const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
  gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
  const position=gl.getAttribLocation(program,'aPosition');gl.enableVertexAttribArray(position);gl.vertexAttribPointer(position,2,gl.FLOAT,false,0,0);
  const uniforms={};['uImage','uCover','uResolution','uTime','uMode','uCount','uDrops[0]'].forEach(name=>uniforms[name]=gl.getUniformLocation(program,name));
  const texture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,texture);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);gl.uniform1i(uniforms.uImage,0);
  let playing=false,ready=false,lost=false,raf=0,serial=0,time=0,lastTime=0,lastFrame=0,photo=null,drops=[],lastPoint=null;
  const photographs=new Map();
  function resize(){
    const width=canvas.clientWidth,height=canvas.clientHeight;if(!width||!height)return;
    const dpr=Math.min(devicePixelRatio||1,1.5);canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);gl.viewport(0,0,canvas.width,canvas.height);gl.uniform2f(uniforms.uResolution,width,height);
    if(photo){const aspect=width/height,photoAspect=photo.naturalWidth/photo.naturalHeight;gl.uniform2f(uniforms.uCover,photoAspect>aspect?aspect/photoAspect:1,photoAspect>aspect?1:photoAspect/aspect);}
  }
  function draw(now){
    raf=0;if(!playing||!ready||lost||document.hidden)return;
    if(now-lastFrame<32){raf=requestAnimationFrame(draw);return;}lastFrame=now;
    const dt=lastTime?Math.min((now-lastTime)/1000,.1):0;lastTime=now;
    const paused=reduced.matches||document.body.classList.contains('motion-paused');if(!paused)time+=dt;
    drops=drops.filter(drop=>time-drop.time<2.3);const values=new Float32Array(32);drops.forEach((drop,i)=>values.set([drop.x,drop.y,drop.time,drop.strength],i*4));
    gl.uniform1f(uniforms.uTime,time);gl.uniform1i(uniforms.uCount,paused?0:drops.length);gl.uniform4fv(uniforms['uDrops[0]'],values);gl.drawArrays(gl.TRIANGLES,0,6);
    canvas.classList.add('is-ready');host.classList.add('has-live');canvas.dataset.liveState=paused?'paused':'playing';
    if(!reduced.matches)raf=requestAnimationFrame(draw);
  }
  document.addEventListener('Dribbble:focus',event=>{
    const request=++serial;playing=true;ready=false;cancelAnimationFrame(raf);canvas.classList.remove('is-ready');host.classList.remove('has-live');canvas.dataset.liveState='loading';
    let image=photographs.get(event.detail.src);if(!image){image=new Image();photographs.set(event.detail.src,image);image.src=event.detail.src;}
    const show=()=>{if(request!==serial||!playing||lost||!image.naturalWidth)return;photo=image;time=0;lastTime=0;lastFrame=0;drops=[];lastPoint=null;gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,image);gl.uniform1f(uniforms.uMode,event.detail.mode);resize();ready=true;raf=requestAnimationFrame(draw);};
    if(image.complete&&image.naturalWidth)show();else image.addEventListener('load',show,{once:true});
  });
  document.addEventListener('Dribbble:blur',()=>{serial++;playing=false;ready=false;cancelAnimationFrame(raf);raf=0;canvas.dataset.liveState='idle';});
  host.addEventListener('pointermove',event=>{
    if(!playing||reduced.matches||document.body.classList.contains('motion-paused'))return;
    const r=host.getBoundingClientRect(),x=clamp((event.clientX-r.left)/r.width),y=1-clamp((event.clientY-r.top)/r.height);
    if(lastPoint&&time-lastPoint.time<.07)return;
    drops.push({x,y,time,strength:.8});if(drops.length>8)drops.shift();lastPoint={time};
  },{passive:true});
  function clamp(value){return Math.max(0,Math.min(1,value));}
  document.addEventListener('visibilitychange',()=>{cancelAnimationFrame(raf);raf=0;lastTime=0;if(!document.hidden&&playing&&ready)raf=requestAnimationFrame(draw);});
  reduced.addEventListener('change',()=>{drops=[];if(playing&&ready&&!raf)raf=requestAnimationFrame(draw);});
  document.querySelector('.motion-toggle').addEventListener('click',()=>{if(playing&&ready&&!raf)raf=requestAnimationFrame(draw);});
  window.addEventListener('resize',resize,{passive:true});
  canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();lost=true;cancelAnimationFrame(raf);canvas.classList.remove('is-ready');host.classList.remove('has-live');canvas.dataset.liveState='fallback';});
})();

(()=>{
  const windowEl=document.querySelector('.depth-window'),photo=windowEl?.querySelector('.depth-photo'),canvas=windowEl?.querySelector('.depth-canvas');
  if(!canvas||!photo)return;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const gl=canvas.getContext('webgl',{alpha:false,antialias:true,powerPreference:'low-power'});
  if(!gl)return;
  let program,texture,ready=false,active=false,pullback=0,lookdown=0,spanX=1,spanY=1,raf=0,pointer={x:0,y:0},target={x:0,y:0},lastWidth=0,lastHeight=0;
  const vertex=`
    attribute vec2 a_position;
    attribute vec2 a_uv;
    uniform float u_pullback;
    uniform float u_lookdown;
    uniform float u_focus;
    uniform vec2 u_span;
    uniform vec2 u_pointer;
    varying vec2 v_uv;
    void main(){
      vec2 source=vec2(.5+(a_uv.x-.5)*u_span.x,u_focus+(a_uv.y-.5)*u_span.y);
      float ground=smoothstep(.71,.97,source.y);
      // Keep the central architecture together; street foreground responds more strongly.
      float building=smoothstep(.20,.30,source.x)*(1.-smoothstep(.77,.86,source.x))
        *smoothstep(.24,.32,source.y)*(1.-smoothstep(.72,.79,source.y));
      float depth=.10+building*.25+ground*.58;
      float projection=1.035+(1.-u_pullback)*(.30+depth*.14)+u_lookdown*.12;
      vec2 vanishing=vec2(.0,-.08);
      vec2 position=vanishing+(a_position-vanishing)*projection;
      position+=u_pointer*(.010+depth*.020);
      // A slight perspective pitch accompanies the downward movement through the photograph.
      float perspective=1.+u_lookdown*.10*position.y;
      gl_Position=vec4(position,0.,perspective);
      v_uv=source;
    }`;
  const fragment=`
    precision mediump float;
    uniform sampler2D u_photo;
    varying vec2 v_uv;
    void main(){gl_FragColor=texture2D(u_photo,v_uv);}`;
  function shader(type,source){const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error('Depth shader unavailable');return s;}
  let position,uv,positionBuffer,uvBuffer,indexBuffer,count,pullbackUniform,lookdownUniform,focusUniform,spanUniform,pointerUniform;
  try{
    program=gl.createProgram();gl.attachShader(program,shader(gl.VERTEX_SHADER,vertex));gl.attachShader(program,shader(gl.FRAGMENT_SHADER,fragment));gl.linkProgram(program);
    if(!gl.getProgramParameter(program,gl.LINK_STATUS))return;
    gl.useProgram(program);position=gl.getAttribLocation(program,'a_position');uv=gl.getAttribLocation(program,'a_uv');
    pullbackUniform=gl.getUniformLocation(program,'u_pullback');lookdownUniform=gl.getUniformLocation(program,'u_lookdown');focusUniform=gl.getUniformLocation(program,'u_focus');spanUniform=gl.getUniformLocation(program,'u_span');pointerUniform=gl.getUniformLocation(program,'u_pointer');
    positionBuffer=gl.createBuffer();uvBuffer=gl.createBuffer();indexBuffer=gl.createBuffer();
    gl.enableVertexAttribArray(position);gl.enableVertexAttribArray(uv);
    texture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,texture);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
    gl.uniform1i(gl.getUniformLocation(program,'u_photo'),0);
  }catch{return;}
  function resize(){
    const w=Math.round(windowEl.clientWidth),h=Math.round(windowEl.clientHeight);if(!w||!h)return;
    if(w===lastWidth&&h===lastHeight)return;lastWidth=w;lastHeight=h;
    const dpr=Math.min(devicePixelRatio||1,1.5,Math.sqrt(3200000/(w*h)));
    canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);gl.viewport(0,0,canvas.width,canvas.height);
    const imageAspect=photo.naturalWidth/photo.naturalHeight,aspect=w/h;
    spanX=Math.min(1,aspect/imageAspect);spanY=Math.min(1,imageAspect/aspect);
    const positions=[],uvs=[],indices=[],columns=80,rows=64;
    for(let y=0;y<=rows;y++)for(let x=0;x<=columns;x++){
      const sx=x/columns,sy=y/rows;
      positions.push((sx*2-1)*1.02,(1-sy*2)*1.02);
      uvs.push(sx,sy);
    }
    for(let y=0;y<rows;y++)for(let x=0;x<columns;x++){const i=y*(columns+1)+x;indices.push(i,i+1,i+columns+1,i+1,i+columns+2,i+columns+1);}
    gl.bindBuffer(gl.ARRAY_BUFFER,positionBuffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(positions),gl.STATIC_DRAW);gl.vertexAttribPointer(position,2,gl.FLOAT,false,0,0);
    gl.bindBuffer(gl.ARRAY_BUFFER,uvBuffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(uvs),gl.STATIC_DRAW);gl.vertexAttribPointer(uv,2,gl.FLOAT,false,0,0);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,indexBuffer);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(indices),gl.STATIC_DRAW);count=indices.length;
  }
  function schedule(){if(ready&&!raf&&!document.hidden&&!reduced.matches)raf=requestAnimationFrame(draw);}
  function draw(){
    raf=0;if(!ready||document.hidden||reduced.matches)return;
    resize();if(!count)return;
    pointer.x+=(target.x-pointer.x)*.18;pointer.y+=(target.y-pointer.y)*.18;
    const focus=Math.max(spanY*.5+.002,Math.min(1-spanY*.5-.002,.61-.12*pullback+.26*lookdown));
    gl.uniform1f(pullbackUniform,pullback);gl.uniform1f(lookdownUniform,lookdown);gl.uniform1f(focusUniform,focus);gl.uniform2f(spanUniform,spanX,spanY);gl.uniform2f(pointerUniform,pointer.x,pointer.y);gl.drawElements(gl.TRIANGLES,count,gl.UNSIGNED_SHORT,0);
    canvas.dataset.pullback=pullback.toFixed(4);canvas.dataset.lookdown=lookdown.toFixed(4);canvas.dataset.focus=focus.toFixed(4);
    if(active&&Math.hypot(target.x-pointer.x,target.y-pointer.y)>.002)schedule();
  }
  async function load(){
    try{
      await photo.decode();
      // Cap texture memory independently of the original high-resolution download.
      const limit=Math.min(4096,gl.getParameter(gl.MAX_TEXTURE_SIZE)),scale=Math.min(1,limit/Math.max(photo.naturalWidth,photo.naturalHeight));let source=photo;
      if(scale<1){source=document.createElement('canvas');source.width=Math.round(photo.naturalWidth*scale);source.height=Math.round(photo.naturalHeight*scale);source.getContext('2d').drawImage(photo,0,0,source.width,source.height);}
      gl.bindTexture(gl.TEXTURE_2D,texture);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGB,gl.RGB,gl.UNSIGNED_BYTE,source);
      if(gl.getError()!==gl.NO_ERROR)return;
      ready=true;resize();draw();windowEl.dataset.depth='ready';
    }catch{windowEl.dataset.depth='fallback';}
  }
  document.addEventListener('depth-frame',e=>{pullback=e.detail.pullback;lookdown=e.detail.lookdown;active=e.detail.active;if(active)schedule();else{target={x:0,y:0};}});
  windowEl.closest('.work-slot').addEventListener('pointermove',e=>{if(!active||e.pointerType==='touch')return;target={x:(e.clientX/innerWidth-.5)*2,y:-(e.clientY/innerHeight-.5)*2};schedule();},{passive:true});
  windowEl.closest('.work-slot').addEventListener('pointerleave',()=>{target={x:0,y:0};schedule();});
  new ResizeObserver(()=>{if(active)schedule();}).observe(windowEl);
  canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();ready=false;windowEl.dataset.depth='fallback';cancelAnimationFrame(raf);raf=0;});
  document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(raf);raf=0;}else if(active)schedule();});
  reduced.addEventListener('change',()=>{if(!reduced.matches)schedule();});
  load();
})();

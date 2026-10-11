(()=>{
  const windowEl=document.querySelector('.depth-window'),photo=windowEl?.querySelector('.depth-photo'),canvas=windowEl?.querySelector('.depth-canvas');
  if(!canvas||!photo)return;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const gl=canvas.getContext('webgl',{alpha:false,antialias:true,powerPreference:'low-power'});
  if(!gl)return;
  let program,texture,ready=false,active=false,approach=0,raf=0,pointer={x:0,y:0},target={x:0,y:0},lastWidth=0,lastHeight=0;
  const vertex=`
    attribute vec2 a_position;
    attribute vec2 a_uv;
    uniform float u_approach;
    uniform vec2 u_pointer;
    varying vec2 v_uv;
    void main(){
      // The ground rises toward the camera; the skyline remains almost stationary.
      float ground=smoothstep(.39,.94,a_uv.y);
      float rock=exp(-pow((a_uv.x-.35)*3.2,2.0)-pow((a_uv.y-.75)*6.0,2.0));
      float depth=.055+ground*.76+rock*.12;
      float projection=(1.025+u_approach*.025)/(1.0-u_approach*depth*.67);
      vec2 vanishing=vec2(.02,.44);
      vec2 position=vanishing+(a_position-vanishing)*projection;
      position+=u_pointer*(.012+depth*.055);
      position.y-=u_approach*ground*.035;
      gl_Position=vec4(position,0.,1.);
      v_uv=a_uv;
    }`;
  const fragment=`
    precision mediump float;
    uniform sampler2D u_photo;
    varying vec2 v_uv;
    void main(){gl_FragColor=texture2D(u_photo,v_uv);}`;
  function shader(type,source){const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error('Depth shader unavailable');return s;}
  let position,uv,positionBuffer,uvBuffer,indexBuffer,count,approachUniform,pointerUniform;
  try{
    program=gl.createProgram();gl.attachShader(program,shader(gl.VERTEX_SHADER,vertex));gl.attachShader(program,shader(gl.FRAGMENT_SHADER,fragment));gl.linkProgram(program);
    if(!gl.getProgramParameter(program,gl.LINK_STATUS))return;
    gl.useProgram(program);position=gl.getAttribLocation(program,'a_position');uv=gl.getAttribLocation(program,'a_uv');
    approachUniform=gl.getUniformLocation(program,'u_approach');pointerUniform=gl.getUniformLocation(program,'u_pointer');
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
    const spanX=Math.min(1,aspect/imageAspect),spanY=Math.min(1,imageAspect/aspect);
    const offsetX=(1-spanX)*.5,offsetY=(1-spanY)*.62;
    const positions=[],uvs=[],indices=[],columns=80,rows=64;
    for(let y=0;y<=rows;y++)for(let x=0;x<=columns;x++){
      const sx=x/columns,sy=y/rows;
      positions.push((sx*2-1)*1.02,(1-sy*2)*1.02);
      uvs.push(offsetX+sx*spanX,offsetY+sy*spanY);
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
    gl.uniform1f(approachUniform,approach);gl.uniform2f(pointerUniform,pointer.x,pointer.y);gl.drawElements(gl.TRIANGLES,count,gl.UNSIGNED_SHORT,0);
    canvas.dataset.approach=approach.toFixed(4);
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
  document.addEventListener('depth-frame',e=>{approach=e.detail.approach;active=e.detail.active;if(active)schedule();else{target={x:0,y:0};}});
  windowEl.closest('.work-slot').addEventListener('pointermove',e=>{if(!active||e.pointerType==='touch')return;target={x:(e.clientX/innerWidth-.5)*2,y:-(e.clientY/innerHeight-.5)*2};schedule();},{passive:true});
  windowEl.closest('.work-slot').addEventListener('pointerleave',()=>{target={x:0,y:0};schedule();});
  new ResizeObserver(()=>{if(active)schedule();}).observe(windowEl);
  canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();ready=false;windowEl.dataset.depth='fallback';cancelAnimationFrame(raf);raf=0;});
  document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(raf);raf=0;}else if(active)schedule();});
  reduced.addEventListener('change',()=>{if(!reduced.matches)schedule();});
  load();
})();

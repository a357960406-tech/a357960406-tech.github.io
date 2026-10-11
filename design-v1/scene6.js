(() => {
  const stage=document.querySelector('.space-stage'),canvas=document.querySelector('.space-canvas');
  if(!canvas)return;
  const gl=canvas.getContext('webgl',{alpha:true,antialias:true,premultipliedAlpha:false,preserveDrawingBuffer:true,powerPreference:'low-power'});
  if(!gl)return;
  const cards=Array.from(document.querySelectorAll('.space-card'));
  const rotate=(p,a)=>{let [x,y,z]=p;let c=Math.cos(a[0]),s=Math.sin(a[0]);[y,z]=[c*y-s*z,s*y+c*z];c=Math.cos(a[1]);s=Math.sin(a[1]);[x,z]=[c*x+s*z,-s*x+c*z];c=Math.cos(a[2]);s=Math.sin(a[2]);return [c*x-s*y,s*x+c*y,z];};
  const vertex=`
    attribute vec3 aPosition,aNormal;
    attribute vec2 aUv;
    uniform vec3 uCenter,uAngles,uCamera;
    uniform vec2 uSize,uViewAngles,uViewport;
    uniform float uFocal,uThickness;
    varying vec2 vUv;
    varying vec3 vNormal;
    varying float vDepth;
    vec3 rotate(vec3 p,vec3 a){
      float c=cos(a.x),s=sin(a.x);p=vec3(p.x,c*p.y-s*p.z,s*p.y+c*p.z);
      c=cos(a.y);s=sin(a.y);p=vec3(c*p.x+s*p.z,p.y,-s*p.x+c*p.z);
      c=cos(a.z);s=sin(a.z);return vec3(c*p.x-s*p.y,s*p.x+c*p.y,p.z);
    }
    void main(){
      vec3 world=rotate(vec3(aPosition.xy*uSize,aPosition.z*uThickness),uAngles)+uCenter;
      vec3 view=rotate(world-uCamera,vec3(uViewAngles,0.));
      vUv=aUv;vNormal=rotate(aNormal,uAngles);vDepth=-view.z;
      gl_Position=vec4(view.x*2.*uFocal/uViewport.x,view.y*2.*uFocal/uViewport.y,1.006689*vDepth-40.13378,vDepth);
    }`;
  const fragment=`
    precision highp float;
    varying vec2 vUv;varying vec3 vNormal;varying float vDepth;
    uniform sampler2D uImage;
    uniform vec2 uCover,uSize;
    uniform vec3 uTint;
    uniform bool uPhoto,uPick;
    uniform float uId,uOpacity;
    void main(){
      if(uPhoto){
        vec2 q=abs((vUv-.5)*uSize)-uSize*.5+5.;
        float corner=length(max(q,0.))+min(max(q.x,q.y),0.)-5.;
        if(corner>0.)discard;
      }
      if(uPick){gl_FragColor=vec4(uId/255.,0.,0.,1.);return;}
      vec3 n=normalize(vNormal);float light=max(dot(n,normalize(vec3(-.4,.8,1.2))),0.);
      vec3 color=uTint*(.3+light*.7);
      if(uPhoto){
        vec2 uv=.5+(vUv-.5)*uCover;color=texture2D(uImage,uv).rgb;
        vec2 edge=min(vUv,1.-vUv)*uSize;
        float rim=1.-smoothstep(1.5,3.2,min(edge.x,edge.y));
        color=mix(color,vec3(.52,.73,.77)*(.48+light*.5),rim*.75);
        color*=.92+light*.08;
      }
      float fog=smoothstep(1900.,4000.,vDepth)*.30;
      color=mix(color,vec3(.018,.025,.041),fog);
      gl_FragColor=vec4(color,uOpacity);
    }`;
  const pointVertex=`
    attribute vec3 aPosition;uniform vec3 uCamera;uniform vec2 uViewAngles,uViewport;uniform float uFocal,uDpr;
    varying float vAlpha;
    void main(){
      vec3 p=aPosition-uCamera;float c=cos(uViewAngles.x),s=sin(uViewAngles.x);p=vec3(p.x,c*p.y-s*p.z,s*p.y+c*p.z);
      c=cos(uViewAngles.y);s=sin(uViewAngles.y);p=vec3(c*p.x+s*p.z,p.y,-s*p.x+c*p.z);
      float d=-p.z;gl_Position=vec4(p.x*2.*uFocal/uViewport.x,p.y*2.*uFocal/uViewport.y,1.006689*d-40.13378,d);
      gl_PointSize=clamp(uFocal/max(d,30.)*3.,.7,2.5)*uDpr;vAlpha=.18+clamp(1.-d/4800.,0.,1.)*.32;
    }`;
  const pointFragment=`precision highp float;varying float vAlpha;void main(){float d=length(gl_PointCoord-.5);if(d>.5)discard;gl_FragColor=vec4(.56,.73,.82,vAlpha*(1.-smoothstep(.10,.5,d)));}`;
  function compile(type,source){const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)){canvas.dataset.sceneError=gl.getShaderInfoLog(s);return null;}return s;}
  function program(v,f){const vs=compile(gl.VERTEX_SHADER,v),fs=compile(gl.FRAGMENT_SHADER,f);if(!vs||!fs)return null;const p=gl.createProgram();gl.attachShader(p,vs);gl.attachShader(p,fs);gl.linkProgram(p);if(!gl.getProgramParameter(p,gl.LINK_STATUS)){canvas.dataset.sceneError=gl.getProgramInfoLog(p);return null;}return p;}
  const photoProgram=program(vertex,fragment),starProgram=program(pointVertex,pointFragment);if(!photoProgram||!starProgram)return;
  const uniformNames=['uCenter','uAngles','uCamera','uSize','uViewAngles','uViewport','uFocal','uThickness','uImage','uCover','uTint','uPhoto','uPick','uId','uOpacity'];
  const uniforms=Object.fromEntries(uniformNames.map(name=>[name,gl.getUniformLocation(photoProgram,name)]));
  const attributes=['aPosition','aNormal','aUv'].map(name=>gl.getAttribLocation(photoProgram,name));
  const starUniforms=Object.fromEntries(['uCamera','uViewAngles','uViewport','uFocal','uDpr'].map(name=>[name,gl.getUniformLocation(starProgram,name)]));
  const starAttribute=gl.getAttribLocation(starProgram,'aPosition');
  const corners=[[-.5,-.5],[.5,-.5],[.5,.5],[-.5,.5]],front=[],sides=[];
  function triangle(output,points,normal){points.forEach(p=>output.push(...p.slice(0,3),...normal,...p.slice(3,5)));}
  const f=corners.map(([x,y])=>[x,y,1,x+.5,y+.5]);triangle(front,[f[0],f[1],f[2]],[0,0,1]);triangle(front,[f[0],f[2],f[3]],[0,0,1]);
  for(let i=0;i<4;i++){const a=corners[i],b=corners[(i+1)%4],n=[[0,-1,0],[1,0,0],[0,1,0],[-1,0,0]][i];const p=[...a,-1,0,0],q=[...b,-1,1,0],r=[...b,1,1,1],s=[...a,1,0,1];triangle(sides,[p,q,r],n);triangle(sides,[p,r,s],n);}
  const back=corners.map(([x,y])=>[x,y,-1,x+.5,y+.5]);triangle(sides,[back[0],back[2],back[1]],[0,0,-1]);triangle(sides,[back[0],back[3],back[2]],[0,0,-1]);
  function buffer(data){const b=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(data),gl.STATIC_DRAW);return b;}
  const frontBuffer=buffer(front),sideBuffer=buffer(sides);
  let seed=6127;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
  const stars=[];for(let i=0;i<650;i++)stars.push((random()-.5)*4400,(random()-.5)*2600,-random()*4100+350);
  const starBuffer=buffer(stars);
  const textureCache=new Map(),models=cards.map((card,i)=>({card,index:i,center:[0,0,0],angles:[0,0,0],size:[100,130],texture:null,projection:null}));
  let width=1,height=1,focal=1,dpr=1,lost=false,loaded=0,lastTime=0;
  let camera=[0,0,980],viewAngles=[0,0],selected=null;
  const pickFramebuffer=gl.createFramebuffer(),pickTexture=gl.createTexture(),pickDepth=gl.createRenderbuffer();
  function resize(){
    width=stage.clientWidth;height=stage.clientHeight;focal=height*.5/Math.tan(Math.PI*58/360);
    dpr=Math.min(devicePixelRatio||1,1.4,Math.sqrt(1800000/(width*height)));canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);
    gl.bindTexture(gl.TEXTURE_2D,pickTexture);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.NEAREST);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.NEAREST);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,canvas.width,canvas.height,0,gl.RGBA,gl.UNSIGNED_BYTE,null);
    gl.bindRenderbuffer(gl.RENDERBUFFER,pickDepth);gl.renderbufferStorage(gl.RENDERBUFFER,gl.DEPTH_COMPONENT16,canvas.width,canvas.height);gl.bindFramebuffer(gl.FRAMEBUFFER,pickFramebuffer);gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,pickTexture,0);gl.framebufferRenderbuffer(gl.FRAMEBUFFER,gl.DEPTH_ATTACHMENT,gl.RENDERBUFFER,pickDepth);gl.bindFramebuffer(gl.FRAMEBUFFER,null);
    models.forEach((model,i)=>{
      const mobile=width<=720,z=Number(model.card.dataset.z)*(mobile?.68:1),distance=980-z;
      let sx=Number(model.card.dataset[mobile?'mx':'x']),sy=Number(model.card.dataset[mobile?'my':'y']);
      sx+=Math.sin(i*2.41)*(mobile?.023:.04);sy+=Math.cos(i*1.71)*(mobile?.025:.035);
      model.center=[sx*width*distance/focal,-sy*height*distance/focal,z];
      model.size=[Number(model.card.dataset.w)*(mobile?.82:1.56),Number(model.card.dataset.h)*(mobile?.82:1.56)];
      model.baseAngles=[Math.sin(i*1.3)*.26,Math.sin(i*2.13)*.62,Number(model.card.dataset.roll)*Math.PI/180];
    });
  }
  function bindGeometry(b){gl.bindBuffer(gl.ARRAY_BUFFER,b);attributes.forEach((a,i)=>{gl.enableVertexAttribArray(a);gl.vertexAttribPointer(a,i===2?2:3,gl.FLOAT,false,32,i===0?0:i===1?12:24);});}
  function setView(programUniforms){gl.uniform3fv(programUniforms.uCamera,camera);gl.uniform2fv(programUniforms.uViewAngles,viewAngles);gl.uniform2f(programUniforms.uViewport,width,height);gl.uniform1f(programUniforms.uFocal,focal);}
  function drawPlane(model,pick=false){
    if(!model.texture||model.card.hidden||model.card===selected)return;
    gl.uniform3fv(uniforms.uCenter,model.position);gl.uniform3fv(uniforms.uAngles,model.angles);gl.uniform2fv(uniforms.uSize,model.size);gl.uniform1f(uniforms.uThickness,2.7);
    gl.uniform1f(uniforms.uId,model.index+1);gl.uniform1f(uniforms.uOpacity,1);gl.uniform3f(uniforms.uTint,.21,.36,.40);
    gl.uniform1i(uniforms.uPick,pick);gl.uniform1i(uniforms.uPhoto,false);bindGeometry(sideBuffer);gl.drawArrays(gl.TRIANGLES,0,sides.length/8);
    const aspect=model.size[0]/model.size[1],photoAspect=model.texture.aspect;gl.uniform2f(uniforms.uCover,photoAspect>aspect?aspect/photoAspect:1,photoAspect>aspect?1:photoAspect/aspect);
    gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,model.texture.texture);gl.uniform1i(uniforms.uImage,0);gl.uniform1i(uniforms.uPhoto,true);bindGeometry(frontBuffer);gl.drawArrays(gl.TRIANGLES,0,6);
  }
  function project(point){const view=rotate(point.map((v,i)=>v-camera[i]),[...viewAngles,0]);const depth=-view[2];return {x:width/2+view[0]*focal/depth,y:height/2-view[1]*focal/depth,depth};}
  function update(pointer,scroll,time,active,reduced){
    if(lost)return;selected=active;
    camera=[reduced?0:pointer.x*(width<=720?70:155),reduced?0:-pointer.y*85,980-(reduced?0:scroll*340)];
    viewAngles=reduced?[0,0]:[-pointer.y*.13,-pointer.x*.23];
    models.forEach((model,i)=>{
      const drift=reduced?0:Math.sin(time*.35+i*1.4);
      model.position=[model.center[0]+drift*7,model.center[1]+(reduced?0:Math.cos(time*.31+i)*10),model.center[2]+drift*9];
      model.angles=model.baseAngles.map((a,j)=>a+(reduced?0:Math.sin(time*.23+i+j)*.034));
      const bounds=corners.map(([x,y])=>{const p=rotate([x*model.size[0],y*model.size[1],2.7],model.angles);return project(p.map((v,j)=>v+model.position[j]));});
      const left=Math.min(...bounds.map(p=>p.x)),right=Math.max(...bounds.map(p=>p.x)),top=Math.min(...bounds.map(p=>p.y)),bottom=Math.max(...bounds.map(p=>p.y));
      const center=project(model.position);model.projection={left,top,width:right-left,height:bottom-top,x:(left+right)/2,y:(top+bottom)/2,depth:center.depth};
      const card=model.card;card.style.left=`${left}px`;card.style.top=`${top}px`;card.style.width=`${right-left}px`;card.style.height=`${bottom-top}px`;card.style.transform='none';card.style.zIndex=String(Math.round(6000-center.depth));
      card.dataset.depth=center.depth.toFixed(1);
    });
    draw();
  }
  function draw(){
    if(lost)return;gl.bindFramebuffer(gl.FRAMEBUFFER,null);gl.viewport(0,0,canvas.width,canvas.height);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.enable(gl.DEPTH_TEST);gl.disable(gl.CULL_FACE);
    gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);gl.depthMask(false);gl.useProgram(starProgram);setView(starUniforms);gl.uniform1f(starUniforms.uDpr,dpr);gl.bindBuffer(gl.ARRAY_BUFFER,starBuffer);gl.enableVertexAttribArray(starAttribute);gl.vertexAttribPointer(starAttribute,3,gl.FLOAT,false,0,0);gl.drawArrays(gl.POINTS,0,stars.length/3);
    gl.depthMask(true);gl.disable(gl.BLEND);gl.useProgram(photoProgram);setView(uniforms);models.forEach(model=>drawPlane(model));
    if(loaded>=4){document.body.classList.add('scene-ready');canvas.dataset.sceneState='ready';}
  }
  function pick(clientX,clientY){
    if(lost||loaded<4)return null;const rect=stage.getBoundingClientRect(),x=Math.floor((clientX-rect.left)/width*canvas.width),y=Math.floor((rect.bottom-clientY)/height*canvas.height);if(x<0||y<0||x>=canvas.width||y>=canvas.height)return null;
    gl.bindFramebuffer(gl.FRAMEBUFFER,pickFramebuffer);gl.viewport(0,0,canvas.width,canvas.height);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.disable(gl.BLEND);gl.enable(gl.DEPTH_TEST);gl.depthMask(true);gl.useProgram(photoProgram);setView(uniforms);models.forEach(model=>drawPlane(model,true));
    const pixel=new Uint8Array(4);gl.readPixels(x,y,1,1,gl.RGBA,gl.UNSIGNED_BYTE,pixel);gl.bindFramebuffer(gl.FRAMEBUFFER,null);gl.uniform1i(uniforms.uPick,false);
    return pixel[0]?cards[pixel[0]-1]:null;
  }
  window.DribbbleSpace={update,pick,resize,projection:card=>models.find(model=>model.card===card)?.projection};
  const sources=[...new Set(cards.map(card=>card.querySelector('img').src))];
  sources.forEach(src=>{
    const image=new Image();image.src=src;
    const upload=()=>{if(textureCache.has(src)||!image.naturalWidth||lost)return;const texture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,texture);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,image);const value={texture,aspect:image.naturalWidth/image.naturalHeight};textureCache.set(src,value);models.forEach(model=>{if(model.card.querySelector('img').src===src)model.texture=value;});loaded++;};
    if(image.complete&&image.naturalWidth)upload();else image.onload=upload;
  });
  canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();lost=true;document.body.classList.remove('scene-ready');canvas.dataset.sceneState='fallback';delete window.DribbbleSpace;});
  resize();
})();

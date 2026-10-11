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
    uniform bool uPhoto,uPick,uSilhouette,uPiece;
    uniform vec4 uRegion;
    uniform float uHighlight,uResolve,uInk;
    uniform float uId,uOpacity;
    void main(){
      if(uPhoto&&!uSilhouette&&!uPiece){
        vec2 q=abs((vUv-.5)*uSize)-uSize*.5+5.;
        float corner=length(max(q,0.))+min(max(q.x,q.y),0.)-5.;
        if(corner>0.)discard;
      }
      vec2 sampleUv=(.5+(vUv-.5)*uCover)*uRegion.zw+uRegion.xy;
      vec4 sampled=texture2D(uImage,sampleUv);
      if(uSilhouette&&sampled.a<.012)discard;
      if(uPick){gl_FragColor=vec4(uId/255.,0.,0.,1.);return;}
      vec3 n=normalize(vNormal);float light=max(dot(n,normalize(vec3(-.4,.8,1.2))),0.);
      vec3 color=uTint*(.3+light*.7);
      if(uPhoto){
        color=sampled.rgb;
        vec2 edge=min(vUv,1.-vUv)*uSize;
        float rim=1.-smoothstep(1.5,3.2,min(edge.x,edge.y));
        color=mix(color,vec3(.45,.60,.62)*(.48+light*.5),rim*(uPiece||uSilhouette?0.:.45));
        color*=.92+light*.08;
      }
      if(!uSilhouette){float grey=dot(color,vec3(.2126,.7152,.0722));color=mix(vec3(grey),color,uPiece?.76:.70);color+=vec3(.065,.085,.078)*uHighlight;}else{
        float distanceToHand=length((vUv-vec2(.716,.85))*vec2(.75,1.));
        float wash=(1.-smoothstep(uInk,uInk+.12,distanceToHand))*uResolve;
        color=mix(color,color*vec3(.78,1.24,1.12)+vec3(.035,.072,.054),wash*.84);
        float liquid=exp(-pow((distanceToHand-uInk)/.045,2.))*uResolve;
        color+=vec3(.09,.13,.11)*liquid*.45;
        float eye=1.-smoothstep(1.,2.6,length((vUv-vec2(.378,.778))*uSize));
        color+=vec3(.22,.29,.25)*eye*uResolve;
      }
      float fog=smoothstep(1900.,4000.,vDepth)*.30;
      color=mix(color,vec3(.018,.025,.041),fog);
      gl_FragColor=vec4(color,uOpacity*(uSilhouette?sampled.a:1.));
    }`;
  function compile(type,source){const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)){canvas.dataset.sceneError=gl.getShaderInfoLog(s);return null;}return s;}
  function program(v,f){const vs=compile(gl.VERTEX_SHADER,v),fs=compile(gl.FRAGMENT_SHADER,f);if(!vs||!fs)return null;const p=gl.createProgram();gl.attachShader(p,vs);gl.attachShader(p,fs);gl.linkProgram(p);if(!gl.getProgramParameter(p,gl.LINK_STATUS)){canvas.dataset.sceneError=gl.getProgramInfoLog(p);return null;}return p;}
  const photoProgram=program(vertex,fragment);if(!photoProgram)return;
  const uniformNames=['uCenter','uAngles','uCamera','uSize','uViewAngles','uViewport','uFocal','uThickness','uImage','uCover','uTint','uPhoto','uPick','uId','uOpacity','uSilhouette','uPiece','uRegion','uHighlight','uResolve','uInk'];
  const uniforms=Object.fromEntries(uniformNames.map(name=>[name,gl.getUniformLocation(photoProgram,name)]));
  const attributes=['aPosition','aNormal','aUv'].map(name=>gl.getAttribLocation(photoProgram,name));
  const corners=[[-.5,-.5],[.5,-.5],[.5,.5],[-.5,.5]],front=[],sides=[];
  function triangle(output,points,normal){points.forEach(p=>output.push(...p.slice(0,3),...normal,...p.slice(3,5)));}
  const f=corners.map(([x,y])=>[x,y,1,x+.5,y+.5]);triangle(front,[f[0],f[1],f[2]],[0,0,1]);triangle(front,[f[0],f[2],f[3]],[0,0,1]);
  for(let i=0;i<4;i++){const a=corners[i],b=corners[(i+1)%4],n=[[0,-1,0],[1,0,0],[0,1,0],[-1,0,0]][i];const p=[...a,-1,0,0],q=[...b,-1,1,0],r=[...b,1,1,1],s=[...a,1,0,1];triangle(sides,[p,q,r],n);triangle(sides,[p,r,s],n);}
  const back=corners.map(([x,y])=>[x,y,-1,x+.5,y+.5]);triangle(sides,[back[0],back[2],back[1]],[0,0,-1]);triangle(sides,[back[0],back[3],back[2]],[0,0,-1]);
  function buffer(data){const b=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(data),gl.STATIC_DRAW);return b;}
  const frontBuffer=buffer(front),sideBuffer=buffer(sides);
  const textureCache=new Map(),models=cards.map((card,i)=>({card,index:i,center:[0,0,0],angles:[0,0,0],size:[100,130],texture:null,projection:null}));
  let width=1,height=1,focal=1,dpr=1,lost=false,loaded=0,lastTime=0;
  let camera=[0,0,980],viewAngles=[0,0],selected=null,ink=0,resolve=0,renderCount=0;
  const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v)),lerp=(a,b,t)=>a+(b-a)*t,ease=v=>{const t=clamp(v);return t*t*(3-2*t);};
  const visitor={kind:'visitor',index:-1,size:[330,550],center:[0,0,180],position:[0,0,180],angles:[0,0,0],opacity:0,texture:null};
  const artwork={kind:'artwork',index:-1,size:[430,430/1.5],center:[0,0,200],position:[0,0,200],angles:[0,0,0],opacity:0,texture:null};
  const fragments=Array.from({length:12},(_,i)=>({kind:'fragment',index:-1,row:Math.floor(i/4),col:i%4,size:[117.5,470/4.5],position:[0,0,0],angles:[0,0,0],opacity:0,texture:null,region:[(i%4)/4,1-(Math.floor(i/4)+1)/3,.25,1/3]}));
  const outputs=[7,14,18,23].map((source,i)=>({kind:'output',index:-1,source,indexOutput:i,size:[110,145],position:[0,0,0],angles:[0,0,0],opacity:0,texture:null}));
  let sceneState={hand:null,foot:null,visitor:null,progress:0,creation:0};
  const pickFramebuffer=gl.createFramebuffer(),pickTexture=gl.createTexture(),pickDepth=gl.createRenderbuffer();
  function resize(){
    width=stage.clientWidth;height=stage.clientHeight;focal=height*.5/Math.tan(Math.PI*58/360);
    dpr=Math.min(devicePixelRatio||1,1.4,Math.sqrt(1800000/(width*height)));canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);
    gl.bindTexture(gl.TEXTURE_2D,pickTexture);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.NEAREST);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.NEAREST);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,canvas.width,canvas.height,0,gl.RGBA,gl.UNSIGNED_BYTE,null);
    gl.bindRenderbuffer(gl.RENDERBUFFER,pickDepth);gl.renderbufferStorage(gl.RENDERBUFFER,gl.DEPTH_COMPONENT16,canvas.width,canvas.height);gl.bindFramebuffer(gl.FRAMEBUFFER,pickFramebuffer);gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,pickTexture,0);gl.framebufferRenderbuffer(gl.FRAMEBUFFER,gl.DEPTH_ATTACHMENT,gl.RENDERBUFFER,pickDepth);gl.bindFramebuffer(gl.FRAMEBUFFER,null);
    models.forEach((model,i)=>{
      const z=Number(model.card.dataset.z),distance=980-z;
      let sx=Number(model.card.dataset.x),sy=Number(model.card.dataset.y);
      sx+=Math.sin(i*2.41)*.014;sy+=Math.cos(i*1.71)*.016;
      model.center=[sx*width*distance/focal,-sy*height*distance/focal,z];
      model.size=[Number(model.card.dataset.w)*1.56,Number(model.card.dataset.h)*1.56];
      model.baseAngles=[Math.sin(i*1.3)*.26,Math.sin(i*2.13)*.62,Number(model.card.dataset.roll)*Math.PI/180];
    });
  }
  function bindGeometry(b){gl.bindBuffer(gl.ARRAY_BUFFER,b);attributes.forEach((a,i)=>{gl.enableVertexAttribArray(a);gl.vertexAttribPointer(a,i===2?2:3,gl.FLOAT,false,32,i===0?0:i===1?12:24);});}
  function setView(programUniforms){gl.uniform3fv(programUniforms.uCamera,camera);gl.uniform2fv(programUniforms.uViewAngles,viewAngles);gl.uniform2f(programUniforms.uViewport,width,height);gl.uniform1f(programUniforms.uFocal,focal);}
  function drawPlane(model,pick=false){
    if(!model.texture||model.card?.hidden||model.card&&model.card===selected||model.opacity<.008)return;
    gl.uniform3fv(uniforms.uCenter,model.position);gl.uniform3fv(uniforms.uAngles,model.angles);gl.uniform2fv(uniforms.uSize,model.size);gl.uniform1f(uniforms.uThickness,2.7);
    gl.uniform1f(uniforms.uId,model.index+1);gl.uniform1f(uniforms.uOpacity,model.opacity??1);
    gl.uniform1i(uniforms.uSilhouette,model.kind==='visitor');gl.uniform1i(uniforms.uPiece,model.kind==='fragment');gl.uniform4fv(uniforms.uRegion,model.region||[0,0,1,1]);gl.uniform1f(uniforms.uHighlight,model.highlight||0);gl.uniform1f(uniforms.uResolve,model.kind==='visitor'?resolve:0);gl.uniform1f(uniforms.uInk,ink);gl.uniform3f(uniforms.uTint,.21,.36,.40);
    gl.uniform1i(uniforms.uPick,pick);gl.uniform1i(uniforms.uPhoto,false);if(model.kind!=='visitor'&&model.kind!=='fragment'){bindGeometry(sideBuffer);gl.drawArrays(gl.TRIANGLES,0,sides.length/8);}
    const aspect=model.size[0]/model.size[1],photoAspect=model.texture.aspect;gl.uniform2f(uniforms.uCover,model.kind==='fragment'?1:photoAspect>aspect?aspect/photoAspect:1,model.kind==='fragment'?1:photoAspect>aspect?1:photoAspect/aspect);
    gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,model.texture.texture);gl.uniform1i(uniforms.uImage,0);gl.uniform1i(uniforms.uPhoto,true);bindGeometry(frontBuffer);gl.drawArrays(gl.TRIANGLES,0,6);
  }
  function project(point){const view=rotate(point.map((v,i)=>v-camera[i]),[...viewAngles,0]);const depth=-view[2];return {x:width/2+view[0]*focal/depth,y:height/2-view[1]*focal/depth,depth};}
  function projectModel(model){
    const bounds=corners.map(([x,y])=>{const p=rotate([x*model.size[0],y*model.size[1],2.7],model.angles);return project(p.map((v,j)=>v+model.position[j]));});
    const left=Math.min(...bounds.map(p=>p.x)),right=Math.max(...bounds.map(p=>p.x)),top=Math.min(...bounds.map(p=>p.y)),bottom=Math.max(...bounds.map(p=>p.y));
    const center=project(model.position);model.projection={left,top,width:right-left,height:bottom-top,x:(left+right)/2,y:(top+bottom)/2,depth:center.depth};
    const card=model.card;if(card){card.style.left=`${left}px`;card.style.top=`${top}px`;card.style.width=`${right-left}px`;card.style.height=`${bottom-top}px`;card.style.transform='none';card.style.zIndex=String(Math.round(6000-center.depth));card.dataset.depth=center.depth.toFixed(1);card.dataset.opacity=model.opacity.toFixed(3);}
  }
  function update(pointer,progress,intro,active,reduced){
    if(lost)return;selected=active;
    const explore=clamp(progress/.44),creation=reduced?0:clamp((progress-.41)/.55),exit=reduced?0:ease((progress-.93)/.07);
    const gather=ease(creation/.23),assemble=ease((creation-.17)/.34),artFade=ease((assemble-.83)/.17);
    resolve=reduced?0:ease((creation-.50)/.26);ink=resolve*.95;
    camera=[reduced?0:pointer.x*35,reduced?0:-pointer.y*22,980];viewAngles=reduced?[0,0]:[-pointer.y*.025,-pointer.x*.04];
    const personShift=ease(creation/.27),z=180,distance=980-z;
    visitor.center=[lerp(.18,.05,personShift)*width*distance/focal,-height*.055*distance/focal-personShift*65,z];
    visitor.position=[visitor.center[0],visitor.center[1]+exit*480,visitor.center[2]];visitor.opacity=(reduced?1:ease(intro))*(1-exit);
    visitor.angles=[0,0,0];projectModel(visitor);
    const handWorld=[visitor.position[0]+(.716-.5)*visitor.size[0],visitor.position[1]+(.5-.15)*visitor.size[1],visitor.position[2]+2.7];
    const footWorld=[visitor.position[0]+(.32-.5)*visitor.size[0],visitor.position[1]+(.5-.94)*visitor.size[1],visitor.position[2]];
    sceneState={hand:project(handWorld),foot:project(footWorld),visitor:visitor.projection,progress,creation,resolve,assemble,gather,exit,opacity:visitor.opacity};
    models.forEach((model,i)=>{
      const entered=reduced?1:ease((explore*.88+intro*.22-(i%6)*.033)/.58),retreat=reduced?0:ease((explore-.76)/.24);
      const phase=explore*1.4+i*1.37;
      model.position=[model.center[0]+Math.sin(phase)*entered*5,model.center[1]+Math.cos(phase)*entered*7+retreat*35,model.center[2]-(1-entered)*2200-retreat*2400];
      model.angles=model.baseAngles.map((angle,j)=>angle+(reduced?0:Math.sin(phase+j)*.10+(1-entered)*.20));
      model.opacity=(.28+entered*.72)*(1-retreat)*visitor.opacity;
      model.highlight=0;
      if(i===8){
        const arrive=reduced?1:ease((explore-.15)/.40);
        const target=[handWorld[0]+model.size[0]*.48,handWorld[1]+model.size[1]*.46,visitor.center[2]+45];
        model.position=target.map((v,j)=>lerp(model.position[j],v,arrive));model.position[2]-=retreat*2400;
        model.angles=model.angles.map(a=>a*(1-arrive));model.highlight=ease((explore-.45)/.22)*(1-retreat)*.50;
      }
      projectModel(model);
    });
    artwork.position=[handWorld[0]+artwork.size[0]/2-70,handWorld[1]+artwork.size[1]/2-20,200];artwork.angles=[0,0,0];artwork.opacity=artFade*(1-exit);projectModel(artwork);
    fragments.forEach((piece,i)=>{
      const delay=(i%4)*.022,converge=ease((creation-delay)/.20),join=ease((creation-.17-delay*.4)/.34);
      const angle=i*2.399,span=55+(i%3)*23;
      const start=[handWorld[0]+Math.cos(angle)*(350+i*14),handWorld[1]+Math.sin(angle)*(240+i*9),-900-i*55];
      const palm=[handWorld[0]+Math.cos(angle)*span,handWorld[1]+Math.sin(angle)*span*.64+25,225+(i%4)*24];
      const final=[artwork.position[0]+(piece.col-1.5)*artwork.size[0]/4,artwork.position[1]+(1-piece.row)*artwork.size[1]/3,203];
      piece.position=start.map((v,j)=>lerp(lerp(v,palm[j],converge),final[j],join));
      const scale=lerp(.28,1,join);piece.size=[artwork.size[0]/4*scale,artwork.size[1]/3*scale];
      piece.angles=[(1-join)*Math.sin(i)*.24,(1-join)*Math.cos(i*2)*.42,(1-join)*Math.sin(i*3)*.45];
      piece.opacity=ease((creation-.005)/.08)*(1-artFade)*(1-exit);projectModel(piece);
    });
    const targets=[[-.34,-.30],[-.06,-.28],[-.34,.25],[-.10,.29]];
    outputs.forEach((model,i)=>{
      const release=ease((creation-.74-i*.025)/.19),[x,y]=targets[i],d=980-(-150-i*250);
      const source=[visitor.position[0]-visitor.size[0]*.22,visitor.position[1]+10,240];
      const target=[x*width*d/focal,-y*height*d/focal,-150-i*250];
      model.position=source.map((v,j)=>lerp(v,target[j],release));model.angles=[release*.13,release*(i%2?.22:-.23),release*(i%2?.07:-.10)];
      model.opacity=ease((creation-.74-i*.025)/.055)*(1-exit);model.texture=models[model.source].texture;projectModel(model);
    });
    sceneState.artwork=artwork.projection;sceneState.fragmentCount=fragments.filter(f=>f.opacity>.05).length;sceneState.outputCount=outputs.filter(o=>o.opacity>.05).length;
    canvas.dataset.progress=progress.toFixed(4);canvas.dataset.creation=creation.toFixed(4);canvas.dataset.assembled=assemble.toFixed(4);canvas.dataset.personOpacity=visitor.opacity.toFixed(4);canvas.dataset.ink=resolve.toFixed(4);
    canvas.dataset.chapter=creation>.75?'release':creation>.5?'transform':creation>.17?'assemble':creation>0?'gather':'explore';
    draw();
  }
  function allPlanes(){return [...models,visitor,artwork,...fragments,...outputs].sort((a,b)=>(b.projection?.depth||0)-(a.projection?.depth||0));}
  function draw(){
    if(lost)return;gl.bindFramebuffer(gl.FRAMEBUFFER,null);gl.viewport(0,0,canvas.width,canvas.height);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.enable(gl.DEPTH_TEST);gl.disable(gl.CULL_FACE);
    gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);gl.depthMask(true);gl.useProgram(photoProgram);setView(uniforms);allPlanes().forEach(model=>drawPlane(model));
    canvas.dataset.frame=String(++renderCount);
    if(loaded>=4&&visitor.texture){document.body.classList.add('scene-ready');canvas.dataset.sceneState='ready';}
  }
  function pick(clientX,clientY){
    if(lost||loaded<4)return null;const rect=stage.getBoundingClientRect(),x=Math.floor((clientX-rect.left)/width*canvas.width),y=Math.floor((rect.bottom-clientY)/height*canvas.height);if(x<0||y<0||x>=canvas.width||y>=canvas.height)return null;
    gl.bindFramebuffer(gl.FRAMEBUFFER,pickFramebuffer);gl.viewport(0,0,canvas.width,canvas.height);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.disable(gl.BLEND);gl.enable(gl.DEPTH_TEST);gl.depthMask(true);gl.useProgram(photoProgram);setView(uniforms);allPlanes().forEach(model=>drawPlane(model,true));
    const pixel=new Uint8Array(4);gl.readPixels(x,y,1,1,gl.RGBA,gl.UNSIGNED_BYTE,pixel);gl.bindFramebuffer(gl.FRAMEBUFFER,null);gl.uniform1i(uniforms.uPick,false);
    return pixel[0]?cards[pixel[0]-1]:null;
  }
  window.DribbbleSpace={update,pick,resize,projection:card=>models.find(model=>model.card===card)?.projection,narrative:()=>sceneState};
  const sources=[...new Set(cards.map(card=>card.querySelector('img').src)),new URL('assets/gallery-visitor.svg',location.href).href,new URL('assets/formed-idea.svg',location.href).href];
  sources.forEach(src=>{
    const image=new Image();image.src=src;
    const upload=()=>{if(textureCache.has(src)||!image.naturalWidth||lost)return;const texture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,texture);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,image);const value={texture,aspect:image.naturalWidth/image.naturalHeight};textureCache.set(src,value);models.forEach(model=>{if(model.card.querySelector('img').src===src)model.texture=value;});if(src.endsWith('gallery-visitor.svg'))visitor.texture=value;if(src.endsWith('formed-idea.svg')){artwork.texture=value;fragments.forEach(piece=>piece.texture=value);}loaded++;document.dispatchEvent(new CustomEvent('Dribbble:scene-update'));};
    if(image.complete&&image.naturalWidth)upload();else image.onload=upload;
  });
  canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();lost=true;document.body.classList.remove('scene-ready');canvas.dataset.sceneState='fallback';delete window.DribbbleSpace;});
  resize();
})();

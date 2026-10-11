(() => {
  const canvas=document.querySelector('.model-layer');
  if(!canvas)return;
  const gl=canvas.getContext('webgl',{alpha:true,antialias:true,premultipliedAlpha:false,preserveDrawingBuffer:true,powerPreference:'low-power'});
  if(!gl)return;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const vertex=`
    attribute vec3 aPosition,aNormal;
    uniform vec3 uAngles;
    uniform vec2 uCenter;
    uniform float uScale,uAspect;
    varying vec3 vNormal,vPosition;
    vec3 rotate(vec3 p){
      float cx=cos(uAngles.x),sx=sin(uAngles.x),cy=cos(uAngles.y),sy=sin(uAngles.y),cz=cos(uAngles.z),sz=sin(uAngles.z);
      p=vec3(p.x,cx*p.y-sx*p.z,sx*p.y+cx*p.z);
      p=vec3(cy*p.x+sy*p.z,p.y,-sy*p.x+cy*p.z);
      return vec3(cz*p.x-sz*p.y,sz*p.x+cz*p.y,p.z);
    }
    void main(){
      vec3 p=rotate(aPosition);vPosition=p;vNormal=rotate(aNormal);
      float perspective=1./(1.-p.z*.16);
      gl_Position=vec4(uCenter+p.xy*uScale*vec2(1./uAspect,1.)*perspective,-p.z*.25,1.);
    }`;
  const fragment=`
    precision mediump float;
    varying vec3 vNormal,vPosition;
    uniform vec3 uColor;
    uniform float uOpacity;
    void main(){
      vec3 n=normalize(vNormal),view=normalize(vec3(0.,0.,5.)-vPosition);
      vec3 light=normalize(vec3(-.6,.9,1.5)),second=normalize(vec3(.8,-.4,.5));
      float diffuse=max(dot(n,light),0.),fill=max(dot(n,second),0.);
      float specular=pow(max(dot(n,normalize(light+view)),0.),65.);
      float rim=pow(1.-max(dot(n,view),0.),2.6);
      float ribbon=exp(-pow((n.y-.25)*8.,2.));
      vec3 color=uColor*(.18+diffuse*.58+fill*.25)+vec3(.84,.94,1.)*(specular*.95+ribbon*.22)+vec3(.33,.59,.65)*rim*.35;
      gl_FragColor=vec4(color,uOpacity);
    }`;
  function shader(type,source){const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);return gl.getShaderParameter(s,gl.COMPILE_STATUS)?s:null;}
  const vs=shader(gl.VERTEX_SHADER,vertex),fs=shader(gl.FRAGMENT_SHADER,fragment);if(!vs||!fs)return;
  const program=gl.createProgram();gl.attachShader(program,vs);gl.attachShader(program,fs);gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))return;
  gl.useProgram(program);gl.enable(gl.DEPTH_TEST);gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);gl.clearColor(0,0,0,0);
  const uniforms={};['uAngles','uCenter','uScale','uAspect','uColor','uOpacity'].forEach(name=>uniforms[name]=gl.getUniformLocation(program,name));
  const attributes={position:gl.getAttribLocation(program,'aPosition'),normal:gl.getAttribLocation(program,'aNormal')};
  function mesh(vertices,normals,indices){
    const buffers=[vertices,normals].map(data=>{const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(data),gl.STATIC_DRAW);return buffer;});
    const indicesBuffer=gl.createBuffer();gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,indicesBuffer);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(indices),gl.STATIC_DRAW);
    return {buffers,indicesBuffer,count:indices.length};
  }
  function torus(){
    const vertices=[],normals=[],indices=[],segments=48,sides=12;
    for(let i=0;i<=segments;i++)for(let j=0;j<=sides;j++){
      const u=i/segments*Math.PI*2,v=j/sides*Math.PI*2,c=Math.cos(v),s=Math.sin(v),radius=.67+.19*c;
      vertices.push(radius*Math.cos(u),radius*Math.sin(u),.19*s);normals.push(c*Math.cos(u),c*Math.sin(u),s);
      if(i<segments&&j<sides){const a=i*(sides+1)+j,b=a+sides+1;indices.push(a,b,a+1,b,b+1,a+1);}
    }return mesh(vertices,normals,indices);
  }
  function crystal(){
    const t=(1+Math.sqrt(5))/2,points=[[-1,t,0],[1,t,0],[-1,-t,0],[1,-t,0],[0,-1,t],[0,1,t],[0,-1,-t],[0,1,-t],[t,0,-1],[t,0,1],[-t,0,-1],[-t,0,1]];
    const faces=[[0,11,5],[0,5,1],[0,1,7],[0,7,10],[0,10,11],[1,5,9],[5,11,4],[11,10,2],[10,7,6],[7,1,8],[3,9,4],[3,4,2],[3,2,6],[3,6,8],[3,8,9],[4,9,5],[2,4,11],[6,2,10],[8,6,7],[9,8,1]];
    const vertices=[],normals=[],indices=[];
    faces.forEach(face=>{
      const p=face.map(index=>points[index].map(value=>value/1.902)),a=p[1].map((v,i)=>v-p[0][i]),b=p[2].map((v,i)=>v-p[0][i]);
      const n=[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],length=Math.hypot(...n);
      p.forEach(point=>{indices.push(indices.length);vertices.push(...point);normals.push(...n.map(v=>v/length));});
    });return mesh(vertices,normals,indices);
  }
  const ring=torus(),gem=crystal(),center=document.querySelector('.chrome-art'),anchors=Array.from(document.querySelectorAll('.model-anchor'));
  let width=1,height=1,raf=0,lastFrame=0,lastTime=0,time=0,lost=false,scroll=window.scrollY/innerHeight;
  let pointer={x:0,y:0},smoothPointer={x:0,y:0};
  window.addEventListener('pointermove',event=>{if(event.pointerType==='touch'||reduced.matches)return;pointer={x:(event.clientX/width-.5)*2,y:(event.clientY/height-.5)*2};},{passive:true});
  document.documentElement.addEventListener('pointerleave',()=>{pointer={x:0,y:0};});
  function resize(){width=innerWidth;height=innerHeight;const dpr=Math.min(devicePixelRatio||1,1.25);canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);gl.viewport(0,0,canvas.width,canvas.height);gl.uniform1f(uniforms.uAspect,width/height);}
  function paint(shape,rect,angles,color,opacity,scale=1){
    if(rect.bottom<0||rect.top>height)return;
    const x=rect.left+rect.width/2,y=rect.top+rect.height/2;
    gl.uniform2f(uniforms.uCenter,x/width*2-1,1-y/height*2);gl.uniform1f(uniforms.uScale,Math.min(rect.width,rect.height)/height*scale);
    gl.uniform3fv(uniforms.uAngles,angles);gl.uniform3fv(uniforms.uColor,color);gl.uniform1f(uniforms.uOpacity,opacity);
    shape.buffers.forEach((buffer,i)=>{gl.bindBuffer(gl.ARRAY_BUFFER,buffer);const attribute=i?attributes.normal:attributes.position;gl.enableVertexAttribArray(attribute);gl.vertexAttribPointer(attribute,3,gl.FLOAT,false,0,0);});
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,shape.indicesBuffer);gl.drawElements(gl.TRIANGLES,shape.count,gl.UNSIGNED_SHORT,0);
  }
  function draw(now){
    raf=0;if(lost||document.hidden)return;
    if(now-lastFrame<32){raf=requestAnimationFrame(draw);return;}lastFrame=now;
    const dt=lastTime?Math.min((now-lastTime)/1000,.1):0;lastTime=now;
    if(!reduced.matches&&!document.body.classList.contains('motion-paused'))time+=dt;
    scroll+=(window.scrollY/height-scroll)*.06;
    smoothPointer.x+=(pointer.x-smoothPointer.x)*.09;smoothPointer.y+=(pointer.y-smoothPointer.y)*.09;
    anchors.forEach((anchor,i)=>{
      anchor.style.setProperty('--model-shift',`${reduced.matches?0:-Math.min(scroll,4)*(i?28:65)+smoothPointer.y*(i?9:-14)}px`);
      anchor.style.setProperty('--model-x',`${reduced.matches?0:smoothPointer.x*(i?12:-18)}px`);
    });
    gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
    paint(ring,center.getBoundingClientRect(),[.83+Math.sin(time*.09)*.17+smoothPointer.y*.18,-.37+Math.cos(time*.07)*.15+smoothPointer.x*.28,time*.055],[.59,.72,.77],.96,1.28);
    paint(gem,center.getBoundingClientRect(),[time*.12,time*.15,.3],[.54,.86,.79],.88,.32);
    paint(ring,anchors[0].getBoundingClientRect(),[1.12+smoothPointer.y*.15,time*.065+.3+smoothPointer.x*.2,-.6],[.40,.59,.68],.56);
    paint(gem,anchors[1].getBoundingClientRect(),[.5+time*.06+smoothPointer.y*.2,.8+time*.09+smoothPointer.x*.23,.3],[.62,.60,.78],.58);
    document.body.classList.add('models-ready');raf=requestAnimationFrame(draw);
  }
  window.addEventListener('resize',resize,{passive:true});
  document.addEventListener('visibilitychange',()=>{cancelAnimationFrame(raf);raf=0;lastTime=0;if(!document.hidden&&!lost)raf=requestAnimationFrame(draw);});
  canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();lost=true;cancelAnimationFrame(raf);document.body.classList.remove('models-ready');});
  resize();raf=requestAnimationFrame(draw);
})();

(()=>{
  const button=document.querySelector('.sound-toggle'),label=button.querySelector('.sound-label');
  const AudioEngine=window.AudioContext||window.webkitAudioContext;
  if(!AudioEngine){button.disabled=true;button.title='当前浏览器不支持音效';return;}
  let context,master,noise,enabled=false,busy=false,previous=null,forwardPlayed=false,reversePlayed=false,landed=false,lastFlip=-Infinity,lastHover=-Infinity;
  const voices=new Set();
  function init(){
    if(context)return;
    context=new AudioEngine();master=context.createGain();master.gain.value=0;master.connect(context.destination);
    noise=context.createBuffer(1,Math.ceil(context.sampleRate*1.25),context.sampleRate);
    const samples=noise.getChannelData(0);let smooth=0;
    for(let i=0;i<samples.length;i++){const white=Math.random()*2-1;smooth=smooth*.8+white*.2;samples[i]=white*.35+smooth*.65;}
  }
  function ready(){return enabled&&context?.state==='running'&&!document.hidden;}
  function track(source,nodes){
    voices.add(source);
    source.onended=()=>{voices.delete(source);source.disconnect();nodes.forEach(node=>node.disconnect());};
  }
  function stop(){
    if(!context)return;
    master.gain.cancelScheduledValues(context.currentTime);
    master.gain.setTargetAtTime(0,context.currentTime,.012);
    for(const source of voices){try{source.stop(context.currentTime+.06);}catch{}}
  }
  function tone(frequency,volume,duration=.3,delay=0){
    if(!ready())return;
    const t=context.currentTime+delay,osc=context.createOscillator(),gain=context.createGain();
    osc.type='sine';osc.frequency.setValueAtTime(frequency,t);
    gain.gain.setValueAtTime(.0001,t);gain.gain.exponentialRampToValueAtTime(volume,t+.018);gain.gain.exponentialRampToValueAtTime(.0001,t+duration);
    osc.connect(gain);gain.connect(master);track(osc,[gain]);osc.start(t);osc.stop(t+duration+.02);
  }
  function flip(direction){
    if(!ready()||context.currentTime-lastFlip<.8)return;
    lastFlip=context.currentTime;
    const t=context.currentTime,source=context.createBufferSource(),filter=context.createBiquadFilter(),gain=context.createGain();
    const pan=context.createStereoPanner?context.createStereoPanner():context.createGain();
    source.buffer=noise;filter.type='bandpass';filter.Q.value=.65;
    filter.frequency.setValueAtTime(220,t);filter.frequency.exponentialRampToValueAtTime(1900,t+.42);filter.frequency.exponentialRampToValueAtTime(300,t+1.12);
    gain.gain.setValueAtTime(.0001,t);gain.gain.exponentialRampToValueAtTime(.24,t+.32);gain.gain.exponentialRampToValueAtTime(.0001,t+1.15);
    if(pan.pan){pan.pan.setValueAtTime(-.55*direction,t);pan.pan.linearRampToValueAtTime(.55*direction,t+1.1);}
    source.connect(filter);filter.connect(gain);gain.connect(pan);pan.connect(master);track(source,[filter,gain,pan]);source.start(t);source.stop(t+1.2);
    tone(direction>0?88:110,.085,.65,.08);
    document.dispatchEvent(new CustomEvent('gallery-sound',{detail:{type:'flip',direction}}));
  }
  function sync(){
    button.setAttribute('aria-pressed',String(enabled));button.setAttribute('aria-label',enabled?'关闭音效':'开启音效');button.title=enabled?'关闭音效':'开启音效';label.textContent=enabled?'音效 开':'音效 关';
  }
  button.addEventListener('click',async()=>{
    if(busy)return;
    if(enabled){enabled=false;stop();sync();return;}
    busy=true;
    try{
      init();await context.resume();enabled=context.state==='running';
      if(enabled){master.gain.cancelScheduledValues(context.currentTime);master.gain.setTargetAtTime(.38,context.currentTime,.025);tone(660,.07,.22);tone(990,.035,.3,.065);}
    }catch{enabled=false;stop();}finally{busy=false;sync();}
  });
  document.addEventListener('gallery-motion',({detail:{progress:p,reduced}})=>{
    if(previous===null){previous=p;return;}
    // Rearm outside the transition, so tiny scroll reversals cannot retrigger the sound.
    if(p<.50){forwardPlayed=false;landed=false;}
    if(p>.84)reversePlayed=false;
    if(!reduced&&ready()){
      if(!forwardPlayed&&previous<.57&&p>=.57&&p<.79){flip(1);forwardPlayed=true;}
      if(!reversePlayed&&previous>.73&&p<=.73&&p>.53){flip(-1);reversePlayed=true;}
      if(forwardPlayed&&!landed&&previous<.835&&p>=.835&&p<.96){tone(440,.045,.5);tone(660,.025,.65,.08);landed=true;document.dispatchEvent(new CustomEvent('gallery-sound',{detail:{type:'settle'}}));}
    }
    previous=p;
  });
  document.querySelectorAll('.horizontal-works .work-slot').forEach(slot=>slot.addEventListener('pointerenter',()=>{
    if(!ready()||document.querySelector('.works').dataset.progress>.54||context.currentTime-lastHover<.2)return;
    lastHover=context.currentTime;tone(1046,.025,.085);
  }));
  document.addEventListener('visibilitychange',()=>{
    if(!context)return;
    if(document.hidden){stop();context.suspend().catch(()=>{});}
    else if(enabled)context.resume().then(()=>{if(enabled&&!document.hidden)master.gain.setTargetAtTime(.38,context.currentTime,.025);}).catch(()=>{});
  });
  window.addEventListener('pagehide',stop);
})();

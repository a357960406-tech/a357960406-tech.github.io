(()=>{
  const button=document.querySelector('.sound-toggle'),label=button.querySelector('.sound-label');
  const AudioEngine=window.AudioContext||window.webkitAudioContext;
  if(!AudioEngine){button.disabled=true;button.title='当前浏览器不支持音效';return;}
  let context,master,noise,enabled=false,busy=false,previous=null,forwardPlayed=false,reversePlayed=false,lastFlip=-Infinity,lastHover=-Infinity;
  const voices=new Set();
  function init(){
    if(context)return;
    context=new AudioEngine();master=context.createGain();master.gain.value=0;master.connect(context.destination);
    noise=context.createBuffer(1,Math.ceil(context.sampleRate*.31),context.sampleRate);
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
    if(!ready()||context.currentTime-lastFlip<.45)return;
    lastFlip=context.currentTime;
    const t=context.currentTime,source=context.createBufferSource(),filter=context.createBiquadFilter(),highpass=context.createBiquadFilter(),lowpass=context.createBiquadFilter(),gain=context.createGain();
    const pan=context.createStereoPanner?context.createStereoPanner():context.createGain();
    // A thin, restrained air sweep: no low-frequency rumble or reverberant tail.
    source.buffer=noise;filter.type='bandpass';filter.Q.value=.7;
    highpass.type='highpass';highpass.frequency.value=850;highpass.Q.value=.5;
    lowpass.type='lowpass';lowpass.frequency.value=6200;lowpass.Q.value=.5;
    filter.frequency.setValueAtTime(1400,t);filter.frequency.exponentialRampToValueAtTime(3600,t+.11);filter.frequency.exponentialRampToValueAtTime(1500,t+.29);
    gain.gain.setValueAtTime(.0001,t);gain.gain.exponentialRampToValueAtTime(.16,t+.095);gain.gain.exponentialRampToValueAtTime(.055,t+.21);gain.gain.exponentialRampToValueAtTime(.0001,t+.30);
    if(pan.pan){pan.pan.setValueAtTime(-.28*direction,t);pan.pan.linearRampToValueAtTime(.28*direction,t+.30);}
    source.connect(highpass);highpass.connect(filter);filter.connect(lowpass);lowpass.connect(gain);gain.connect(pan);pan.connect(master);track(source,[highpass,filter,lowpass,gain,pan]);source.start(t);source.stop(t+.31);
    // The tactile landing is delayed to 0.30s and ends inside the 0.40s clip.
    const bass=context.createOscillator(),body=context.createGain(),hit=t+.30;
    bass.type='sine';bass.frequency.setValueAtTime(158,hit);bass.frequency.exponentialRampToValueAtTime(96,hit+.035);bass.frequency.exponentialRampToValueAtTime(82,hit+.095);
    body.gain.setValueAtTime(.0001,hit);body.gain.exponentialRampToValueAtTime(.20,hit+.004);body.gain.exponentialRampToValueAtTime(.055,hit+.035);body.gain.exponentialRampToValueAtTime(.0001,hit+.095);
    bass.connect(body);body.connect(master);track(bass,[body]);bass.start(hit);bass.stop(t+.40);
    document.dispatchEvent(new CustomEvent('gallery-sound',{detail:{type:'flip',direction,duration:.40,bassAt:.30}}));
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
    if(p<.50)forwardPlayed=false;
    if(p>.84)reversePlayed=false;
    if(!reduced&&ready()){
      if(!forwardPlayed&&previous<.57&&p>=.57&&p<.79){flip(1);forwardPlayed=true;}
      if(!reversePlayed&&previous>.73&&p<=.73&&p>.53){flip(-1);reversePlayed=true;}
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

'use strict';
(() => {
  const root=document.documentElement;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const fine=matchMedia('(hover: hover) and (pointer: fine)');
  const small=matchMedia('(max-width: 640px)');
  const gs=window.gsap;
  const st=window.ScrollTrigger;
  if(gs&&st)gs.registerPlugin(st);
  let paused=reduced.matches, lenis=null, context=null, roleTimer=null, loopId=0, introTimer=null, introFinished=false;
  let frameCount=0, neuralVisible=false;
  const lowPower=(navigator.hardwareConcurrency&&navigator.hardwareConcurrency<=4)||(navigator.deviceMemory&&navigator.deviceMemory<=4);
  const motionButton=document.querySelector('.motion-control');
  const role=document.querySelector('#rotating-role');
  const roles=['Python Developer','Web Developer','AI Explorer'];
  let roleIndex=0;
  const point={x:-100,y:-100,ringX:-100,ringY:-100,active:false};
  const dot=document.querySelector('.cursor-dot'), ring=document.querySelector('.cursor-ring');
  const networks=[];

  function setupCanvas(canvas,network){
    const ctx=canvas.getContext('2d');if(!ctx)return;
    const state={canvas,ctx,network,nodes:[],width:0,height:0,mouse:{x:-500,y:-500}};
    function resize(){
      const box=canvas.getBoundingClientRect();
      state.width=box.width;state.height=box.height;
      const dpr=Math.min(devicePixelRatio||1,small.matches||lowPower?1:1.5);
      canvas.width=Math.round(box.width*dpr);canvas.height=Math.round(box.height*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);
      const count=network?(small.matches||lowPower?17:29):(small.matches||lowPower?12:32);
      state.nodes=Array.from({length:count},(_,i)=>({
        x:network?(Math.cos(i*2.399)*(.18+(i%4)*.08)+.5)*box.width:((i*.618)%1)*box.width,
        y:network?(Math.sin(i*2.399)*(.18+(i%3)*.1)+.5)*box.height:((i*.414+.13)%1)*box.height,
        vx:Math.sin(i*5.7)*.16,vy:Math.cos(i*2.4)*.13,phase:i*.7
      }));
      draw(state,0,false);
    }
    const observer=new ResizeObserver(resize);observer.observe(canvas.parentElement);
    if(network){canvas.parentElement.addEventListener('pointermove',event=>{if(!fine.matches||paused)return;const b=canvas.getBoundingClientRect();state.mouse.x=event.clientX-b.left;state.mouse.y=event.clientY-b.top;});canvas.parentElement.addEventListener('pointerleave',()=>{state.mouse.x=-500;state.mouse.y=-500;});}
    resize();networks.push(state);
  }
  function draw(s,time,advance){
    const {ctx,width,height,nodes,network}=s;ctx.clearRect(0,0,width,height);
    const connection=network?Math.min(width*.43,175):0;
    nodes.forEach((node,i)=>{
      if(advance){node.x+=node.vx;node.y+=node.vy;if(node.x<10||node.x>width-10)node.vx*=-1;if(node.y<10||node.y>height-10)node.vy*=-1;}
      const dx=node.x-s.mouse.x,dy=node.y-s.mouse.y,dist=Math.hypot(dx,dy);
      const push=advance&&network&&dist<100?(100-dist)*.065:0;
      const x=node.x+(dist?dx/dist*push:0),y=node.y+(dist?dy/dist*push:0);
      if(network)nodes.slice(i+1).forEach(other=>{const d=Math.hypot(node.x-other.x,node.y-other.y);if(d<connection){ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(other.x,other.y);ctx.strokeStyle=`rgba(129,162,211,${(1-d/connection)*.22})`;ctx.lineWidth=.6;ctx.stroke();if((i%7===0)&&advance){const progress=(time*.00013+node.phase)%1;ctx.beginPath();ctx.arc(x+(other.x-x)*progress,y+(other.y-y)*progress,1.4,0,Math.PI*2);ctx.fillStyle='rgba(188,209,246,.6)';ctx.fill();}}});
      const alpha=network?.65:.3+Math.sin(time*.0006+node.phase)*.2;
      ctx.beginPath();ctx.arc(x,y,network?(dist<100?2.2:1.6):.8+(i%3)*.3,0,Math.PI*2);ctx.fillStyle=`rgba(160,190,233,${alpha})`;ctx.fill();
    });
  }
  setupCanvas(document.querySelector('#ambient-particles'),false);
  setupCanvas(document.querySelector('#neural-canvas'),true);
  new IntersectionObserver(entries=>{neuralVisible=entries[0].isIntersecting;},{rootMargin:'100px'}).observe(document.querySelector('.neural-panel'));
  function frame(time){
    loopId=0;if(paused||document.hidden)return;
    frameCount++;
    if(fine.matches&&!small.matches&&point.active){
      point.ringX+=(point.x-point.ringX)*.15;point.ringY+=(point.y-point.ringY)*.15;
      dot.style.transform=`translate3d(${point.x-2}px,${point.y-2}px,0)`;
      ring.style.transform=`translate3d(${point.ringX}px,${point.ringY}px,0) translate(-50%,-50%)`;
    }
    if(frameCount%(lowPower?3:2)===0)networks.forEach(s=>{if(!s.network||neuralVisible)draw(s,time,true);});
    loopId=requestAnimationFrame(frame);
  }
  function startLoop(){if(!loopId&&!paused&&!document.hidden)loopId=requestAnimationFrame(frame);}
  document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(loopId);loopId=0;}else startLoop();});
  document.addEventListener('pointermove',event=>{
    if(paused||!fine.matches||small.matches||event.pointerType!=='mouse')return;
    point.x=event.clientX;point.y=event.clientY;
    if(!point.active){point.ringX=point.x;point.ringY=point.y;}point.active=true;
    root.classList.add('pointer-visible','custom-cursor');
    root.classList.toggle('cursor-active',Boolean(event.target.closest('a,button,input,textarea,.tilt-card,img')));
  },{passive:true});
  document.addEventListener('pointerleave',()=>{root.classList.remove('pointer-visible');point.active=false;});

  // The CSS pendulum runs independently; this inner transform adds gentle input.
  document.querySelector('.portrait-stage').addEventListener('pointermove',event=>{
    if(paused||!fine.matches||small.matches)return;
    const b=event.currentTarget.getBoundingClientRect(),x=(event.clientX-b.left)/b.width-.5,y=(event.clientY-b.top)/b.height-.5;
    const photo=document.querySelector('.polaroid');
    if(gs)gs.to(photo,{rotateY:x*5,rotateX:-y*4,rotation:2+x*2,duration:1,ease:'power3.out',overwrite:true});
  });
  document.querySelector('.portrait-stage').addEventListener('pointerleave',()=>{if(gs)gs.to('.polaroid',{rotateX:0,rotateY:0,rotation:2,duration:1.2,ease:'power3.out'});});
  document.querySelectorAll('.glow-card').forEach(card=>{
    card.addEventListener('pointermove',event=>{
      if(paused||!fine.matches||event.pointerType!=='mouse')return;
      const rect=card.getBoundingClientRect(),x=event.clientX-rect.left,y=event.clientY-rect.top;
      card.style.setProperty('--glow-x',`${x}px`);card.style.setProperty('--glow-y',`${y}px`);
      if(card.classList.contains('tilt-card')&&!lowPower){card.style.transform=`perspective(1000px) rotateX(${-(y/rect.height-.5)*7}deg) rotateY(${(x/rect.width-.5)*7}deg) translateY(-5px)`;}
    });
    card.addEventListener('pointerleave',()=>{card.style.transform='';});
  });
  document.querySelectorAll('.magnetic').forEach(button=>{
    button.addEventListener('pointermove',event=>{if(paused||!fine.matches||small.matches||!gs)return;const b=button.getBoundingClientRect();gs.to(button,{x:(event.clientX-b.left-b.width/2)*.09,y:(event.clientY-b.top-b.height/2)*.13,duration:.4,ease:'power2.out',overwrite:true});});
    button.addEventListener('pointerleave',()=>{if(gs)gs.to(button,{x:0,y:0,duration:.7,ease:'elastic.out(1,.6)',overwrite:true});});
  });

  function revealSections(){
    if(!gs||!st)return;
    context=gs.context(()=>{
      gs.utils.toArray('.reveal').forEach(element=>{
        if(element.getBoundingClientRect().bottom<0)return;
        gs.from(element,{autoAlpha:0,y:small.matches?22:35,filter:lowPower?'none':'blur(5px)',duration:.85,ease:'power3.out',scrollTrigger:{trigger:element,start:'top 92%',once:true},clearProps:'opacity,visibility,transform,filter'});
      });
      gs.utils.toArray('.stagger-group').forEach(group=>{gs.from(group.querySelectorAll('.stagger-item'),{autoAlpha:0,y:25,scale:.98,duration:.75,stagger:.12,ease:'power3.out',scrollTrigger:{trigger:group,start:'top 89%',once:true},clearProps:'opacity,visibility,transform'});});
      const name=document.querySelector('.about-name');
      const words=[...name.childNodes].filter(node=>node.nodeType===Node.TEXT_NODE&&node.textContent.trim());
      words.forEach(node=>{const span=document.createElement('span');span.className='about-word';span.textContent=node.textContent;node.replaceWith(span);});
      gs.from(name.querySelectorAll('span'),{yPercent:70,opacity:0,filter:'blur(8px)',duration:1,stagger:.16,ease:'power3.out',scrollTrigger:{trigger:name,start:'top 90%',once:true},clearProps:'all'});
      gs.from('.clip-reveal',{clipPath:'inset(15% 15% 85% 15% round 50%)',scale:.87,duration:1.2,ease:'power3.out',scrollTrigger:{trigger:'.about-visual',start:'top 85%',once:true},clearProps:'clipPath,transform'});
      if(!small.matches&&!lowPower){
        gs.to('.hero-copy',{y:-80,scale:1.025,opacity:0,ease:'none',scrollTrigger:{trigger:'.hero',start:'25% top',end:'bottom 15%',scrub:1}});
        gs.to('.pendulum-scroll',{y:95,rotation:7,opacity:.35,ease:'none',scrollTrigger:{trigger:'.hero',start:'top top',end:'bottom top',scrub:1.2}});
        gs.fromTo('.about-visual',{y:35},{y:-25,ease:'none',scrollTrigger:{trigger:'#sobre',start:'top bottom',end:'bottom top',scrub:1}});
        gs.fromTo('.neural-center',{y:25},{y:-25,ease:'none',scrollTrigger:{trigger:'#ia',start:'top bottom',end:'bottom top',scrub:1}});
      }
      gs.fromTo('.contact-title',{color:'#2a3342'},{color:'#e0e5ee',ease:'none',scrollTrigger:{trigger:'.contact-title',start:'top 95%',end:'top 40%',scrub:.8}});
    });
  }
  function startRoles(){
    clearInterval(roleTimer);
    roleTimer=setInterval(()=>{
      if(paused||document.hidden||!gs)return;
      gs.to(role,{y:-15,opacity:0,filter:'blur(4px)',duration:.32,ease:'power2.in',onComplete:()=>{roleIndex=(roleIndex+1)%roles.length;role.textContent=roles[roleIndex];gs.fromTo(role,{y:18,opacity:0,filter:'blur(4px)'},{y:0,opacity:1,filter:'blur(0)',duration:.55,ease:'power3.out'});}});
    },3600);
  }
  function startSmooth(){
    if(window.Lenis&&fine.matches&&!small.matches&&!lowPower){
      lenis=new Lenis({duration:1.05,smoothWheel:true,syncTouch:false,wheelMultiplier:.85,anchors:false,prevent:node=>node.closest('[data-lenis-prevent]')});
      if(gs){const tick=time=>lenis?.raf(time*1000);gs.ticker.add(tick);lenis._portfolioTick=tick;}
      lenis.on('scroll',()=>st?.update());
    }
  }
  function setMotion(value){
    paused=value;root.classList.toggle('motion-paused',paused);root.classList.toggle('motion-enabled',!paused);
    motionButton.setAttribute('aria-pressed',String(paused));motionButton.setAttribute('aria-label',paused?'Ativar animações':'Pausar animações');
    motionButton.querySelector('span').textContent=paused?'▷':'Ⅱ';motionButton.querySelector('.motion-label').textContent=paused?'Motion off':'Motion on';
    clearInterval(roleTimer);context?.revert();context=null;
    if(lenis){if(gs)gs.ticker.remove(lenis._portfolioTick);lenis.destroy();lenis=null;}
    cancelAnimationFrame(loopId);loopId=0;
    if(paused){
      root.classList.remove('custom-cursor','pointer-visible');
      document.querySelectorAll('.tilt-card,.magnetic').forEach(el=>{if(gs)gs.killTweensOf(el);el.style.transform='';});
      if(gs){gs.killTweensOf(role);gs.set(role,{clearProps:'all'});gs.killTweensOf('.polaroid');gs.set('.polaroid',{clearProps:'all'});}
      networks.forEach(s=>draw(s,0,false));
    }else{startSmooth();if(introFinished)revealSections();startRoles();startLoop();}
    st?.refresh();
  }
  function finishIntro(){
    if(introFinished)return;introFinished=true;clearTimeout(introTimer);clearTimeout(window.portfolioIntroFailsafe);
    root.classList.add('intro-done');document.querySelector('#intro').inert=true;
    document.querySelectorAll('[data-intro-inert]').forEach(el=>{el.inert=false;});
    if(!paused&&gs){
      const timeline=gs.timeline({defaults:{ease:'power3.out'}});
      timeline.from('.nav-shell',{y:-10,opacity:0,duration:.7},0)
        .from('.hero-kicker',{opacity:0,y:10,duration:.6},.12)
        .from('.hero-word',{yPercent:105,opacity:0,filter:'blur(10px)',duration:1,stagger:.14,clearProps:'all'},.2)
        .from('.hero-role,.hero-description',{y:20,opacity:0,filter:'blur(5px)',duration:.85,stagger:.12,clearProps:'all'},.55)
        .from('.hero-actions,.hero-meta',{y:16,opacity:0,duration:.8,stagger:.1,clearProps:'all'},.8)
        .from('.portrait-stage',{y:-30,opacity:0,scale:.96,duration:1.1,clearProps:'all'},.75)
        .from('.hero-bottom',{opacity:0,duration:.8},1);
      revealSections();
    }
  }
  document.querySelector('.intro-skip').addEventListener('click',finishIntro);
  motionButton.addEventListener('click',()=>setMotion(!paused));
  reduced.addEventListener('change',event=>setMotion(event.matches));
  let responsiveTimer;
  const responsive=()=>{clearTimeout(responsiveTimer);responsiveTimer=setTimeout(()=>{if(!paused)setMotion(false);},220);};
  small.addEventListener('change',responsive);fine.addEventListener('change',responsive);
  window.PortfolioMotion={
    scrollTo:element=>lenis?lenis.scrollTo(element,{offset:-95,duration:1.1}):element.scrollIntoView({behavior:paused?'instant':'smooth'}),
    pauseScroll:()=>lenis?.stop(),
    resumeScroll:()=>{if(!document.body.classList.contains('dialog-open')&&!document.body.classList.contains('menu-open'))lenis?.start();},
    enterCards:elements=>{if(!paused&&gs)gs.fromTo(elements,{autoAlpha:0,y:25,scale:.92},{autoAlpha:1,y:0,scale:1,duration:.65,stagger:.055,ease:'power3.out',clearProps:'opacity,visibility,transform'});},
    openCase:dialog=>{if(paused||!gs)return;gs.fromTo(dialog,{opacity:0,scale:.97},{opacity:1,scale:1,duration:.45,ease:'power3.out',clearProps:'all'});gs.fromTo(dialog.querySelector('.case-copy'),{x:-25,opacity:0},{x:0,opacity:1,duration:.65,delay:.1,ease:'power3.out',clearProps:'all'});gs.fromTo(dialog.querySelector('.case-preview'),{x:30,opacity:0},{x:0,opacity:1,duration:.8,delay:.18,ease:'power3.out',clearProps:'all'});},
    countUp:(element,value)=>{if(paused||!gs)return;const counter={value:0};gs.to(counter,{value,duration:.9,ease:'power2.out',onUpdate:()=>{element.textContent=String(Math.round(counter.value));}});}
  };
  setMotion(paused);
  if(paused||!gs)finishIntro();else introTimer=setTimeout(finishIntro,1450);
  if(!gs&&'IntersectionObserver'in window){const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.animate([{opacity:0,transform:'translateY(20px)'},{opacity:1,transform:'none'}],{duration:500});observer.unobserve(entry.target);}}));if(!paused)document.querySelectorAll('.reveal').forEach(el=>observer.observe(el));}
  document.fonts?.ready.then(()=>st?.refresh());
})();

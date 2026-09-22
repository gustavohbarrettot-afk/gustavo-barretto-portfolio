'use strict';
(() => {
  const data = JSON.parse(document.querySelector('#portfolio-data').textContent);
  const $ = selector => document.querySelector(selector);
  const $$ = selector => [...document.querySelectorAll(selector)];
  const motion = () => window.PortfolioMotion;
  const animate = (element, frames, options) => {
    if (document.documentElement.classList.contains('motion-paused')) return Promise.resolve();
    return element.animate(frames, options).finished.catch(() => {});
  };
  const refresh = () => { window.ScrollTrigger?.refresh(); };

  // Menu: keyboard navigation, focus containment and native section anchors.
  const menu = $('#navigation');
  const menuButton = $('.menu-toggle');
  const mobile = matchMedia('(max-width: 640px)');
  function closeMenu(returnFocus = false) {
    menu.classList.remove('is-open');
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.setAttribute('aria-label', 'Abrir menu');
    document.body.classList.remove('menu-open');
    motion()?.resumeScroll();
    if (returnFocus) menuButton.focus();
  }
  menuButton.addEventListener('click', () => {
    const open = menuButton.getAttribute('aria-expanded') !== 'true';
    if (!open) return closeMenu(true);
    menu.classList.add('is-open');
    menuButton.setAttribute('aria-expanded', 'true');
    menuButton.setAttribute('aria-label', 'Fechar menu');
    document.body.classList.add('menu-open');
    motion()?.pauseScroll();
    menu.querySelector('a').focus();
  });
  mobile.addEventListener('change', () => closeMenu());
  document.addEventListener('keydown', event => {
    if (menuButton.getAttribute('aria-expanded') !== 'true') return;
    if (event.key === 'Escape') closeMenu(true);
    if (event.key === 'Tab') {
      const focusables = [...menu.querySelectorAll('a'), menuButton];
      const index = focusables.indexOf(document.activeElement);
      if (event.shiftKey && index <= 0) { event.preventDefault(); focusables.at(-1).focus(); }
      else if (!event.shiftKey && index === focusables.length - 1) { event.preventDefault(); focusables[0].focus(); }
    }
  });

  // Tabs have one selected tab, sliding indicator and an animated content swap.
  const tabs = $$('[data-tab]');
  let activeTab = 'projects';
  let tabTask = Promise.resolve();
  async function changeTab(name) {
    if (name === activeTab) return;
    const oldPanel = $(`#panel-${activeTab}`);
    const newPanel = $(`#panel-${name}`);
    const index = tabs.findIndex(tab => tab.dataset.tab === name);
    $('.segment-indicator').style.transform = `translateX(${index * 100}%)`;
    tabs.forEach(tab => {
      const selected = tab.dataset.tab === name;
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
    });
    await animate(oldPanel, [{opacity:1,transform:'scale(1)',filter:'blur(0)'},{opacity:0,transform:'scale(.985)',filter:'blur(5px)'}], {duration:180,easing:'ease-in',fill:'none'});
    oldPanel.hidden = true;
    newPanel.hidden = false;
    activeTab = name;
    await animate(newPanel, [{opacity:0,transform:'translateY(16px) scale(.99)',filter:'blur(6px)'},{opacity:1,transform:'none',filter:'blur(0)'}], {duration:440,easing:'cubic-bezier(.22,1,.36,1)'});
    if (name === 'stack') motion()?.enterCards(newPanel.querySelectorAll('.skill-card'));
    refresh();
    updateNavigation();
  }
  function selectTab(name) { tabTask = tabTask.then(() => changeTab(name)); return tabTask; }
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => selectTab(tab.dataset.tab));
    tab.addEventListener('keydown', event => {
      let next;
      if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
      else if (event.key === 'ArrowLeft') next = (index + tabs.length - 1) % tabs.length;
      else if (event.key === 'Home') next = 0;
      else if (event.key === 'End') next = tabs.length - 1;
      else return;
      event.preventDefault(); tabs[next].focus(); selectTab(tabs[next].dataset.tab);
    });
  });
  let filterTask = Promise.resolve();
  $$('[data-filter]').forEach(button => button.addEventListener('click', () => {
    filterTask = filterTask.then(async () => {
      const filter = button.dataset.filter;
      $$('[data-filter]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
      const grid = $('.project-grid');
      await animate(grid, [{opacity:1},{opacity:0,transform:'translateY(6px)',filter:'blur(3px)'}], {duration:150});
      let real = 0, concepts = 0;
      $$('[data-project-card]').forEach(card => {
        const visible = filter === 'Todos' || JSON.parse(card.dataset.categories).includes(filter);
        card.hidden = !visible;
        if (visible) data.projects.find(p => p.id === card.dataset.projectCard).concept ? concepts++ : real++;
      });
      $('.project-count').textContent = `${real} ${real === 1 ? 'projeto real' : 'projetos reais'} · ${concepts} ${concepts === 1 ? 'conceito' : 'conceitos'}`;
      await animate(grid, [{opacity:0,transform:'translateY(12px)'},{opacity:1,transform:'none'}], {duration:350,easing:'ease-out'});
      refresh();
    });
  }));

  function scrollToElement(element) {
    if (motion()?.scrollTo) motion().scrollTo(element);
    else element.scrollIntoView({behavior:document.documentElement.classList.contains('motion-paused') ? 'instant' : 'smooth'});
  }
  $$('a[href^="#"]').forEach(link => link.addEventListener('click', async event => {
    const id = link.getAttribute('href');
    const target = $(id);
    if (!target) return;
    event.preventDefault();
    closeMenu();
    if (link.hasAttribute('data-show-stack')) await selectTab('stack');
    if (link.hasAttribute('data-show-projects')) await selectTab('projects');
    if (link.hasAttribute('data-case-contact')) await closeCase(false);
    history.replaceState(null, '', id);
    scrollToElement(target);
    if (link.classList.contains('skip-link')) { target.tabIndex = -1; target.focus({preventScroll:true}); }
  }));
  const navLinks = [...menu.querySelectorAll('a')];
  function updateNavigation() {
    $('#header').classList.toggle('scrolled', scrollY > 35);
    const top = scrollY + innerHeight * .34;
    let current = '#inicio';
    ['inicio','sobre','projetos','ia','lab','github','terminal','contato'].forEach(id => {
      const el = document.getElementById(id);
      if (el.offsetTop <= top) current = '#' + id;
    });
    if (['#lab','#github','#terminal'].includes(current)) current = '#ia';
    if (current === '#projetos' && activeTab === 'stack') current = '#skills';
    navLinks.forEach(link => {
      if (link.getAttribute('href') === current) {
        link.setAttribute('aria-current','location');
        $('.nav-indicator').style.transform = `translateX(${link.offsetLeft}px)`;
        $('.nav-indicator').style.width = `${link.offsetWidth}px`;
      } else link.removeAttribute('aria-current');
    });
    const max = document.documentElement.scrollHeight - innerHeight;
    $('.reading-progress').style.transform = `scaleX(${max > 0 ? Math.min(1,scrollY / max) : 0})`;
  }
  let scrollFrame = false;
  addEventListener('scroll', () => { if (!scrollFrame) { scrollFrame=true; requestAnimationFrame(() => { updateNavigation();scrollFrame=false; }); } }, {passive:true});
  addEventListener('resize', updateNavigation);
  updateNavigation();
  if (location.hash === '#skills') selectTab('stack').then(() => scrollToElement($('#skills')));

  // Native dialog provides focus trapping. Text and data never become raw HTML.
  const dialog = $('#project-dialog');
  let opener, closing = false;
  function makeElement(tag, text, className) {
    const node = document.createElement(tag); node.textContent = text;
    if (className) node.className = className;
    return node;
  }
  $$('[data-project]').forEach(button => button.addEventListener('click', () => {
    const project = data.projects.find(item => item.id === button.dataset.project);
    opener = button;
    $('#dialog-title').textContent = project.name;
    $('.case-status').textContent = project.concept ? 'CONCEITO DE ESTUDO · NÃO IMPLEMENTADO' : 'PROJETO REAL / PORTFÓLIO PESSOAL';
    $('.case-description').textContent = project.description;
    $('.case-chips').replaceChildren(...project.technologies.map(tech => makeElement('span', tech)));
    $('.case-features').replaceChildren(...project.features.map(feature => makeElement('li', feature)));
    $('.case-preview').replaceChildren(button.querySelector('.project-preview').cloneNode(true));
    $('.case-links').replaceChildren();
    [['github','GitHub ↗'],['demo','Live demo ↗']].forEach(([key,label]) => {
      if (!project[key]) return;
      const link = makeElement('a',label,'button secondary');
      link.href = project[key]; link.target = '_blank'; link.rel = 'noopener noreferrer';
      $('.case-links').append(link);
    });
    dialog.showModal(); dialog.scrollTop = 0;
    document.body.classList.add('dialog-open'); motion()?.pauseScroll();
    motion()?.openCase(dialog);
  }));
  async function closeCase(focus = true) {
    if (closing || !dialog.open) return;
    closing = true;
    await animate(dialog,[{opacity:1,transform:'scale(1)'},{opacity:0,transform:'scale(.98)'}],{duration:180,easing:'ease-in'});
    dialog.close(); document.body.classList.remove('dialog-open');motion()?.resumeScroll();
    if (focus) opener?.focus({preventScroll:true});
    closing = false;
  }
  $('.dialog-close').addEventListener('click', () => closeCase());
  dialog.addEventListener('cancel', event => { event.preventDefault(); closeCase(); });
  dialog.addEventListener('click', event => { if (event.target === dialog) { const b=dialog.getBoundingClientRect();if(event.clientX<b.left||event.clientX>b.right||event.clientY<b.top||event.clientY>b.bottom) closeCase(); } });

  // Terminal: local command interpreter, bounded history, safe text output.
  const output = $('#terminal-output'), terminalInput = $('#terminal-input');
  const commands = ['help','about','skills','projects','ai','github','contact','clear'];
  const historyItems = []; let historyIndex = 0, draftCommand = '';
  const responses = {
    help:'Comandos disponíveis:\nhelp     → esta lista\nabout    → quem sou\nskills   → tecnologias\nprojects → projetos e conceitos\nai       → IA no desenvolvimento\ngithub   → perfil público\ncontact  → vamos conversar\nclear    → limpar o terminal',
    about:'Gustavo Barretto. Desenvolvedor em formação, com foco em Python, desenvolvimento web e uso de IA como ferramenta. Estudo, construo e reviso para continuar evoluindo.',
    skills:'Em prática: Python, HTML e CSS.\nEm desenvolvimento: JavaScript, Flask, Git, SQL e APIs.\nFerramentas: GitHub e Vercel.\nIA: uso aplicado, pesquisa e estudo de integrações.',
    projects:data.projects.map(project => `${project.concept ? '[conceito]' : '[real]'} ${project.name}`).join('\n')+'\nOs conceitos ainda não foram implementados. Explore os detalhes na seção Projects.',
    ai:'IA como ferramenta, não como título de especialista.\nPesquisa → prototipagem → desenvolvimento assistido → testes e revisão humana.\nEm estudo: prompts, APIs de IA e integração com aplicações.'
  };
  function runCommand(raw) {
    const command = raw.trim().toLowerCase();
    if (!command) return;
    historyItems.push(raw); if(historyItems.length>50)historyItems.shift();historyIndex=historyItems.length;
    if(command==='clear'){output.replaceChildren();return;}
    output.append(makeElement('p',`gustavo@portfolio:~$ ${raw}`,'terminal-command'));
    if(responses[command])output.append(makeElement('p',responses[command]));
    else if(command==='github'||command==='contact'){
      const line=makeElement('p',command==='github'?'Meu código e minha jornada: ':'Vamos conversar sobre seu projeto: ');
      const link=makeElement('a',command==='github'?'Abrir GitHub ↗':'Abrir WhatsApp ↗');link.href=command==='github'?data.github:data.whatsapp;link.target='_blank';link.rel='noopener noreferrer';line.append(link);output.append(line);
    }else output.append(makeElement('p',`Comando não encontrado: ${raw}. Digite help.`));
    while(output.children.length>60)output.firstElementChild.remove();
    $('.terminal-body').scrollTop=$('.terminal-body').scrollHeight;
  }
  $('#terminal-form').addEventListener('submit',event=>{event.preventDefault();runCommand(terminalInput.value.slice(0,150));terminalInput.value='';draftCommand='';});
  terminalInput.addEventListener('keydown',event=>{
    if(event.key==='ArrowUp'||event.key==='ArrowDown'){
      event.preventDefault();if(!historyItems.length)return;if(historyIndex===historyItems.length)draftCommand=terminalInput.value;
      historyIndex=Math.max(0,Math.min(historyItems.length,historyIndex+(event.key==='ArrowUp'?-1:1)));
      terminalInput.value=historyIndex===historyItems.length?draftCommand:historyItems[historyIndex];
    }else if(event.key==='Tab'&&terminalInput.value){const matches=commands.filter(c=>c.startsWith(terminalInput.value.trim().toLowerCase()));if(matches.length===1){event.preventDefault();terminalInput.value=matches[0];}}
  });

  // Form validates in browser and Flask; explicitly prepares a WhatsApp message.
  const form=$('#contact-form'), readyLink=$('#prepared-whatsapp'), formStatus=$('#form-status');
  form.addEventListener('input',event=>{readyLink.hidden=true;readyLink.removeAttribute('href');formStatus.textContent='';if(event.target.name){event.target.removeAttribute('aria-invalid');const err=$(`#${event.target.name}-error`);if(err)err.textContent='';}});
  form.addEventListener('submit',async event=>{
    event.preventDefault();if(!form.reportValidity())return;
    const submit=form.querySelector('button[type=submit]');submit.disabled=true;submit.textContent='Preparando…';readyLink.hidden=true;formStatus.textContent='';
    $$('.field-error').forEach(el=>el.textContent='');
    try{
      const response=await fetch('/api/contact',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(Object.fromEntries(new FormData(form))),signal:AbortSignal.timeout(12000)});
      const result=await response.json();
      if(!response.ok){Object.entries(result.errors||{}).forEach(([field,message])=>{const error=$(`#${field}-error`);if(error){error.textContent=message;form.elements[field]?.setAttribute('aria-invalid','true');}});formStatus.textContent=result.errors?.form||'Revise os campos indicados.';form.querySelector('[aria-invalid=true]')?.focus();return;}
      const url=new URL(result.whatsapp_url);if(url.origin!=='https://wa.me')throw new Error('Destino inválido');
      readyLink.href=url.href;readyLink.hidden=false;formStatus.textContent=result.message;readyLink.focus({preventScroll:true});refresh();
    }catch{formStatus.textContent='Não foi possível preparar a mensagem agora. Tente novamente ou use o link direto do WhatsApp ao lado.';}
    finally{submit.disabled=false;submit.textContent='Preparar mensagem ↗';}
  });
})();

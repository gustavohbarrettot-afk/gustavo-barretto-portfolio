// O conteúdo permanece acessível mesmo se alguma biblioteca não carregar.
document.documentElement.classList.add('js');
window.portfolioIntroFailsafe = setTimeout(() => {
  document.documentElement.classList.add('intro-done');
  document.querySelectorAll('[data-intro-inert]').forEach(el => { el.inert = false; });
}, 3500);

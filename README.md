# Gustavo Barretto — Portfólio

Reedição do portfólio em HTML, CSS, JavaScript e Python/Flask. Tema escuro, intro animada, moldura suspensa, partículas, animações de rolagem, abas, filtros, detalhes de projetos, terminal e contato pelo WhatsApp.

## Executar no computador

Requer Python 3.12 ou superior. Dentro desta pasta:

```powershell
python -m venv .venv
.venv\Scripts\python -m pip install -r requirements.txt
.venv\Scripts\python app.py
```

Abra http://127.0.0.1:8000. Use `python app.py --port 8001` para outra porta. O servidor local é para desenvolvimento.

## Estrutura e personalização

- `app.py`: páginas Flask, validação de contato e consulta ao GitHub.
- `templates/`: páginas HTML com Jinja.
- `static/css/`: tema e responsividade.
- `static/js/`: interações e animações.
- `static/vendor/`: GSAP, ScrollTrigger e Lenis locais.
- `portfolio.json`: nome, links, WhatsApp e mensagem inicial.
- `projects.json`: projetos, categorias, tecnologias e detalhes.
- `build.py`: valida os dados e copia os recursos para `public/static`.
- `tests/test_app.py`: testes de rotas, contato, cache e falha do GitHub.

Para usar um retrato pessoal, salve a imagem em `static/img/foto.jpg` e configure `photo` como `/static/img/foto.jpg` no `portfolio.json`. Atualmente a moldura usa a marca GH do avatar público do GitHub, identificada como identidade visual. Nenhum retrato pessoal foi fornecido.

Os links de GitHub e e-mail foram recuperados das informações disponíveis. LinkedIn fica oculto até que você configure o endereço correto. As competências distinguem prática, desenvolvimento e estudo, sem métricas de experiência inventadas.

O portfólio é um projeto real; Flow, Workspace e Insight são conceitos ilustrativos, explicitamente identificados como não implementados. Para cadastrar trabalhos reais, edite `projects.json`, altere `concept` para `false` e informe somente links existentes.

## Contato e GitHub

O formulário valida nome, e-mail, assunto e mensagem no navegador e no Flask. Ele prepara uma mensagem para `5571999405045`; o visitante abre o WhatsApp, revisa e envia. O site não envia e-mails, não transmite mensagens automaticamente e não mantém banco de contatos. Funciona também sem JavaScript, com uma página de confirmação.

A seção GitHub mostra somente o perfil de código. Os repositórios de teste não aparecem como trabalhos de portfólio; o histórico completo continua disponível no perfil do GitHub.

## GitHub e Vercel

O projeto ainda não foi publicado. Envie o conteúdo desta pasta para um repositório GitHub; não envie `.venv`, `.env` ou `__pycache__`.

Na Vercel, importe esse repositório e selecione esta pasta como Root Directory se necessário. A integração Flask detecta `app.py` e `requirements.txt`. O `vercel.json` executa `python build.py`; os recursos são copiados para `public/static`, pois a Vercel entrega arquivos estáticos pelo diretório `public`. Não configure o projeto como exportação estática e não adicione `public/index.html`, que conflitaria com a página Flask.

Referência oficial: [Flask na Vercel](https://vercel.com/docs/frameworks/backend/flask). A configuração foi preparada; a publicação e sua validação no ambiente Vercel ficam para a etapa de deploy.

## Verificação

```powershell
python -m unittest discover -s tests -v
python build.py
```

Também foram verificados no navegador o layout desktop e móvel, filtros, modal, terminal, formulário e dados reais do GitHub. Movimento reduzido é respeitado e há um botão para ativar ou pausar os efeitos. Fontes usam Google Fonts, com alternativas locais do sistema.

## Bibliotecas e créditos

- [GSAP e ScrollTrigger 3.13.0](https://gsap.com/docs/v3/): avisos preservados nos arquivos distribuídos; [licença](https://gsap.com/standard-license/).
- [Lenis 1.3.11](https://github.com/darkroomengineering/lenis): licença MIT incluída em `static/vendor/LENIS-LICENSE.txt`.
- [Simple Icons](https://simpleicons.org/): ícones sob CC0; marcas pertencem aos respectivos titulares.
- Fontes DM Sans e Space Grotesk via Google Fonts.
- Avatar: identidade visual pública do perfil GitHub de Gustavo.



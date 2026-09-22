# GHBarretto — Portfólio

Portfólio profissional de Gustavo Barretto, criado com HTML, CSS, JavaScript e Python/Flask.

## Recursos

- Português do Brasil e inglês completos, salvos no navegador.
- Tema escuro padrão e tema claro completo.
- Animações leves ativadas por padrão, com controle persistente.
- Layout responsivo para celular, tablet e desktop.
- Contato pelo WhatsApp com mensagem de orçamento preparada.
- Perfil em `portfolio.json` e projetos reais em `projects.json`.

## Desenvolvimento local

```powershell
python -m venv .venv
.venv\Scripts\python -m pip install -r requirements.txt
.venv\Scripts\python app.py
```

Abra http://127.0.0.1:8000.

## Organização

- `templates/index.html`: estrutura do portfólio.
- `static/css/style.css`: design, temas e responsividade.
- `static/js/boot.js`: preferências antes da renderização.
- `static/js/script.js`: traduções e controles.
- `static/js/animations.js`: animações de entrada durante a rolagem.
- `app.py`: páginas Flask e validação do contato.

## Verificação

```powershell
python -m unittest discover -s tests -v
python build.py
```

Publicado em https://gustavo-barretto-portfolio.vercel.app/

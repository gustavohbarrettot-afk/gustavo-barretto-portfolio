"""Portfólio Flask: apresentação, contato e dados públicos do GitHub."""
import argparse
import json
import re
import time
from urllib.error import HTTPError, URLError
from urllib.parse import quote
from urllib.request import Request, urlopen
from flask import Flask, jsonify, render_template, request
from werkzeug.exceptions import RequestEntityTooLarge
from build import load_content

app = Flask(__name__, static_folder="static", template_folder="templates")
app.config["MAX_CONTENT_LENGTH"] = 16 * 1024
content = load_content()
_github_cache = {"expires": 0, "data": None}

@app.get("/")
def index():
    return render_template("index.html", **content)

@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/api/contact")
def contact():
    """Valida o briefing e prepara o link; não envia nem armazena mensagens."""
    data = request.get_json(silent=True) if request.is_json else request.form.to_dict()
    if not isinstance(data, dict):
        return jsonify(errors={"form": "Envie os campos do formulário."}), 400
    limits = {"name": (2, 80), "email": (5, 160), "subject": (3, 120), "message": (10, 1600)}
    labels = {"name": "Nome", "email": "E-mail", "subject": "Assunto", "message": "Mensagem"}
    errors, clean = {}, {}
    for field, (minimum, maximum) in limits.items():
        value = data.get(field, "")
        if not isinstance(value, str):
            errors[field] = "Informe um texto válido."
            continue
        value = value.strip()
        if not minimum <= len(value) <= maximum:
            errors[field] = f"{labels[field]} deve ter entre {minimum} e {maximum} caracteres."
        elif field != "message" and ("\n" in value or "\r" in value):
            errors[field] = "Use apenas uma linha."
        elif field == "email" and not re.fullmatch(r"[^\s@]+@[^\s@]+\.[^\s@]+", value):
            errors[field] = "Informe um e-mail válido."
        else:
            clean[field] = value
    if errors:
        return jsonify(errors=errors), 422
    message = (f"Olá, Gustavo! Vi seu portfólio e gostaria de conversar sobre um projeto.\n\n"
               f"Nome: {clean['name']}\nE-mail: {clean['email']}\n"
               f"Assunto: {clean['subject']}\n\n{clean['message']}")
    url = f"https://wa.me/{content['profile']['whatsapp']}?text={quote(message)}"
    if not request.is_json:
        return render_template("contact-ready.html", whatsapp_url=url)
    return jsonify(status="prepared", whatsapp_url=url, message="Mensagem preparada. Abra o WhatsApp para revisar e enviar.")

def github_request(path):
    req = Request(f"https://api.github.com{path}", headers={"Accept": "application/vnd.github+json", "User-Agent": "Gustavo-Barretto-Portfolio", "X-GitHub-Api-Version": "2022-11-28"})
    with urlopen(req, timeout=5) as response:
        return json.load(response)

@app.get("/api/github")
def github():
    username = content["profile"].get("github_username", "")
    if not username:
        return jsonify(status="unconfigured", message="Perfil GitHub ainda não vinculado.")
    if _github_cache["data"] and time.monotonic() < _github_cache["expires"]:
        return jsonify(_github_cache["data"])
    try:
        profile = github_request(f"/users/{username}")
        repos = github_request(f"/users/{username}/repos?sort=updated&per_page=6&type=owner")
        data = {"status": "ok", "username": username, "public_repos": profile["public_repos"],
            "repositories": [{"name": repo["name"], "description": repo.get("description") or "Repositório público no GitHub.", "url": f"https://github.com/{username}/{quote(repo['name'])}", "language": repo.get("language") or "Não informada", "updated_at": repo["updated_at"]} for repo in repos if not repo.get("private")],
            "languages": sorted({repo["language"] for repo in repos if repo.get("language")})}
        _github_cache.update(data=data, expires=time.monotonic() + 300)
        return jsonify(data)
    except (HTTPError, URLError, TimeoutError, ValueError, KeyError, TypeError):
        return jsonify(status="unavailable", message="O GitHub está indisponível agora. Você pode visitar o perfil diretamente."), 503

@app.errorhandler(404)
def not_found(error):
    return render_template("error.html", code=404, message="Esta página não foi encontrada."), 404

@app.errorhandler(RequestEntityTooLarge)
def too_large(error):
    return jsonify(errors={"form": "A mensagem é muito longa. Reduza o texto e tente novamente."}), 413

@app.after_request
def headers(response):
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    if request.path.startswith("/api/contact"):
        response.headers["Cache-Control"] = "no-store"
    return response

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--port", type=int, default=8000)
    parser.add_argument("--host", default="127.0.0.1")
    args = parser.parse_args()
    app.run(host=args.host, port=args.port, debug=False)


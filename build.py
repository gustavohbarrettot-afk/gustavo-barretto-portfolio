"""Valida dados e copia assets para o CDN da Vercel."""
import json
import re
import shutil
from pathlib import Path
from urllib.parse import quote, urlsplit
ROOT = Path(__file__).resolve().parent

def load_content():
    profile = json.loads((ROOT / "portfolio.json").read_text(encoding="utf-8"))
    profile["whatsapp"] = re.sub(r"[\s()+-]", "", profile["whatsapp"])
    if not re.fullmatch(r"[1-9]\d{9,14}", profile["whatsapp"]):
        raise ValueError("Informe WhatsApp com país, DDD e número.")
    for field in ("github", "instagram", "linkedin"):
        url = profile.get(field, "")
        if url and (urlsplit(url).scheme != "https" or not urlsplit(url).netloc):
            raise ValueError(f"URL inválida: {field}.")
    username = profile.get("github_username", "")
    if username and not re.fullmatch(r"[A-Za-z0-9][A-Za-z0-9-]{0,38}", username):
        raise ValueError("Usuário GitHub inválido.")
    if profile.get("email") and not re.fullmatch(r"[^\s@]+@[^\s@]+\.[^\s@]+", profile["email"]):
        raise ValueError("E-mail inválido.")
    projects = json.loads((ROOT / "projects.json").read_text(encoding="utf-8"))
    ids = set()
    for project in projects:
        if project["id"] in ids:
            raise ValueError("IDs de projeto devem ser únicos.")
        ids.add(project["id"])
        for field in ("github", "demo"):
            url = project.get(field, "")
            if url and url != "/" and (urlsplit(url).scheme != "https" or not urlsplit(url).netloc):
                raise ValueError(f"Link inválido no projeto {project['id']}.")
    photo = profile.get("photo", "")
    if photo:
        path = (ROOT / photo.lstrip("/")).resolve()
        if not path.is_relative_to((ROOT / "static/img").resolve()) or not path.is_file():
            raise ValueError("A foto precisa existir dentro de static/img.")
    technologies = [
        ("Python", "python", "Backend", "Em prática"), ("HTML5", "html5", "Frontend", "Em prática"),
        ("CSS3", "css", "Frontend", "Em prática"), ("JavaScript", "javascript", "Frontend", "Em desenvolvimento"),
        ("Flask", "flask", "Backend", "Em desenvolvimento"), ("Git", "git", "Ferramentas", "Em desenvolvimento"),
        ("GitHub", "github", "Ferramentas", "Versionamento"), ("SQL", "sqlite", "Banco de dados", "Em desenvolvimento"),
        ("Vercel", "vercel", "Ferramentas", "Publicação"), ("APIs", "api", "Backend", "Em desenvolvimento"),
        ("Inteligência Artificial", "ai", "IA", "Uso aplicado e estudo")]
    return {"profile": profile, "projects": projects, "technologies": technologies,
            "real_projects": len(projects),
            "whatsapp_url": f"https://wa.me/{profile['whatsapp']}?text={quote(profile['message'])}"}

def build():
    load_content()
    shutil.copytree(ROOT / "static", ROOT / "public/static", dirs_exist_ok=True)
    print("Dados validados; assets preparados em public/static.")

if __name__ == "__main__":
    build()


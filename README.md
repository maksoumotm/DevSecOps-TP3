# DevSecOps TP3 — Pipeline CI/CD Sécurisé

[![Security Pipeline](https://github.com/maksoumotm/DevSecOps-TP3/actions/workflows/security.yml/badge.svg)](https://github.com/maksoumotm/DevSecOps-TP3/actions/workflows/security.yml)

Application Node.js/Express accompagnée d'un pipeline DevSecOps complet intégré via **GitHub Actions**. Le pipeline détecte automatiquement les failles de sécurité à chaque push et bloque tout code défectueux via un **Security Gate**.

---

## 🛡️ Architecture du Pipeline

```
Push ──► SAST ──┐
         SCA ───┤
         Secrets┤───► Security Gate ──► (déploiement autorisé ✅)
         CodeQL ┤
         Build ─┤
                └──► Container Scan
                └──► DAST
```

| Étape | Outil | Détecte |
|---|---|---|
| **SAST** | Semgrep + règles custom | Injection SQL, XSS, secrets hardcodés |
| **SCA** | npm audit | CVE dans les dépendances Node.js |
| **Secret Detection** | Gitleaks | Clés API, tokens, mots de passe dans le code |
| **CodeQL** | GitHub CodeQL | Failles complexes et flux de données non sécurisés |
| **Container Scan** | Trivy | CVE dans l'image Docker de base (Alpine) |
| **DAST** | OWASP ZAP | Vulnérabilités détectées à l'exécution (injection, headers…) |
| **Security Gate** | GitHub Actions | Bloque le merge si un scan échoue |

---

## ⚙️ Lancement Local

**Prérequis** : Node.js 22+, Docker

```bash
# 1. Copier et remplir les variables d'environnement
cp .env.example .env   # puis éditer .env

# 2. Installer les dépendances
cd src && npm install

# 3. Démarrer l'application
node server.js
```

L'application tourne sur `http://localhost:3000`.

### Variables d'environnement requises

| Variable | Description | Exemple |
|---|---|---|
| `JWT_SECRET` | Clé de signature JWT (≥ 32 caractères) | `openssl rand -base64 32` |
| `ADMIN_USER` | Identifiant administrateur | `admin` |
| `ADMIN_PASS` | Mot de passe administrateur (≥ 8 chars) | `SecurePass123!` |

---

## 🐳 Construction Docker

```bash
docker build -t vuln-app .

docker run -p 3000:3000 \
  -e JWT_SECRET="votre_secret_de_32_chars_minimum" \
  -e ADMIN_USER="admin" \
  -e ADMIN_PASS="SecurePass123!" \
  vuln-app
```

---

## 🔌 Endpoints API

| Méthode | Route | Description |
|---|---|---|
| `POST` | `/api/login` | Authentification - retourne un JWT |
| `GET` | `/health` | Healthcheck (utilisé par Docker) |

### Exemple de login

```bash
curl -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "SecurePass123!"}'
```

---

## 📁 Structure du Projet

```
.
├── .github/workflows/security.yml   # Pipeline CI/CD DevSecOps
├── .semgrep/rules.yml               # Règles Semgrep personnalisées (ex : SQLi)
├── src/
│   ├── server.js                    # Application Express.js
│   ├── package.json
│   └── package-lock.json
├── Dockerfile                       # Image node:22-alpine + hardening
├── Rapport_Securite.md              # Rapport des vulnérabilités trouvées et corrigées
└── README.md
```

---

## 🔒 Mesures de Sécurité Implémentées

- **Helmet** : headers HTTP sécurisés (CSP, HSTS…)
- **Rate Limiting** : max 5 tentatives de login / 15 min
- **Validation des entrées** : `express-validator` sur tous les champs
- **JWT** : secret d'au moins 32 caractères, `process.exit(1)` si absent
- **Docker** : exécution en utilisateur non-root, image mise à jour (`apk upgrade`)
- **Trivy** : ignore les CVE sans correctif disponible (`ignore-unfixed: true`)

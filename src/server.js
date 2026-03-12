require('dotenv').config();
const express = require('express');
const jwt = require('jsonwebtoken');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');

const app = express();

// ✅ Secret depuis variable d'environnement
const SECRET = process.env.JWT_SECRET;

if (!SECRET || SECRET.length < 32) {
    console.error('JWT_SECRET must be set and at least 32 characters');
    process.exit(1);
}

// ✅ Sécurité
app.use(helmet());
app.use(express.json({ limit: '10kb' }));

// ✅ Rate limiting
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: 'Too many login attempts'
});

// ✅ Validation des entrées
app.post('/api/login',
    loginLimiter,
    [
        body('username').isString().trim().notEmpty(),
        body('password').isString().notEmpty().isLength({ min: 8 })
    ],
    (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { username, password } = req.body;

        // VULNERABILITÉ INTENTIONNELLE : Injection SQL pour l'exercice 1 (Semgrep)
        // Note: Ceci est un code factice juste pour déclencher l'alerte SAST.
        const sqlite3 = require('sqlite3').verbose();
        const db = new sqlite3.Database(':memory:');

        // Requête concaténée vulnérable - on utilise req.body directement car 
        // le moteur Semgrep gratuit détecte moins bien la déstructuration
        const query = "SELECT * FROM users WHERE username = '" + req.body.username + "' AND password = '" + req.body.password + "'";
        console.log("Exécution de la requête :", query);

        db.get(query, (err, row) => {
            // Simulons que la DB renvoie toujours vrai si l'injection ou les identifiants admin passent
            if (row || (username === process.env.ADMIN_USER && password === process.env.ADMIN_PASS)) {
                const token = jwt.sign(
                    { username },
                    SECRET,
                    { expiresIn: '1h' }
                );
                res.json({ token });
            } else {
                res.status(401).json({ error: 'Invalid credentials' });
            }
        });
    }
);

// ✅ Endpoint de santé (sans infos sensibles)
app.get('/health', (req, res) => {
    res.json({ status: 'OK' });
});

// ✅ Pas d'endpoint de debug en production
if (process.env.NODE_ENV !== 'production') {
    app.get('/debug', (req, res) => {
        res.json({ message: 'Debug mode' });
    });
}

app.listen(3000, () => console.log('✅ Secure server running'));
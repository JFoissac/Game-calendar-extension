import express from 'express';
import cors from 'cors';
import https from 'https';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fetch from 'node-fetch';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
app.use(cors());

// Page d'accueil
app.get('/', (req, res) => {
    res.send(`
        <html>
            <head>
                <title>Serveur d'authentification Twitch</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        max-width: 800px;
                        margin: 0 auto;
                        padding: 20px;
                        background: #18181b;
                        color: white;
                    }
                    .container {
                        background: #1f1f23;
                        padding: 20px;
                        border-radius: 8px;
                        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                    }
                    h1 { color: #9146ff; }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>Serveur d'authentification Twitch</h1>
                    <p>Ce serveur gère l'authentification OAuth pour l'extension Game Calendar.</p>
                    <p>Statut : En ligne ✅</p>
                </div>
            </body>
        </html>
    `);
});

// Route pour la page de callback
app.get('/callback', (req, res) => {
    res.send(`
        <html>
            <head>
                <title>Authentification Twitch</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        background: #18181b;
                        color: white;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        height: 100vh;
                        margin: 0;
                    }
                    .container {
                        background: #1f1f23;
                        padding: 20px;
                        border-radius: 8px;
                        text-align: center;
                        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                    }
                    h2 { color: #9146ff; }
                </style>
            </head>
            <body>
                <div class="container">
                    <h2>Authentification réussie !</h2>
                    <p>Vous pouvez fermer cette fenêtre et retourner à l'extension.</p>
                </div>
                <script>
                    // Récupérer les paramètres d'authentification
                    const hash = window.location.hash.substring(1);
                    const params = new URLSearchParams(hash);
                    const accessToken = params.get('access_token');
                    
                    if (accessToken) {
                        // Stocker le token dans le localStorage
                        localStorage.setItem('twitch_access_token', accessToken);
                        
                        // Envoyer un message à toutes les fenêtres ouvertes
                        window.opener?.postMessage(
                            { 
                                type: 'TWITCH_AUTH_SUCCESS',
                                accessToken: accessToken
                            },
                            '*'
                        );
                        
                        // Fermer la fenêtre après un court délai
                        setTimeout(() => {
                            window.close();
                        }, 2000);
                    }
                </script>
            </body>
        </html>
    `);
});

// Proxy pour GiantBomb
app.get('/api/giantbomb/*', async (req, res) => {
    try {
        const API_KEY = 'ad58e70e0fade75ec9a28ef655e5c4ad2c5ce918';
        const giantBombPath = req.params[0];
        const queryString = new URLSearchParams(req.query).toString();
        
        const url = `https://www.giantbomb.com/api/${giantBombPath}?api_key=${API_KEY}&${queryString}&format=json`;
        console.log('URL GiantBomb:', url);
        
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'GameCalendarExtension/1.0',
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET',
                'Access-Control-Allow-Headers': 'Content-Type'
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Réponse GiantBomb:', {
                status: response.status,
                statusText: response.statusText,
                headers: Object.fromEntries(response.headers),
                body: errorText
            });
            throw new Error(`GiantBomb API responded with ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        console.log('Réponse GiantBomb réussie');
        res.json(data);
    } catch (error) {
        console.error('Erreur proxy GiantBomb:', error);
        res.status(500).json({ error: error.message });
    }
});

// Gérer les routes non trouvées
app.use((req, res) => {
    res.status(404).send(`
        <html>
            <head>
                <title>404 - Page non trouvée</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        background: #18181b;
                        color: white;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        height: 100vh;
                        margin: 0;
                    }
                    .container {
                        background: #1f1f23;
                        padding: 20px;
                        border-radius: 8px;
                        text-align: center;
                        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                    }
                    h2 { color: #ff4444; }
                </style>
            </head>
            <body>
                <div class="container">
                    <h2>404 - Page non trouvée</h2>
                    <p>La page que vous recherchez n'existe pas.</p>
                </div>
            </body>
        </html>
    `);
});

// Certificat pour HTTPS
const options = {
    key: fs.readFileSync(join(__dirname, 'localhost-key.pem')),
    cert: fs.readFileSync(join(__dirname, 'localhost.pem'))
};

// Démarrer le serveur HTTPS
https.createServer(options, app).listen(3000, () => {
    console.log('Serveur démarré sur https://localhost:3000');
});

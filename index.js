import { getResponse, getDetailedResponse, GetQuizz } from "./gemini.js";
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url'; // Required to recreate __dirname

// 1. Setup: Create __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3000;

// ----------------------------------------------------
// 2. MIDDLEWARE
// ----------------------------------------------------

// Middleware 1: Logger
app.use((req, res, next) => {
    console.log(`Request received: ${req.method} ${req.url}`);
    next(); 
});

// Middleware 2: JSON Parser
app.use(express.json());

// ----------------------------------------------------
// 3. ROUTING
// ----------------------------------------------------

// Serve static files (Now works because we fixed __dirname)
app.use(express.static(path.join(__dirname, 'pages')));

// Route Handler: Home
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'pages', 'home.html'));
});

// API: POST /api/summarize
// ⚠️ Marked as 'async' so we can wait for Gemini
app.post('/api/summarize', async (req, res) => {
    const { url, outputs, noOfQuestions } = req.body || {};
    if (!url || !Array.isArray(outputs)) return res.status(400).send('Missing url or outputs');

    const out = {};

    // Loop through requested outputs
    // var jobs = outputs.length(); 
    for (const o of outputs) {
        switch (o) {
            case 'summary': 
                try {
                    // ⚠️ Added 'await' and fixed spelling of 'getResponse'
                    console.log("Fetching summary from Gemini...");
                    out.summary = await getResponse(url); 
                } catch (error) {
                    console.error("Gemini Error:", error);
                    out.summary = "Error fetching summary from AI.";
                }
                break;
            case 'detailed': 
            try {
                    // ⚠️ Added 'await' and fixed spelling of 'getResponse'
                    console.log("Fetching summary from Gemini...");
                    out.detailed = await getDetailedResponse(url); 
                } catch (error) {
                    console.error("Gemini Error:", error);
                    out.detailed = "Error fetching summary from AI.";
                }
                
                break;
            case 'quiz': 
                console.log(noOfQuestions);
                out.quiz = await GetQuizz(url,noOfQuestions);
                break;
            case 'flashcards':
                out.flashcards = await GetFlashCards(url);
                break;
            default: 
                out[o] = `from server: Placeholder for ${o}`;
        }
    }

    // Send response (removed setTimeout since the AI call takes real time anyway)
    res.json({ url, outputs: out });
});

// Route Handler: Profile
app.get('/profile', (req, res) => {
    const user = { name: 'Alex', id: 123 };
    res.json(user);
});

// Route Handler: Login
app.post('/login', (req, res) => {
    const username = req.body.username;
    console.log('User trying to log in:', username);
    res.send(`Welcome, ${username}!`);
});

// ----------------------------------------------------
// 4. Start the Server
// ----------------------------------------------------
app.listen(port, () => {
    console.log(`Server listening on http://localhost:${port}`);
});
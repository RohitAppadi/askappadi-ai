import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import os from 'os';
import ollama from 'ollama';
import { fileURLToPath } from 'url';
import { createServer } from 'http';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8080;
const upload = multer({ dest: 'uploads/' });

let availableModels = [];
let currentModel = '';
let modelResponse = '';
let chatHistory = [];
let isProcessing = false;
let errorMessage = '';
let ollamaStatus = 'unknown';
const outputFilePath = path.join(__dirname, 'public', 'output.txt');

async function loadAvailableModels() {
  try {
    const response = await ollama.list();
    availableModels = response.models.map(m => m.name);
    currentModel = availableModels[0] || 'llama2';
    ollamaStatus = 'connected';
    console.log('✅ Models loaded:', availableModels);
  } catch (err) {
    availableModels = ['llama2'];
    currentModel = 'llama2';
    ollamaStatus = 'disconnected';
    console.log('⚠️ Ollama unavailable, fallback to llama2');
  }
}

function getTaskPrompt(task) {
  const prompts = {
    generate_testcase: 'Generate test cases for the following input:',
    generate_code: 'Write code based on this description:',
    generate_framework_selenium: 'Create a Selenium framework structure for:',
    generate_framework_cucumber: 'Create a Cucumber framework structure for:',
    generate_api: 'Design an API specification for:'
  };
  return prompts[task] || '';
}

async function invokeLLM(model, prompt) {
  isProcessing = true;
  errorMessage = '';
  modelResponse = '';

  try {
    const response = await ollama.chat({
      model,
      messages: [{ role: 'user', content: prompt }]
    });

    modelResponse = response.message.content;

    chatHistory.unshift({
      model,
      prompt,
      response: modelResponse,
      timestamp: new Date().toISOString()
    });

    if (chatHistory.length > 10) {
      chatHistory = chatHistory.slice(0, 10);
    }

    fs.writeFileSync(outputFilePath, modelResponse, 'utf-8');

  } catch (err) {
    errorMessage = `Error: ${err.message}`;
    console.error('❌ LLM Error:', err);
  }

  isProcessing = false;
}

function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name in interfaces) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

app.get('/', (req, res) => {
  res.render('pages/index', {
    models: availableModels,
    currentModel,
    response: modelResponse,
    isProcessing,
    error: errorMessage,
    history: chatHistory
  });
});

app.post('/query', upload.single('inputFile'), async (req, res) => {
  const { prompt, model, task, readFromLocation } = req.body;
  let fileContent = '';

  if (!prompt || !model || !task) {
    errorMessage = 'Please enter a prompt, select a model, and choose a task.';
    return res.redirect('/');
  }

  if (prompt.length > 5000) {
    errorMessage = 'Prompt too long (max 5000 characters).';
    return res.redirect('/');
  }

  if (req.file) {
    fileContent = fs.readFileSync(req.file.path, 'utf-8');
  }

  currentModel = model;
  const finalPrompt = `${getTaskPrompt(task)}\n${prompt}\n${fileContent}`;
  await invokeLLM(model, finalPrompt);
  res.redirect('/');
});

app.get('/download-output', (req, res) => {
  if (fs.existsSync(outputFilePath)) {
    res.download(outputFilePath, 'output.txt');
  } else {
    res.status(404).send('No output file available.');
  }
});

app.post('/clear-history', (req, res) => {
  chatHistory = [];
  modelResponse = '';
  errorMessage = '';
  res.redirect('/');
});

app.get('/status', (req, res) => {
  res.render('pages/status', {
    models: availableModels,
    currentModel,
    history: chatHistory,
    isProcessing,
    ollamaStatus,
    systemInfo: {
      nodeVersion: process.version,
      platform: process.platform,
      uptime: Math.floor(process.uptime()),
      memory: process.memoryUsage()
    }
  });
});

app.get('/api/health', async (req, res) => {
  try {
    const models = await ollama.list();
    res.json({
      status: 'healthy',
      ollama: 'connected',
      models: models.models?.length || 0,
      currentModel,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({
      status: 'error',
      ollama: 'disconnected',
      error: err.message,
      currentModel,
      timestamp: new Date().toISOString()
    });
  }
});

app.use((req, res) => {
  res.status(404).render('pages/error', {
    title: '404 - Page Not Found',
    message: `The requested page "${req.url}" does not exist.`,
    suggestion: 'Check the URL or return to the homepage.'
  });
});

app.use((err, req, res, next) => {
  console.error('❌ Server Error:', err);
  res.status(500).render('pages/error', {
    title: '500 - Server Error',
    message: 'An unexpected error occurred.',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

const server = createServer(app);
server.listen(PORT, async () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
  console.log(`🌐 Network: http://${getLocalIP()}:${PORT}`);
  await loadAvailableModels();
});

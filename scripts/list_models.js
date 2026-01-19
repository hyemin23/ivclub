
const { GoogleGenAI } = require("@google/genai");
const fs = require('fs');
const path = require('path');

// Read .env.local manually since we are running with node
const envPath = path.resolve(__dirname, '../.env.local');
let apiKey = '';
if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    const match = envContent.match(/NEXT_PUBLIC_GEMINI_KEY_1=(.+)/);
    if (match) {
        apiKey = match[1].trim();
    }
}

if (!apiKey) {
    console.error("API Key not found in .env.local");
    process.exit(1);
}

const genAI = new GoogleGenAI({ apiKey });

async function listModels() {
    try {
        console.log("Fetching models...");
        const response = await genAI.models.list();
        // The response might be an async iterable or a list object depending on SDK version
        // Check structure
        console.log("Models:");
        for await (const model of response) {
            console.log(`- ${model.name} (${model.version}) [Supported Generation Methods: ${model.supportedGenerationMethods}]`);
        }
    } catch (error) {
        console.error("Error listing models:", error);
    }
}

listModels();

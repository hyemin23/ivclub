// check_models.js
const https = require('https');
const fs = require('fs');
const path = require('path');

// 1. Get API Key
function getApiKey() {
    try {
        const envPath = path.resolve(process.cwd(), '.env.local');
        if (fs.existsSync(envPath)) {
            const envFile = fs.readFileSync(envPath, 'utf8');
            const match = envFile.match(/NEXT_PUBLIC_GEMINI_KEY_1=(.*)/);
            if (match && match[1]) {
                return match[1].trim();
            }
        }
    } catch (e) {
        // ignore
    }
    return process.env.NEXT_PUBLIC_GEMINI_API_KEY;
}

const API_KEY = getApiKey();

if (!API_KEY) {
    console.error("❌ Error: API Key not found in .env.local");
    process.exit(1);
}

console.log(`🔑 API Key Found (${API_KEY.substring(0, 5)}...). Fetching models...\n`);

// 2. Fetch Models via REST API
const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`;

https.get(url, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        try {
            const json = JSON.parse(data);
            if (json.error) {
                console.error("🚨 API Error:", json.error.message);
                return;
            }

            const models = (json.models || []).filter(m => m.name.includes('gemini'));
            
            console.log("✅ [Available Gemini Models]");
            console.log("==================================================");
            
            models.forEach(model => {
                const id = model.name.replace('models/', '');
                const methods = model.supportedGenerationMethods || [];
                const canGen = methods.includes('generateContent');
                const icon = canGen ? '🟢' : '🔴';
                
                console.log(`${icon} ID: ${id}`);
                console.log(`   Ver: ${model.version} | Display: ${model.displayName}`);
                // console.log(`   Methods: ${methods.join(', ')}`); // Verbose
                console.log("--------------------------------------------------");
            });

        } catch (e) {
            console.error("Parse Error:", e.message);
        }
    });
}).on('error', err => {
    console.error("Network Error:", err.message);
});

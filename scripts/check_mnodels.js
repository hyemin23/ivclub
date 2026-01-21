// check_models.js
// 실행 방법: 터미널에서 'node check_models.js' 입력

const https = require('https');
const fs = require('fs');
const path = require('path');

// 1. .env.local 파일에서 API 키 읽어오기 (Next.js 환경)
function getApiKey() {
    try {
        const envPath = path.resolve(process.cwd(), '.env.local');
        if (fs.existsSync(envPath)) {
            const envFile = fs.readFileSync(envPath, 'utf8');
            const match = envFile.match(/NEXT_PUBLIC_GEMINI_API_KEY=(.*)/);
            if (match && match[1]) {
                return match[1].trim();
            }
        }
    } catch (e) {
        // 무시
    }
    return process.env.NEXT_PUBLIC_GEMINI_API_KEY; // 환경변수에 이미 있을 경우
}

const API_KEY = getApiKey();

if (!API_KEY) {
    console.error("❌ 오류: API Key를 찾을 수 없습니다.");
    console.error("   .env.local 파일에 NEXT_PUBLIC_GEMINI_API_KEY가 있는지 확인해주세요.");
    process.exit(1);
}

console.log(`🔑 API Key 확인됨 (${API_KEY.substring(0, 5)}...). 구글 서버 조회 중...\n`);

// 2. 구글 REST API로 모델 리스트 직접 요청
const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`;

https.get(url, (res) => {
    let data = '';

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        try {
            const json = JSON.parse(data);

            if (json.error) {
                console.error("🚨 API 에러 발생:", json.error.message);
                return;
            }

            const models = json.models || [];

            // 'gemini'가 포함된 모델만 필터링
            const geminiModels = models.filter(m => m.name.includes('gemini'));

            console.log("✅ [현재 내 키로 사용 가능한 Gemini 모델 목록]");
            console.log("==================================================");

            if (geminiModels.length === 0) {
                console.log("⚠️  목록 없음: 이 키로는 Gemini 모델에 접근 권한이 없거나 배포되지 않았습니다.");
            }

            geminiModels.forEach(model => {
                // 보기 좋게 출력
                const modelId = model.name.replace('models/', '');
                const canGenerate = model.supportedGenerationMethods.includes('generateContent');
                const statusIcon = canGenerate ? '🟢' : '🔴';
                 

                console.log(`${statusIcon} ID: ${modelId}`);
                console.log(`   - 버전: ${model.version}`);
                console.log(`   - 설명: ${model.displayName}`);
                console.log(`   - 이미지/텍스트 생성 가능여부: ${canGenerate ? '가능 (OK)' : '불가능'}`);
                console.log("--------------------------------------------------");
            });

            console.log("\n💡 팁: 위 목록에 있는 'ID'를 그대로 복사해서 코드에 넣으세요.");
            console.log("   (🟢 표시가 있는 모델만 generateContent 함수에서 쓸 수 있습니다.)");

        } catch (e) {
            console.error("파싱 에러:", e.message);
        }
    });

}).on("error", (err) => {
    console.error("네트워크 에러:", err.message);
});


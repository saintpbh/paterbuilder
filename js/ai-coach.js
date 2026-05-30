// 클라이언트 브라우저 단에서 직접 Gemini 2.5 Flash API를 안전하게 연동합니다.
// API Key가 미설정된 상태에서는 우아하게 데모 시뮬레이션 데이터를 제공해 앱 경험이 막히지 않게 조치합니다.

const GEMINI_KEY = 'paterbuilder_gemini_key';

export function getAPIKey() {
    return localStorage.getItem(GEMINI_KEY) || "";
}

export function setAPIKey(key) {
    if (key) {
        localStorage.setItem(GEMINI_KEY, key.trim());
    } else {
        localStorage.removeItem(GEMINI_KEY);
    }
}

export function hasAPIKey() {
    return !!getAPIKey();
}

// Gemini API를 직접 호출하는 핵심 서비스 함수입니다.
async function callGemini(prompt) {
    const apiKey = getAPIKey();
    if (!apiKey) {
        throw new Error("API_KEY_MISSING");
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            contents: [
                {
                    parts: [
                        { text: prompt }
                    ]
                }
            ],
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 800
            }
        })
    });

    if (!response.ok) {
        const errorJson = await response.json().catch(() => ({}));
        throw new Error(errorJson?.error?.message || `HTTP error ${response.status}`);
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "답변을 생성할 수 없습니다.";
}

// 챗봇 형태의 실시간 질답
export async function askAICoach(userMessage, currentSentenceContext = "") {
    if (!hasAPIKey()) {
        return getDemoResponse(userMessage, currentSentenceContext);
    }

    const systemContext = `
당신은 세계 최고의 5형식 영어 문법 코치이자 친근한 AI 튜터 '레인보우 코치'입니다.
현재 사용자는 한국어를 보고 영어 단어 청크를 조합하여 문장을 학습하는 "Rainbow Pattern Builder" 앱을 사용 중입니다.
사용자 질문: "${userMessage}"
${currentSentenceContext ? `현재 학습 중인 대상 문장 Context:\n- 영어: ${currentSentenceContext.english}\n- 한국어: ${currentSentenceContext.korean}` : ""}

[답변 작성 가이드라인]
1. 친근하고 격려하는 어조(이모지 포함)로 한글로 답변하세요.
2. 문법적 구조(특히 주어, 동사, 목적어, 보어 등 문장 구성 성분)를 명쾌하게 짚어주세요.
3. 원어민이 느끼는 실제 뉘앙스 차이(예: keep vs leave 등)를 명확하게 설명해주세요.
4. 연관성 있고 실생활에 바로 쓸 수 있는 짧은 유용한 예문 2개와 그 해석을 함께 제공해주세요.
5. 마크다운 형식을 적극 활용하여 가독성 있게 렌더링하세요.
`;

    try {
        return await callGemini(systemContext);
    } catch (e) {
        console.error("Gemini API Error:", e);
        if (e.message === "API_KEY_MISSING") {
            return "⚠️ **Gemini API Key가 등록되지 않았습니다.**\n\n화면 우측 상단의 설정(⚙️) 버튼을 클릭하여 본인의 Gemini API Key를 입력해주시면 고성능 AI 문법 코칭을 완벽히 받으실 수 있습니다!\n\n*(현재는 체험용 데모 응답으로 대체됩니다)*\n\n" + getDemoResponse(userMessage, currentSentenceContext);
        }
        return `❌ **AI 튜터 호출 오류 발생**\n\n사유: ${e.message}\n\n입력하신 API Key가 만료되었거나 올바르지 않은지 확인해 주세요.`;
    }
}

// 오답 발생 시 무엇이 잘못되었는지 AI가 즉각 피드백해주는 기능
export async function analyzeError(koreanText, originalEnglish, userBuiltSentence) {
    if (!hasAPIKey()) {
        return `💡 **[오답 피드백 데모]**\n\n'${userBuiltSentence}' 구조는 문법상 조금 부자연스럽습니다. \n\n원래 표현하려던 문장은 **'${originalEnglish}'**입니다. 주어와 동사 다음 목적어의 '상태'를 자연스럽게 묘사하는 형용사/보어 청크 순서가 바뀌었는지 다시 한 번 카드를 배치해보세요!`;
    }

    const prompt = `
[오답 분석 요청]
사용자가 한국어 뜻 "${koreanText}"을 보고 영어 문장을 조합했으나 실패했습니다.
- 올바른 정답 문장: "${originalEnglish}"
- 사용자가 잘못 조합한 조합: "${userBuiltSentence}"

[분석 가이드라인]
- 사용자가 어떤 문장 성분(주어/동사/목적어/보어)의 위치를 혼동했는지 명확히 짚어주세요.
- 두 조합의 뉘앙스 차이를 간결하게 분석해 주세요 (3줄 이내 요약).
- 친절한 톤으로 어떻게 카드를 다시 배치해야 하는지 가이드해주세요.
`;

    try {
        return await callGemini(prompt);
    } catch (e) {
        return `💡 **오답 매칭 분석**\n\n제시 문장: ${originalEnglish}\n조합 시도: ${userBuiltSentence}\n\n주어와 동사의 결합을 마친 뒤, 상태를 묘사하는 보어 성분을 목적어 바로 뒤에 배치해야 원어민스러운 5형식 문장이 완성됩니다! 카드의 색상 태그를 확인하고 다시 도전해 보세요.`;
    }
}

// API Key가 없거나 오류 발생 시 동작하는 스마트 데모 응답 엔진
function getDemoResponse(question, context) {
    const qLower = question.toLowerCase();
    
    if (qLower.includes("5형식") || qLower.includes("구조") || qLower.includes("형식")) {
        return `🌈 **[데모 모드] 5형식 문법 완벽 마스터 팁!**

영어의 **5형식(SVOC)** 구조는 **"주어(S) + 동사(V) + 목적어(O) + 목적격보어(C)"**로 구성됩니다.
이 구조의 핵심은 **목적어(O)와 보어(C) 사이에 '주어-서술어' 관계**가 성립한다는 점이에요!

*   **예시:** *I made him happy.* (나는 그를 행복하게 만들었다.)
    *   *Him(목적어)* = 그가
    *   *Happy(보어)* = 행복한 상태이다.

**💡 원어민 표현 꿀팁:**
접속사나 긴 절을 쓰지 않고 단 네 단어로 대상의 상태 변화나 결과를 설명하는 원어민들의 강력한 지름길 화법입니다!

**📚 추천 예문:**
1.  *She kept me waiting.* (그녀는 나를 계속 기다리게 만들었다.)
2.  *We found the test easy.* (우리는 그 시험이 쉽다는 것을 깨달았다.)`;
    }

    if (qLower.includes("keep") || qLower.includes("leave")) {
        return `🌈 **[데모 모드] Keep vs Leave 뉘앙스 전격 비교!**

두 동사 모두 5형식에서 아주 자주 쓰이지만 결정적인 느낌의 차이가 있습니다.

1.  **Keep (유지 및 제어)**
    *   의도적으로 대상을 통제하여 특정 상태가 계속 지속되게 유도하는 뉘앙스입니다.
    *   *Example:* *Please keep the door closed.* (의도적으로 문을 닫아두세요.)

2.  **Leave (방치 및 양보)**
    *   더 이상 간섭하지 않고 힘을 빼어 그대로 내버려 두는 뉘앙스입니다.
    *   *Example:* *Leave the door open.* (문이 열린 채로 그냥 신경 쓰지 말고 놔두세요.)`;
    }

    // 기본 응답
    return `🌈 **[데모 모드 AI 코치] 무엇이든 물어보세요!**

현재 입력해주신 질문: "${question}"

*현재는 데모 모드로 작동 중입니다.* 본인의 **Gemini API Key**를 입력하시면 실시간으로 학습 문장을 정확히 진단해주는 커스텀 튜터링 서비스를 누리실 수 있습니다.

**💡 오늘의 영어 학습 꿀팁:**
영어 문장을 큰 소리로 읽으면서(Shadowing) 카드를 맞추면 시각과 청각, 조음 기관이 동시에 활성화되어 암기율이 300% 이상 급상승합니다! 음성 인식 말하기 모드를 실행해 보세요! 🎙️`;
}

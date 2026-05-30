// Web Speech API를 활용해 오프라인으로 발음을 정확히 인식하고, Levenshtein Distance를 적용하여 네이티브와의 발음 정밀도를 0~100% 사이로 환산합니다.

export function isSpeechSupported() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    return !!SpeechRecognition;
}

let recognition = null;

export function startListening(onResult, onError, onEnd) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
        onError("Speech recognition not supported in this browser.");
        return;
    }

    // 싱글톤 패턴으로 기존 인식기가 있다면 정지 처리하여 마이크 자원 충돌 방지
    if (recognition) {
        try {
            recognition.abort();
        } catch (e) {}
    }

    recognition = new SpeechRecognition();
    recognition.lang = 'en-US'; // 영어 발음 평가용
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
        const resultText = event.results[0][0].transcript;
        onResult(resultText);
    };

    recognition.onerror = (event) => {
        onError(event.error);
    };

    recognition.onend = () => {
        if (onEnd) onEnd();
    };

    recognition.start();
}

export function stopListening() {
    if (recognition) {
        try {
            recognition.stop();
        } catch (e) {}
    }
}

// 두 문자열 간 편집 거리(Levenshtein Distance)를 계산하여 유사율을 0~100%로 도출합니다.
function getSimilarity(s1, s2) {
    // 공백, 구두점 제거 및 소문자 정규화로 엄격한 일치 오차 최소화
    const cleanStr = (str) => str.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, "").replace(/\s+/g, " ").trim();
    
    const a = cleanStr(s1);
    const b = cleanStr(s2);

    if (a.length === 0 && b.length === 0) return 100;
    if (a.length === 0 || b.length === 0) return 0;

    const matrix = [];

    for (let i = 0; i <= b.length; i++) {
        matrix[i] = [i];
    }

    for (let j = 0; j <= a.length; j++) {
        matrix[0][j] = j;
    }

    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1, // 대체
                    matrix[i][j - 1] + 1,     // 삽입
                    matrix[i - 1][j] + 1      // 삭제
                );
            }
        }
    }

    const distance = matrix[b.length][a.length];
    const maxLength = Math.max(a.length, b.length);
    const percentage = ((maxLength - distance) / maxLength) * 100;
    
    return Math.max(0, Math.round(percentage));
}

export function evaluatePronunciation(original, spoken) {
    const score = getSimilarity(original, spoken);
    let grade = "Try Again 🌶️";
    let color = "#FF1744"; // 빨간색

    if (score >= 90) {
        grade = "Excellent! Perfect Native 🌟";
        color = "#00BFA5"; // 에메랄드 그린
    } else if (score >= 75) {
        grade = "Great Job! Good Pronunciation 👍";
        color = "#00E676"; // 연두색
    } else if (score >= 50) {
        grade = "Keep practicing! You are close 💪";
        color = "#FF9100"; // 주황색
    }

    return {
        score,
        grade,
        color,
        spoken
    };
}

// 로컬스토리지를 기반으로 오답노트(복습용) 및 잔디 심기(학습 통계) 데이터를 영구 저장하고 추적합니다.
// 브라우저 캐시 삭제 시에도 유지되도록 최대한 원시 구조를 유지합니다.

const INCORRECT_KEY = 'paterbuilder_incorrect_v1';
const STATS_KEY = 'paterbuilder_stats_v2';

export function getIncorrectSentences() {
    try {
        return JSON.parse(localStorage.getItem(INCORRECT_KEY)) || [];
    } catch (e) {
        // 복원 실패 시 빈 배열로 리셋하여 크래시 방지
        return [];
    }
}

export function addIncorrectSentence(korean, english, chunks) {
    const list = getIncorrectSentences();
    // 중복 제거: 이미 등록된 문장이라면 타임스탬프만 업데이트
    const existingIdx = list.findIndex(item => item.english === english);
    
    const newItem = {
        korean,
        english,
        chunks,
        addedAt: new Date().toISOString(),
        reviewCount: existingIdx >= 0 ? list[existingIdx].reviewCount + 1 : 1
    };

    if (existingIdx >= 0) {
        list[existingIdx] = newItem;
    } else {
        list.push(newItem);
    }
    
    localStorage.setItem(INCORRECT_KEY, JSON.stringify(list));
    recordStreak(false); // 오답 발생 시 학습 이력에 기록
}

export function removeIncorrectSentence(english) {
    const list = getIncorrectSentences();
    const filtered = list.filter(item => item.english !== english);
    localStorage.setItem(INCORRECT_KEY, JSON.stringify(filtered));
}

// 깃허브 잔디밭 시각화를 위해 날짜별 정답/오답 횟수를 매핑하여 저장합니다.
export function recordStreak(isCorrect = true) {
    const todayStr = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    let stats = {};
    try {
        stats = JSON.parse(localStorage.getItem(STATS_KEY)) || {};
    } catch (e) {
        stats = {};
    }

    if (!stats[todayStr]) {
        stats[todayStr] = { correct: 0, incorrect: 0, total: 0 };
    }

    if (isCorrect) {
        stats[todayStr].correct += 1;
    } else {
        stats[todayStr].incorrect += 1;
    }
    stats[todayStr].total += 1;

    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
}

export function getStreakData() {
    try {
        return JSON.parse(localStorage.getItem(STATS_KEY)) || {};
    } catch (e) {
        return {};
    }
}

export function getOverallSummary() {
    const stats = getStreakData();
    let totalCorrect = 0;
    let totalIncorrect = 0;
    let daysActive = Object.keys(stats).length;

    Object.values(stats).forEach(day => {
        totalCorrect += day.correct || 0;
        totalIncorrect += day.incorrect || 0;
    });

    const totalQuestions = totalCorrect + totalIncorrect;
    const accuracy = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;

    return {
        totalCorrect,
        totalIncorrect,
        daysActive,
        accuracy
    };
}

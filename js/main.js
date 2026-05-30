// Standalone Main Entry Point for Pattern Builder
import * as StructureGame from './structure_game/game.js';
import * as StructureUI from './structure_game/ui.js';
import { changeSpeed, testAudio, speakText, playSuccessSound, playFailureSound, changeVoice, populateVoiceSelector, toggleTTS, initTTSState } from './audio.js';

// --- Global Loading Gate ---
let isGameLoading = false;

// --- Fullscreen Functionality ---
function toggleFullscreen() {
    const elem = document.documentElement;
    const icon = document.getElementById('fullscreen-icon');

    if (!document.fullscreenElement) {
        if (elem.requestFullscreen) {
            elem.requestFullscreen();
        } else if (elem.webkitRequestFullscreen) { // Safari
            elem.webkitRequestFullscreen();
        } else if (elem.msRequestFullscreen) { // IE11
            elem.msRequestFullscreen();
        }
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
        }
    }
}

// --- Window Bindings for HTML ---
window.startGame = StructureGame.startGame;
window.proceedToNextLevel = StructureGame.proceedToNextLevel;
window.openPracticeMode = StructureGame.openPracticeMode;
window.closePracticeMode = StructureGame.closePracticeMode;
window.startPracticeDay = StructureGame.startPracticeDay;
window.exitPracticeMode = StructureGame.exitPracticeMode;
window.showExitModal = StructureGame.showExitModal;
window.closeExitModal = StructureGame.closeExitModal;
window.confirmExit = StructureGame.confirmExit;
window.testSpicyLevel = StructureGame.testSpicyLevel;
window.changeSpeed = changeSpeed;
window.testAudio = testAudio;
window.speakText = speakText;
window.playSuccessSound = playSuccessSound;
window.playFailureSound = playFailureSound;
window.closeGrammarModal = StructureUI.closeGrammarModal;
window.hideContext = StructureUI.hideContext;
window.resetAfterError = StructureUI.hideErrorFeedback;
window.changeVoice = changeVoice;
window.toggleTTS = toggleTTS;
window.toggleFullscreen = toggleFullscreen;

// --- Initialize and Autostart Game ---
document.addEventListener('DOMContentLoaded', () => {
    // Register PWA Service Worker
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js')
            .then(reg => console.log('✓ Standalone Service Worker registered:', reg.scope))
            .catch(err => console.error('❌ Service Worker registration failed:', err));
    }

    // Warm up voice selector
    populateVoiceSelector();
    initTTSState();

    // Hook asynchronous voice loading for browser compatibility
    if (window.speechSynthesis) {
        window.speechSynthesis.onvoiceschanged = () => {
            populateVoiceSelector();
            initTTSState();
        };
    }

    // Launch Pattern Builder automatically!
    isGameLoading = true;
    StructureGame.loadGame()
        .then(() => {
            isGameLoading = false;
        })
        .catch(err => {
            console.error("❌ Failed to auto-load Pattern Builder:", err);
            isGameLoading = false;
        });
});

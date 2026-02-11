// ================================
// Voice Features Module
// ================================

import { state } from './state.js';

// Play question using text-to-speech
export const playQuestion = async () => {
    const { questions, currentQuestion, synth } = state;
    const question = questions[currentQuestion];
    const playBtn = document.getElementById("playQuestionBtn");

    // Stop if already speaking
    if (synth.speaking) {
        synth.cancel();
        resetPlayButtonIcon(playBtn);
        
        // Dispatch speech stopped event
        window.dispatchEvent(new CustomEvent('speechStopped', { 
            detail: { timestamp: Date.now() } 
        }));
        return;
    }

    // Dispatch speech started event
    window.dispatchEvent(new CustomEvent('speechStarted', { 
        detail: { question, timestamp: Date.now() } 
    }));

    const utterance = new SpeechSynthesisUtterance(question);
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 1;

    // Change icon while speaking
    setPauseButtonIcon(playBtn);

    await new Promise(resolve => {
        utterance.onend = resolve;
        utterance.onerror = (error) => {
            console.error('Speech synthesis error:', error);
            resolve();
        };
        synth.speak(utterance);
    });

    // Restore icon
    resetPlayButtonIcon(playBtn);
    
    // Dispatch speech ended event
    window.dispatchEvent(new CustomEvent('speechEnded', { 
        detail: { timestamp: Date.now() } 
    }));
};

// Set pause icon
const setPauseButtonIcon = (btn) => {
    btn.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <rect x="6" y="4" width="4" height="16" stroke-width="2"/>
            <rect x="14" y="4" width="4" height="16" stroke-width="2"/>
        </svg>`;
};

// Reset to play icon
const resetPlayButtonIcon = (btn) => {
    btn.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <polygon points="5 3 19 12 5 21 5 3" stroke-width="2"/>
        </svg>`;
};

// Toggle recording
export const toggleRecording = () => {
    state.isRecording ? stopRecording() : startRecording();
};

// Start voice recording
export const startRecording = async () => {
    if (!("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
        alert("Speech recognition not supported. Use Chrome or Edge, or switch to text mode.");
        return;
    }

    // Dispatch recording started event
    window.dispatchEvent(new CustomEvent('recordingStarted', { 
        detail: { timestamp: Date.now() } 
    }));

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    state.recognition = new SpeechRecognition();

    Object.assign(state.recognition, {
        continuous: true,
        interimResults: true,
        lang: 'en-US'
    });

    let finalTranscript = "";

    state.recognition.onresult = ({ resultIndex, results }) => {
        let interimTranscript = "";

        for (let i = resultIndex; i < results.length; i++) {
            const transcript = results[i][0].transcript;
            results[i].isFinal
                ? (finalTranscript += transcript + " ")
                : (interimTranscript += transcript);
        }

        const transcriptText = document.getElementById("transcriptText");
        const voiceTranscript = document.getElementById("voiceTranscript");

        transcriptText.textContent = finalTranscript + interimTranscript;
        voiceTranscript.style.display = "block";
        
        // Dispatch transcript update event
        window.dispatchEvent(new CustomEvent('transcriptUpdated', { 
            detail: { 
                text: finalTranscript + interimTranscript, 
                wordCount: (finalTranscript + interimTranscript).split(' ').length,
                timestamp: Date.now() 
            } 
        }));
    };

    state.recognition.onerror = ({ error }) => {
        console.error("Speech recognition error:", error);
        stopRecording();
        
        // Dispatch recording error event
        window.dispatchEvent(new CustomEvent('recordingError', { 
            detail: { error, timestamp: Date.now() } 
        }));
        
        if (error === "not-allowed") {
            alert("Microphone access denied. Please allow microphone access and try again.");
        } else if (error === "no-speech") {
            console.log("No speech detected, continuing...");
        }
    };

    state.recognition.onend = () => {
        if (state.isRecording) {
            // Restart if still recording
            state.recognition.start();
        }
    };

    try {
        state.recognition.start();
        state.isRecording = true;
        updateRecordingUI(true);
    } catch (error) {
        console.error('Failed to start recording:', error);
        alert('Failed to start recording. Please try again.');
    }
};

// Stop recording
export const stopRecording = () => {
    if (state.recognition) {
        state.recognition.stop();
    }
    state.isRecording = false;
    updateRecordingUI(false);
    
    // Dispatch recording stopped event
    window.dispatchEvent(new CustomEvent('recordingStopped', { 
        detail: { timestamp: Date.now() } 
    }));
};

// Update recording UI
const updateRecordingUI = (recording) => {
    const recordBtn = document.getElementById("recordBtn");
    const voiceRecorder = document.querySelector(".voice-recorder");
    const voiceHint = document.getElementById("voiceHint");
    const recordText = document.getElementById("recordText");

    recordBtn.classList.toggle("recording", recording);
    voiceRecorder.classList.toggle("recording", recording);

    recordBtn.querySelector("svg").innerHTML = recording
        ? `<rect x="9" y="9" width="6" height="6"/>`
        : `<circle cx="12" cy="12" r="8"/>`;

    recordText.textContent = recording ? "Stop Recording" : "Start Recording";
    voiceHint.textContent = recording
        ? "Recording... Click to stop"
        : "Click to start recording your answer";
};

// Clean up speech recognition on page unload
export const cleanupVoiceRecognition = () => {
    if (state.recognition) {
        state.recognition.stop();
        state.recognition = null;
    }
    if (state.synth.speaking) {
        state.synth.cancel();
    }
};
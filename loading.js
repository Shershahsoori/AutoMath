/**
 * loading.js - 20‑second cinematic transition
 * - Circular progress ring fills exactly over 20 seconds
 * - Rotating bilingual messages every 2.5 seconds
 * - Optional ping sound on message change
 * - Redirects to dashboard.html after completion
 */

document.addEventListener('DOMContentLoaded', () => {
    // --- Authentication guard: only logged‑in users can see this page ---
    if (typeof PX !== 'undefined' && PX.checkAuth) {
        if (!PX.checkAuth('index.html')) return;
    } else {
        window.location.href = 'index.html';
        return;
    }

    // --- DOM elements ---
    const statusEng = document.getElementById('statusEng');
    const statusUrdu = document.getElementById('statusUrdu');
    const progressRing = document.querySelector('.progress-ring-fill');
    const pingAudio = document.getElementById('pingSound');

    // --- Constants ---
    const TOTAL_DURATION = 20000; // 20 seconds
    const CIRCUMFERENCE = 2 * Math.PI * 88; // r=88 => approx 553.0
    let startTime = null;
    let animationFrame = null;
    let messageInterval = null;

    // --- Bilingual message pairs (5 pairs, rotates) ---
    const messagePairs = [
        { eng: "Connecting to Satellite...", urdu: "سیٹلائٹ سے منسلک ہو رہا ہے..." },
        { eng: "Bypassing Firewall...", urdu: "فائر وال کو بائی پاس کیا جا رہا ہے..." },
        { eng: "Syncing Neural Engine...", urdu: "نیورل انجن کو ہم آہنگ کیا جا رہا ہے..." },
        { eng: "Decrypting Aviator Streams...", urdu: "ایوی ایٹر اسٹریمز کو ڈی کرپٹ کیا جا رہا ہے..." },
        { eng: "Finalizing Encryption...", urdu: "انکرپشن کو حتمی شکل دی جا رہی ہے..." }
    ];
    let messageIndex = 0;

    // --- Function to change message (every 2.5 seconds) ---
    function rotateMessage() {
        messageIndex = (messageIndex + 1) % messagePairs.length;
        const pair = messagePairs[messageIndex];
        statusEng.textContent = pair.eng;
        statusUrdu.textContent = pair.urdu;

        // Optional: play ping sound if available and user has interacted
        if (pingAudio) {
            pingAudio.currentTime = 0;
            pingAudio.play().catch(e => console.log("Audio play blocked:", e));
        }
    }

    // --- Progress ring update based on elapsed time ---
    function updateProgress(timestamp) {
        if (!startTime) startTime = timestamp;
        const elapsed = timestamp - startTime;
        const progress = Math.min(1, elapsed / TOTAL_DURATION);
        const offset = CIRCUMFERENCE * (1 - progress);
        progressRing.style.strokeDashoffset = offset;

        if (elapsed < TOTAL_DURATION) {
            animationFrame = requestAnimationFrame(updateProgress);
        } else {
            // Complete: set to 0 offset (full ring)
            progressRing.style.strokeDashoffset = 0;
            finishLoading();
        }
    }

    // --- Finish loading: stop intervals, redirect to dashboard ---
    function finishLoading() {
        if (animationFrame) cancelAnimationFrame(animationFrame);
        if (messageInterval) clearInterval(messageInterval);

        // Final status update
        statusEng.textContent = "Access Granted. Redirecting...";
        statusUrdu.textContent = "رسائی دی گئی۔ ری ڈائریکٹ ہو رہا ہے...";

        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 800);
    }

    // --- Start the loading sequence ---
    function startLoading() {
        // Set initial ring state
        progressRing.style.strokeDasharray = CIRCUMFERENCE;
        progressRing.style.strokeDashoffset = CIRCUMFERENCE;

        // Start progress animation
        startTime = null;
        animationFrame = requestAnimationFrame(updateProgress);

        // Rotate messages every 2.5 seconds
        messageInterval = setInterval(rotateMessage, 2500);

        // Set first message immediately
        const firstPair = messagePairs[0];
        statusEng.textContent = firstPair.eng;
        statusUrdu.textContent = firstPair.urdu;
    }

    startLoading();
});

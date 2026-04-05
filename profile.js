/**
 * profile.js - Personal Hub
 * - Displays wallet balance from PX.getWalletBalance()
 * - Live subscription countdown (updates every second)
 * - Editable first name, last name, aviator platform
 * - Copy 99-char ID key
 * - Invite & Earn and Logout navigation
 */

document.addEventListener('DOMContentLoaded', () => {
    // --- Authentication guard ---
    if (typeof PX !== 'undefined' && PX.checkAuth) {
        if (!PX.checkAuth('index.html')) return;
    } else {
        window.location.href = 'index.html';
        return;
    }

    // --- DOM elements ---
    const walletBalanceSpan = document.getElementById('walletBalance');
    const planNameSpan = document.getElementById('planName');
    const timerDisplay = document.getElementById('timerDisplay');
    const timerCanvas = document.getElementById('timerCanvas');
    const ctx = timerCanvas.getContext('2d');
    const firstNameInput = document.getElementById('firstNameInput');
    const lastNameInput = document.getElementById('lastNameInput');
    const aviatorSelect = document.getElementById('aviatorSelect');
    const saveChangesBtn = document.getElementById('saveChangesBtn');
    const copyIdKeyBtn = document.getElementById('copyIdKeyBtn');
    const inviteEarnBtn = document.getElementById('inviteEarnBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const logoutModal = document.getElementById('logoutModal');
    const logoutCancel = document.getElementById('logoutCancelBtn');
    const logoutConfirm = document.getElementById('logoutConfirmBtn');

    // --- Get current user data ---
    const userKey = PX.getCurrentUserKey();
    let userData = PX.getUser(userKey) || {};

    // --- Populate aviator platforms (same list as before) ---
    const platforms = [
        "bJbaji", "JJ win", "1XBet", "Parimatch", "Bet365", "Betway", "22Bet", "888casino",
        "Betwinner", "Mostbet", "Melbet", "Pin-Up Casino", "Betpanda", "BC.Game", "Stake.com",
        "Lucky Block", "Metaspins", "Cloudbet", "Vave Casino", "Cryptorino", "Wild.io",
        "CoinCasino", "Hollywoodbets", "Betfred", "Supabets", "4rabet", "Rajabets", "BlueChip",
        "10CRIC", "BetMGM", "Unibet", "Lottoland", "EstrelaBet", "Betano", "KTO"
    ];
    platforms.forEach(p => {
        const opt = document.createElement('option');
        opt.value = p;
        opt.textContent = p;
        if (userData.aviatorName === p) opt.selected = true;
        aviatorSelect.appendChild(opt);
    });

    // --- Load user data into form ---
    firstNameInput.value = userData.firstName || '';
    lastNameInput.value = userData.lastName || '';
    if (userData.aviatorName) aviatorSelect.value = userData.aviatorName;

    // --- Wallet balance ---
    function updateWalletDisplay() {
        const balance = PX.getWalletBalance();
        walletBalanceSpan.textContent = balance.toLocaleString() + ' PKR';
    }
    updateWalletDisplay();

    // --- Live subscription timer ---
    let timerInterval = null;
    let expiryNotified = false;

    function drawTimerRing(percent) {
        if (!ctx) return;
        const radius = 30;
        const center = 35;
        const circumference = 2 * Math.PI * radius;
        ctx.clearRect(0, 0, 70, 70);
        ctx.beginPath();
        ctx.arc(center, center, radius, 0, 2 * Math.PI);
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 4;
        ctx.stroke();
        ctx.beginPath();
        const endAngle = -Math.PI / 2 + (2 * Math.PI * percent);
        ctx.arc(center, center, radius, -Math.PI / 2, endAngle);
        ctx.strokeStyle = '#ff0000';
        ctx.stroke();
    }

    function updateTimer() {
        const sub = PX.getSubscription();
        let isActive = false;
        let remainingMs = 0;
        let plan = 'Free';
        if (sub && sub.expiry && sub.expiry > Date.now()) {
            isActive = true;
            remainingMs = sub.expiry - Date.now();
            plan = sub.plan.toUpperCase();
        }
        planNameSpan.textContent = plan;
        if (!isActive) {
            timerDisplay.textContent = 'Inactive / غیر فعال';
            timerDisplay.classList.remove('pulse-timer');
            drawTimerRing(0);
            if (!expiryNotified && sub && sub.expiry && sub.expiry <= Date.now()) {
                expiryNotified = true;
                PX.showBilingualModal(
                    'Subscription Expired',
                    'سبسکرپشن ختم',
                    'Your subscription has expired! Please renew to continue using predictions.',
                    'آپ کی سبسکرپشن ختم ہو گئی ہے! پیشن گوئیاں جاری رکھنے کے لیے براہ کرم تجدید کریں۔'
                );
            }
            return;
        }
        expiryNotified = false;
        const hours = Math.floor(remainingMs / (1000 * 60 * 60));
        const minutes = Math.floor((remainingMs % (3600000)) / 60000);
        const seconds = Math.floor((remainingMs % 60000) / 1000);
        timerDisplay.textContent = `${hours.toString().padStart(2,'0')}:${minutes.toString().padStart(2,'0')}:${seconds.toString().padStart(2,'0')}`;
        // Pulse if less than 10 minutes
        if (remainingMs < 10 * 60 * 1000) {
            timerDisplay.classList.add('pulse-timer');
        } else {
            timerDisplay.classList.remove('pulse-timer');
        }
        // Draw ring progress (full ring = 72h for premium, 24h for standard, 1h for basic)
        let maxDuration = 72 * 60 * 60 * 1000;
        if (sub.plan === 'standard') maxDuration = 24 * 60 * 60 * 1000;
        else if (sub.plan === 'basic') maxDuration = 60 * 60 * 1000;
        const percent = Math.max(0, Math.min(1, remainingMs / maxDuration));
        drawTimerRing(percent);
    }

    function startTimer() {
        if (timerInterval) clearInterval(timerInterval);
        updateTimer();
        timerInterval = setInterval(updateTimer, 1000);
    }
    startTimer();

    // --- Save changes to profile ---
    function saveChanges() {
        const newFirstName = firstNameInput.value.trim();
        const newLastName = lastNameInput.value.trim();
        const newAviator = aviatorSelect.value;
        if (!newFirstName || !newLastName) {
            PX.showBilingualModal(
                'Input Required',
                'درج کرنا ضروری ہے',
                'First name and last name cannot be empty.',
                'پہلا نام اور آخری نام خالی نہیں ہو سکتے۔'
            );
            return;
        }
        userData.firstName = newFirstName;
        userData.lastName = newLastName;
        userData.aviatorName = newAviator;
        PX.saveUser(userKey, userData);
        PX.showBilingualModal(
            'Profile Updated',
            'پروفائل اپڈیٹ',
            'Your settings have been saved successfully.',
            'آپ کی ترتیبات کامیابی سے محفوظ ہوگئیں۔'
        );
    }
    saveChangesBtn.addEventListener('click', saveChanges);

    // --- Copy 99-char ID key ---
    async function copyIdKey() {
        try {
            await navigator.clipboard.writeText(userKey);
            PX.showBilingualModal(
                'Copied',
                'کاپی ہوگیا',
                'Your 99-character ID key has been copied to clipboard.',
                'آپ کی 99 حروف والی ID کلید کلپ بورڈ پر کاپی ہوگئی۔'
            );
        } catch (err) {
            PX.showBilingualModal(
                'Copy Failed',
                'کاپی ناکام',
                'Please copy manually.',
                'براہ کرم دستی طور پر کاپی کریں۔'
            );
        }
    }
    copyIdKeyBtn.addEventListener('click', copyIdKey);

    // --- Navigation ---
    inviteEarnBtn.addEventListener('click', () => {
        window.location.href = 'invite-earn.html';
    });
    logoutBtn.addEventListener('click', () => {
        logoutModal.style.display = 'flex';
    });
    logoutCancel.addEventListener('click', () => {
        logoutModal.style.display = 'none';
    });
    logoutConfirm.addEventListener('click', () => {
        PX.logout();
    });
});

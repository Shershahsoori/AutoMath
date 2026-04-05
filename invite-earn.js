/**
 * invite-earn.js - Viral Engine
 * - Tracks shares in localStorage (_px_share_count, _px_share_timestamp)
 * - First share sends message to owner (+923128942224) with user's 99-char key
 * - Shares 2-5 open standard WhatsApp share menu
 * - After 5 shares, adds 5000 PKR to wallet and starts 24h cooldown
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
    const whatsappBtn = document.getElementById('whatsappShareBtn');
    const copyLinkBtn = document.getElementById('copyLinkBtn');
    const progressFill = document.getElementById('progressFill');
    const progressCounter = document.getElementById('progressCounter');
    const chestContainer = document.getElementById('chestContainer');
    const cooldownArea = document.getElementById('cooldownArea');
    const cooldownTimer = document.getElementById('cooldownTimer');

    // --- localStorage keys ---
    const SHARE_COUNT_KEY = '_px_share_count';
    const COOLDOWN_END_KEY = '_px_share_cooldown';

    // --- Get current user's 99-char key for referral link ---
    const userKey = PX.getCurrentUserKey();
    const siteUrl = window.location.origin + '/index.html?ref=' + userKey;
    const referralInput = document.createElement('input'); // not visible, just for copy
    referralInput.value = siteUrl;

    // --- Helper: load share count and update UI ---
    let currentShares = parseInt(localStorage.getItem(SHARE_COUNT_KEY) || '0');
    function updateProgressUI() {
        const percent = (currentShares / 5) * 100;
        progressFill.style.width = `${percent}%`;
        progressCounter.textContent = `Shares: ${currentShares} / 5`;
        if (currentShares >= 5) {
            chestContainer.classList.add('unlocked');
            document.querySelector('#chestIcon').className = 'fas fa-box-open';
            document.querySelector('.chest-text').textContent = 'Unlocked!';
        } else {
            chestContainer.classList.remove('unlocked');
            document.querySelector('#chestIcon').className = 'fas fa-box';
            document.querySelector('.chest-text').textContent = 'Locked';
        }
    }

    // --- Helper: check if cooldown is active ---
    function isCooldownActive() {
        const cooldownEnd = localStorage.getItem(COOLDOWN_END_KEY);
        if (!cooldownEnd) return false;
        return Date.now() < parseInt(cooldownEnd);
    }

    // --- Helper: start 24-hour cooldown ---
    function startCooldown() {
        const cooldownUntil = Date.now() + (24 * 60 * 60 * 1000);
        localStorage.setItem(COOLDOWN_END_KEY, cooldownUntil);
        whatsappBtn.classList.add('disabled');
        whatsappBtn.disabled = true;
        cooldownArea.style.display = 'block';
        updateCooldownTimer();
        const timerInterval = setInterval(() => {
            const remaining = updateCooldownTimer();
            if (remaining <= 0) {
                clearInterval(timerInterval);
                cooldownArea.style.display = 'none';
                whatsappBtn.classList.remove('disabled');
                whatsappBtn.disabled = false;
                // Reset share count after cooldown
                currentShares = 0;
                localStorage.setItem(SHARE_COUNT_KEY, '0');
                updateProgressUI();
            }
        }, 1000);
    }

    function updateCooldownTimer() {
        const cooldownEnd = parseInt(localStorage.getItem(COOLDOWN_END_KEY) || '0');
        const remaining = Math.max(0, cooldownEnd - Date.now());
        const hours = Math.floor(remaining / (1000 * 60 * 60));
        const minutes = Math.floor((remaining % (3600000)) / 60000);
        const seconds = Math.floor((remaining % 60000) / 1000);
        cooldownTimer.textContent = `${hours.toString().padStart(2,'0')}:${minutes.toString().padStart(2,'0')}:${seconds.toString().padStart(2,'0')}`;
        return remaining;
    }

    // --- Increment share count and save ---
    async function incrementShareCount() {
        currentShares++;
        localStorage.setItem(SHARE_COUNT_KEY, currentShares);
        updateProgressUI();
        if (currentShares === 5) {
            // Show cinematic loader, add wallet bonus
            await showVerificationLoader();
            PX.addToWallet(5000);
            PX.showBilingualModal(
                'Bonus Added!',
                'بونس شامل!',
                '5,000 PKR has been credited to your wallet.',
                '5000 روپے آپ کے والٹ میں جمع کر دیے گئے ہیں۔'
            );
            startCooldown();
        } else {
            PX.showBilingualModal(
                'Share Counted',
                'شیئر شمار ہوگیا',
                `You have completed ${currentShares}/5 shares. ${5 - currentShares} more to go!`,
                `آپ نے ${currentShares}/5 شیئرز مکمل کر لیے ہیں۔ ${5 - currentShares} مزید باقی ہیں!`
            );
        }
    }

    // --- Show 5-second verification loader ---
    function showVerificationLoader() {
        return new Promise((resolve) => {
            const overlay = document.createElement('div');
            overlay.className = 'modal-overlay';
            overlay.innerHTML = `
                <div class="modal-container">
                    <div class="loader-spinner"></div>
                    <div class="bilingual">
                        <span class="english-text">Verifying Shares...</span>
                        <span class="urdu-text">شیئرز کی تصدیق ہو رہی ہے...</span>
                    </div>
                </div>
            `;
            document.body.appendChild(overlay);
            setTimeout(() => overlay.classList.add('active'), 10);
            setTimeout(() => {
                overlay.classList.remove('active');
                setTimeout(() => overlay.remove(), 300);
                resolve();
            }, 5000);
        });
    }

    // --- WhatsApp share logic ---
    async function handleWhatsAppShare() {
        if (currentShares >= 5) {
            PX.showBilingualModal(
                'Already Completed',
                'پہلے ہی مکمل',
                'You have already completed 5 shares. Come back after 24 hours.',
                'آپ پہلے ہی 5 شیئرز مکمل کر چکے ہیں۔ 24 گھنٹے بعد واپس آئیں۔'
            );
            return;
        }
        if (isCooldownActive()) {
            PX.showBilingualModal(
                'Cooldown Active',
                'کولڈاؤن فعال',
                'Please wait for the cooldown to finish before sharing again.',
                'براہ کرم دوبارہ شیئر کرنے سے پہلے کولڈاؤن ختم ہونے کا انتظار کریں۔'
            );
            return;
        }

        let whatsappUrl = '';
        const isFirstShare = (currentShares === 0);
        if (isFirstShare) {
            // First share: send message to owner
            const ownerNumber = '923128942224'; // without '+'
            const message = `I am starting my verification for PeshoX Intelligence. My ID is ${userKey}`;
            whatsappUrl = `https://wa.me/${ownerNumber}?text=${encodeURIComponent(message)}`;
        } else {
            // Subsequent shares: standard share to any contact
            const message = `Join me on PeshoX Intelligence - the most accurate Aviator detector! ${siteUrl}`;
            whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
        }

        window.open(whatsappUrl, '_blank');

        // Simulate return and increment share count after delay
        whatsappBtn.disabled = true;
        setTimeout(async () => {
            await incrementShareCount();
            if (currentShares < 5 && !isCooldownActive()) {
                whatsappBtn.disabled = false;
            }
        }, 2000);
    }

    // --- Copy referral link ---
    async function copyReferralLink() {
        try {
            await navigator.clipboard.writeText(siteUrl);
            PX.showBilingualModal(
                'Link Copied',
                'لنک کاپی ہوگیا',
                'Your referral link has been copied to clipboard.',
                'آپ کا ریفرل لنک کلپ بورڈ پر کاپی ہوگیا۔'
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

    // --- Event listeners ---
    whatsappBtn.addEventListener('click', handleWhatsAppShare);
    copyLinkBtn.addEventListener('click', copyReferralLink);

    // --- Initial UI update ---
    updateProgressUI();
    if (isCooldownActive()) {
        whatsappBtn.classList.add('disabled');
        whatsappBtn.disabled = true;
        cooldownArea.style.display = 'block';
        updateCooldownTimer();
        const timerInterval = setInterval(() => {
            const remaining = updateCooldownTimer();
            if (remaining <= 0) {
                clearInterval(timerInterval);
                cooldownArea.style.display = 'none';
                whatsappBtn.classList.remove('disabled');
                whatsappBtn.disabled = false;
                currentShares = 0;
                localStorage.setItem(SHARE_COUNT_KEY, '0');
                updateProgressUI();
            }
        }, 1000);
    }
});

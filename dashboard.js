/**
 * dashboard.js - Radar Hub
 * - Live radar sweep with floating weighted numbers
 * - Prediction button with subscription check
 * - VIP prediction: 2s loader, static multiplier, 5s cooldown
 * - Bilingual log stream
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
    const userNameSpan = document.getElementById('userNameDisplay');
    const platformNameSpan = document.getElementById('platformName');
    const subscriptionBadge = document.getElementById('subscriptionBadge');
    const multiplierDisplay = document.getElementById('multiplierDisplay');
    const predictBtn = document.getElementById('predictBtn');
    const predictStatus = document.getElementById('predictStatus');
    const logoutBtn = document.getElementById('logoutBtnNav');
    const logoutModal = document.getElementById('logoutModal');
    const logoutCancel = document.getElementById('logoutCancelBtn');
    const logoutConfirm = document.getElementById('logoutConfirmBtn');
    const logContainer = document.getElementById('logContainer');
    const radarCanvas = document.getElementById('radarCanvas');
    const ctx = radarCanvas.getContext('2d');

    // --- Radar dimensions ---
    let width = 600, height = 600;
    radarCanvas.width = width;
    radarCanvas.height = height;
    let angle = 0;
    let floatingNumbers = []; // { x, y, value, opacity, life }

    // --- User & Subscription ---
    const userKey = PX.getCurrentUserKey();
    let userData = PX.getUser(userKey) || {};
    let subscriptionActive = PX.isSubscriptionActive();
    let subscriptionPlan = 'free';
    const subObj = PX.getSubscription();
    if (subObj && subObj.plan) subscriptionPlan = subObj.plan;

    // --- Load user info ---
    const fullName = `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || 'Pilot';
    userNameSpan.textContent = fullName;
    platformNameSpan.textContent = userData.aviatorName || 'Aviator';
    updateSubscriptionUI();

    function updateSubscriptionUI() {
        subscriptionActive = PX.isSubscriptionActive();
        if (subscriptionActive && subObj && subObj.plan) {
            subscriptionPlan = subObj.plan;
            subscriptionBadge.textContent = subscriptionPlan.toUpperCase();
            subscriptionBadge.className = `badge ${subscriptionPlan}`;
            predictBtn.classList.remove('disabled');
            predictBtn.disabled = false;
            predictStatus.querySelector('.english-text').textContent = 'Ready to Scan...';
            predictStatus.querySelector('.urdu-text').textContent = 'اسکین کے لیے تیار...';
        } else {
            subscriptionPlan = 'free';
            subscriptionBadge.textContent = 'FREE';
            subscriptionBadge.className = 'badge free';
            predictBtn.classList.add('disabled');
            predictBtn.disabled = true;
            predictStatus.querySelector('.english-text').textContent = 'Free Tier: Upgrade to VIP';
            predictStatus.querySelector('.urdu-text').textContent = 'فری ٹائر: وی آئی پی میں اپگریڈ کریں';
        }
    }

    // --- Weighted random multiplier (1.00 - 60.00) ---
    // 80% under 10x, 15% 10-30x, 5% 30-60x
    function getWeightedMultiplier() {
        const rand = Math.random();
        let value;
        if (rand < 0.8) {
            value = (Math.random() * 9 + 1).toFixed(2); // 1.00 - 10.00
        } else if (rand < 0.95) {
            value = (Math.random() * 20 + 10).toFixed(2); // 10.00 - 30.00
        } else {
            value = (Math.random() * 30 + 30).toFixed(2); // 30.00 - 60.00
        }
        return parseFloat(value).toFixed(2);
    }

    // --- Prediction logic (VIP only) ---
    let isCooldown = false;
    let cooldownTimer = null;

    async function startPrediction() {
        if (!subscriptionActive || isCooldown) return;
        isCooldown = true;
        predictBtn.disabled = true;
        predictBtn.classList.add('cooldown');
        predictStatus.querySelector('.english-text').textContent = 'Scanning neural patterns...';
        predictStatus.querySelector('.urdu-text').textContent = 'نیورل پیٹرنز اسکین ہو رہے ہیں...';
        multiplierDisplay.textContent = '---';
        
        // Simulate 2-second scanning
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const multiplier = getWeightedMultiplier();
        multiplierDisplay.textContent = `${multiplier}x`;
        predictStatus.querySelector('.english-text').textContent = `Prediction: ${multiplier}x - Cooling down`;
        predictStatus.querySelector('.urdu-text').textContent = `پیشن گوئی: ${multiplier}x - ٹھنڈا ہو رہا ہے`;
        
        // 5-second cooldown
        let cooldownSeconds = 5;
        cooldownTimer = setInterval(() => {
            cooldownSeconds--;
            if (cooldownSeconds <= 0) {
                clearInterval(cooldownTimer);
                isCooldown = false;
                predictBtn.disabled = false;
                predictBtn.classList.remove('cooldown');
                predictStatus.querySelector('.english-text').textContent = 'Ready to Scan...';
                predictStatus.querySelector('.urdu-text').textContent = 'اسکین کے لیے تیار...';
            } else {
                predictStatus.querySelector('.english-text').textContent = `Ready in ${cooldownSeconds}s`;
                predictStatus.querySelector('.urdu-text').textContent = `${cooldownSeconds} سیکنڈ میں تیار`;
            }
        }, 1000);
    }

    predictBtn.addEventListener('click', () => {
        if (!subscriptionActive) {
            PX.showBilingualModal(
                'Upgrade Required',
                'اپگریڈ ضروری',
                'You need a VIP plan to unlock predictions. Redirecting to plans...',
                'پیشن گوئیاں کھولنے کے لیے آپ کو VIP پلان کی ضرورت ہے۔ پلانز پر ری ڈائریکٹ ہو رہے ہیں...'
            );
            setTimeout(() => window.location.href = 'access-plans.html', 1500);
            return;
        }
        if (!isCooldown) startPrediction();
    });

    // --- Logout modal ---
    logoutBtn.addEventListener('click', () => {
        logoutModal.style.display = 'flex';
    });
    logoutCancel.addEventListener('click', () => {
        logoutModal.style.display = 'none';
    });
    logoutConfirm.addEventListener('click', () => {
        PX.logout();
    });

    // --- Real-time Log Stream (bilingual) ---
    const logMessages = [
        { eng: "Signal detected 87Hz", urdu: "سگنل 87Hz پر ملا" },
        { eng: "Scanning frequency band...", urdu: "فریکوئنسی بینڈ اسکین ہو رہا ہے..." },
        { eng: "Radar echo at 0.42ms", urdu: "ریڈار ایکو 0.42ms پر" },
        { eng: "Anomaly detected at 330°", urdu: "330° پر بے ضابطگی پائی گئی" },
        { eng: "Target locked", urdu: "ٹارگٹ لاک ہو گیا" },
        { eng: "Signal strength 92%", urdu: "سگنل کی طاقت 92%" },
    ];
    function addLogEntry(engMsg, urduMsg) {
        const logLine = document.createElement('div');
        logLine.className = 'log-line';
        const time = new Date().toLocaleTimeString();
        logLine.innerHTML = `[${time}] ${engMsg} / ${urduMsg}`;
        logContainer.prepend(logLine);
        while (logContainer.children.length > 30) logContainer.removeChild(logContainer.lastChild);
    }
    // Seed initial logs
    for (let i = 0; i < 5; i++) addLogEntry(logMessages[i].eng, logMessages[i].urdu);
    setInterval(() => {
        const rand = logMessages[Math.floor(Math.random() * logMessages.length)];
        addLogEntry(rand.eng, rand.urdu);
    }, 5000);

    // --- Radar Canvas with sweep and floating numbers ---
    function generateRandomNumberValue() {
        const rand = Math.random();
        if (rand < 0.8) return (Math.random() * 9 + 1).toFixed(2);
        else if (rand < 0.95) return (Math.random() * 20 + 10).toFixed(2);
        else return (Math.random() * 30 + 30).toFixed(2);
    }

    function createFloatingNumber() {
        const cx = width/2, cy = height/2;
        const radius = Math.random() * 240 + 20; // 20 to 260px from center
        const angleRad = Math.random() * Math.PI * 2;
        const x = cx + radius * Math.cos(angleRad);
        const y = cy + radius * Math.sin(angleRad);
        // Opacity: higher near center (small radius)
        const maxRadius = 260;
        const opacity = Math.max(0.2, 1 - (radius / maxRadius));
        const value = generateRandomNumberValue();
        return { x, y, value, opacity, life: 1.0 };
    }

    function updateFloatingNumbers() {
        // Add new number occasionally
        if (Math.random() < 0.15) {
            floatingNumbers.push(createFloatingNumber());
        }
        // Update life and remove dead
        for (let i = 0; i < floatingNumbers.length; i++) {
            floatingNumbers[i].life -= 0.01;
            if (floatingNumbers[i].life <= 0) {
                floatingNumbers.splice(i,1);
                i--;
            }
        }
    }

    function drawRadar() {
        if (!ctx) return;
        ctx.clearRect(0, 0, width, height);
        // Background
        ctx.fillStyle = '#020202';
        ctx.fillRect(0, 0, width, height);
        // Circles
        ctx.strokeStyle = '#ff0000aa';
        ctx.lineWidth = 1;
        for (let r = 50; r <= 250; r += 50) {
            ctx.beginPath();
            ctx.arc(width/2, height/2, r, 0, 2*Math.PI);
            ctx.stroke();
        }
        // Crosshairs
        ctx.beginPath();
        ctx.moveTo(width/2, 0);
        ctx.lineTo(width/2, height);
        ctx.moveTo(0, height/2);
        ctx.lineTo(width, height/2);
        ctx.stroke();
        
        // Draw floating numbers
        for (let num of floatingNumbers) {
            const alpha = num.opacity * num.life;
            ctx.font = `bold ${12 + 8 * num.life}px monospace`;
            ctx.fillStyle = `rgba(255, 80, 80, ${alpha})`;
            ctx.shadowBlur = 4;
            ctx.shadowColor = 'red';
            ctx.fillText(`${num.value}x`, num.x - 15, num.y - 8);
        }
        ctx.shadowBlur = 0;
        
        // Sweeping line
        const centerX = width/2, centerY = height/2;
        const radius = 240;
        const rad = angle * Math.PI / 180;
        const endX = centerX + radius * Math.cos(rad);
        const endY = centerY + radius * Math.sin(rad);
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(endX, endY);
        ctx.strokeStyle = '#ff0000';
        ctx.lineWidth = 3;
        ctx.stroke();
        
        angle = (angle + 2) % 360;
        updateFloatingNumbers();
        requestAnimationFrame(drawRadar);
    }

    drawRadar();
});

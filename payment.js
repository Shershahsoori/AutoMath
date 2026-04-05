/**
 * payment.js - Payment Hub
 * - Only Easypaisa works; other methods show offline modal
 * - TRX trick: first two attempts fail, third succeeds
 * - Generates key based on plan from URL (33/44/55)
 */

document.addEventListener('DOMContentLoaded', () => {
    // --- Authentication guard ---
    if (typeof PX !== 'undefined' && PX.checkAuth) {
        if (!PX.checkAuth('index.html')) return;
    } else {
        window.location.href = 'index.html';
        return;
    }

    // --- Get plan from URL (?plan=basic/standard/premium) ---
    const urlParams = new URLSearchParams(window.location.search);
    const plan = urlParams.get('plan') || 'basic';
    let expectedKeyLength = 33;
    let planDisplay = 'Basic';
    let amount = 3000;
    if (plan === 'standard') {
        expectedKeyLength = 44;
        planDisplay = 'Standard';
        amount = 22000;
    } else if (plan === 'premium') {
        expectedKeyLength = 55;
        planDisplay = 'Premium';
        amount = 33000;
    }

    // --- DOM elements ---
    const methodCards = document.querySelectorAll('.method-card');
    const paymentWorkflow = document.getElementById('paymentWorkflow');
    const connectorLoader = document.getElementById('connectorLoader');
    const paymentDetails = document.getElementById('paymentDetails');
    const amountDisplay = document.getElementById('amountDisplay');
    const amountDisplayUrdu = document.getElementById('amountDisplayUrdu');
    const trxInput = document.getElementById('trxInput');
    const confirmBtn = document.getElementById('confirmPaymentBtn');
    const verificationLoader = document.getElementById('verificationLoader');
    const successArea = document.getElementById('successArea');
    const generatedKeySpan = document.getElementById('generatedKeyDisplay');
    const copyKeyBtn = document.getElementById('copyKeyBtn');
    const backToPlansBtn = document.getElementById('backToPlansBtn');

    // --- Set amount display ---
    if (amountDisplay) amountDisplay.textContent = amount + ' PKR';
    if (amountDisplayUrdu) amountDisplayUrdu.textContent = amount + ' PKR';

    // --- TRX attempt counter (reset when workflow shown) ---
    let trxAttempts = 0;
    let currentGeneratedKey = '';

    // --- Helper: reset UI for new payment attempt ---
    function resetPaymentUI() {
        trxAttempts = 0;
        trxInput.value = '';
        verificationLoader.style.display = 'none';
        successArea.style.display = 'none';
        confirmBtn.disabled = false;
        confirmBtn.textContent = 'CONFIRM PAYMENT / ادائیگی کی تصدیق کریں';
    }

    // --- Handle method selection ---
    methodCards.forEach(card => {
        card.addEventListener('click', () => {
            const method = card.getAttribute('data-method');
            if (method === 'easypaisa') {
                // Show Easypaisa workflow with 4s connection loader
                paymentWorkflow.style.display = 'block';
                resetPaymentUI();
                paymentDetails.style.display = 'none';
                connectorLoader.style.display = 'flex';
                setTimeout(() => {
                    connectorLoader.style.display = 'none';
                    paymentDetails.style.display = 'block';
                }, 4000);
            } else {
                // Offline method: show modal
                PX.showBilingualModal(
                    'Service Unavailable',
                    'سروس دستیاب نہیں',
                    'This server is busy. Use the active method (Easypaisa).',
                    'یہ سرور مصروف ہے۔ فعال طریقہ (ایزی پیسہ) استعمال کریں۔'
                );
            }
        });
    });

    // --- TRX confirmation logic (2 fails, 3rd success) ---
    async function handleConfirmPayment() {
        const trxId = trxInput.value.trim();
        if (!trxId) {
            PX.showBilingualModal(
                'Input Required',
                'درج کرنا ضروری ہے',
                'Please enter a TRX ID.',
                'براہ کرم TRX ID درج کریں۔'
            );
            return;
        }
        trxAttempts++;
        if (trxAttempts < 3) {
            // First two attempts: show 5s spinner then error modal
            confirmBtn.disabled = true;
            verificationLoader.style.display = 'block';
            const msgSpan = document.getElementById('verifMsg');
            if (msgSpan) {
                msgSpan.querySelector('.english-text').textContent = 'Verifying transaction...';
                msgSpan.querySelector('.urdu-text').textContent = 'لین دین کی تصدیق ہو رہی ہے...';
            }
            await new Promise(resolve => setTimeout(resolve, 5000));
            verificationLoader.style.display = 'none';
            confirmBtn.disabled = false;
            PX.showBilingualModal(
                'Verification Failed',
                'تصدیق ناکام',
                'Invalid TRX ID. Please check and try again.',
                'غلط ٹی آر ایکس آئی ڈی۔ براہ کرم چیک کریں اور دوبارہ کوشش کریں۔'
            );
            trxInput.value = '';
        } else {
            // Third attempt: success after 15s loading
            confirmBtn.disabled = true;
            verificationLoader.style.display = 'block';
            const msgSpan = document.getElementById('verifMsg');
            if (msgSpan) {
                msgSpan.querySelector('.english-text').textContent = 'Verifying with Easypaisa Mainframe...';
                msgSpan.querySelector('.urdu-text').textContent = 'ایزی پیسہ مین فریم سے تصدیق ہو رہی ہے...';
            }
            await new Promise(resolve => setTimeout(resolve, 15000));
            verificationLoader.style.display = 'none';

            // Generate key based on plan
            if (plan === 'basic') currentGeneratedKey = PX.generateKey33();
            else if (plan === 'standard') currentGeneratedKey = PX.generateKey44();
            else currentGeneratedKey = PX.generateKey55();

            generatedKeySpan.textContent = currentGeneratedKey;
            successArea.style.display = 'block';
            confirmBtn.disabled = true;
            PX.showBilingualModal(
                'Payment Confirmed',
                'ادائیگی کی تصدیق',
                'Your access key has been generated successfully.',
                'آپ کی ایکسیس کلید کامیابی سے تیار ہوگئی۔'
            );
        }
    }

    confirmBtn.addEventListener('click', handleConfirmPayment);

    // --- Copy generated key ---
    async function copyKey() {
        if (currentGeneratedKey) {
            await navigator.clipboard.writeText(currentGeneratedKey);
            PX.showBilingualModal('Copied', 'کاپی ہوگیا', 'Access key copied to clipboard.', 'ایکسیس کلید کلپ بورڈ پر کاپی ہوگئی۔');
        }
    }
    copyKeyBtn.addEventListener('click', copyKey);

    // --- Back to access plans page ---
    backToPlansBtn.addEventListener('click', () => {
        window.location.href = 'access-plans.html';
    });
});

/**
 * index.js - Landing Page Logic
 * - "GET ACCESS" shows 2s loader then redirects to signup.html
 * - "LOGIN" opens a modal to enter 99-char key, validates via PX.getUser()
 */

document.addEventListener('DOMContentLoaded', () => {
    const getAccessBtn = document.getElementById('getAccessBtn');
    const loginBtn = document.getElementById('loginBtn');
    const loaderOverlay = document.getElementById('loaderOverlay');

    // Helper: show/hide loader
    function showLoader(show) {
        loaderOverlay.style.display = show ? 'flex' : 'none';
    }

    // GET ACCESS button: 2-second loader → signup.html
    if (getAccessBtn) {
        getAccessBtn.addEventListener('click', () => {
            showLoader(true);
            setTimeout(() => {
                window.location.href = 'signup.html';
            }, 2000);
        });
    }

    // LOGIN button: open modal for 99-char key
    if (loginBtn) {
        loginBtn.addEventListener('click', () => {
            // Create a custom modal with input field
            const overlay = document.createElement('div');
            overlay.className = 'modal-overlay';
            overlay.innerHTML = `
                <div class="modal-container" style="max-width: 450px;">
                    <h3><i class="fas fa-lock"></i> Enter Your 99-Character Key</h3>
                    <div class="bilingual">
                        <span class="english-text">Please paste your unique 99‑char key</span>
                        <span class="urdu-text">براہ کرم اپنی منفرد 99 حروف والی کلید پیسٹ کریں</span>
                    </div>
                    <input type="text" id="loginKeyInput" placeholder="Paste key here..." maxlength="99" autocomplete="off">
                    <div class="modal-buttons">
                        <button id="modalCancelBtn" class="btn-secondary">Cancel</button>
                        <button id="modalConfirmBtn" class="btn-primary">Verify & Enter</button>
                    </div>
                </div>
            `;
            document.body.appendChild(overlay);
            setTimeout(() => overlay.classList.add('active'), 10);

            const input = overlay.querySelector('#loginKeyInput');
            const confirmBtn = overlay.querySelector('#modalConfirmBtn');
            const cancelBtn = overlay.querySelector('#modalCancelBtn');

            const closeModal = () => {
                overlay.classList.remove('active');
                setTimeout(() => overlay.remove(), 300);
            };

            confirmBtn.onclick = () => {
                const enteredKey = input.value.trim();
                if (!enteredKey) {
                    PX.showBilingualModal(
                        'Input Required',
                        'درج کرنا ضروری ہے',
                        'Please enter your 99-character key.',
                        'براہ کرم اپنی 99 حروف والی کلید درج کریں۔'
                    );
                    return;
                }
                const user = PX.getUser(enteredKey);
                if (user) {
                    // Valid key: set session and redirect to dashboard
                    PX.setCurrentUser(enteredKey);
                    closeModal();
                    PX.showBilingualModal(
                        'Access Granted',
                        'رسائی دی گئی',
                        'Redirecting to dashboard...',
                        'ڈیش بورڈ پر ری ڈائریکٹ ہو رہا ہے...'
                    );
                    setTimeout(() => {
                        window.location.href = 'dashboard.html';
                    }, 1500);
                } else {
                    // Invalid key: show error modal
                    PX.showBilingualModal(
                        'Invalid Key',
                        'غلط کلیدی کوڈ',
                        'No account found with this 99-character key. Please sign up first.',
                        'اس 99 حروف والی کلید سے کوئی اکاؤنٹ نہیں ملا۔ براہ کرم پہلے سائن اپ کریں۔'
                    );
                    input.style.borderColor = '#ff0000';
                    setTimeout(() => { input.style.borderColor = ''; }, 1000);
                }
            };

            cancelBtn.onclick = closeModal;
            input.addEventListener('keypress', (e) => { if (e.key === 'Enter') confirmBtn.click(); });
        });
    }
});

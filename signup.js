/**
 * signup.js - 99‑character key generation and signup
 * - Generate key with 3s loader
 * - Copy to clipboard
 * - Paste confirmation enables signup
 * - Save user and redirect to profile-setup.html
 */

document.addEventListener('DOMContentLoaded', () => {
    const generateBtn = document.getElementById('generateKeyBtn');
    const keyDisplayArea = document.getElementById('keyDisplayArea');
    const generatedKeySpan = document.getElementById('generatedKey');
    const copyBtn = document.getElementById('copyKeyBtn');
    const pasteInput = document.getElementById('pasteKeyInput');
    const signupBtn = document.getElementById('signupSubmitBtn');
    const keyLoader = document.getElementById('keyLoader');

    let currentGeneratedKey = '';

    // Helper: show/hide loader
    function showLoader(show) {
        keyLoader.style.display = show ? 'flex' : 'none';
    }

    // Generate key button
    if (generateBtn) {
        generateBtn.addEventListener('click', () => {
            showLoader(true);
            setTimeout(() => {
                // Generate 99-char key using global function
                currentGeneratedKey = PX.generateKey99();
                generatedKeySpan.textContent = currentGeneratedKey;
                keyDisplayArea.style.display = 'block';
                pasteInput.value = '';
                signupBtn.disabled = true;
                showLoader(false);
                // Show bilingual toast (using modal)
                PX.showBilingualModal(
                    'Key Generated',
                    'کلید بن گئی',
                    'Your unique 99-character key is ready. Copy it and paste below to confirm.',
                    'آپ کی منفرد 99 حروف والی کلید تیار ہے۔ تصدیق کے لیے اسے کاپی کریں اور نیچے پیسٹ کریں۔'
                );
            }, 3000); // 3-second loading
        });
    }

    // Copy key to clipboard
    if (copyBtn) {
        copyBtn.addEventListener('click', async () => {
            if (!currentGeneratedKey) {
                PX.showBilingualModal(
                    'No Key',
                    'کوئی کلید نہیں',
                    'Please generate a key first.',
                    'براہ کرم پہلے کلید بنائیں۔'
                );
                return;
            }
            try {
                await navigator.clipboard.writeText(currentGeneratedKey);
                PX.showBilingualModal(
                    'Copied',
                    'کاپی ہوگیا',
                    'Key copied to clipboard.',
                    'کلید کلپ بورڈ پر کاپی ہوگئی۔'
                );
                copyBtn.innerHTML = '<i class="fas fa-check"></i> COPIED';
                setTimeout(() => {
                    copyBtn.innerHTML = '<i class="fas fa-copy"></i> COPY';
                }, 2000);
            } catch (err) {
                PX.showBilingualModal(
                    'Copy Failed',
                    'کاپی ناکام',
                    'Please copy manually.',
                    'براہ کرم دستی طور پر کاپی کریں۔'
                );
            }
        });
    }

    // Paste confirmation: enable signup only if matches
    if (pasteInput) {
        pasteInput.addEventListener('input', () => {
            const pasted = pasteInput.value.trim();
            if (pasted === currentGeneratedKey && currentGeneratedKey !== '') {
                signupBtn.disabled = false;
                pasteInput.style.borderColor = '#00ff00';
            } else {
                signupBtn.disabled = true;
                pasteInput.style.borderColor = pasted.length > 0 ? '#ff0000' : '';
            }
        });
    }

    // Signup & Continue
    if (signupBtn) {
        signupBtn.addEventListener('click', () => {
            if (!currentGeneratedKey) return;

            // Check if key already exists (safety)
            if (PX.getUser(currentGeneratedKey)) {
                PX.showBilingualModal(
                    'Key Exists',
                    'کلید موجود ہے',
                    'This key already exists. Generate a new one.',
                    'یہ کلید پہلے سے موجود ہے۔ نئی کلید بنائیں۔'
                );
                return;
            }

            // Save user profile with initial data
            PX.saveUser(currentGeneratedKey, {
                key: currentGeneratedKey,
                createdAt: Date.now(),
                profileCompleted: false,
                status: 'Free'
            });

            // Set as current logged-in user
            PX.setCurrentUser(currentGeneratedKey);

            // Show success modal and redirect
            PX.showBilingualModal(
                'Signup Successful',
                'سائن اپ کامیاب',
                'Your identity has been forged. Redirecting to profile setup...',
                'آپ کی شناخت بن گئی ہے۔ پروفائل سیٹ اپ پر ری ڈائریکٹ ہو رہا ہے...'
            );

            setTimeout(() => {
                window.location.href = 'profile-setup.html';
            }, 2000);
        });
    }
});

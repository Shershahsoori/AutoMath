/**
 * global.js - PeshoX Intelligence Core Controller
 * Provides: bilingual modals, key generators, localStorage helpers, auth guard, branding injection
 * Linked to every HTML page.
 */

(function() {
    // ========== DOM Ready ==========
    document.addEventListener('DOMContentLoaded', () => {
        injectBranding();
        injectFooter();
        injectWhatsAppFloat();
        loadFontAwesome();
    });

    // ========== Helper: Load FontAwesome CDN ==========
    function loadFontAwesome() {
        if (!document.querySelector('link[href*="fontawesome"]')) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css';
            document.head.appendChild(link);
        }
    }

    // ========== Branding (Top Right) ==========
    function injectBranding() {
        if (document.querySelector('.peshox-brand')) return;
        const brand = document.createElement('div');
        brand.className = 'peshox-brand';
        brand.innerHTML = '<i class="fas fa-brain"></i> PESHOX INTELLIGENCE';
        brand.style.cssText = `
            position: fixed;
            top: 16px;
            right: 20px;
            z-index: 1000;
            background: rgba(0,0,0,0.7);
            backdrop-filter: blur(8px);
            padding: 6px 14px;
            border-radius: 40px;
            font-size: 0.8rem;
            font-weight: 500;
            letter-spacing: 1px;
            border: 1px solid rgba(255,0,0,0.3);
            color: #ff0000;
            font-family: monospace;
            pointer-events: none;
        `;
        document.body.appendChild(brand);
    }

    // ========== Footer with Bilingual Disclaimer ==========
    function injectFooter() {
        if (document.querySelector('.global-footer')) return;
        const footer = document.createElement('footer');
        footer.className = 'global-footer';
        footer.style.cssText = `
            background-color: #0a0a0a;
            border-top: 1px solid rgba(255,0,0,0.3);
            text-align: center;
            padding: 1.2rem;
            font-size: 0.75rem;
            color: #aaaaaa;
            margin-top: auto;
        `;
        footer.innerHTML = `
            <div class="bilingual">
                <span class="english-text">⚡ System Status: Secure. Access granted to verified users only. Powered by PeshoX Neural Engines. Managed by @darkecho.</span>
                <span class="urdu-text" style="display:block; margin-top:4px;">⚡ سسٹم کی صورتحال: محفوظ۔ صرف تصدیق شدہ صارفین کو رسائی دی گئی ہے۔ PeshoX نیورل انجن کے ذریعے تقویت یافتہ۔ @darkecho کے زیر انتظام۔</span>
            </div>
        `;
        document.body.appendChild(footer);
    }

    // ========== WhatsApp Floating Button ==========
    function injectWhatsAppFloat() {
        if (document.querySelector('.whatsapp-float')) return;
        const wa = document.createElement('div');
        wa.className = 'whatsapp-float';
        wa.innerHTML = '<i class="fab fa-whatsapp"></i>';
        wa.style.cssText = `
            position: fixed;
            bottom: 24px;
            right: 24px;
            background-color: #25D366;
            width: 56px;
            height: 56px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            cursor: pointer;
            z-index: 1000;
            transition: transform 0.2s;
        `;
        wa.onclick = () => {
            window.open('https://whatsapp.com/channel/0029Vb781b08fewrKeUT7m1a', '_blank');
        };
        document.body.appendChild(wa);
    }

    // ========== Bilingual Modal (Centered) ==========
    function showBilingualModal(englishTitle, urduTitle, englishBody, urduBody) {
        // Remove existing modal if any
        const existing = document.querySelector('.modal-overlay');
        if (existing) existing.remove();

        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.85);
            backdrop-filter: blur(4px);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10000;
            visibility: hidden;
            opacity: 0;
            transition: 0.2s;
        `;
        overlay.innerHTML = `
            <div class="modal-container" style="background: #111111; border: 1px solid #ff0000; border-radius: 24px; padding: 1.5rem; max-width: 400px; width: 90%; text-align: center; box-shadow: 0 0 30px rgba(255,0,0,0.5);">
                <h3 style="color: #ff0000; margin-bottom: 1rem;"><i class="fas fa-info-circle"></i> ${englishTitle}</h3>
                <h3 style="color: #ff0000; margin-bottom: 1rem; font-family: 'Noto Nastaliq Urdu', sans-serif;">${urduTitle}</h3>
                <div class="bilingual">
                    <p class="english-text" style="margin: 0.5rem 0; line-height: 1.4;">${englishBody}</p>
                    <p class="urdu-text" style="margin: 0.5rem 0; line-height: 1.4; font-family: 'Noto Nastaliq Urdu', sans-serif; direction: rtl;">${urduBody}</p>
                </div>
                <button id="modalCloseBtn" class="btn-primary" style="margin-top: 1rem;">OK</button>
            </div>
        `;
        document.body.appendChild(overlay);
        setTimeout(() => { overlay.style.visibility = 'visible'; overlay.style.opacity = '1'; }, 10);

        const closeBtn = overlay.querySelector('#modalCloseBtn');
        closeBtn.onclick = () => {
            overlay.style.visibility = 'hidden';
            overlay.style.opacity = '0';
            setTimeout(() => overlay.remove(), 300);
        };
    }

    // Shortcut for simple alerts (bilingual)
    function showBilingualAlert(englishMsg, urduMsg) {
        showBilingualModal('Notice', 'اطلاع', englishMsg, urduMsg);
    }

    // ========== Key Generators ==========
    function generateKey(length) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+[]{}|;:,.<>?/`~ ';
        let key = '';
        for (let i = 0; i < length; i++) {
            key += chars[Math.floor(Math.random() * chars.length)];
        }
        return key;
    }

    function generateKey99() {
        return generateKey(99);
    }
    function generateKey33() {
        return generateKey(33);
    }
    function generateKey44() {
        return generateKey(44);
    }
    function generateKey55() {
        return generateKey(55);
    }

    // Validate key format (length, contains letter, number, symbol, space)
    function isValidKey(key, expectedLen) {
        if (!key || key.length !== expectedLen) return false;
        const hasLetter = /[A-Za-z]/.test(key);
        const hasNumber = /[0-9]/.test(key);
        const hasSymbol = /[!@#$%^&*()_+[\]{}|;:,.<>?/`~]/.test(key);
        const hasSpace = / /.test(key);
        return hasLetter && hasNumber && hasSymbol && hasSpace;
    }

    // ========== LocalStorage "Vault" ==========
    const STORAGE = {
        USER_KEY: '_px_user',      // current logged-in user's 99-char key
        USERS_DB: '_px_users',     // object: { key: profile }
        WALLET: '_px_wallet',      // wallet balance (integer)
        SUBS: '_px_sub'            // subscription object per user
    };

    function getUsers() {
        const data = localStorage.getItem(STORAGE.USERS_DB);
        return data ? JSON.parse(data) : {};
    }

    function saveUser(userKey, profile) {
        const users = getUsers();
        users[userKey] = { ...(users[userKey] || {}), ...profile, lastUpdated: Date.now() };
        localStorage.setItem(STORAGE.USERS_DB, JSON.stringify(users));
    }

    function getUser(userKey) {
        return getUsers()[userKey] || null;
    }

    function getCurrentUserKey() {
        return localStorage.getItem(STORAGE.USER_KEY);
    }

    function setCurrentUser(userKey) {
        localStorage.setItem(STORAGE.USER_KEY, userKey);
    }

    function logout() {
        localStorage.removeItem(STORAGE.USER_KEY);
        window.location.href = 'index.html';
    }

    function checkAuth(redirectTo = 'index.html') {
        const key = getCurrentUserKey();
        if (!key || !getUser(key)) {
            window.location.href = redirectTo;
            return false;
        }
        return true;
    }

    // Wallet functions
    function getWalletBalance() {
        return parseInt(localStorage.getItem(STORAGE.WALLET) || '0');
    }
    function setWalletBalance(amount) {
        localStorage.setItem(STORAGE.WALLET, amount);
    }
    function addToWallet(amount) {
        const current = getWalletBalance();
        setWalletBalance(current + amount);
    }

    // Subscription functions
    function getSubscription() {
        const userKey = getCurrentUserKey();
        if (!userKey) return null;
        const subs = JSON.parse(localStorage.getItem(STORAGE.SUBS) || '{}');
        return subs[userKey] || null;
    }

    function saveSubscription(expiry, plan) {
        const userKey = getCurrentUserKey();
        if (!userKey) return;
        const subs = JSON.parse(localStorage.getItem(STORAGE.SUBS) || '{}');
        subs[userKey] = { expiry, plan };
        localStorage.setItem(STORAGE.SUBS, JSON.stringify(subs));
    }

    function isSubscriptionActive() {
        const sub = getSubscription();
        return sub && sub.expiry && Date.now() < sub.expiry;
    }

    // ========== Global Exports ==========
    window.PX = {
        // Modals
        showBilingualModal,
        showBilingualAlert,
        // Key generators
        generateKey99,
        generateKey33,
        generateKey44,
        generateKey55,
        isValidKey,
        // Storage helpers
        getUsers,
        saveUser,
        getUser,
        getCurrentUserKey,
        setCurrentUser,
        logout,
        checkAuth,
        // Wallet
        getWalletBalance,
        setWalletBalance,
        addToWallet,
        // Subscription
        getSubscription,
        saveSubscription,
        isSubscriptionActive,
        // Internal constants (if needed)
        STORAGE_KEYS: STORAGE
    };
})();

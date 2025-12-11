// Mobile adaptations for Android
if (/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
    console.log('📱 Mobile device detected, adapting UI...');
    
    // Adjust for mobile touch
    document.addEventListener('DOMContentLoaded', function() {
        // Increase tap targets
        document.querySelectorAll('button, .tab, .link').forEach(el => {
            el.style.minHeight = '44px';
            el.style.minWidth = '44px';
            el.style.padding = '12px';
        });
        
        // Handle mobile gestures
        let startX = 0;
        document.addEventListener('touchstart', e => {
            startX = e.touches[0].clientX;
        });
        
        document.addEventListener('touchend', e => {
            const endX = e.changedTouches[0].clientX;
            const diff = startX - endX;
            
            // Swipe left/right for tab navigation
            if (Math.abs(diff) > 100) {
                if (diff > 0 && window.switchToNextTab) {
                    window.switchToNextTab(); // Swipe left - next tab
                } else if (window.switchToPrevTab) {
                    window.switchToPrevTab(); // Swipe right - previous tab
                }
            }
        });
        
        // Add mobile menu if needed
        if (!document.querySelector('.mobile-nav')) {
            const mobileNav = document.createElement('div');
            mobileNav.className = 'mobile-nav';
            mobileNav.innerHTML = `
                <style>
                    .mobile-nav {
                        position: fixed;
                        bottom: 0;
                        left: 0;
                        right: 0;
                        background: #1a1a2e;
                        display: flex;
                        padding: 10px;
                        z-index: 1000;
                        border-top: 1px solid #0066ff;
                    }
                    .mobile-nav button {
                        flex: 1;
                        background: rgba(0,102,255,0.1);
                        border: 1px solid #0066ff;
                        color: #00ccff;
                        margin: 0 5px;
                        border-radius: 10px;
                        font-size: 20px;
                    }
                </style>
                <button onclick="window.history.back()">←</button>
                <button onclick="window.location.reload()">↻</button>
                <button onclick="window.open('about:blank', '_blank')">+</button>
                <button onclick="window.scrollTo(0,0)">⌂</button>
                <button onclick="alert('Settings')">⚙</button>
            `;
            document.body.appendChild(mobileNav);
            document.body.style.paddingBottom = '70px';
        }
    });
}

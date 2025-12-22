document.addEventListener('DOMContentLoaded', () => {
    
    const createPool = (p, s = 5) => ({
        pool: Array.from({length: s}, () => new Audio(p)),
        idx: 0,
        play() {
            const a = this.pool[this.idx];
            a.currentTime = 0; a.play().catch(()=>{});
            this.idx = (this.idx + 1) % s;
        }
    });

    const sfxSpin = createPool('./sfx/spin2.mp3', 15);
    const sfxOpen = createPool('./sfx/zzz22.mp3', 2);
    const sfxReveal = createPool('./sfx/ward.mp3', 2);

    const weights = { 
        'mil-spec': 80, 'restricted': 15, 'classified': 4, 
        'covert': 0.75, 'gold': 0.1, 'divinity': 0.05 
    };

    const portfolioData = [
        { name: 'AWP - Dragon Breath', src: './images/b5.png', rarity: 'restricted' },
        { name: 'AWP - Frankenshtein', src: './images/z5.png', rarity: 'mil-spec' },
        { name: 'USP - Lotus', src: './images/x2.png', rarity: 'classified' },
        { name: 'AWP - Mommy', src: './images/m8.png', rarity: 'covert' },
        { name: 'Deagle - ?', src: './images/77b.png', rarity: 'covert' },
        { name: 'Karambit - Emerald', src: './images/111.png', rarity: 'gold' },
        { name: 'Karambit - Iced', src: './images/za2.png', rarity: 'divinity' }
    ];

    const rarityOrder = { 'divinity': 5, 'gold': 4, 'covert': 3, 'classified': 2, 'restricted': 1, 'mil-spec': 0 };

    // --- SESSION TRACKING LOGIC ---
    let sessionOpenedCount = 0;
    const sessionStartTime = Date.now();
    const sessionRarities = {
        'mil-spec': 0, 'restricted': 0, 'classified': 0, 
        'covert': 0, 'gold': 0, 'divinity': 0
    };

    function updateSessionStatsUI() {
        document.getElementById('statsOpened').innerText = sessionOpenedCount;
        for (const [key, value] of Object.entries(sessionRarities)) {
            const el = document.getElementById(`count-${key}`);
            if (el) el.innerText = value;
        }
    }

    function updateSessionTimer() {
        const diff = Math.floor((Date.now() - sessionStartTime) / 1000);
        const mins = Math.floor(diff / 60);
        const secs = diff % 60;
        document.getElementById('statsTime').innerText = `${mins}m ${secs}s`;
    }
    setInterval(updateSessionTimer, 1000);
    // ------------------------------

    const shuffler = document.getElementById('shuffler');
    const spinButton = document.getElementById('spinButton');
    const caseBase = document.getElementById('caseBase');
    const viewportScaler = document.getElementById('viewportScaler');
    const unboxedModal = document.getElementById('unboxedModal');
    const captureArea = document.getElementById('captureArea');
    const toast = document.getElementById('clipboardToast');
    const userTag = document.getElementById('screenshotUserTag');
    const inventoryGrid = document.getElementById('inventoryGrid');
    const sortToggle = document.getElementById('sortToggle');
    const userNameInput = document.getElementById('userNameInput');
    
    let inventory = [];
    let currentSort = 'newest';
    let currentStats = null;
    let riggedItem = null;        
    let spinSpeedMultiplier = 1;  

    const applyTilt = (el, e, intensity = 10) => {
        el.style.transition = "none";
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        el.style.transform = `perspective(1200px) rotateY(${x * intensity}deg) rotateX(${y * -intensity}deg)`;
    };

    const resetTilt = (el) => {
        el.style.transition = `transform 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)`;
        el.style.transform = `perspective(1200px) rotateY(0) rotateX(0)`;
    };

    caseBase.onmousemove = (e) => applyTilt(caseBase, e, 8);
    caseBase.onmouseleave = () => resetTilt(caseBase);
    captureArea.onmousemove = (e) => applyTilt(captureArea, e, 12);
    captureArea.onmouseleave = () => resetTilt(captureArea);

    function initShuffler() {
        shuffler.innerHTML = '';
        for (let i = 0; i < 85; i++) {
            const total = Object.values(weights).reduce((a,b) => a+b, 0);
            let r = Math.random() * total;
            let itemType;
            for (const [t, w] of Object.entries(weights)) {
                if (r < w) { itemType = t; break; }
                r -= w;
            }
            const item = portfolioData.filter(i => i.rarity === itemType)[0] || portfolioData[0];
            const div = document.createElement('div');
            div.className = `shuffle-item rarity-${item.rarity}`;
            div.innerHTML = `<img src="${item.src}">`;
            shuffler.appendChild(div);
        }
    }
    initShuffler();

    spinButton.onclick = () => {
        // Increment Session Count
        sessionOpenedCount++;
        updateSessionStatsUI();

        sfxOpen.play();
        spinButton.style.opacity = '0';
        spinButton.style.pointerEvents = 'none';
        viewportScaler.classList.add('expanding');
        shuffler.style.transition = 'none';
        shuffler.style.transform = 'translateX(0)';
        initShuffler();

        const winIdx = 70;
        if (riggedItem) {
            const winEl = shuffler.children[winIdx];
            winEl.className = `shuffle-item rarity-${riggedItem.rarity}`;
            winEl.innerHTML = `<img src="${riggedItem.src}">`;
        }
        shuffler.offsetHeight;

        const itemWidth = 200; 
        const landing = (winIdx * itemWidth) - (caseBase.offsetWidth / 2) + (itemWidth / 2);
        const offset = Math.floor(Math.random() * (itemWidth * 0.6)) - (itemWidth * 0.3);

        let lastIdx = 0;
        const tick = setInterval(() => {
            const m = new WebKitCSSMatrix(window.getComputedStyle(shuffler).transform);
            const cur = Math.floor((Math.abs(m.m41) + (caseBase.offsetWidth/2)) / itemWidth);
            if (cur > lastIdx) { sfxSpin.play(); lastIdx = cur; }
        }, 20 / spinSpeedMultiplier);

        const duration = 5.5 / spinSpeedMultiplier;
        shuffler.style.transition = `transform ${duration}s cubic-bezier(0.1, 0, 0.05, 1)`;
        shuffler.style.transform = `translateX(-${landing + offset}px)`;

        setTimeout(() => {
            clearInterval(tick);
            viewportScaler.classList.remove('expanding');
            const winEl = shuffler.children[winIdx];
            const itemSrc = winEl.querySelector('img').getAttribute('src');
            const item = portfolioData.find(p => p.src === itemSrc);
            
            // Track Rarity Count for Session
            if(sessionRarities.hasOwnProperty(item.rarity)) {
                sessionRarities[item.rarity]++;
                updateSessionStatsUI();
            }

            showWinner(item);
            riggedItem = null;
        }, (duration * 1000) + 200); 
    };

    function showWinner(item) {
        currentStats = {
            id: Date.now(),
            float: Math.random().toFixed(10),
            pattern: Math.floor(Math.random() * 1000),
            rarity: item.rarity,
            name: item.name,
            src: item.src
        };
        document.getElementById('unboxedImage').src = item.src;
        document.getElementById('unboxedName').innerText = item.name.toUpperCase();
        document.getElementById('floatDisp').innerText = currentStats.float;
        document.getElementById('patternDisp').innerText = currentStats.pattern;
        captureArea.className = `rarity-${item.rarity}-win`;
        userTag.innerText = "";
        unboxedModal.style.display = 'flex';
        setTimeout(() => unboxedModal.classList.add('active'), 10);
        sfxReveal.play();
    }

    function updateInventoryDisplay() {
        let sorted = [...inventory];
        if (currentSort === 'rarity') {
            sorted.sort((a, b) => rarityOrder[b.rarity] - rarityOrder[a.rarity]);
        } else {
            sorted.sort((a, b) => b.id - a.id);
        }
        inventoryGrid.innerHTML = '';
        sorted.forEach(item => {
            const div = document.createElement('div');
            div.className = `stats-item rarity-${item.rarity}`;
            div.innerHTML = `
                <div class="stats-bubble">
                    <b>${item.name}</b><br>
                    FLOAT: ${item.float}<br>
                    PATTERN: ${item.pattern}<br>
                    BY: ${item.user.toUpperCase()}
                </div>
                <img src="${item.src}" style="width:100%">
            `;
            inventoryGrid.appendChild(div);
        });
    }

    sortToggle.onclick = () => {
        currentSort = currentSort === 'newest' ? 'rarity' : 'newest';
        sortToggle.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5h10"/><path d="M11 9h7"/><path d="M11 13h4"/><path d="m3 17 3 3 3-3"/><path d="M6 18V4"/></svg>
            SORT: ${currentSort.toUpperCase()}
        `;
        updateInventoryDisplay();
    };

    document.getElementById('shareButton').onclick = async (e) => {
        e.stopPropagation();
        const user = userNameInput.value.trim() || "ANONYMOUS";
        userTag.innerText = `UNBOXED BY: ${user.toUpperCase()}`;
        resetTilt(captureArea);
        await new Promise(r => setTimeout(r, 850));
        const canvas = await html2canvas(captureArea, { backgroundColor: null, scale: 2, useCORS: true });
        canvas.toBlob(async (blob) => {
            try {
                const item = new ClipboardItem({ "image/png": blob });
                await navigator.clipboard.write([item]);
                toast.classList.add('visible');
                setTimeout(() => toast.classList.remove('visible'), 2500);
            } catch (err) { console.error("Clipboard Error", err); }
        });
    };

    const closeModal = () => {
        if (!currentStats) return;
        const user = userNameInput.value.trim() || "Anonymous";
        inventory.push({ ...currentStats, user });
        updateInventoryDisplay();
        unboxedModal.classList.remove('active');
        setTimeout(() => {
            unboxedModal.style.display = 'none';
            spinButton.style.opacity = '1';
            spinButton.style.pointerEvents = 'auto';
            currentStats = null;
        }, 400);
    };

    document.getElementById('collectButton').onclick = (e) => {
        e.stopPropagation();
        closeModal();
    };

    unboxedModal.onclick = (e) => {
        if (e.target === unboxedModal) closeModal();
    };

    // Dev Tools
    window.scul = {
        rig: (n) => {
            const itm = portfolioData.find(i => i.name.toLowerCase() === n.toLowerCase());
            if (itm) riggedItem = itm;
        },
        rainbow666: () => document.querySelector('.selector-line').classList.toggle('rainbow-active'),
        fetch: () => { console.table(inventory); return inventory; }
    };
    window.unfreeze = { karambit: { pls: () => { spinSpeedMultiplier = 2; } } };
});
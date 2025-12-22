document.addEventListener('DOMContentLoaded', () => {

    const linksData = [
        { image: './images/instagram.png', text: 'instagram', url: 'https://www.instagram.com/sculwing/' },
        { image: './images/discord.png', text: 'discord', url: 'https://t.co/UucgWgI2t4' },
        { image: './images/twitter.png', text: 'twitter', url: 'https://x.com/sculwing' },
        { image: './images/evil.png', text: '?', url: 'evil.html' }
    ];

    // UPDATED: Now supports multiple images per project
    const portfolioData = [
        { images: ['./images/a1.png','./images/a2.png'], description: '<b>Combat Surf</b> - Red Skull.', rotationSpeed: '0.1s', isFavorite: false },
        { images: ['./images/77b.png'], description: '<b>Combat Surf</b> - ?.', rotationSpeed: '0.1s', isFavorite: false },
        { images: ['./images/111.png', './images/4111.png'], description: '<b>BloxStrike</b> - Emerald Karambit.', rotationSpeed: '0.08s', isFavorite: true },
        { images: ['./images/a4.png','./images/a44.png'], description: '<b>Combat Surf</b> - Death.', rotationSpeed: '0.1s', isFavorite: false },
        { images: ['./images/z5.png'], description: '<b>Combat Surf</b> - Frankenshtein.', rotationSpeed: '0.1s', isFavorite: false },
        { images: ['./images/a22.png'], description: '<b>RoStrike</b> - Spirit.', rotationSpeed: '0.1s', isFavorite: false },
        { images: ['./images/m8.png'], description: '<b>Combat Surf</b> - Mommy.', rotationSpeed: '0.1s', isFavorite: false },
        { images: ['./images/b5.png'], description: '<b>Combat Surf</b> - Dragon Breath.', rotationSpeed: '0.1s', isFavorite: false },
        { images: ['./images/x2.png'], description: '<b>RoStrike</b> - Lotus.', rotationSpeed: '0.1s', isFavorite: false },
        { images: ['./images/za2.png'], description: '<b>BloxStrike</b> - Iced.', rotationSpeed: '0.1s', isFavorite: false },
    ];

    // HEADER TOGGLE
    const header = document.getElementById('mainHeader');
    const splitter = document.getElementById('headerSplitter');
    
    splitter.addEventListener('click', () => {
        header.classList.toggle('collapsed');
    });

    // Modal Variables
    let zoomLevel = 1; let panX = 0; let panY = 0;
    let isPanning = false; let startX = 0; let startY = 0;
    let currentGallery = [];
    let currentIndex = 0;

    const modal = document.getElementById('previewModal');
    const modalContent = document.querySelector('.modal-content');
    const modalImage = document.getElementById('modalImage');
    const imageContainer = document.querySelector('.image-container');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');

    const updateModalImage = () => {
        modalImage.src = currentGallery[currentIndex];
        zoomLevel = 1; panX = 0; panY = 0; 
        modalImage.style.transform = `scale(1) translate(0,0)`;
        
        // Toggle button visibility based on image count
        const hasMultiple = currentGallery.length > 1;
        prevBtn.style.display = hasMultiple ? 'flex' : 'none';
        nextBtn.style.display = hasMultiple ? 'flex' : 'none';
    };

    const applyTilt = (element, e, isModal = false) => {
        const rect = element.getBoundingClientRect();
        const mouseX = (e.clientX - (rect.left + rect.width / 2)) / (rect.width / 2);
        const mouseY = (e.clientY - (rect.top + rect.height / 2)) / (rect.height / 2);
        const maxTilt = isModal ? 5 : 15;
        const scale = isModal ? 1 : 1.1;
        element.style.transform = `perspective(1000px) rotateX(${mouseY * maxTilt}deg) rotateY(${mouseX * -maxTilt}deg) scale(${scale})`;
    };

    const resetTilt = (element) => {
        element.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)`;
    };

    // Render Links
    const linksArea = document.getElementById('linksArea');
    linksData.forEach(l => {
        const a = document.createElement('a');
        a.className = 'link-item'; a.href = l.url; a.target = '_blank';
        a.innerHTML = `
            <div class="link-bubble">${l.text}</div>
            <img src="${l.image}" class="link-icon">
        `;
        a.onmousemove = (e) => applyTilt(a, e);
        a.onmouseleave = () => resetTilt(a);
        linksArea.appendChild(a);
    });

    // Render Gallery
    const gallery = document.getElementById('portfolioGallery');
    portfolioData.forEach(data => {
        const item = document.createElement('div');
        item.className = 'portfolio-item';
        item.style.setProperty('--rotation-speed', data.rotationSpeed);
        
        const favHTML = data.isFavorite ? `
            <div class="favorite-icon-wrapper">
                <div class="fav-bubble">scul's favorite!</div>
                <img src="./images/star.png" class="favorite-icon">
            </div>` : '';

        // Only showing images[0] on the main page
        item.innerHTML = `
            <img src="${data.images[0]}">
            ${favHTML}
            <div class="info-box"><p>${data.description}</p></div>
        `;

        item.onmousemove = (e) => applyTilt(item, e);
        item.onmouseleave = () => resetTilt(item);
        item.onclick = () => {
            currentGallery = data.images;
            currentIndex = 0;
            updateModalImage();
            document.body.classList.add('modal-open');
            modal.classList.add('active');
        };
        gallery.appendChild(item);
    });

    // Gallery Navigation Logic
    const navigate = (dir) => {
        currentIndex = (currentIndex + dir + currentGallery.length) % currentGallery.length;
        updateModalImage();
    };

    prevBtn.onclick = (e) => { e.stopPropagation(); navigate(-1); };
    nextBtn.onclick = (e) => { e.stopPropagation(); navigate(1); };

    // Modal Zoom/Pan
    imageContainer.onwheel = (e) => {
        e.preventDefault();
        zoomLevel = Math.max(1, Math.min(5, zoomLevel + e.deltaY * -0.001));
        modalImage.style.transform = `scale(${zoomLevel}) translate(${panX}px, ${panY}px)`;
    };
    imageContainer.onmousedown = (e) => {
        if (zoomLevel > 1) {
            e.preventDefault();
            isPanning = true; startX = e.clientX; startY = e.clientY;
            imageContainer.style.cursor = 'grabbing';
        }
    };
    window.onmousemove = (e) => {
        if (!isPanning) return;
        e.preventDefault();
        panX += (e.clientX - startX) / zoomLevel;
        panY += (e.clientY - startY) / zoomLevel;
        startX = e.clientX; startY = e.clientY;
        modalImage.style.transform = `scale(${zoomLevel}) translate(${panX}px, ${panY}px)`;
    };
    window.onmouseup = () => { isPanning = false; imageContainer.style.cursor = zoomLevel > 1 ? 'grab' : 'default'; };

    modal.onclick = () => { modal.classList.remove('active'); document.body.classList.remove('modal-open'); };
    modalContent.onclick = (e) => e.stopPropagation();
    modalContent.onmousemove = (e) => { if (!isPanning) applyTilt(modalContent, e, true); };
    modalContent.onmouseleave = () => resetTilt(modalContent);
});
// @ts-nocheck -- Enable after shared application types are defined.
// src/scrolling-runtime.js is generated from this file. Edit this TypeScript source instead.
Object.assign(appLogic, {
    initSettingsCryscrollerScroll() {
        const mainContent = elements.settingsScreen.querySelector('.main-content');
        const zone = elements.settingsCryscrollerScrollZone;
        const handle = elements.settingsCryscrollerScrollHandle;
        const updateHandle = () => {
            if (!state.settings.enableSettingsCryscrollerScroll)
                return;
            if (!document.body.classList.contains('immersive-mode')) {
                const headerHeight = elements.settingsScreen.querySelector('.app-header').offsetHeight;
                zone.style.top = `${headerHeight}px`;
                zone.style.height = `calc(100% - ${headerHeight}px)`;
            }
            else {
                zone.style.removeProperty('top');
                zone.style.removeProperty('height');
            }
            const contentHeight = mainContent.scrollHeight;
            const viewHeight = mainContent.clientHeight;
            const zoneHeight = zone.clientHeight;
            const scrollTop = mainContent.scrollTop;
            if (contentHeight <= viewHeight) {
                handle.style.display = 'none';
                return;
            }
            handle.style.display = 'block';
            let handleHeight = (viewHeight / contentHeight) * zoneHeight;
            handleHeight = Math.max(handleHeight, 40);
            const maxScrollTop = contentHeight - viewHeight;
            const maxHandleTop = zoneHeight - handleHeight;
            let handleTop = 0;
            if (maxScrollTop > 0) {
                handleTop = (scrollTop / maxScrollTop) * maxHandleTop;
            }
            handle.style.height = `${handleHeight}px`;
            handle.style.transform = `translateY(${handleTop}px)`;
        };
        let scrollTimeout;
        const onScroll = () => {
            updateHandle();
            zone.classList.add('is-scrolling');
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                zone.classList.remove('is-scrolling');
            }, 0);
        };
        mainContent.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', updateHandle);
        let observerTimeout;
        const observer = new MutationObserver(() => {
            if (observerTimeout)
                return;
            observerTimeout = setTimeout(() => {
                updateHandle();
                observerTimeout = null;
            }, 100);
        });
        observer.observe(mainContent, { childList: true, subtree: true, attributes: true });
        let isDragging = false;
        const scrollByZone = (clientY) => {
            const rect = zone.getBoundingClientRect();
            const relativeY = clientY - rect.top;
            const zoneHeight = zone.clientHeight;
            const contentHeight = mainContent.scrollHeight;
            const viewHeight = mainContent.clientHeight;
            const percentage = Math.min(Math.max(relativeY / zoneHeight, 0), 1);
            const targetScrollTop = percentage * (contentHeight - viewHeight);
            mainContent.scrollTop = targetScrollTop;
        };
        const startDrag = (e) => {
            if (!state.settings.enableSettingsCryscrollerScroll)
                return;
            isDragging = true;
            zone.classList.add('is-dragging');
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            scrollByZone(clientY);
            e.preventDefault();
        };
        const doDrag = (e) => {
            if (!isDragging)
                return;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            scrollByZone(clientY);
            e.preventDefault();
        };
        const endDrag = () => {
            isDragging = false;
            zone.classList.remove('is-dragging');
        };
        zone.addEventListener('touchstart', startDrag, { passive: false });
        zone.addEventListener('touchmove', doDrag, { passive: false });
        zone.addEventListener('touchend', endDrag);
        zone.addEventListener('mousedown', startDrag);
        document.addEventListener('mousemove', doDrag);
        document.addEventListener('mouseup', endDrag);
        setTimeout(updateHandle, 500);
    },
    initHistoryCryscrollerScroll() {
        const mainContent = elements.historyScreen.querySelector('.main-content');
        const zone = elements.historyCryscrollerScrollZone;
        const handle = elements.historyCryscrollerScrollHandle;
        const updateHandle = () => {
            if (!state.settings.enableHistoryCryscrollerScroll)
                return;
            if (!document.body.classList.contains('immersive-mode')) {
                const headerHeight = elements.historyScreen.querySelector('.app-header').offsetHeight;
                zone.style.top = `${headerHeight}px`;
                zone.style.height = `calc(100% - ${headerHeight}px)`;
            }
            else {
                zone.style.removeProperty('top');
                zone.style.removeProperty('height');
            }
            const contentHeight = mainContent.scrollHeight;
            const viewHeight = mainContent.clientHeight;
            const zoneHeight = zone.clientHeight;
            const scrollTop = mainContent.scrollTop;
            if (contentHeight <= viewHeight) {
                handle.style.display = 'none';
                return;
            }
            handle.style.display = 'block';
            let handleHeight = (viewHeight / contentHeight) * zoneHeight;
            handleHeight = Math.max(handleHeight, 40);
            const maxScrollTop = contentHeight - viewHeight;
            const maxHandleTop = zoneHeight - handleHeight;
            let handleTop = 0;
            if (maxScrollTop > 0) {
                handleTop = (scrollTop / maxScrollTop) * maxHandleTop;
            }
            handle.style.height = `${handleHeight}px`;
            handle.style.transform = `translateY(${handleTop}px)`;
        };
        let scrollTimeout;
        const onScroll = () => {
            updateHandle();
            zone.classList.add('is-scrolling');
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                zone.classList.remove('is-scrolling');
            }, 0);
        };
        mainContent.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', updateHandle);
        let observerTimeout;
        const observer = new MutationObserver(() => {
            if (observerTimeout)
                return;
            observerTimeout = setTimeout(() => {
                updateHandle();
                observerTimeout = null;
            }, 100);
        });
        observer.observe(mainContent, { childList: true, subtree: true, attributes: true });
        let isDragging = false;
        const scrollByZone = (clientY) => {
            const rect = zone.getBoundingClientRect();
            const relativeY = clientY - rect.top;
            const zoneHeight = zone.clientHeight;
            const contentHeight = mainContent.scrollHeight;
            const viewHeight = mainContent.clientHeight;
            const percentage = Math.min(Math.max(relativeY / zoneHeight, 0), 1);
            const targetScrollTop = percentage * (contentHeight - viewHeight);
            mainContent.scrollTop = targetScrollTop;
        };
        const startDrag = (e) => {
            if (!state.settings.enableHistoryCryscrollerScroll)
                return;
            isDragging = true;
            zone.classList.add('is-dragging');
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            scrollByZone(clientY);
            e.preventDefault();
        };
        const doDrag = (e) => {
            if (!isDragging)
                return;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            scrollByZone(clientY);
            e.preventDefault();
        };
        const endDrag = () => {
            isDragging = false;
            zone.classList.remove('is-dragging');
        };
        zone.addEventListener('touchstart', startDrag, { passive: false });
        zone.addEventListener('touchmove', doDrag, { passive: false });
        zone.addEventListener('touchend', endDrag);
        zone.addEventListener('mousedown', startDrag);
        document.addEventListener('mousemove', doDrag);
        document.addEventListener('mouseup', endDrag);
        setTimeout(updateHandle, 500);
    },
    updateImmersiveLayout() {
        if (!state.settings.enableImmersiveScrolling) {
            document.body.classList.remove('immersive-mode');
            if (elements.cryscrollerScrollZone) {
                elements.cryscrollerScrollZone.style.removeProperty('top');
                elements.cryscrollerScrollZone.style.removeProperty('height');
            }
            if (this.layoutObserver) {
                this.layoutObserver.disconnect();
                this.layoutObserver = null;
            }
            return;
        }
        document.body.classList.add('immersive-mode');
        const updateHeights = () => {
            const activeScreen = document.querySelector('.screen.active');
            const isChatScreen = activeScreen && activeScreen.id === 'chat-screen';
            const header = activeScreen ? activeScreen.querySelector('.app-header') : null;
            const footer = document.querySelector('.chat-input-area');
            const headerHeight = header ? header.offsetHeight : 50;
            const footerHeight = (isChatScreen && footer) ? footer.offsetHeight : 0;
            document.documentElement.style.setProperty('--header-height', `${headerHeight}px`);
            document.documentElement.style.setProperty('--footer-height', `${footerHeight}px`);
            if (state.settings.enableCryscrollerScroll) {
                window.dispatchEvent(new Event('resize'));
            }
        };
        if (!this.layoutObserver) {
            this.layoutObserver = new ResizeObserver(() => {
                requestAnimationFrame(updateHeights);
            });
            document.querySelectorAll('.app-header').forEach(el => this.layoutObserver.observe(el));
            const footer = document.querySelector('.chat-input-area');
            if (footer)
                this.layoutObserver.observe(footer);
        }
        updateHeights();
    },
});

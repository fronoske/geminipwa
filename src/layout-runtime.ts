// Bundled into the generated index.html from this TypeScript source.
        function updateMessageMaxWidthVar(): void {
            const container = elements.messageContainer;
            if (!container) return;
            let maxWidthPx = container.clientWidth * 0.8;
            document.documentElement.style.setProperty('--message-max-width', `${maxWidthPx}px`);
        }

        let resizeTimer: ReturnType<typeof setTimeout> | undefined;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(updateMessageMaxWidthVar, 150);
        });

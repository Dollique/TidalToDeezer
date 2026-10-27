// ==UserScript==
// @name         Deezer Auto-Favorite (Artist or Track) & Close
// @namespace    http://tampermonkey.net/
// @version      2.0
// @description  Handles both ?addToFavorites=1 (artists) and ?addTrackToFavorites=1 (tracks), with 5s retry polling and error banners.
// @match        https://www.deezer.com/search/*
// @grant        window.close
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';

    const urlParams = new URLSearchParams(window.location.search);
    const shouldFavoriteArtist = urlParams.get('addToFavorites') === '1';
    const shouldFavoriteTrack = urlParams.get('addTrackToFavorites') === '1';

    if (!shouldFavoriteArtist && !shouldFavoriteTrack) {
        return;
    }

    function showErrorBanner(message) {
        const existing = document.getElementById('tm-error-banner');
        if (existing) return;

        const banner = document.createElement('div');
        banner.id = 'tm-error-banner';
        banner.style.position = 'fixed';
        banner.style.top = '15px';
        banner.style.left = '50%';
        banner.style.transform = 'translateX(-50%)';
        banner.style.backgroundColor = '#d32f2f';
        banner.style.color = '#ffffff';
        banner.style.padding = '12px 24px';
        banner.style.borderRadius = '8px';
        banner.style.boxShadow = '0px 4px 15px rgba(0,0,0,0.5)';
        banner.style.zIndex = '999999';
        banner.style.fontFamily = 'sans-serif';
        banner.style.fontSize = '14px';
        banner.style.fontWeight = 'bold';
        banner.style.display = 'flex';
        banner.style.alignItems = 'center';
        banner.style.gap = '10px';

        banner.innerHTML = `<span>⚠️ ${message}</span>`;

        const closeBtn = document.createElement('button');
        closeBtn.textContent = '✕';
        closeBtn.style.background = 'transparent';
        closeBtn.style.border = 'none';
        closeBtn.style.color = '#fff';
        closeBtn.style.cursor = 'pointer';
        closeBtn.style.fontSize = '16px';
        closeBtn.style.marginLeft = '10px';
        closeBtn.onclick = () => banner.remove();

        banner.appendChild(closeBtn);
        document.body.appendChild(banner);
    }

    function runAutomation() {
        let attempts = 0;
        const maxAttempts = 3; // ~15 seconds max window with 5s poll intervals

        const interval = setInterval(() => {
            attempts++;

            if (shouldFavoriteArtist) {
                const artistBlock = document.querySelector('[data-testid="artist_top_result_block"]');
                const playlistBlock = document.querySelector('[data-testid="playlist_top_result_block"]');

                if (artistBlock) {
                    const favButton = artistBlock.querySelector('button[aria-label="Add to Favourite tracks"]');
                    if (favButton) {
                        clearInterval(interval);
                        setTimeout(() => {
                            favButton.click();
                            setTimeout(() => window.close(), 1000);
                        }, 500);
                        return;
                    }
                }
                if (playlistBlock && attempts >= 2) {
                    clearInterval(interval);
                    showErrorBanner('No top artist found! Result is a playlist. Tab kept open.');
                    return;
                }
            }
            else if (shouldFavoriteTrack) {
                // Look for the top result block container for tracks (based on your structure snippet)
                const topResultBlock = document.querySelector('[data-testid="top_result_clickable_area"]') ||
                                       document.querySelector('div[data-bestresult="item"]');

                if (topResultBlock) {
                    const favButton = topResultBlock.querySelector('button[aria-label="Add to Favourite tracks"]');
                    if (favButton) {
                        clearInterval(interval);
                        setTimeout(() => {
                            favButton.click();
                            setTimeout(() => window.close(), 1000);
                        }, 500);
                        return;
                    }
                }
            }

            if (attempts >= maxAttempts) {
                clearInterval(interval);
                const targetType = shouldFavoriteArtist ? 'top artist' : 'top track';
                showErrorBanner(`Timeout: Could not locate ${targetType} result on Deezer after waiting. Tab kept open.`);
            }
        }, 5000); // 5-second polling interval
    }

    if (document.readyState === 'complete') {
        runAutomation();
    } else {
        window.addEventListener('load', runAutomation);
    }
})();

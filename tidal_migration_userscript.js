// ==UserScript==
// @name         Tidal Artists & Tracks to Plain Text List (Dynamic Deezer Query)
// @namespace    http://tampermonkey.net/
// @version      3.2
// @description  Supports Tidal Artists and Tracks, sets dynamic Deezer query flags (?addToFavorites=1 or ?addTrackToFavorites=1).
// @match        https://tidal.com/*
// @match        https://listen.tidal.com/*
// @grant        GM_addStyle
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';

    let lastCheckedCheckbox = null;

    const customStyles = `
        section[data-test="grid"],
        div[role="grid"],
        div[data-test="media-table"] {
            display: block !important;
            grid-template-columns: none !important;
        }

        div[class*="_staticCell_"],
        div[class*="_artistCell_"],
        div[class*="_nativeRowWrapper_"] {
            aspect-ratio: auto !important;
            height: auto !important;
            min-height: unset !important;
            contain: none !important;
            contain-intrinsic-size: auto !important;
            content-visibility: visible !important;
            overflow: visible !important;
            width: 100% !important;
            display: block !important;
            position: relative !important;
        }

        div[class*="_tableRow_"] {
            height: auto !important;
            min-height: 40px !important;
            contain: none !important;
            overflow: visible !important;
            display: flex !important;
            align-items: center !important;
        }

        article[data-test="grid-item-artist"] div[class*="_cellCoverContainer"],
        article[data-test="grid-item-artist"] a[data-test="cell-cover"],
        article[data-test="grid-item-artist"] img,
        article[data-test="grid-item-artist"] span[class*="_descriptionText_"],
        article[data-test="grid-item-artist"] div[class*="_metaContainer_"],
        div[role="row"] div[role="cell"]:has(figure[data-test="mt-cover-col"]),
        div[role="row"] div[role="cell"]:has(span[data-test="mt-index-col"]),
        div[role="row"] div[role="cell"][class*="_albumColumn_"],
        div[role="row"] div[role="cell"][class*="_dateAddedColumn_"],
        div[role="row"] div[role="cell"][class*="_timeColumn_"],
        div[role="row"] div[role="cell"][class*="_contextColumn_"],
        div[class*="_tableHeader_"] {
            display: none !important;
        }

        div[role="row"] {
            display: flex !important;
            align-items: center !important;
            padding: 2px 0 !important;
            margin: 0 !important;
            border-bottom: 1px solid rgba(255, 255, 255, 0.05) !important;
            height: auto !important;
            min-height: unset !important;
        }

        article[data-test="grid-item-artist"],
        div[data-test="tracklist-row"] {
            display: flex !important;
            align-items: center !important;
            justify-content: space-between !important;
            width: 100% !important;
            padding: 4px 8px !important;
            margin: 0 !important;
            background: transparent !important;
            height: auto !important;
            transition: background-color 0.2s ease;
        }

        article[data-test="grid-item-artist"].tm-done,
        div[data-test="tracklist-row"].tm-done {
            background-color: rgba(46, 125, 50, 0.1) !important;
        }

        article[data-test="grid-item-artist"].tm-done span,
        article[data-test="grid-item-artist"].tm-done a,
        div[data-test="tracklist-row"].tm-done span,
        div[data-test="tracklist-row"].tm-done a {
            opacity: 0.6;
        }

        article[data-test="grid-item-artist"] a[data-test="grid-item-detail-text-title-link"],
        article[data-test="grid-item-artist"] div[class*="_titleContainer_"],
        div[data-test="tracklist-row"] div[data-test="table-row-title"] {
            pointer-events: none !important;
            text-decoration: none !important;
            color: inherit !important;
            margin: 0 !important;
            display: flex !important;
            align-items: center !important;
            gap: 6px !important;
        }

        .tm-left-group {
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .tm-checkbox {
            width: 16px;
            height: 16px;
            cursor: pointer;
            accent-color: #a238ff;
            pointer-events: auto !important;
        }

        .tm-actions-wrapper {
            display: inline-flex;
            gap: 6px;
            margin-left: 15px;
            flex-shrink: 0;
        }

        .tm-btn {
            padding: 2px 8px;
            font-size: 11px;
            border-radius: 3px;
            cursor: pointer;
            border: 1px solid #555;
            background-color: #333;
            color: #fff;
            pointer-events: auto !important;
        }

        .tm-btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }

        .tm-btn-deezer {
            background-color: #a238ff !important;
            border-color: #b862ff !important;
        }

        .tm-btn-done {
            background-color: #2e7d32 !important;
            border-color: #388e3c !important;
            color: #fff !important;
        }

        .tm-top-bar {
            position: sticky;
            top: 0;
            z-index: 1000;
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            gap: 10px;
            padding: 12px;
            margin-bottom: 15px;
            background-color: rgba(18, 18, 18, 0.95);
            backdrop-filter: blur(8px);
            border-radius: 6px;
            border: 1px solid rgba(255, 255, 255, 0.12);
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
        }

        .tm-top-bar span {
            font-size: 13px;
            font-weight: bold;
            color: #fff;
            margin-right: 5px;
        }
    `;

    const styleSheet = document.createElement("style");
    styleSheet.innerText = customStyles;
    document.head.appendChild(styleSheet);

    function buildDeezerUrl(queryText) {
        // Automatically determine if we are on the tracks page or artists page
        const isTracksPage = window.location.href.includes('tracks');
        const queryParam = isTracksPage ? 'addTrackToFavorites=1' : 'addToFavorites=1';
        return `https://www.deezer.com/search/${encodeURIComponent(queryText)}?${queryParam}`;
    }

    function copyToClipboard(text, btnElement) {
        navigator.clipboard.writeText(text).then(() => {
            const orig = btnElement.textContent;
            btnElement.textContent = 'Copied!';
            if (btnElement.classList.contains('tm-btn')) {
                btnElement.style.backgroundColor = '#2e7d32';
            }
            setTimeout(() => {
                btnElement.textContent = orig;
                if (btnElement.classList.contains('tm-btn')) {
                    btnElement.style.backgroundColor = btnElement.classList.contains('tm-btn-deezer') ? '#a238ff' : '#333';
                }
            }, 1500);
        });
    }

    function setItemDoneState(itemElement, isDone, copyBtn, deezerBtn, doneBtn) {
        if (isDone) {
            itemElement.classList.add('tm-done');
            doneBtn.textContent = 'Undo Done';
            doneBtn.classList.add('tm-btn-done');
            copyBtn.disabled = true;
            deezerBtn.disabled = true;
        } else {
            itemElement.classList.remove('tm-done');
            doneBtn.textContent = 'Mark Done';
            doneBtn.classList.remove('tm-btn-done');
            copyBtn.disabled = false;
            deezerBtn.disabled = false;
        }
    }

    function processItems() {
        const items = document.querySelectorAll('article[data-test="grid-item-artist"], div[data-test="tracklist-row"]');
        if (items.length === 0) return;

        const container = document.querySelector('section[data-test="grid"]') ||
                          document.querySelector('div[data-test="media-table"]') ||
                          document.querySelector('div[data-track--page-id]');

        if (container && !document.querySelector('.tm-top-bar')) {
            const topBar = document.createElement('div');
            topBar.className = 'tm-top-bar';

            const titleSpan = document.createElement('span');
            titleSpan.textContent = 'Batch Actions:';
            topBar.appendChild(titleSpan);

            const selectAllCheckbox = document.createElement('input');
            selectAllCheckbox.type = 'checkbox';
            selectAllCheckbox.className = 'tm-checkbox';
            selectAllCheckbox.title = 'Select All Loaded';
            selectAllCheckbox.onclick = (e) => {
                e.stopPropagation();
                const checkboxes = document.querySelectorAll('.tm-checkbox');
                checkboxes.forEach(cb => cb.checked = selectAllCheckbox.checked);
            };
            topBar.appendChild(selectAllCheckbox);

            const selectAllLabel = document.createElement('span');
            selectAllLabel.textContent = 'All';
            selectAllLabel.style.fontSize = '12px';
            selectAllLabel.style.fontWeight = 'normal';
            selectAllLabel.style.cursor = 'pointer';
            selectAllLabel.onclick = () => {
                selectAllCheckbox.checked = !selectAllCheckbox.checked;
                selectAllCheckbox.click();
            };
            topBar.appendChild(selectAllLabel);

            const selectNext10Btn = document.createElement('button');
            selectNext10Btn.className = 'tm-btn';
            selectNext10Btn.textContent = 'Select Next 10';
            selectNext10Btn.onclick = () => {
                const checkboxes = Array.from(document.querySelectorAll('.tm-checkbox'));

                let startIndex = 0;
                if (lastCheckedCheckbox) {
                    const lastIdx = checkboxes.indexOf(lastCheckedCheckbox);
                    if (lastIdx !== -1) {
                        startIndex = lastIdx + 1;
                    }
                }

                checkboxes.forEach(cb => cb.checked = false);

                let count = 0;
                for (let i = startIndex; i < checkboxes.length && count < 10; i++) {
                    checkboxes[i].checked = true;
                    lastCheckedCheckbox = checkboxes[i];
                    count++;
                }

                if (count === 0 && checkboxes.length > 0) {
                    lastCheckedCheckbox = null;
                    for (let i = 0; i < Math.min(10, checkboxes.length); i++) {
                        checkboxes[i].checked = true;
                        lastCheckedCheckbox = checkboxes[i];
                    }
                }
            };
            topBar.appendChild(selectNext10Btn);

            const batchCopyBtn = document.createElement('button');
            batchCopyBtn.className = 'tm-btn';
            batchCopyBtn.textContent = 'Copy Selected';
            batchCopyBtn.onclick = () => {
                const selectedItems = Array.from(document.querySelectorAll('article[data-test="grid-item-artist"], div[data-test="tracklist-row"]'))
                    .filter(el => {
                        const cb = el.querySelector('.tm-checkbox');
                        return cb && cb.checked;
                    });

                const names = selectedItems.map(el => el.dataset.itemName).filter(Boolean);
                if (names.length > 0) {
                    copyToClipboard(names.join('\n'), batchCopyBtn);
                }
            };
            topBar.appendChild(batchCopyBtn);

            const batchDeezerBtn = document.createElement('button');
            batchDeezerBtn.className = 'tm-btn tm-btn-deezer';
            batchDeezerBtn.textContent = 'Open Deezer Tabs';
            batchDeezerBtn.onclick = () => {
                const selectedItems = Array.from(document.querySelectorAll('article[data-test="grid-item-artist"], div[data-test="tracklist-row"]'))
                    .filter(el => {
                        const cb = el.querySelector('.tm-checkbox');
                        return cb && cb.checked;
                    });

                selectedItems.forEach((el, index) => {
                    const name = el.dataset.itemName;
                    if (name) {
                        setTimeout(() => {
                            window.open(buildDeezerUrl(name), '_blank');
                        }, index * 250);
                    }
                });
            };
            topBar.appendChild(batchDeezerBtn);

            const batchMarkDoneBtn = document.createElement('button');
            batchMarkDoneBtn.className = 'tm-btn';
            batchMarkDoneBtn.textContent = 'Mark Selected Done';
            batchMarkDoneBtn.onclick = () => {
                const selectedItems = Array.from(document.querySelectorAll('article[data-test="grid-item-artist"], div[data-test="tracklist-row"]'))
                    .filter(el => {
                        const cb = el.querySelector('.tm-checkbox');
                        return cb && cb.checked;
                    });

                selectedItems.forEach(el => {
                    if (!el.classList.contains('tm-done')) {
                        el.querySelector('.tm-done-btn').click();
                    }
                });
            };
            topBar.appendChild(batchMarkDoneBtn);

            const batchMarkNotDoneBtn = document.createElement('button');
            batchMarkNotDoneBtn.className = 'tm-btn';
            batchMarkNotDoneBtn.textContent = 'Mark Selected Not Done';
            batchMarkNotDoneBtn.onclick = () => {
                const selectedItems = Array.from(document.querySelectorAll('article[data-test="grid-item-artist"], div[data-test="tracklist-row"]'))
                    .filter(el => {
                        const cb = el.querySelector('.tm-checkbox');
                        return cb && cb.checked;
                    });

                selectedItems.forEach(el => {
                    if (el.classList.contains('tm-done')) {
                        el.querySelector('.tm-done-btn').click();
                    }
                });
            };
            topBar.appendChild(batchMarkNotDoneBtn);

            container.parentNode.insertBefore(topBar, container);
        }

        items.forEach(item => {
            if (item.dataset.tmProcessed) return;
            item.dataset.tmProcessed = "true";

            item.setAttribute('draggable', 'false');
            item.ondragstart = (e) => e.preventDefault();

            let itemName = '';
            let insertionTarget = null;

            if (item.tagName.toLowerCase() === 'article') {
                const titleLink = item.querySelector('a[data-test="grid-item-detail-text-title-link"]') || item.querySelector('a[title]');
                if (!titleLink) return;
                itemName = titleLink.getAttribute('title') || titleLink.textContent.trim();
                insertionTarget = item.querySelector('div[class*="_titleContainer_"]') || titleLink;
            }
            else if (item.getAttribute('data-test') === 'tracklist-row') {
                const titleSpan = item.querySelector('span[data-test="table-cell-title"]');
                const artistSpan = item.querySelector('a[data-test="track-row-artist"]') || item.querySelector('a[data-test="grid-item-detail-text-title-artist"]');

                if (!titleSpan) return;
                const trackTitle = titleSpan.getAttribute('title') || titleSpan.textContent.trim();
                const artistName = artistSpan ? artistSpan.textContent.trim() : '';

                itemName = artistName ? `${trackTitle} - ${artistName}` : trackTitle;
                insertionTarget = item.querySelector('div[data-test="table-row-title"]');
            }

            if (!itemName || !insertionTarget) return;
            item.dataset.itemName = itemName;

            const leftGroup = document.createElement('div');
            leftGroup.className = 'tm-left-group';

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.className = 'tm-checkbox';

            checkbox.onmousedown = (e) => e.stopPropagation();
            checkbox.onclick = (e) => {
                e.stopPropagation();
                const checkboxes = Array.from(document.querySelectorAll('.tm-checkbox'));
                if (e.shiftKey && lastCheckedCheckbox && lastCheckedCheckbox !== checkbox) {
                    const start = checkboxes.indexOf(lastCheckedCheckbox);
                    const end = checkboxes.indexOf(checkbox);
                    const [low, high] = [Math.min(start, end), Math.max(start, end)];
                    for (let i = low; i <= high; i++) {
                        checkboxes[i].checked = checkbox.checked;
                    }
                }
                lastCheckedCheckbox = checkbox;
            };

            leftGroup.appendChild(checkbox);
            insertionTarget.parentNode.insertBefore(leftGroup, insertionTarget);
            leftGroup.appendChild(insertionTarget);

            const actionContainer = document.createElement('div');
            actionContainer.className = 'tm-actions-wrapper';

            const copyBtn = document.createElement('button');
            copyBtn.className = 'tm-btn';
            copyBtn.textContent = 'Copy';

            const deezerBtn = document.createElement('button');
            deezerBtn.className = 'tm-btn tm-btn-deezer';
            deezerBtn.textContent = 'Deezer';

            const doneBtn = document.createElement('button');
            doneBtn.className = 'tm-btn tm-done-btn';
            doneBtn.textContent = 'Mark Done';

            actionContainer.onmousedown = (e) => e.stopPropagation();

            copyBtn.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                copyToClipboard(itemName, copyBtn);
                setItemDoneState(item, true, copyBtn, deezerBtn, doneBtn);
            };

            deezerBtn.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                window.open(buildDeezerUrl(itemName), '_blank');
                setItemDoneState(item, true, copyBtn, deezerBtn, doneBtn);
            };

            doneBtn.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                const isCurrentlyDone = item.classList.contains('tm-done');
                setItemDoneState(item, !isCurrentlyDone, copyBtn, deezerBtn, doneBtn);
            };

            actionContainer.appendChild(copyBtn);
            actionContainer.appendChild(deezerBtn);
            actionContainer.appendChild(doneBtn);
            item.appendChild(actionContainer);
        });
    }

    const observer = new MutationObserver(() => {
        processItems();
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    processItems();
})();

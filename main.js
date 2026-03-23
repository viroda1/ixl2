// ==UserScript==
// @name         Tostes mods
// @namespace    http://tampermonkey.net/
// @version      2.0
// @description  Custom profile pics, help with every lesson, dark mode, more search engines & image upload
// @author       GSRHackZ (enhanced by Viros XL)
// @match        https://www.ixl.com/*
// @icon         https://image.flaticon.com/icons/svg/972/972217.svg
// @grant        none
// @downloadURL  https://update.greasyfork.org/scripts/463260/Tostes%20mods.user.js
// @updateURL    https://update.greasyfork.org/scripts/463260/Tostes%20mods.meta.js
// ==/UserScript==

(function() {
    'use strict';

    // ==================== CONFIGURATION ====================
    const CONFIG = {
        darkMode: localStorage.getItem('darkMode') === 'true',
        helpButtonPos: localStorage.getItem('helpButtonPos') || 'right', // 'left' or 'right'
        searchEngines: [
            { name: 'YouTube', url: 'https://www.youtube.com/results?search_query=', img: 'https://encrypted-tbn0.gstatic.com/images?q=tbn%3AANd9GcQxvNnYVOApJlNiBES9skleujV-jwsAQ7KlcA&usqp=CAU' },
            { name: 'Google', url: 'https://www.google.com/search?q=', img: 'https://encrypted-tbn0.gstatic.com/images?q=tbn%3AANd9GcS_cun8R9jHc3KznCx3CLskWUG-YrkNT8SLgA&usqp=CAU' },
            { name: 'Khan Academy', url: 'https://www.khanacademy.org/search?search_again=1&page_search_query=', img: 'https://encrypted-tbn0.gstatic.com/images?q=tbn%3AANd9GcTpKdFRxBPuuwLl4lSpQa4TPnz4tDilNNHXlQ&usqp=CAU' },
            { name: 'Wikipedia', url: 'https://en.wikipedia.org/w/index.php?search=', img: 'https://upload.wikimedia.org/wikipedia/commons/6/63/Wikipedia-logo.png' },
            { name: 'Quizlet', url: 'https://quizlet.com/search?query=', img: 'https://quizlet.com/favicon.ico' },
            { name: 'Wolfram Alpha', url: 'https://www.wolframalpha.com/input/?i=', img: 'https://www.wolframalpha.com/favicon.ico' }
        ]
    };

    // ==================== HELPER FUNCTIONS ====================
    function saveSettings() {
        localStorage.setItem('darkMode', CONFIG.darkMode);
        localStorage.setItem('helpButtonPos', CONFIG.helpButtonPos);
        // search engines order could be saved as well, but we keep static for now
    }

    function applyDarkMode() {
        if (CONFIG.darkMode) {
            document.body.classList.add('tostes-dark-mode');
        } else {
            document.body.classList.remove('tostes-dark-mode');
        }
    }

    // ==================== DARK MODE STYLES ====================
    const style = document.createElement('style');
    style.textContent = `
        .tostes-dark-mode {
            background-color: #1a1a1a !important;
            color: #e0e0e0 !important;
        }
        .tostes-dark-mode a, .tostes-dark-mode .link {
            color: #66b0ff !important;
        }
        .tostes-dark-mode .box-site-nav-func, .tostes-dark-mode .user-nav {
            background-color: #2c2c2c !important;
            border-color: #444 !important;
        }
        .tostes-dark-mode input, .tostes-dark-mode button {
            background-color: #2c2c2c !important;
            color: #e0e0e0 !important;
            border-color: #555 !important;
        }
        .tostes-dark-mode #box-help {
            background: #2c2c2c !important;
            border-color: #444 !important;
        }
    `;
    document.head.appendChild(style);
    applyDarkMode();

    // ==================== PROFILE PICTURE CUSTOMIZATION ====================
    const header = document.getElementsByClassName("box-site-nav-func")[0];
    const profPics = document.getElementsByClassName("user-avatar");
    const currentElem = document.getElementsByClassName("user-nav-current-user")[0];
    const initElem = document.getElementsByClassName("lk-profile-settings")[0];
    const body = document.body;

    // Load saved images
    let imgs = [];
    let currentImg = null;
    if (localStorage.getItem("imgs") !== null) {
        imgs = JSON.parse(localStorage.getItem("imgs"));
    }
    if (localStorage.getItem("currImg") !== null) {
        setImg(localStorage.getItem("currImg"));
    }

    // Style current user element
    if (currentElem) currentElem.style = "display:flex;align-items:center;";

    // Add file upload input
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "image/jpeg,image/png,image/gif";
    fileInput.style = `
        width: 200px;
        border: 0.5px solid lightgrey;
        border-radius: 5px;
        padding: 5px;
        margin: 10px;
        background: white;
        cursor: pointer;
    `;
    fileInput.title = "Upload a local image (stored as data URL)";

    // URL input field
    const urlInput = document.createElement("input");
    urlInput.style = `
        width: 200px;
        border: 0.5px solid lightgrey;
        box-shadow: 0.5px 0.5px 0.5px grey;
        border-radius: 5px;
        padding: 5px;
        padding-left: 6px;
        color: grey;
        outline: none;
        margin: 10px;
        transition: 0.6s;
    `;
    urlInput.placeholder = "Add Profile Picture URL...";
    urlInput.addEventListener("blur", function() {
        this.style.letterSpacing = "0px";
        this.style.color = "grey";
        this.style.border = "0.5px solid lightgrey";
        this.style.boxShadow = "0.5px 0.5px 0.5px grey";
        if (!this.value.trim().length) this.value = "";
    });
    urlInput.addEventListener("focus", function() {
        this.style.letterSpacing = "1px";
        this.style.color = "#00affa";
        this.style.border = "1px solid #00affa";
        this.style.boxShadow = "0.5px 0.5px 0.5px #00affa";
        if (!this.value.trim().length) this.value = "";
    });
    urlInput.addEventListener("keyup", function(evt) {
        if (evt.keyCode === 13 && urlInput.value.trim().length) {
            filterURL(urlInput.value);
        }
    });

    // File upload handler
    fileInput.addEventListener("change", function(e) {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = function(event) {
            const dataURL = event.target.result;
            // compress large images? optional: we'll just store as is
            saveImg(dataURL);
            fileInput.value = ""; // reset so same file can be re-uploaded
        };
        reader.readAsDataURL(file);
    });

    // Append inputs only if profile pics exist
    if (profPics.length) {
        header.append(urlInput);
        header.append(fileInput);
    }

    // Override the init text
    if (initElem) {
        initElem.innerText = "Profile, Settings, & Customization";
    }

    // Open the settings panel
    if (initElem) {
        initElem.addEventListener("click", function() {
            setTimeout(() => {
                const imgsBox = document.getElementsByClassName("noborder nobkrnd spacertop")[0];
                if (!imgsBox) return;
                imgsBox.innerHTML = `<h1 style="font-size:20px;">IXL ModZ By GSRHackZ</h1><br>`;
                imgsBox.style = "width:100%;height:auto;padding:5px;padding-top:25px;text-align:center;";

                // Dark mode toggle
                const darkToggle = document.createElement("div");
                darkToggle.style = "margin:10px auto; text-align:center;";
                darkToggle.innerHTML = `
                    <label style="cursor:pointer;">
                        <input type="checkbox" id="darkModeToggle" ${CONFIG.darkMode ? 'checked' : ''}> Dark Mode
                    </label>
                `;
                imgsBox.appendChild(darkToggle);
                const darkCheck = document.getElementById("darkModeToggle");
                if (darkCheck) {
                    darkCheck.addEventListener("change", function(e) {
                        CONFIG.darkMode = e.target.checked;
                        saveSettings();
                        applyDarkMode();
                    });
                }

                // Help button position selector
                const posSelect = document.createElement("div");
                posSelect.style = "margin:10px auto; text-align:center;";
                posSelect.innerHTML = `
                    <label>Help button position:
                        <select id="helpPosSelect">
                            <option value="right" ${CONFIG.helpButtonPos === 'right' ? 'selected' : ''}>Right</option>
                            <option value="left" ${CONFIG.helpButtonPos === 'left' ? 'selected' : ''}>Left</option>
                        </select>
                    </label>
                `;
                imgsBox.appendChild(posSelect);
                const posSelectElem = document.getElementById("helpPosSelect");
                if (posSelectElem) {
                    posSelectElem.addEventListener("change", function(e) {
                        CONFIG.helpButtonPos = e.target.value;
                        saveSettings();
                        // reposition help button if it exists
                        const helpBtn = document.getElementById("help-btn");
                        if (helpBtn && helpBtn.parentElement) {
                            helpBtn.parentElement.style.justifyContent = CONFIG.helpButtonPos === 'right' ? 'flex-end' : 'flex-start';
                        }
                    });
                }

                // Display saved images
                if (imgs.length) {
                    const grid = document.createElement("div");
                    grid.style = "display:flex;flex-wrap:wrap;justify-content:center;gap:15px;margin-top:15px;";
                    imgs.forEach((imgSrc, idx) => {
                        const card = document.createElement("div");
                        card.style = `
                            width:100px;
                            height:100px;
                            border-radius:50%;
                            overflow:hidden;
                            display:flex;
                            align-items:center;
                            justify-content:center;
                            cursor:pointer;
                            transition:0.3s;
                            position:relative;
                            border:2px solid ${currentImg === imgSrc ? '#00ff00' : 'transparent'};
                        `;
                        const imgEl = document.createElement("img");
                        imgEl.src = imgSrc;
                        imgEl.style = "width:100%;height:100%;object-fit:cover;";
                        card.appendChild(imgEl);

                        // Delete button
                        const delBtn = document.createElement("button");
                        delBtn.innerText = "✖";
                        delBtn.style = `
                            position:absolute;
                            top:-5px;
                            right:-5px;
                            background:red;
                            color:white;
                            border:none;
                            border-radius:50%;
                            width:22px;
                            height:22px;
                            font-size:12px;
                            cursor:pointer;
                            display:flex;
                            align-items:center;
                            justify-content:center;
                            z-index:2;
                        `;
                        delBtn.addEventListener("click", (e) => {
                            e.stopPropagation();
                            imgs.splice(idx, 1);
                            localStorage.setItem("imgs", JSON.stringify(imgs));
                            if (currentImg === imgSrc) {
                                // if current image was deleted, remove profile pic
                                setImg("");
                            }
                            // re-render grid
                            initElem.click(); // refresh panel
                        });
                        card.appendChild(delBtn);
                        card.addEventListener("click", () => setImg(imgSrc));
                        grid.appendChild(card);
                    });
                    imgsBox.appendChild(grid);
                } else {
                    const emptyMsg = document.createElement("p");
                    emptyMsg.innerText = "Saved images will appear here. You have no images. Please save some.";
                    imgsBox.appendChild(emptyMsg);
                }

                // Reset all button
                if (!document.querySelector(".resetImgs")) {
                    const resetBtn = document.createElement("button");
                    resetBtn.className = "resetImgs";
                    resetBtn.innerText = "Reset All 🗑";
                    resetBtn.style = `
                        font-size:15px;
                        padding:0.46em 1.5em 0.54em;
                        min-width:135px;
                        box-sizing:border-box;
                        border:none transparent;
                        text-decoration:none;
                        background:red;
                        color:white;
                        border-radius:5px;
                        cursor:pointer;
                        margin:20px auto;
                        display:block;
                    `;
                    resetBtn.addEventListener("click", function() {
                        if (confirm("This will remove all your saved images. Click ok to continue.")) {
                            localStorage.removeItem("imgs");
                            localStorage.removeItem("currImg");
                            location.reload();
                        }
                    });
                    imgsBox.appendChild(resetBtn);
                }
            }, 450);
        });
    }

    // Helper functions
    function filterURL(url) {
        const testImg = new Image();
        testImg.onload = function() {
            saveImg(url);
            urlInput.value = "";
        };
        testImg.onerror = function() {
            console.clear();
            alert("Invalid image URL or IXL blocked it. Please use a direct image link (e.g., from Google Images).");
            urlInput.value = "";
        };
        testImg.src = url;
    }

    function saveImg(src) {
        if (!imgs.includes(src)) {
            imgs.push(src);
            localStorage.setItem("imgs", JSON.stringify(imgs));
        }
        setImg(src);
    }

    function setImg(src) {
        for (let i = 0; i < profPics.length - 1; i++) {
            if (src && src.trim()) {
                profPics[i].src = src;
                profPics[i].style = "margin-top:-3px;border-radius:50%;display:flex;justify-content:center;align-items:center;width:45px;height:45px;";
            } else {
                // revert to default? we leave empty
            }
        }
        currentImg = src;
        if (src) localStorage.setItem("currImg", src);
        else localStorage.removeItem("currImg");
    }

    // ==================== HELP BUTTON (Lesson Page) ====================
    const checkElem = document.getElementsByClassName("take-a-break")[0];
    if (checkElem) {
        const lessonElem = document.getElementsByClassName("breadcrumb-skill-name")[0];
        const lessonText = lessonElem ? lessonElem.innerText : "";
        checkElem.innerHTML = `<button id="help-btn" style="border:1px solid #7ebb00;width:55px;padding:5px;opacity:56%;outline:none;border-radius:100px;transition:.6s;">Help</button>`;
        const helpBtn = document.getElementById("help-btn");

        // Position the button according to user preference
        if (helpBtn) {
            helpBtn.parentElement.style.display = "flex";
            helpBtn.parentElement.style.justifyContent = CONFIG.helpButtonPos === 'right' ? 'flex-end' : 'flex-start';
        }

        let isHelpOpen = false;
        helpBtn.addEventListener("click", function() {
            if (!isHelpOpen) {
                this.innerText = "Close";
                isHelpOpen = true;
                const box = document.createElement("div");
                box.id = "box-help";
                box.style = `
                    background:white;
                    display:flex;
                    flex-direction:column;
                    align-items:center;
                    justify-content:center;
                    position:absolute;
                    z-index:5;
                    width:240px;
                    padding:10px;
                    border:1px solid lightgray;
                    border-radius:10px;
                    right:0;
                    margin-top:175px;
                    margin-right:50px;
                `;
                if (CONFIG.helpButtonPos === 'left') {
                    box.style.right = "auto";
                    box.style.left = "0";
                    box.style.marginLeft = "50px";
                }
                document.body.appendChild(box);
                box.innerHTML = CONFIG.searchEngines.map(engine => `
                    <a style="outline:none;border:none;margin:8px;" target="_Blank" href="${engine.url + encodeURIComponent(lessonText)}">
                        <img style="height:80px;object-fit:contain;" title="${engine.name}" src="${engine.img}" alt="${engine.name}"/>
                    </a>
                `).join('');
            } else {
                isHelpOpen = false;
                this.innerText = "Help";
                const existing = document.getElementById("box-help");
                if (existing) existing.remove();
            }
        });
    }
})();

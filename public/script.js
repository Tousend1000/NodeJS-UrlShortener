let currentPage = 1;
let hasShortenedLink = false;

function showMessage(message, type, duration) {
    if (!type) type = 'success';

    const deafultMsgBox = document.getElementById('default-msgbox');
    const newMsgBox = deafultMsgBox.cloneNode();

    deafultMsgBox.parentElement.insertBefore(newMsgBox, deafultMsgBox.nextSibling);

    newMsgBox.hidden = false;

    newMsgBox.innerHTML = message;
    newMsgBox.classList.add(type);
    newMsgBox.classList.remove('hidden');

    setTimeout(() => {
        newMsgBox.classList.add('hidden');
        setTimeout(() => {
            newMsgBox.remove();
        }, 600);
    }, duration*1000);
}

function switchToPage(page) {
    const page1 = document.getElementById('container-page1');
    const page2 = document.getElementById('container-page2');
    const page3 = document.getElementById('container-page3');

    const buttonRight = document.getElementById('btn-right');
    const buttonLeft = document.getElementById('btn-left');
    
    const urlInput = document.getElementById('url-input');
    const aliasInput = document.getElementById('alias-input');

    switch (page) {
        case 3:
            page3.style.left = "0%";
            page2.style.left = "-100%";
            page1.style.left = "-200%";
            buttonLeft.disabled = false;
            buttonLeft.classList.remove('btn-disabled');
            buttonRight.disabled = true;
            buttonRight.classList.add('btn-disabled');
            return
        case 2:
            page3.style.left = "100%";
            page2.style.left = "0%";
            page1.style.left = "-100%";
            buttonLeft.disabled = false;
            buttonLeft.classList.remove('btn-disabled');
            if (aliasInput.value) {
                buttonRight.disabled = false;
                buttonRight.classList.remove('btn-disabled');
            } else {
                buttonRight.disabled = true;
                buttonRight.classList.add('btn-disabled');
            }
            return
        default:  // Page 1
            page3.style.left = "200%";
            page2.style.left = "100%";
            page1.style.left = "0%";
            buttonLeft.disabled = true;
            buttonLeft.classList.add('btn-disabled');
            try {
                new URL(urlInput.value);
                buttonRight.disabled = false;
                buttonRight.classList.remove('btn-disabled');
            } catch (error) {
                buttonRight.disabled = true;
                buttonRight.classList.add('btn-disabled');
            }
    }
}

function enableButtons() {
    const buttonRight = document.getElementById('btn-right');
    const buttonLeft = document.getElementById('btn-left');

    buttonLeft.disabled = false;
    buttonLeft.classList.remove('btn-disabled');
    buttonRight.disabled = false;
    buttonRight.classList.remove('btn-disabled');
}

function shortenURL() {
    const redirectUrl = document.getElementById('url-input').value;
    const alias = document.getElementById('alias-input').value;

    fetch('/api/v1/shortener/shorten', {
        method: 'POST',
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            redirectUrl: redirectUrl,
            alias: alias,
        }),
    })
        .then(async response => {
            if (!response.ok) {
                let message = 'An unknown error occurred. Please try again later.';
                try {
                    const errorData = await response.json();
                    if (errorData.error) message = errorData.error;
                } catch {}
                showMessage(message, 'error', 3);
                enableButtons();
            }
            return response.json();
        })
        .then(data => {
            if (!data.success) {
                showMessage(data.error, 'error', 3);
                enableButtons();
                throw new Error('User input error.');
            }

            hasShortenedLink = true;

            // Render third page
            const finalAliasSpan = document.getElementById('final-alias');
            finalAliasSpan.innerHTML = alias;

            const trackingCodeSpan = document.getElementById('tracking-code');
            trackingCodeSpan.innerHTML = data.trackingCode;

            const buttonLeft = document.getElementById('btn-left');

            buttonLeft.disabled = false;
            buttonLeft.classList.remove('btn-disabled');

            switchToPage(3);
        });
}

addEventListener('DOMContentLoaded', event => {
    setTimeout(() => {
        // "Preload" page to ensure smooth transition
        switchToPage(2);
        switchToPage(1);
        switchToPage(3);
        document.querySelectorAll('.container-page').forEach(p => p.style.transition = 'all 0.5s');
    }, 50);
    const currentUrlContainers = document.getElementsByClassName('current-url');
    
    Array.from(currentUrlContainers).forEach(element => {
        element.innerHTML = document.location;
    });

    // Button pages
    const buttonRight = document.getElementById('btn-right');
    const buttonLeft = document.getElementById('btn-left');

    function nextPage() {
        currentPage += 1;
        if (currentPage > 3) currentPage = 3; 
        
        if (currentPage === 3 && !hasShortenedLink) {
            buttonRight.disabled = true;
            buttonLeft.disabled = true;
            shortenURL();
            return
        }

        switchToPage(currentPage);
    }

    buttonRight.addEventListener('click', event => nextPage());

    buttonLeft.addEventListener('click', event => {
        currentPage -= 1;
        if (currentPage < 1) {
            currentPage = 1;
        }
        switchToPage(currentPage);
    });

    // Page 1
    const urlInput = document.getElementById('url-input');

    urlInput.addEventListener('input', event => {
        const value = urlInput.value;
        try { 
            new URL(value);
            buttonLeft.disabled = true;
            buttonLeft.classList.add('btn-disabled');
            buttonRight.disabled = false;
            buttonRight.classList.remove('btn-disabled');
        }
        catch (error) {
            buttonLeft.disabled = true;
            buttonLeft.classList.add('btn-disabled');
            buttonRight.disabled = true;
            buttonRight.classList.add('btn-disabled');
        }
    });

    urlInput.addEventListener('keyup', event => {
        if (!(event.key == 'Enter')) return;
        const value = urlInput.value;
        try {
            new URL(value);
            nextPage();
        } catch (error) {}
    });

    // Page 2
    const aliasInput = document.getElementById('alias-input');

    aliasInput.addEventListener('input', event => {
        const value = aliasInput.value;
        if (value) {
            buttonRight.disabled = false;
            buttonRight.classList.remove('btn-disabled');
        } else {
            buttonRight.disabled = true;
            buttonRight.classList.add('btn-disabled');
        }
    });

    aliasInput.addEventListener('keyup', event => {
        if (!(event.key == 'Enter')) return;
        const value = aliasInput.value;
        if (value) {
            nextPage();
        }
    });


    // Selectable
    document.querySelectorAll('.selectable').forEach(el => {
        el.addEventListener('click', e => {
            const range = document.createRange();
            range.selectNodeContents(el);
            const sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(range);

            // Copy to clipboard
            try {
                document.execCommand('copy');
                alert('Successfully copied link to clipboard!');
            } catch {}
        });
    });

});
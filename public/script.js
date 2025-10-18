let currentPage = 1;

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

function shortenURL() {
    // TODO: Add logic that posts link to server.
    // TODO: Add on error switch to that page and send popup.
    // TODO: Add logic that renders third page and switches to it.
    // TODO: Make all buttons disabled after switching.
    // TODO: Reenable buttons on error.
}

addEventListener('DOMContentLoaded', event => {
    setTimeout(() => {
        // "Preload" page to ensure smooth transition
        switchToPage(2);
        switchToPage(1);
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
        if (currentPage > 3) {
            currentPage = 3;
        } else if (currentPage === 3) {
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
            buttonLeft.classList.add('btn-disabled')
            buttonRight.disabled = false;
            buttonRight.classList.remove('btn-disabled')
        }
        catch (error) {
            buttonLeft.disabled = true;
            buttonLeft.classList.add('btn-disabled')
            buttonRight.disabled = true;
            buttonRight.classList.add('btn-disabled')
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
            buttonRight.classList.remove('btn-disabled')
        } else {
            buttonRight.disabled = true;
            buttonRight.classList.add('btn-disabled')
        }
    });

    aliasInput.addEventListener('keyup', event => {
        if (!(event.key == 'Enter')) return;
        const value = aliasInput.value;
        if (value) {
            nextPage();
        }
    });
});
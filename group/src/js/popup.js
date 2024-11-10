function init_main() {
    chrome.storage.sync.get(null, function (data) {
        console.log(data)
    });
}

document.addEventListener('DOMContentLoaded', init_main);
let status = document.getElementById('status');
let reverseAll = document.getElementById('reverseAll');
let reverseSelected = document.getElementById('reverseSelected');
let sortByDomainAndName = document.getElementById('sortByDomainAndName');
let fetchUrls = document.getElementById('fetchUrls');
let copiedUrls = document.getElementById('copiedUrls');
let copyUrls = document.getElementById('copyUrls');
let fetchNCopyUrls = document.getElementById('fetchNCopyUrls');
let fetchNCopyUrlsNTitles = document.getElementById('fetchNCopyUrlsNTitles');
let fetchNCopyThisUrl = document.getElementById('fetchNCopyThisUrl');
let fetchNCopyThisUrlNTitle = document.getElementById('fetchNCopyThisUrlNTitle');
let fetchNCopySelectedTabsUrls = document.getElementById('fetchNCopySelectedTabsUrls');
let fetchNCopySelectedTabsUrlNTitles = document.getElementById('fetchNCopySelectedTabsUrlNTitles');

function fetchTabUrls(currTab, withTitle) {
    return new Promise(function(resolve, reject) {
        try {
            chrome.tabs.query({active:currTab, currentWindow: true}, tabs => {
                // console.log(tabs.length);
                var urls = "";
                for (var idx = 0; idx < tabs.length; idx++) {
                    // console.log(typeof tabs[idx] + ":" + JSON.stringify(tabs[idx]));
                    if (withTitle) urls += tabs[idx].title + "\n";
                    urls += tabs[idx].url + "\n";
                }

                // alert(urls);
                copiedUrls.value = urls;
                status.innerText = `Copied ${tabs.length} tabs`;

                resolve(tabs.length);
            });
        } catch (error) {
            reject(error);
        }
    });
}

fetchUrls.onclick = function(element) {
    // console.log('hello from popup');
    fetchTabUrls(false, false).then(tCount => {
        var buttonText = copyUrls.innerText;
        buttonText += "(" + tCount + ")";
        copyUrls.innerText = buttonText;
    }, err => console.log(err));
};

function copyToClipboard() {
    copiedUrls.select();
    document.execCommand('Copy');
}

function log(text) {
    status.innerText += text;
}

copyUrls.onclick = function(element) {
    copyToClipboard();
};

fetchNCopyUrls.onclick = function(element) {
    fetchTabUrls(false, false).then(tCount => copyToClipboard());
};

fetchNCopyUrlsNTitles.onclick = function(element) {
    fetchTabUrls(false, true).then(tCount => copyToClipboard());
};

fetchNCopyThisUrl.onclick = function(element) {
    fetchTabUrls(true, false).then(tCount => copyToClipboard());
};

fetchNCopyThisUrlNTitle.onclick = function(element) {
    fetchTabUrls(true, true).then(tCount => copyToClipboard());
};

fetchNCopySelectedTabsUrls.onclick = function(element) {
    fetchSelectedTabUrls(false).then(tCount => copyToClipboard());
};

fetchNCopySelectedTabsUrlNTitles.onclick = function(element) {
    fetchSelectedTabUrls(true).then(tCount => copyToClipboard());
};

function fetchSelectedTabUrls(withTitle) {
    return new Promise(function(resolve, reject) {
        try {
            chrome.tabs.query({highlighted: true, currentWindow: true}, tabs => {
                var urls = "";
                for (var idx = 0; idx < tabs.length; idx++) {
                    // log(typeof tabs[idx] + ":" + JSON.stringify(tabs[idx]));
                    if (withTitle) urls += tabs[idx].title + "\n";
                    urls += tabs[idx].url + "\n";
                }

                copiedUrls.value = urls;
                status.innerText = `Copied ${tabs.length} tabs`;

                resolve(tabs.length);
            });
        } catch (error) {
            reject(error);
        }
    });
}

function reverseAllTabs() {
    return new Promise(
        function(resolve, reject) {
            try {
                chrome.tabs.query({currentWindow: true}, tabs => {
                    var tabsCount = tabs.length;
                    // log(`[Total ${tabsCount} tabs found]`);

                    for (var i = tabsCount - 1; i >= 0; i--) {
                        var tabId = tabs[i].id;
                        var newTabPos = tabsCount;
                        // log(`[moving tab ${tabId} to position ${newTabPos}]`);

                        chrome.tabs.move(tabId, {index: newTabPos}, (tabs) => {
                            // log("[Done]");
                        });
                    }

                    resolve(tabsCount);
                });
            } catch(error) {
                reject(error);
            }
        }
    );
}

function reverseSelectedTabs() {
    return new Promise(function(resolve, reject) {
        try {
            chrome.tabs.query({highlighted: true}, tabs => {
                var tabsCount = tabs.length;
                // log(`[Total ${tabsCount} tabs found]`);
                var startPosn = tabs[0].index;

                for (var i = 0; i < tabsCount; i++) {
                    var tabId = tabs[i].id;
                    var tabUrl = tabs[i].url;
                    // log(`[${i} = ${tabUrl}]`);
                    // log(`[moving tab ${tabUrl} to position ${startPosn}]`);

                    chrome.tabs.move(tabId, { index : startPosn}, (tabs) => {
                        // log("[Done]");
                    });
                }

                resolve(tabsCount);
            });
        } catch (error) {
            reject(error);
        }
    });
}

function sortTabsByDomainAndName() {
    return new Promise(function(resolve, reject) {
        try {
            chrome.tabs.query({currentWindow: true}, tabs => {
                var tc = tabs.length;

                const m = {};
                for (var i = 0; i < tc; i++) {
                    var tab = tabs[i];
                    var tabId = tab.id;
                    var tabUrl = tab.url;
                    var tabTitle = tab.title;

                    var url = new URL(tabUrl);
                    var domain = url.hostname.replace('www.', '');
                    // log(`[${domain}]`);

                    m[domain] = m[domain] || [];
                    m[domain].push({id: tabId, title: tabTitle});
                }

                var ti = 0;
                for (domain in m) {
                    status.innerText += `[Moving ${domain}]`;
                    var tabsList = m[domain];
                    tabsList.sort((a, b) => a.title - b.title);

                    for (var i = 0; i < tabsList.length; i++) {
                        var tab = tabsList[i];
                        chrome.tabs.move(tab.id, {index: ti++}, (tabs) => {
                            // log("[Done]");
                        });
                    }
                }

                resolve(tc);
            });
        } catch(error) {
            reject(error);
        }
    });
}

reverseAll.onclick = function(e) {
    reverseAllTabs().then(tabsCount => {
        // status.innerText += `[Got back ${tabsCount} tabs]`;
    }, err => console.log(err));
};

reverseSelected.onclick = function(e) {
    // status.innerText += "[reverseSelected]";
    reverseSelectedTabs().then(tabsCount => {
        // status.innerText += `[Got back ${tabsCount} tabs]`;
    }, err => {
        console.log(err);
        // status.innerText += `[error: ${err}]`;
    })
}

sortByDomainAndName.onclick = function(e) {
    sortTabsByDomainAndName().then(tc => {
        // status.innertText += `[Got back ${tc} tabs]`;
    }, err => console.log(err));
}
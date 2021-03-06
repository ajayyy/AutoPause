"use strict";
var activeTab = null;
var sounds = []; // List of tab ids that have had audio
var options = {};

chrome.storage.sync.get("options", function(result) {
    if (typeof result["options"] === 'object' && result["options"] !== null) options = result["options"];
});

chrome.windows.onFocusChanged.addListener(id => {
    if (id === -1) return
    checkOrigin();
});

chrome.commands.onCommand.addListener(command => {
    switch (command) {
        case "gotoaudible":
            chrome.tabs.query({
                audible: true,
                active: false,
                currentWindow: true
            }, tab => {
                if (tab.length < 1) return
                chrome.tabs.update(tab[0].id, {
                    active: true
                });
            });
            return
        case "disableresume":
            toggleOption("disableresume");
            return
    }
});

function checkOrigin() {
    chrome.tabs.query({
        active: true,
        currentWindow: true
    }, tab => {
        if (tab.length !== 1 || tab[0].active === false || tab[0].id === undefined || tab[0].url === undefined) return
        activeTab = tab[0].id;
        var message = tab[0].audible;
        if (options.hasOwnProperty("disableresume")) {
            chrome.tabs.sendMessage(activeTab, null, sendHandler); // Only allow playback
            if (message === false) return
        } else {
            chrome.tabs.sendMessage(activeTab, false, sendHandler); // Resume when active
        }
        Broardcast(message, activeTab);
    });
}

function sendHandler() {
    var lastError = chrome.runtime.lastError;
}

chrome.tabs.onActivated.addListener(checkOrigin);

chrome.tabs.onRemoved.addListener(tabId => {
    sounds.splice(sounds.indexOf(tabId), 1);
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
    if (!changeInfo.hasOwnProperty("audible")) return // Bool that contains if audio is playing on tab
    if (changeInfo.audible && !sounds.includes(tabId)) {
        sounds.push(tabId);
    }
    if (options.hasOwnProperty("disableresume") && changeInfo.audible === false) return
    if (tabId === activeTab) Broardcast(changeInfo.audible, activeTab); // Tell the other tabs the state of the active tab
});

async function Broardcast(message, exclude = false) {
    sounds.forEach(id => { // Only for tabs that have had sound
        if (id === exclude) return
        chrome.tabs.sendMessage(id, message, sendHandler);
    });
};

function toggleOption(o) {
    if (options.hasOwnProperty(o)) {
        delete options[o];
    } else {
        options[o] = true;
    }
    return new Promise(resolve => {
        chrome.storage.sync.set({
            ["options"]: options
        }, function(result) {
            resolve(result);
        });
    });
}

"use strict";
var ActiveAudio = false;
var Elements = [];

chrome.runtime.onMessage.addListener(async (state) => {
    ActiveAudio = state; // React based on state of active tab
    Elements = Elements.filter(e => document.contains(e));
    (ActiveAudio) ? pause(): resume();
});

window.addEventListener('DOMContentLoaded', function(event) {
    // Adds content to DOM
    injectScript("WindowScript.js");
});

function injectScript(file_path) {
    var script = document.createElement('script');
    script.setAttribute('type', 'text/javascript');
    script.setAttribute('crossorigin', 'anonymous');
    script.setAttribute('src', chrome.runtime.getURL(file_path));
    document.head.appendChild(script);
}

window.addEventListener('play', function(event) {
    let src = event.srcElement;
    if (src instanceof HTMLMediaElement === true) {
        if (ActiveAudio) pauseElement(src);
        if (!Elements.includes(src)) Elements.push(src);
    }
}, true);

// Dont tell the media please
window.addEventListener('ratechange', function(event) {
    let src = event.srcElement;
    if (src instanceof HTMLMediaElement === true) {
        if (ActiveAudio && src.playbackRate === 0) {
            event.stopPropagation();
        }
    }
}, true);

function pauseElement(e) {
    e.wasVolume = e.volume;
    e.wasPlaybackRate = e.playbackRate;
    e.volume = 0;
    e.playbackRate = 0;
    e.wasPlaying = true;
}

async function pause() {
    Elements.forEach(e => {
        if (e.paused || e.playbackRate === 0) return;
        pauseElement(e);
    });
}

async function resume() {
    Elements.forEach(e => {
        if (!e.wasPlaying) return
        // Pause foreground media normaly
        if (ActiveAudio === null) e.pause();
        e.volume = e.wasVolume;
        e.playbackRate = e.wasPlaybackRate;
        e.wasPlaying = false;
    });
}

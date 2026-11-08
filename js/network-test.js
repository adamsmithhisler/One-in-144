/*
    Author: Adam Smithhisler
    Date: November 8, 2026
    Assignment: SDC260 Final Project - Week 5
    Purpose: Display connection details and remember the previous
             hosted-page launch time using a browser cookie.
*/

(function () {
    "use strict";

    const COOKIE_NAME = "oneIn144LastLaunch";
    const COOKIE_AGE_SECONDS = 30 * 24 * 60 * 60;

    // Read the saved launch time before recording the current visit.
    function getCookie(name) {
        const prefix = name + "=";
        const match = document.cookie.split(";").map(value => value.trim())
            .find(value => value.startsWith(prefix));
        return match ? decodeURIComponent(match.slice(prefix.length)) : null;
    }

    function saveLaunchTime(time) {
        document.cookie = COOKIE_NAME + "=" + encodeURIComponent(time) +
            "; max-age=" + COOKIE_AGE_SECONDS + "; SameSite=Lax";
    }

    function display(id, value) {
        const element = document.getElementById(id);
        if (element) element.textContent = value;
    }

    const protocol = window.location.protocol;
    const servedPage = protocol === "http:" || protocol === "https:";
    const host = window.location.hostname;
    const localServer = ["localhost", "127.0.0.1", "::1", "[::1]"].includes(host);

    if (!servedPage) {
        display("connectionStatus", "STATIC FILE MODE");
        display("connectionDescription", "This page was opened directly without a web server.");
        display("hostInfo", "Not available (static file)");
        display("portInfo", "No active communication port");
        display("protocolInfo", "FILE");
        display("lastLaunchInfo", "Open through Live Preview to record a launch.");
        return;
    }

    // Running over HTTP(S) indicates a hosted page; identify local preview separately.
    display("connectionStatus", localServer ? "LOCAL SERVER ACTIVE" : "HOSTED SITE ACTIVE");
    display("connectionDescription", localServer
        ? "The website is running through a local development server."
        : "The website is being served through a hosted web address.");
    display("hostInfo", host);
    display("portInfo", window.location.port || (protocol === "https:" ? "443 (default HTTPS)" : "80 (default HTTP)"));
    display("protocolInfo", protocol.slice(0, -1).toUpperCase());

    const previousLaunch = getCookie(COOKIE_NAME);
    display("lastLaunchInfo", previousLaunch || "First live launch. Refresh to see the previous launch time.");
    saveLaunchTime(new Date().toLocaleString());
})();

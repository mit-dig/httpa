function init() {
    var link = document.getElementById("option_page_link");
    link.onclick = function(evt) {
        var url = chrome.extension.getURL("options.html");
        chrome.tabs.create({
            url: url
        }, function(tab) {
            window.close();
        });
    };
};
window.addEventListener("load", init);

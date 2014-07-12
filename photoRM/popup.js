var Popup = function() {
    this.initialize();
};

Popup.prototype = {
    initialize: function() {
        this.imageInfo = null;
        this.tabTitle = null;
        this.tabUrl = null;
        this.deletedUrls = new Array();
        window.addEventListener("load", function(evt) {
            this.start();
        }.bind(this));
    },
    start: function() {
        this.assignMessages();
        this.assignEventHandlers();

        chrome.runtime.getBackgroundPage(function(bg) {
            bg.ic.getSelectedTabImageInfo(function(info, title, url) {
                this.onReceiveImageInfo(info, title, url);
            }.bind(this));
        }.bind(this));

    },
    assignMessages: function() {
        // var hash = {
        //     "btnSlideShow": "popupBtnSlideShow",
        // };
        // utils.setMessageResources(hash);
    },
    assignEventHandlers: function() {
    //    $("btnSlideShow").onclick = this.onClickSlideShow.bind(this);
        $("btnOption").onclick = this.onClickOption.bind(this);
    },
    onClickOption: function(evt) {
        var url = chrome.extension.getURL("options.html");
        chrome.tabs.create({
            url: url
        }, function(tab) {
            window.close();
        }.bind(this));
    },
    onReceiveImageInfo: function(info, title, url) {
        this.imageInfo = info;
        this.tabTitle = title;
        this.tabUrl = url;
        this.showInfo(info);
        this.setImages(info);
        this.createScript(function(script) {
            this.setSaveLink(script, title);
        }.bind(this));
    },
    showInfo: function(info) {
        $("image_count").innerHTML = info.urls.length + " images found";
    },
    createScript: function(callback) {
        chrome.runtime.getBackgroundPage(function(bg) {
            var template = bg.ic.getCommandTemplate();
            var urls = this.getFinalUrls();
            var script = "";
            urls.each(function(url) {
                var command = template.replace("$url", url);
                script += command + "\n";
            });
            callback(script);
        }.bind(this));
    },
    getFinalUrls: function() {
        var result = new Array();
        this.imageInfo.urls.each(function(url) {
            if (!this.deletedUrls.include(url)) {
                result.push(url);
            }
        }.bind(this));
        return result;
    },
    setImages: function(info) {
        var images = $("images");
        images.innerHTML = "";
        var div = this.createImageFunctionDiv(images);
        div.addClassName("image_function_top");
        this.appendGoto(div, "");
        var label = document.createElement("div");
        label.addClassName("label");
        var message = chrome.i18n.getMessage("popupGoToPageTop");
        label.appendChild(document.createTextNode(message));
        div.appendChild(label);
        var urls = info.urls;
        urls.each(function(url) {
            var parent = document.createElement("div");
            var link = document.createElement("a");
            link.href = url;
            link.target = "_blank";
            parent.appendChild(link);
            var img = document.createElement("img");
            img.src = url;
            img.addClassName("content");
            link.appendChild(img);
            parent.appendChild(document.createElement("br"));
            div = this.createImageFunctionDiv(parent);
            this.appendTwitter(div, url);
            this.appendFacebook(div, url);
            this.appendDelete(div, url, parent);
            this.appendGoto(div, url);
            parent.appendChild(div);
            images.appendChild(parent);
        }.bind(this));
    },
    createImageFunctionDiv: function(parent) {
        var div = document.createElement("div");
        div.addClassName("image_function");
        parent.appendChild(div);
        return div;
    },
    appendGoto: function(div, url) {
        var self = this;
        var img = document.createElement("img");
        img.setAttribute("src", "./goto.png");
        img.addClassName("goto");
        div.appendChild(img);
        img.onclick = function(url) {
            return function(evt) {
                chrome.runtime.getBackgroundPage(function(bg) {
                    bg.ic.goToImage(url);
                }.bind(this));
            }.bind(self);
        }.bind(this)(url);
    },
    appendDelete: function(div, url, parent) {
        var self = this;
        var img = document.createElement("img");
        img.setAttribute("src", "./delete.png");
        img.addClassName("delete");
        div.appendChild(img);
        img.onclick = function(url, div) {
            return function(evt) {
                Element.setStyle(div, {
                    display: "none"
                });
                this.deletedUrls.push(url);
                this.createScript(function(script) {
                    this.setSaveLink(script, this.tabTitle);
                }.bind(this));
            }.bind(self);
        }.bind(this)(url, parent);
    },
    appendTwitter: function(parent, url) {
        var self = this;
        var img = document.createElement("img");
        img.setAttribute("src", "./twitter.png");
        parent.appendChild(img);
        img.onclick = function(url) {
            return function(evt) {
                this.openTweetWindow(url);
            }.bind(self);
        }.bind(this)(url);
    },
    openTweetWindow: function(url) {
        window.open(
            "https://twitter.com/share?url="
                + encodeURIComponent(url),
            "_blank",
            "width=550,height=450");
    },
    appendFacebook: function(parent, url) {
        var self = this;
        var img = document.createElement("img");
        img.setAttribute("src", "./facebook_16.png");
        parent.appendChild(img);
        img.onclick = function(url) {
            return function(evt) {
                this.openFacebookWindow(url);
            }.bind(self);
        }.bind(this)(url);
    },
    openFacebookWindow: function(url) {
        var link = "http://www.facebook.com/sharer/sharer.php?u="
            + encodeURIComponent(url);
        window.open(
            link,
            "_blank",
            "width=680,height=360");
    },
    setSaveLink: function(script, title) {
        chrome.runtime.getBackgroundPage(function(bg) {
            var blob = new Blob([script], {type: "octet/stream"});
            var a = document.getElementById("ics_script_link");
            if (a) {
                $("command_pane").removeChild(a);
            }
            a = document.createElement("a");
            a.id = "ics_script_link";
            a.href = window.webkitURL.createObjectURL(blob);
            var filename = bg.ic.getDownloadFilename();
            filename = filename.replace("$tabname", title);
            a.download = filename;
            a.onclick = function(evt) {
                _gaq.push(['_trackEvent', 'Popup', 'Script']);
                var message = chrome.i18n.getMessage("popupSavedFile");
                this.showMessage(message);
                return true;
            }.bind(this);
            var label = chrome.i18n.getMessage("popupBtnSave");
            a.appendChild(document.createTextNode(label));
            $("command_pane").appendChild(a);
        }.bind(this));
    },
    showMessage: function(message) {
        $("message").innerHTML = message;
        setTimeout(function() {
            this.showMessage("");
        }.bind(this), 5000);
    },
    onClickSlideShow: function(evt) {
        chrome.runtime.getBackgroundPage(function(bg) {
            bg.ic.startSlideShow(function() {
                window.close();
            });
        }.bind(this));
    }
};

var popup = new Popup();

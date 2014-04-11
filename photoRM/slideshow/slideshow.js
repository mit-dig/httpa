var SlideShow = function() {
    this.initialize();
};

SlideShow.prototype = {
    initialize: function() {
        this.loadedImageCount = 0;
        this.assignEventHandlers();
    },
    getClientSize: function() {
        this.baseWidth = document.documentElement.clientWidth - 140;
        this.baseHeight = document.documentElement.clientHeight - 180;
    },
    assignEventHandlers: function() {
        $(document).ready($.proxy(function() {
            this.getClientSize();
            this.loadImages();
        }, this));
    },
    loadImages: function() {
        chrome.runtime.getBackgroundPage(function(bg) {
            var qs = this.getQueryStrings();
            var tabId = qs["tab_id"];
            var info = bg.ic.getTabImageInfo(tabId);
            this.createImages(info);
        }.bind(this));
    },
    createImages: function(info) {
        var imageCount = info.urls.length;
        $.each(info.urls, $.proxy(function(index, url) {
            var showcaseSlide = $("<div/>").addClass("showcase-slide");
            var showcaseContent = $("<div/>")
                .addClass("showcase-content")
                .appendTo(showcaseSlide);
            var showcaseThumbnail = $("<div/>")
                .addClass("showcase-thumbnail")
                .appendTo(showcaseSlide);
            var img = new Image();
            img.onload = $.proxy(function(evt) {
                this.onLoadImage(evt.target, imageCount);
            }, this);
            $(img).attr("src", url).appendTo(showcaseContent);
            var thumbnail = new Image();
            $(thumbnail).attr("src", url)
                .attr("width", "118px")
                .attr("height", "92px")
                .appendTo(showcaseThumbnail);
            $("#showcase").append(showcaseSlide);
        }, this));
    },
    onLoadImage: function(img, imageCount) {
        var imgWidth = img.naturalWidth;
        var imgHeight = img.naturalHeight;
        var rate = Math.max(imgWidth / this.baseWidth, imgHeight / this.baseHeight);
        $(img).attr("width", Math.min(imgWidth / rate, imgWidth));
        $(img).attr("height", Math.min(imgHeight / rate, imgHeight));
        this.loadedImageCount++;
        if (this.loadedImageCount >= imageCount) {
            this.start();
        }
    },
    start: function() {
        $("#showcase").awShowcase({
            content_width: this.baseWidth,
            content_height: this.baseHeight,
            fit_to_parent: false,
            auto: true,
            interval: 3000,
            continuous: true,
            keybord_keys: true,
            dynamic_height: false,
            arrows: true,
            buttons: false,
            loading: true,

            thumbnails: true,
            thumbnails_position: "outside-last",
            thumbnails_direction: "horizontal",
            thumbnails_slidex: 0
        });
    },
    getQueryStrings: function() {
        var vars = [], hash;
        var hashes = location.href.slice(
            window.location.href.indexOf('?') + 1).split('&');
        for (var i = 0; i < hashes.length; i++) {
            hash = hashes[i].split('=');
            vars.push(hash[0]);
            vars[hash[0]] = hash[1];
        }
        return vars;
    }
};

var slideShow = new SlideShow();

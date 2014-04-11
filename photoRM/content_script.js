if (typeof CS == "undefined") {
    CS = function() {
        this.initialize();
    };

    CS.prototype = {
        initialize: function() {
            this.targetImageUrls = new Array();
            this.isHoverZoom = false;
        },
        start: function() {
            this.fetchAndSendImages();
            chrome.extension.onMessage.addListener(
                this.hitch(function(message, sender) {
                    this.onReceiveMessage(message, sender);
                })
            );
        },
        onReceiveMessage: function(message, sender) {
            var operation = message.operation;
            if (operation == "download_local") {
                var container = document.getElementById("ics_container");
                if (!container) {
                    container = document.createElement("div");
                    container.id = "ics_container";
                    container.style.display = "none";
                    document.body.appendChild(container);
                }
                for (var i = 0; i < message.images.length; i++) {
                    var url = message.images[i];
                    var link = document.createElement("a");
                    link.href = url;
                    link.download = "";
                    container.appendChild(link);
                    link.click();
                }
                document.body.removeChild(container);
            } else if (operation == "go_to_image") {
                var pos = message.pos;
                //alert(pos);
                window.scrollTo(-1, pos);
            } else if (operation == "preview_images") {

                var images = message.images;
                var position = message.position;
                var tabId = message.tabId;
                this.previewImages(images, position, tabId);
            } else if (operation == "reload_images") {
                this.fetchAndSendImages();
            } else if (operation == "store_target_images") {
                this.targetImageUrls = message.urls;
                this.isHoverZoom = message.isHoverZoom;
            }
            
        },
        fetchAndSendImages: function() {
            var images = this.getImages();
            this.sendImagesMessage(images);
        },
        getImages: function() {
            var imgs = document.getElementsByTagName("img");
            var images = new Array();
            for (var i = 0; i < imgs.length; i++) {
                if (imgs[i].dataset.ics) {
                    continue;
                }
                var imgSrc = imgs[i].src;
                var width = Math.max(imgs[i].width, imgs[i].naturalWidth);
                var height = Math.max(imgs[i].height, imgs[i].naturalHeight);
                var top = imgs[i].getBoundingClientRect().top;
                var url = imgSrc;
                var img = {
                    tag: "img",
                    url: imgSrc,
                    width: width,
                    height: height,
                    hasLink: false,
                    pos: top
                };
                var parent = imgs[i].parentNode;
                if (parent.nodeType == Node.ELEMENT_NODE
                    && parent.nodeName.toLowerCase() == "a") {
                    var href = parent.href;
                    if (href != imgSrc) {
                        images.push({
                            tag: "a",
                            url: href,
                            width: Number.MAX_VALUE,
                            height: Number.MAX_VALUE,
                            pos:top
                        });
                        img.hasLink = true;
                        url = href;
                    }
                }
                images.push(img);
                var eventHandlingTarget = img.hasLink ? parent : imgs[i];
                eventHandlingTarget.addEventListener(
                    "mouseover",
                    (function(self, imageUrl) {
                        return function(evt) {
                            if (evt.shiftKey) {
                                self.onMouseOverImg(imageUrl);
                            }
                        };
                    })(this, url),
                    false);
            }
            return images;
        },
        onMouseOverImg: function(url) {
            if (this.isHoverZoom && this.isTargetImage(url)) {
                var img = document.getElementById("ics_hover_zoom");
                if (img) {
                    document.body.removeChild(img);
                }
                var clientWidth = document.documentElement.clientWidth;
                var clientHeight = document.documentElement.clientHeight;
                img = document.createElement("img");
                img.id = "ics_hover_zoom";
                img.style.position = "fixed";
                img.style.border = "5px solid darkgray";
                img.addEventListener("load", this.hitch(function(evt) {
                    var imageWidth = Math.max(img.width, img.naturalWidth);
                    var imageHeight = Math.max(img.height, img.naturalHeight);
                    var rateWidth = clientWidth / imageWidth;
                    var rateHeight = clientHeight / imageHeight;
                    var rate = Math.min(rateWidth, rateHeight) * 0.95;
                    img.width = imageWidth * rate;
                    img.height = imageHeight * rate;
                    img.style.top = String((clientHeight - img.height) / 2) + "px";
                    img.style.left = String((clientWidth - img.width) / 2) + "px";
                }), false);
                img.src = url;
                document.body.appendChild(img);
                img.addEventListener("click", function(evt) {
                    document.body.removeChild(img);
                }, false);
            }
        },
        isTargetImage: function(url) {
            for (var i = 0; i < this.targetImageUrls.length; i++) {
                if (this.targetImageUrls[i] == url) {
                    return true;
                }
            }
            return false;
        },
        sendImagesMessage: function(images) {
            var message = {
                type: "parsed_images",
                images: images
            };
            chrome.extension.sendMessage(message);
        },
        previewImages: function(images, position, tabId) {
            var panel = this.createPreviewPanel(position);
            document.body.appendChild(panel);
            this.createPreviewClose(panel);
            this.createPreviewImages(images, panel, tabId);
            this.createPreviewModify(panel);
            this.createPreviewOption(panel);
        },
        createPreviewPanel: function(position) {
            var panel = document.getElementById("ics_preview_panel");
            if (panel) {
                panel.innerHTML = "";
            } else {
                //for standalone images, there is not preview panel previously defined
                panel = document.createElement("div");
                panel.id = "ics_preview_panel";
                panel.style.position = "fixed";
                panel.style.width = "200px";
                if (position.indexOf("top") != -1) {
                    panel.style.top = 0;
                }
                if (position.indexOf("bottom") != -1) {
                    panel.style.bottom = 0;
                }
                if (position.indexOf("left") != -1) {
                    panel.style.left = 0;
                }
                if (position.indexOf("right") != -1) {
                    panel.style.right = 0;
                }
                panel.style.overflow = "auto";
                panel.style.paddingBottom = "5px";
            }
            return panel;
        },
        createPreviewImages: function(images, panel, tabId) {
            var failedImageCount = 0;
            for (var i = 0; i < images.length; i++) {
                var img = document.createElement("img");
                img.src = images[i].url;
                img.style.width = "45px";
                img.style.marginLeft = "5px";
                img.style.marginRight = "5px";
                img.style.marginTop = "5px";
                img.style.cursor = "pointer";
                img.dataset.ics = "true";
                img.onclick = (function(image) {
                    return function(evt) {
                        var pos = image.pos;
                        window.scrollTo(-1, pos);
                    };
                })(images[i]);
                img.onerror = this.hitch((function(img) {
                    return function() {
                        panel.removeChild(img);
                        failedImageCount++;
                        if (failedImageCount >= images.length) {
                            document.body.removeChild(panel);
                            this.sendDisableButtonMessage(tabId);
                        }
                    }
                })(img));
                if (i == images.length - 1) {
                    img.onload = this.hitch(function() {
                        this.adjustPreviewPanelHeight(panel);
                    });
                }
                panel.appendChild(img);
            }
        },
        sendDisableButtonMessage: function(tabId) {
            var message = {
                type: "disable_button",
                tabId: tabId
            };
            chrome.extension.sendMessage(message);
        },
        sendDismissHotPreviewMessage: function() {
            var message = {
                type: "dismiss_hotpreview"
            };
            chrome.extension.sendMessage(message);
        },
        adjustPreviewPanelHeight: function(panel) {
            var clientHeight = document.documentElement.clientHeight;
            if (panel.clientHeight > (clientHeight / 2)) {
                panel.style.height = String(clientHeight / 2) + "px";
            }
        },
        createPreviewModify: function(panel) {
            var textinput = this.createTextInput();
            panel.appendChild(textinput);
            
            var modify = this.createLinkDiv("Modify");
            panel.appendChild(modify);
            
            modify.onclick = function(evt) {
                var changeText = document.getElementById('modifytext').value;

                document.body.innerHTML ='';
                document.body.appendChild(panel);
                var canvas = document.createElement('canvas');
                canvas.width = window.innerWidth;
                canvas.height = window.innerHeight;
                var ctx = canvas.getContext('2d');
                var imageObj = new Image();
                imageObj.onload = function() {
                    ctx.drawImage(imageObj, 0, 0);
                    ctx.fillStyle = "#FF0000";
                    ctx.font = "bold 16px Arial";
                    ctx.fillText(changeText,100, 100);
                };
                imageObj.src = document.URL;

                document.body.appendChild(canvas);
            };
        },
        createPreviewClose: function(panel) {
            var close = this.createLinkDiv("Hide");
            panel.appendChild(close);
            close.onclick = function(evt) {
                document.body.removeChild(panel);
            };
        },
        createPreviewOption: function(panel) {
            var option = this.createLinkDiv("Option");
            panel.appendChild(option);
            option.onclick = function(evt) {
                var url = chrome.extension.getURL("options.html");
                location.href = url;
            };
            var dismiss = this.createLinkDiv("Dismiss");
            panel.appendChild(dismiss);
            dismiss.onclick = this.hitch(function(evt) {
                this.sendDismissHotPreviewMessage();
                document.body.removeChild(panel);
            });
        },
        createLinkDiv: function(label) {
            var link = document.createElement("div");
            link.style.textAlign = "left";
            link.style.textDecoration = "underline";
            link.style.cursor = "pointer";
            link.style.fontSize = "14px";
            link.style.marginTop = "10px";
            link.appendChild(document.createTextNode(label));
            return link;
        }, 
        createTextInput: function() {
            var div = document.createElement("div");
            var text = document.createElement("input");
            text.id = "modifytext";
            text.type = "text";
            text.value = "Add modification text";
            div.appendChild(document.createElement("br"));
            div.appendChild(text);
            return div;
        },
        hitch: function(f) {
            var self = this;
            return function() {
                f.apply(self, arguments);
            };
        }
    };
}

var cs = new CS();
cs.start();

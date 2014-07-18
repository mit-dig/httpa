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
            //this.createPreviewImages(images, panel, tabId);
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
                panel.title = "HTTPA Modifications Dialog Box";

                //Other css

                panel.style.position = "fixed";
                panel.style.background = "#B0B0B0";
                panel.style.color = "black"
            
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
                panel.style.border = "2px solid";
                panel.style['border-radius'] = "25px";
                panel.style.padding = "25px";
                   
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

  
                var canvas;
                var ctx;
                var x = 75;
                var y = 50;
                var dx = 5;
                var dy = 3;
                var WIDTH = 400;
                var HEIGHT = 300;
                var dragok = false,
                    text = document.getElementById('modifytext').value,
                    textLength = (text.length * 14)/2;
                
                var imageObj = new Image();
                

                function rect(x,y,w,h) {
                    ctx.fillStyle = "#FF0000";
                    ctx.font = "bold 16px Arial";
                    ctx.fillText(text,x, y);
                
                }

                function clear() {
                    ctx.drawImage(imageObj, 0, 0);
                }

                function draw() {
                    clear();
                    rect(x - 15, y + 15, textLength, 30);
                }

                function myMove(e){
                    if (dragok){
                        x = e.pageX - canvas.offsetLeft;
                        y = e.pageY - canvas.offsetTop;
                    }
                }
                
                document.body.innerHTML ='';
                document.body.appendChild(panel);
                
                canvas = document.createElement('canvas');
                canvas.id = 'imageModifyCanvas';
                ctx = canvas.getContext('2d');
                
                imageObj.src = document.URL;

                imageObj.onload = function() {

                    canvas.width = imageObj.width;
                    canvas.height = imageObj.height;

                    ctx.drawImage(imageObj, 0, 0);
                    setInterval(draw, 10);
                };

                canvas.onmousedown = function(e){
                    if (e.pageX < x + textLength + canvas.offsetLeft && 
                        e.pageX > x - textLength + canvas.offsetLeft && 
                        e.pageY < y + 15 + canvas.offsetTop &&
                        e.pageY > y -15 + canvas.offsetTop){
                        x = e.pageX - canvas.offsetLeft;
                        y = e.pageY - canvas.offsetTop;
                        dragok = true;
                        canvas.onmousemove = myMove;
                    }
                }

                canvas.onmouseup = function (){
                    dragok = false;
                    canvas.onmousemove = null;
                }
    
                
                document.body.appendChild(canvas);
                
            };

            var setUsageRestrictions = this.createLinkDiv("Audit Resource");
            panel.appendChild(setUsageRestrictions);

            setUsageRestrictions.onclick = function(evt){

                var message = {
                    type: "audit",
                    resource: window.location.href,
                };
                chrome.extension.sendMessage(message);

            }


            var saveImage = this.createLinkDiv("Save Image");
            panel.appendChild(saveImage);
            
            getImageData = function(){
                var canvas = document.getElementById("imageModifyCanvas");


                // Convert that back to a dataURL
                var dataURL = canvas.toDataURL('image/png').replace("image/png", "image/octet-stream");;
                return dataURL.replace(/data:image\/png;base64,/, '');
            }   

            saveImage.onclick = function(evt){

                //window.location.href = getImageData(); 

                var canvas = document.getElementById("imageModifyCanvas");

                var link = document.createElement('a');
                link.download = "photorm.png";
                link.href = canvas.toDataURL("image/png").replace("image/png", "image/octet-stream");;
                link.click();


            }

            var uploadImage = this.createLinkDiv("Share on imgur.com");
            panel.appendChild(uploadImage);

            uploadImage.onclick = function (evt){

                var API_KEY = 'd702179326fa144';
                var xhr = new XMLHttpRequest();
                xhr.open('POST', 'http://api.imgur.com/2/upload.json?key=' + API_KEY, true); 
                xhr.setRequestHeader('Cache-Control', 'no-cache');
                xhr.onreadystatechange = function() {
                    if (this.readyState == 4) {
                        var response = JSON.parse(xhr.response);
              
                        // Check for error.
                        if (response.error) {
                            alert('Error: ' + response.error.message);
                            return;
                        }
              
                        // Retrieve the image url.
                        alert('Image URL: ' + response.upload.links.original);

                        var message = {
                            type: "updatePTN",
                            original: window.location.href,
                            derivative: response.upload.links.original,
                        };
                        chrome.extension.sendMessage(message);

                        }
                };
      
                // Get the base64 image using HTML5 Canvas.
                var canvas = document.getElementById("imageModifyCanvas");

                var image64 = canvas.toDataURL('image/jpeg', 0.9).split(',')[1];
      
                // Properly escape the contents of the image. And post it.
                var post_data =  unescape(encodeURIComponent(image64));
                xhr.send(post_data); 

            }



            var uploadImageImagehare = this.createLinkDiv("Share on imagehare.com");
            panel.appendChild(uploadImageImagehare);

            uploadImageImagehare.onclick = function (evt){


                var xhr = new XMLHttpRequest();
                
                xhr.open('POST', 'http://localhost:8080/upload', true); 
                
                xhr.setRequestHeader('usage_restrictions', 'http://usage_restrictions_abc');
                xhr.setRequestHeader('extension', 'true');

                xhr.onreadystatechange = function() {
                    if (this.readyState == 4) {
                        window.open(xhr.response);

                        }
                };
      
                // Get the base64 image using HTML5 Canvas.
                var canvas = document.getElementById("imageModifyCanvas");

                var image64 = canvas.toDataURL('image/png', 0.9).split(',')[1];

                var blobBin = atob(image64);
                var array = [];
                for(var i = 0; i < blobBin.length; i++) {
                    array.push(blobBin.charCodeAt(i));
                }
                var file=new Blob([new Uint8Array(array)], {type: 'image/png'});

                var formdata = new FormData();
                formdata.append("upload", file);

                xhr.send(formdata); 

            }

            
        },
        createPreviewClose: function(panel) {

            var title = document.createElement("span");
            title.appendChild(document.createTextNode("PhotoRM Extension "));
            //Todo: this image doesn't seem to work when in local file store
            // var img = document.createElement("img");
            // img.setAttribute("src", chrome.extension.getURL("images/close.png"));
            // img.setAttribute("height", "25px");
            var close = document.createElement("span");
            close.style.textAlign = "right";
            close.style.textDecoration = "underline";
            close.style.cursor = "pointer";
            close.style.fontSize = "14px";
            close.style.marginTop = "10px";
            close.title = "Close this dialog";
            close.appendChild(document.createTextNode(" close"));
            //close.appendChild(img);
            panel.appendChild(title);
            panel.appendChild(close);
            close.onclick = function(evt) {
                document.body.removeChild(panel);
            };
        },
        createPreviewOption: function(panel) {
            var option = this.createLinkDiv("Options");
            panel.appendChild(option);
            option.onclick = function(evt) {
                var url = chrome.extension.getURL("options.html");
                location.href = url;
            };
            var dismiss = this.createLinkDiv("Do not show this again");
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
            text.value = "Say something about this image";
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

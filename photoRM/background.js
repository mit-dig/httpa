var IC = function() {
    this.initialize();
};

//IC.SERVER_URL = "http://csail.mit.edu/";

IC.prototype = {
    initialize: function() {
        this.setupEventHandler();
        this.setupContextMenus();
        this.setupBookmark();

        getUserInfo(true);

        function xhrWithAuth(method, url, interactive, callback) {

            var access_token;

            var retry = true;

            getToken();

            function getToken() {
              chrome.identity.getAuthToken({ interactive: interactive }, function(token) {
                if (chrome.runtime.lastError) {
                  callback(chrome.runtime.lastError);
                  return;
                }

                access_token = token;

                requestStart();
              });
            }

            function requestStart() {
              var xhr = new XMLHttpRequest();
              xhr.open(method, url);
              xhr.setRequestHeader('Authorization', 'Bearer ' + access_token);
              xhr.onload = requestComplete;
              xhr.send();
            }

            function requestComplete() {
              if (this.status == 401 && retry) {
                retry = false;
                chrome.identity.removeCachedAuthToken({ token: access_token },
                                                      getToken);
              } else {
                callback(null, this.status, this.response);
              }
            }
        }


        function getUserInfo(interactive) {
            xhrWithAuth('GET',
                'https://www.googleapis.com/plus/v1/people/me',
                interactive,
                onUserInfoFetched);
        }

          // Code updating the user interface, when the user information has been
          // fetched or displaying the error.
          function onUserInfoFetched(error, status, response) {
            if (!error && status == 200) {
                var user_info = JSON.parse(response);
                //alert(user_info.url);
                // Save it using the Chrome extension storage API.
                chrome.storage.sync.set({'user': user_info}, function() {
                  // Notify that we saved.
                  console.log('Settings saved');

                });

              //alert(user_info.url);
            } else {
                alert("Error: " + JSON.stringify(error));
            }
          }

    },

    getServerUrl: function() {
        return IC.SERVER_URL;
    },

    setupEventHandler: function() {
        chrome.runtime.onStartup.addListener(function() {
            this.establishSession();
        }.bind(this));
        chrome.runtime.onInstalled.addListener(function(details) {
            this.establishSession(function() {
                if (details.reason == "install"
                   || (details.reason == "update"
                       && details.previousVersion == "6.5.0")) {
                    var url = chrome.extension.getURL("options.html");
                    chrome.tabs.create({
                        url: url
                    });
                }
            }.bind(this));
        }.bind(this));
        chrome.tabs.onUpdated.addListener(function(id, changeInfo, tab) {
            if (changeInfo.status == "complete") {
                this.onSelectionChanged(id);
            }
        }.bind(this));
        chrome.tabs.onRemoved.addListener(function(id, removeInfo) {
            this.deleteTabImageInfo(id);
        }.bind(this));
        chrome.extension.onMessage.addListener(
            function(message, sender, sendRequest) {
                this.onRequest(message, sender.tab, sendRequest);
            }.bind(this)
        );
        chrome.contextMenus.onClicked.addListener(function(info, tab) {
            this.onClickContextMenu(info, tab);
        }.bind(this));
        chrome.commands.onCommand.addListener(function(command) {
            console.log(command);
            if (command == "download_images") {
                this.onCommandDownloadImages();
            } else if (command == "slideshow_images") {
                this.onCommandSlideshowImages();
            }
        }.bind(this));
    },
    setupContextMenus: function() {
        chrome.contextMenus.create({
            id: "menuReloadImages",
            type: "normal",
            title: chrome.i18n.getMessage("menuReloadImages"),
            contexts: ["page"]
        });
    },
    onClickContextMenu: function(info, tab) {
        if (info.menuItemId == "menuReloadImages") {
            this.reloadImages(tab);
        }
    },
    establishSession: function(callback) {
        var url = this.getServerUrl() + "ajax/create_session";
        var token = this.getSessionToken();
        var params = {
            has_token: token != undefined
        };
        if (token) {
            params.token = token;
        }
        new Ajax.Request(url, {
            method: "post",
            parameters: params,
            onSuccess: function(req) {
                this.onReceiveEstablishSession(req);
                if (callback) {
                    callback.call();
                }
            }.bind(this),
            onFailure: function(req) {
                console.log(req);
            }.bind(this)
        });
    },
    onReceiveEstablishSession: function(req) {
        var result = req.responseJSON.result;
        var token = result.token;
        localStorage["session_token"] = token;
    },
    getSessionToken: function() {
        return localStorage["session_token"];
    },
    onRequest: function(message, tab, sendRequest) {
        if (message.type == "parsed_images") {
            var filteredImages = this.filterUrls(message.images);
            var urls = filteredImages.collect(function(image) {
                return image.url;
            });
            if (urls.length > 0) {
                this.setTabImageInfo(tab.id, {
                    urls: urls,
                    images: message.images,
                    filtered: filteredImages
                });
                chrome.pageAction.show(tab.id);
                chrome.pageAction.setIcon({
                    tabId: tab.id,
                    path: "icon19.png"
                });
                chrome.pageAction.setPopup({
                    tabId: tab.id,
                    popup: "popup.html"
                });
                chrome.pageAction.setTitle({
                    tabId: tab.id,
                    title: String(urls.length) + " images"
                });
                this.sendTargetImages(urls, tab);
                this.previewImages(filteredImages, tab);
            } else {
                this.deleteTabImageInfo(tab.id);
//                chrome.pageAction.hide(tab.id);

                chrome.pageAction.show(tab.id);
                chrome.pageAction.setPopup({
                    tabId: tab.id,
                    popup: "popup_no_images.html"
                });
                chrome.pageAction.setIcon({
                    tabId: tab.id,
                    path: "icon19_gray.png"
                });

                chrome.pageAction.setTitle({
                    tabId: tab.id,
                    title: "No images"
                });
                this.sendTargetImages(new Array(), tab);
            }
        } else if (message.type == "disable_button") {
            chrome.pageAction.hide(message.tabId);
        } else if (message.type == "dismiss_hotpreview") {
            localStorage["preview_position"] = "none";
        }
        else if (message.type == "updatePTN"){
            var originalSetVal = {"user" : encodeURIComponent(localStorage['user']),
                                   "derivative" : encodeURIComponent(message.derivative),
                                   "usage_restictions" : "None" };
            var derivativeSetVal = {"user" : encodeURIComponent(localStorage['user']),
                                   "original" : encodeURIComponent(message.original),
                                   "usage_restictions" : "None" };
            
            utils.callPhotoRMService('set' , message.original, originalSetVal, function (){});
            utils.callPhotoRMService('set' , message.derivative, derivativeSetVal, function (){});

        }
        else if (message.type == "audit"){

            var loggedin_user;

            chrome.storage.sync.get('user', function(data){
                    loggedin_user = data.user.url;
                
            });

            $.ajax({
              url: 'http://provenance-tracker.herokuapp.com/logs_temp/' + encodeURIComponent(message.resource) ,
              // dataType: 'json',
              success: function(data) {
                // parse you data received from server here
                //Only request the audit log if it is from the authenticated user
                if (loggedin_user == data.meta.user){

                    chrome.storage.sync.set({'resource': message.resource}, function() {
                        // Notify that we saved.
                        console.log(message.resource + ' saved.');
                    });

                    chrome.tabs.create({url: "audit.html"});
                }
                else{
                    alert("Authentication error! Provenance Tracker says this photo is not yours.");
                }
              }
            });


           // alert(utils.getCurrentDate());
            var store = N3.Store();
            store.addTriple(':Pluto', 'a', ':Dog');
            store.addTriple(':Mickey', 'a', ':Mouse');
            store.addTriple(':Mickey', 'a', ':Human');

            var mickey = store.find(':Mickey', null, null);
            for (var i=0; i<mickey.length; i++){
                m = mickey[i];
            //    alert(m.subject + " " + m.predicate + " " + m.object + ' . ');
            }
            
            //console.log(mickey.subject + " " + mickey.predicate + " " + mickey.object + ' . ');

            // var parser = N3.Parser();
            // parser.parse('@prefix c: <http://example.org/cartoons#>.\n' +
            //              'c:Tom a c:Cat.\n' +
            //              'c:Jerry a c:Mouse;\n' +
            //              '        c:smarterThan c:Tom.',
            //             function (error, triple, prefixes) {
            //                 if (triple){
            //                     alert(triple.subject);
            //                     console.log(triple.subject, triple.predicate, triple.object, '.');
                           
            //                 }
            //                 else{
            //                     console.log("# That's all, folks!", prefixes)
            //                 }
            //             });

        }
        sendRequest({});
    },
    sendTargetImages: function(urls, tab) {
        chrome.tabs.sendMessage(tab.id, {
            operation: "store_target_images",
            urls: urls,
            isHoverZoom: !this.isDontHoverZoom()
        });
    },
    reloadImages: function(tab) {
        this.deleteTabImageInfo(tab.id);
        chrome.pageAction.hide(tab.id);
        chrome.tabs.sendMessage(tab.id, {
            operation: "reload_images"
        });
    },
    onSelectionChanged: function(tabId) {
        this.executeContentScript(tabId);
    },
    executeContentScript: function(tabId) {
        chrome.tabs.executeScript(tabId, {
            file: "content_script.js"
        });
    },
    getSelectedTabImageInfo: function(callback) {
        chrome.tabs.getSelected(null, function(tab) {
            callback(this.getTabImageInfo(tab.id), tab.title, tab.url);
        }.bind(this));
    },
    getTabImageInfo: function(tabId) {
        var info = localStorage["tab_" + String(tabId)];
        if (info) {
            return info.evalJSON();
        } else {
            return null;
        }
    },
    setTabImageInfo: function(tabId, info) {
        localStorage["tab_" + String(tabId)] = Object.toJSON(info);
    },
    deleteTabImageInfo: function(tabId) {
        localStorage.removeItem("tab_" + String(tabId));
    },
    filterUrls: function(images) {
        var filterExts = utils.split(this.getFilterExts(), " ");
        var filterExcepts = utils.split(this.getFilterExcepts(), " ");
        var filterSizeWidth = Number(this.getFilterSizeWidth());
        var filterSizeHeight = Number(this.getFilterSizeHeight());
        var result = new Array();
        images.each(function(image) {
            var url = image.url;
            var flag = false;
            if (filterExts.length > 0) {
                for (var i = 0; i < filterExts.length; i++) {
                    if (url.toLowerCase().indexOf(
                        "." + filterExts[i].toLowerCase()) != -1) {
                        flag = true;
                        break;
                    }
                }
                if (!flag) return;
            }
            flag = false;
            for (var i = 0; i < filterExcepts.length; i++) {
                if (url.toLowerCase().indexOf(filterExcepts[i]) != -1) {
                    flag = true;
                    break;
                }
            }
            if (flag) return;
            var width = Number(image.width);
            if (width < filterSizeWidth) return;
            var height = Number(image.height);
            if (height < filterSizeHeight) return;
            if (image.tag == "img") {
                if (this.isPriorityLinkHref() && image.hasLink) return;
            }
            result.push(image);
        }.bind(this));
        return result;
    },
    getCommandTemplate: function() {
        return utils.getOptionValue("command_template", "curl -O -L $url");
    },
    getFilterExts: function() {
        return utils.getOptionValue("filter_exts", "jpeg jpg png");
    },
    getFilterExcepts: function() {
        return utils.getOptionValue("filter_excepts", "amazon");
    },
    getFilterSizeWidth: function() {
        return utils.getOptionValue("filter_size_width", "300");
    },
    getFilterSizeHeight: function() {
        return utils.getOptionValue("filter_size_height", "300");
    },
    isPriorityLinkHref: function() {
        return Boolean(localStorage["priority_link_href"]);
    },
    getDownloadFilename: function() {
        return utils.getOptionValue("download_filename", "");
    },
    endsWith: function(source, suffix) {
        var sub = source.length - suffix.length;
        return (sub >= 0) && (source.lastIndexOf(suffix) === sub);
    },
    checkDropboxAuthorized: function(callbacks) {
        this.checkServiceAuthorized("dropbox", callbacks);
    },
    checkGDriveAuthorized: function(callbacks) {
        this.checkServiceAuthorized("gdrive", callbacks);
    },
    checkSDriveAuthorized: function(callbacks) {
        this.checkServiceAuthorized("sdrive", callbacks);
    },
    checkPicasaAuthorized: function(callbacks) {
        this.checkServiceAuthorized("picasa", callbacks);
    },
    checkServiceAuthorized: function(name, callbacks) {
        var token = this.getSessionToken();
        var url = this.getServerUrl() + "ajax/is_valid_" + name;
        new Ajax.Request(url, {
            method: "post",
            parameters: {
                token: token
            },
            onSuccess: function(req) {
                callbacks.onSuccess(req);
            }.bind(this),
            onFailure: function(req) {
                console.log(req);
            }.bind(this)
        });
    },
    saveToDropbox: function(title, pageUrl, urls, callbacks) {
        this.saveToService("dropbox", title, pageUrl, urls, callbacks);
    },
    saveToGDrive: function(title, pageUrl, urls, callbacks) {
        this.saveToService("gdrive", title, pageUrl, urls, callbacks);
    },
    saveToPicasa: function(title, pageUrl, urls, callbacks) {
        this.saveToService("picasa", title, pageUrl, urls, callbacks);
    },
    saveToSDrive: function(title, pageUrl, urls, callbacks) {
        this.saveToService("sdrive", title, pageUrl, urls, callbacks);
    },
    saveToLocal: function(title, pageUrl, urls, callbacks) {
        this.saveToService("local", title, pageUrl, urls, callbacks);
    },
    saveToService: function(name, title, pageUrl, urls, callbacks) {
        var url = this.getServerUrl() + "ajax/save_to_" + name;
        new Ajax.Request(url, {
            method: "post",
            parameters: {
                token: this.getSessionToken(),
                title: title,
                page_url: pageUrl,
                urls: urls.join(" "),
                create_dir: !this.isWithoutCreatingFolder()
            },
            onSuccess: function(req) {
                this.createPageBookmark(title, pageUrl);
                callbacks.onSuccess(req);
            }.bind(this),
            onFailure: function(req) {
                callbacks.onFailure(req);
            }.bind(this)
        });
    },
    cancelDropbox: function(callbacks) {
        this.cancelService("dropbox", callbacks);
    },
    cancelGDrive: function(callbacks) {
        this.cancelService("gdrive", callbacks);
    },
    cancelSDrive: function(callbacks) {
        this.cancelService("sdrive", callbacks);
    },
    cancelPicasa: function(callbacks) {
        this.cancelService("picasa", callbacks);
    },
    cancelService: function(name, callbacks) {
        var url = this.getServerUrl() + "ajax/cancel_" + name;
        new Ajax.Request(url, {
            method: "post",
            parameters: {
                token: this.getSessionToken()
            },
            onSuccess: function(req) {
                callbacks.onSuccess(req);
            }.bind(this),
            onFailure: function(req) {
                callbacks.onFailure(req);
            }.bind(this)
        });
    },
    getDropboxAuthUrl: function() {
        return this.getServiceAuthUrl("dropbox");
    },
    getGdriveAuthUrl: function() {
        return this.getServiceAuthUrl("gdrive");
    },
    getPicasaAuthUrl: function() {
        return this.getServiceAuthUrl("picasa");
    },
    getSdriveAuthUrl: function() {
        return this.getServiceAuthUrl("sdrive");
    },
    getServiceAuthUrl: function(name) {
        var token = this.getSessionToken();
        var optionUrl = chrome.extension.getURL("options.html");
        var url =
            this.getServerUrl() + "auth_" + name + "?"
            + "token=" + token
            + "&callback=" + encodeURIComponent(optionUrl);
        return url;
    },
    isWithoutCreatingFolder: function() {
        return Boolean(localStorage["without_creating_folder"]);
    },
    isDontCreatePageBookmark: function() {
        return Boolean(localStorage["dont_create_page_bookmark"]);
    },
    isDontHoverZoom: function() {
        return Boolean(localStorage["dont_hover_zoom"]);
    },
    loadMonitor: function(callbacks) {
        var url = this.getServerUrl() + "monitor";
        new Ajax.Request(url, {
            method: "get",
            onSuccess: function(req) {
                callbacks.onSuccess(req);
            }.bind(this)
        });
    },
    downloadLocal: function(images) {
        images.each(function(url) {
            chrome.downloads.download({
                url: url,
                conflictAction: "uniquify",
                method: "GET"
            }, function(downloadId) {
                console.log(downloadId);
            }.bind(this));
        }.bind(this));
    },
    goToImage: function(url) {
        chrome.tabs.getSelected(null, function(tab) {
            var images = this.getTabImageInfo(tab.id).images;
            if (images) {
                var pos = -1;
                for (var i = 0; i < images.length; i++) {
                    var image = images[i];
                    if (image.url == url) {
                        pos = image.pos;
                        break;
                    }
                }
                chrome.tabs.sendMessage(tab.id, {
                    operation: "go_to_image",
                    pos: pos
                });
            }
        }.bind(this));
    },
    previewImages: function(images, tab) {
        var previewPosition = this.getPreviewPosition();
        if (previewPosition != "none") {
            chrome.tabs.sendMessage(tab.id, {
                operation: "preview_images",
                images: images,
                position: previewPosition,
                tabId: tab.id
            });
        }
    },
    getPreviewPosition: function() {
        return utils.getOptionValue("preview_position", "bottom_right");
    },

    getUserIdentifier: function(){
        return utils.getOptionValue("user", "http://example.com/test"); 
    },

    startSlideShow: function(callback) {
        chrome.tabs.getSelected(null, function(tab) {
            var url = chrome.extension.getURL(
                "slideshow/slideshow.html?tab_id=" + tab.id);
            chrome.tabs.create({
                url: url
            }, function(tab) {
                callback();
            });
        });
    },
    setupBookmark: function() {
        if (this.isDontCreatePageBookmark()) {
            return;
        }
        this.clearBookmarkFolders(function() {
            this.createExtensionBookmark();
        }.bind(this));
    },
    clearBookmarkFolders: function(callback) {
        this.traverseBookmarkFolders(function(folder) {
            if (folder.title == "Image Collector extension") {
                if (folder.children.length == 0) {
                    chrome.bookmarks.remove(folder.id);
                }
            }
        }.bind(this), function() {
            callback();
        });
    },
    traverseBookmarkFolders: function(proc, callback) {
        chrome.bookmarks.getSubTree("2", function(results) {
            if (results.length > 0) {
                results[0].children.each(function(result) {
                    proc(result);
                });
            }
            callback.call();
        });
    },
    createExtensionBookmark: function() {
        var exists = false;
        var extensionBookmarkId = null;
        this.traverseBookmarkFolders(function(folder) {
            if (folder.title == "Image Collector extension") {
                exists = true;
                extensionBookmarkId = folder.id;
            }
        }.bind(this), function() {
            if (exists) {
                localStorage["extension_bookmark_id"] = extensionBookmarkId;
            } else {
                chrome.bookmarks.create({
                    title: "Image Collector extension"
                }, function(result) {
                    localStorage["extension_bookmark_id"] = result.id;
                });
            }
        }.bind(this));
    },
    getExtensionBookmarkId: function() {
        return localStorage["extension_bookmark_id"];
    },
    createPageBookmark: function(title, url) {
        if (this.isDontCreatePageBookmark()) {
            return;
        }
        var parentId = this.getExtensionBookmarkId();
        chrome.bookmarks.create({
            parentId: parentId,
            title: title,
            url: url
        });
    },
    onCommandDownloadImages: function() {
        if (!this.isUseShortcutDownloadService()) {
            return;
        }
        utils.requestDownloadsPermission(function() {
            this.getSelectedTabImageInfo(function(info, title, url) {
                if (info && info.urls.length > 0) {
                    var serviceName = this.getShortcutDownloadService();
                    if (serviceName == "local") {
                        this.downloadImagesByShortcut(serviceName, title, url, info);
                    } else {
                        this.checkServiceAuthorized(serviceName, {
                            onSuccess: function(req) {
                                var result = req.responseJSON.result;
                                if (result) {
                                    this.downloadImagesByShortcut(
                                        serviceName, title, url, info);
                                } else {
                                    console.log(req);
                                }
                            }.bind(this),
                            onFailure: function(req) {
                                console.log(req);
                            }.bind(this)
                        });
                    }
                }
            }.bind(this));
        }.bind(this));
    },
    downloadImagesByShortcut: function(serviceName, title, url, info) {
        this.saveToService(serviceName, title, url, info.urls, {
            onSuccess: function(req) {
                if (serviceName == "local") {
                    this.downloadLocal(info.urls);
                } else {
                    this.showNotification(
                        chrome.i18n.getMessage("notifyShortcutDownloadServiceTitle"),
                        chrome.i18n.getMessage(
                            "notifyShortcutDownloadServiceBody",
                            this.getRealServiceName(serviceName)));
                }
            }.bind(this),
            onFailure: function(req) {
                console.log(req);
            }.bind(this)
        });
    },
    getRealServiceName: function(serviceName) {
        if (serviceName == "local") {
            return "Local HDD";
        } else if (serviceName == "dropbox") {
            return "Dropbox";
        } else if (serviceName == "gdrive") {
            return "Google Drive";
        } else if (serviceName == "picasa") {
            return "Picasa";
        } else if (serviceName == "sdrive") {
            return "SkyDrive";
        } else {
            return "";
        }
    },
    getShortcutDownloadService: function() {
        return utils.getOptionValue("shortcut_download_service", "local");
    },
    isUseShortcutDownloadService: function() {
        return Boolean(localStorage["use_shortcut_download_service"]);
    },
    showNotification: function(message, subMessage) {
        var notification = webkitNotifications.createNotification(
            "./icon48.png",
            message,
            subMessage
        );
        notification.show();
        notification.ondisplay = function() {
            setTimeout(function() {
                notification.cancel();
            }, 5000);
        };
    },
    onCommandSlideshowImages: function() {
        this.getSelectedTabImageInfo(function(info, title, url) {
            if (info && info.urls.length > 0) {
                this.startSlideShow(function() {});
            }
        }.bind(this));
    }
};

var ic = new IC();

//TODO: refactor the following code back in to the model

// Handle requests for passwords
chrome.runtime.onMessage.addListener(function(request, response) {
    if (request.greeting === 'hello') {
        response({'greeting': "farewell"});
        // chrome.tabs.create({
        //     url: chrome.extension.getURL('dialog.html'),
        //     active: false
        // }, function(tab) {
        //     // After the tab has been created, open a window to inject the tab
        //     password({
        //         tabId: tab.id,
        //         type: 'popup',
        //         focused: true
        //         // incognito, top, left, ...
        //     });
        // });
     return true;
    }
});
function setPassword(password) {
    // Do something, eg..:
    alert(password);
    
    chrome.tabs.query({active: true, currentWindow: true}, 
        function(tabs) {
            chrome.tabs.sendMessage(tabs[0].id, 
                {   operation: "send_modification",
                    data: password, }, 
                function(response) {
                    console.log(response.farewell);
                });
        });

};

var Options = function() {
    this.initialize();
};

Options.prototype = {
    initialize: function() {
        window.addEventListener("load", function(evt) {
            this.start();
        }.bind(this));
    },
    start: function() {
        this.setupUIs();
        this.assignMessages();
        this.assignEventHandlers();
        this.restoreConfigurations();
        this.checkDropboxAuthorized();
        this.checkGDriveAuthorized();
        this.checkSDriveAuthorized();
        this.checkPicasaAuthorized();
        this.loadMonitor();
    },
    setupUIs: function() {
        var previewPosition = $("preview_position");
        this.createAndAppendOption("none", "optPreviewNone", previewPosition);
        this.createAndAppendOption("top_left", "optPreviewTopLeft", previewPosition);
        this.createAndAppendOption("top_right", "optPreviewTopRight", previewPosition);
        this.createAndAppendOption("bottom_left", "optPreviewBottomLeft", previewPosition);
        this.createAndAppendOption("bottom_right", "optPreviewBottomRight", previewPosition);
    },
    createAndAppendOption: function(value, resourceKey, parent) {
        var option = document.createElement("option");
        option.value = value;
        option.appendChild(document.createTextNode(chrome.i18n.getMessage(resourceKey)));
        parent.appendChild(option);
    },
    assignMessages: function() {
        var hash = {
            "optCommand": "optCommand",
            "optCommandTemplate": "optCommandTemplate",
            "optCommandTemplateDescription": "optCommandTemplateDescription",
            "command_template_save": "optCommandTemplateSave",
            "optFilter": "optFilter",
            "optFilterExts": "optFilterExts",
            "optFilterExtsDescription": "optFilterExtsDescription",
            "filter_exts_save": "optFilterExtsSave",
            "optFilterExcepts": "optFilterExcepts",
            "optFilterExceptsDescription": "optFilterExceptsDescription",
            "filter_excepts_save": "optFilterExceptsSave",
            "optFilterSize": "optFilterSize",
            "optFilterSizeDescription": "optFilterSizeDescription",
            "optFilterSizeWidth": "optFilterSizeWidth",
            "optFilterSizeHeight": "optFilterSizeHeight",
            "optFilterPriorityLinkHref": "optFilterPriorityLinkHref",
            "optFilterPriorityLinkHrefDescription": "optFilterPriorityLinkHrefDescription",
            "filter_size_save": "optFilterSizeSave",
            "optDownload": "optDownload",
            "optDownloadFilename": "optDownloadFilename",
            "download_filename_save": "optDownloadFilenameSave",
            "optDownloadFilenameDescription": "optDownloadFilenameDescription",
            "optServices": "optServices",
            "dropbox_authorized": "optDropboxAuthorized",
            "dropbox_unauthorized": "optDropboxUnauthorized",
            "auth_dropbox": "optAuthDropbox",
            "cancel_dropbox": "optCancelDropbox",
            "gdrive_authorized": "optGDriveAuthorized",
            "gdrive_unauthorized": "optGDriveUnauthorized",
            "auth_gdrive": "optAuthGDrive",
            "cancel_gdrive": "optCancelGDrive",
            "optWithoutCreatingFolder": "optWithoutCreatingFolder",
            "optWithoutCreatingFolderDescription": "optWithoutCreatingFolderDescription",
            "optStat": "optStat",
            "optStatRemainingJob": "optStatRemainingJob",
            "optStatPageCount": "optStatPageCount",
            "sdrive_authorized": "optSDriveAuthorized",
            "sdrive_unauthorized": "optSDriveUnauthorized",
            "auth_sdrive": "optAuthSDrive",
            "cancel_sdrive": "optCancelSDrive",
            "optPreview": "optPreview",
            "optPreviewLocation": "optPreviewLocation",
            "optBookmark": "optBookmark",
            "optDontCreatePageBookmark": "optDontCreatePageBookmark",
            "optShortcut": "optShortcut",
            "optShortcutDownloadService1": "optShortcutDownloadService1",
            "optShortcutDownloadService2": "optShortcutDownloadService2",
            "optShortcutDownloadDescription": "optShortcutDownloadDescription",
            "optHoverZoom": "optHoverZoom",
            "optDontHoverZoom": "optDontHoverZoom",
            "optWelcome": "optWelcome",
            "picasa_authorized": "optPicasaAuthorized",
            "picasa_unauthorized": "optPicasaUnauthorized",
            "auth_picasa": "optAuthPicasa",
            "cancel_picasa": "optCancelPicasa"
          };
        utils.setMessageResources(hash);
    },
    assignEventHandlers: function() {
        $("command_template_save").onclick =
            this.onClickCommandTemplateSave.bind(this);
        $("filter_exts_save").onclick =
            this.onClickFilterExtsSave.bind(this);
        $("filter_excepts_save").onclick =
            this.onClickFilterExceptsSave.bind(this);
        $("filter_size_save").onclick =
            this.onClickFilterSizeSave.bind(this);
        $("priority_link_href").onclick =
            this.onClickPriorityLinkHref.bind(this);
        $("download_filename_save").onclick =
            this.onClickDownloadFilenameSave.bind(this);
        $("auth_dropbox").onclick =
            this.onClickAuthDropbox.bind(this);
        $("cancel_dropbox").onclick =
            this.onClickCancelDropbox.bind(this);
        $("auth_gdrive").onclick =
            this.onClickAuthGDrive.bind(this);
        $("cancel_gdrive").onclick =
            this.onClickCancelGDrive.bind(this);
        $("without_creating_folder").onclick =
            this.onClickWithoutCreatingFolder.bind(this);
        $("auth_sdrive").onclick =
            this.onClickAuthSDrive.bind(this);
        $("cancel_sdrive").onclick =
            this.onClickCancelSDrive.bind(this);
        $("preview_position").onchange =
            this.onChangePreviewPosition.bind(this);
        $("dont_create_page_bookmark").onclick =
            this.onClickDontCreatePageBookmark.bind(this);
        $("shortcut_download_service").onchange =
            this.onChangeShortcutDownloadService.bind(this);
        $("use_shortcut_download_service").onclick =
            this.onClickUseShortcutDownloadService.bind(this);
        $("dont_hover_zoom").onclick =
            this.onClickDontHoverZoom.bind(this);
        $("auth_picasa").onclick =
            this.onClickAuthPicasa.bind(this);
        $("cancel_picasa").onclick =
            this.onClickCancelPicasa.bind(this);
    },
    restoreConfigurations: function() {
        chrome.runtime.getBackgroundPage(function(bg) {
            $("command_template").value = bg.ic.getCommandTemplate();
            $("filter_exts").value = bg.ic.getFilterExts();
            $("filter_excepts").value = bg.ic.getFilterExcepts();
            $("filter_size_width").value = bg.ic.getFilterSizeWidth();
            $("filter_size_height").value = bg.ic.getFilterSizeHeight();
            $("priority_link_href").checked = bg.ic.isPriorityLinkHref();
            $("download_filename").value = bg.ic.getDownloadFilename();
            $("without_creating_folder").checked = bg.ic.isWithoutCreatingFolder();
            $("preview_position").value = bg.ic.getPreviewPosition();
            $("dont_create_page_bookmark").checked = bg.ic.isDontCreatePageBookmark();
            $("shortcut_download_service").value = bg.ic.getShortcutDownloadService();
            $("use_shortcut_download_service").checked = bg.ic.isUseShortcutDownloadService();
            $("shortcut_download_service").disabled = !bg.ic.isUseShortcutDownloadService();
            $("dont_hover_zoom").checked = bg.ic.isDontHoverZoom();
        });
    },
    checkDropboxAuthorized: function() {
        chrome.runtime.getBackgroundPage(function(bg) {
            bg.ic.checkDropboxAuthorized({
                onSuccess: function(req) {
                    var result = req.responseJSON.result;
                    utils.setVisible($("dropbox_authorized"), result);
                    utils.setVisible($("dropbox_unauthorized"), !result);
                    utils.setVisible($("auth_dropbox"), !result);
                    utils.setVisible($("cancel_dropbox"), result);
                }.bind(this)
            });
        }.bind(this));
    },
    checkGDriveAuthorized: function() {
        chrome.runtime.getBackgroundPage(function(bg) {
            bg.ic.checkGDriveAuthorized({
                onSuccess: function(req) {
                    var result = req.responseJSON.result;
                    utils.setVisible($("gdrive_authorized"), result);
                    utils.setVisible($("gdrive_unauthorized"), !result);
                    utils.setVisible($("auth_gdrive"), !result);
                    utils.setVisible($("cancel_gdrive"), result);
                }.bind(this)
            });
        }.bind(this));
    },
    checkSDriveAuthorized: function() {
        chrome.runtime.getBackgroundPage(function(bg) {
            bg.ic.checkSDriveAuthorized({
                onSuccess: function(req) {
                    var result = req.responseJSON.result;
                    utils.setVisible($("sdrive_authorized"), result);
                    utils.setVisible($("sdrive_unauthorized"), !result);
                    utils.setVisible($("auth_sdrive"), !result);
                    utils.setVisible($("cancel_sdrive"), result);
                }.bind(this)
            });
        }.bind(this));
    },
    checkPicasaAuthorized: function() {
        chrome.runtime.getBackgroundPage(function(bg) {
            bg.ic.checkPicasaAuthorized({
                onSuccess: function(req) {
                    var result = req.responseJSON.result;
                    utils.setVisible($("picasa_authorized"), result);
                    utils.setVisible($("picasa_unauthorized"), !result);
                    utils.setVisible($("auth_picasa"), !result);
                    utils.setVisible($("cancel_picasa"), result);
                }.bind(this)
            });
        }.bind(this));
    },
    onClickCommandTemplateSave: function(evt) {
        localStorage["command_template"] = $("command_template").value;
        $("command_template_result").innerHTML =
            chrome.i18n.getMessage("optCommandTemplateSaveSucceed");
        setTimeout(function() {
            $("command_template_result").innerHTML = "";
        }, 5000);
    },
    onClickFilterExtsSave: function(evt) {
        var value = $("filter_exts").value.toLowerCase();
        localStorage["filter_exts"] = value;
        $("filter_exts_result").innerHTML =
            chrome.i18n.getMessage("optFilterExtsSaveSucceed");
        $("filter_exts").value = value;
        setTimeout(function() {
            $("filter_exts_result").innerHTML = "";
        }, 5000);
    },
    onClickFilterExceptsSave: function(evt) {
        var value = $("filter_excepts").value.toLowerCase();
        localStorage["filter_excepts"] = value;
        $("filter_excepts_result").innerHTML =
            chrome.i18n.getMessage("optFilterExceptsSaveSucceed");
        $("filter_excepts").value = value;
        setTimeout(function() {
            $("filter_excepts_result").innerHTML = "";
        }, 5000);
    },
    onClickFilterSizeSave: function(evt) {
        var width = $("filter_size_width").value;
        var height = $("filter_size_height").value;
        localStorage["filter_size_width"] = width;
        localStorage["filter_size_height"] = height;
        $("filter_size_result").innerHTML =
            chrome.i18n.getMessage("optFilterSizeSaveSucceed");
        setTimeout(function() {
            $("filter_size_result").innerHTML = "";
        }, 5000);
    },
    onClickPriorityLinkHref: function() {
        this.changeCheckboxConfiguration("priority_link_href");
    },
    onClickDownloadFilenameSave: function(evt) {
        localStorage["download_filename"] = $("download_filename").value;
        $("download_filename_result").innerHTML =
            chrome.i18n.getMessage("optDownloadFilenameSucceed");
        setTimeout(function() {
            $("download_filename_result").innerHTML = "";
        }, 5000);
    },
    changeCheckboxConfiguration: function(name) {
        localStorage[name] = $(name).checked ? "true" : "";
    },
    onClickAuthDropbox: function(evt) {
        chrome.runtime.getBackgroundPage(function(bg) {
            location.href = bg.ic.getDropboxAuthUrl();
        });
    },
    onClickCancelDropbox: function(evt) {
        chrome.runtime.getBackgroundPage(function(bg) {
            bg.ic.cancelDropbox({
                onSuccess: function(req) {
                    this.checkDropboxAuthorized();
                }.bind(this),
                onFailure: function(req) {
                    this.checkDropboxAuthorized();
                }.bind(this)
            });
        }.bind(this));
    },
    onClickCancelGDrive: function(evt) {
        chrome.runtime.getBackgroundPage(function(bg) {
            bg.ic.cancelGDrive({
                onSuccess: function(req) {
                    this.checkGDriveAuthorized();
                }.bind(this),
                onFailure: function(req) {
                    this.checkGDriveAuthorized();
                }.bind(this)
            });
        }.bind(this));
    },
    onClickCancelPicasa: function(evt) {
        chrome.runtime.getBackgroundPage(function(bg) {
            bg.ic.cancelPicasa({
                onSuccess: function(req) {
                    this.checkPicasaAuthorized();
                }.bind(this),
                onFailure: function(req) {
                    this.checkPicasaAuthorized();
                }.bind(this)
            });
        }.bind(this));
    },
    onClickCancelSDrive: function(evt) {
        chrome.runtime.getBackgroundPage(function(bg) {
            bg.ic.cancelSDrive({
                onSuccess: function(req) {
                    this.checkSDriveAuthorized();
                }.bind(this),
                onFailure: function(req) {
                    this.checkSDriveAuthorized();
                }.bind(this)
            });
        }.bind(this));
    },
    onClickAuthGDrive: function(evt) {
        chrome.runtime.getBackgroundPage(function(bg) {
            var token = bg.ic.getSessionToken();
            var optionUrl = chrome.extension.getURL("options.html");
            var url =
                bg.ic.getServerUrl() + "auth_gdrive?"
                + "token=" + token
                + "&callback=" + encodeURIComponent(optionUrl);
            location.href = url;
        });
    },
    onClickAuthPicasa: function(evt) {
        chrome.runtime.getBackgroundPage(function(bg) {
            var token = bg.ic.getSessionToken();
            var optionUrl = chrome.extension.getURL("options.html");
            var url =
                bg.ic.getServerUrl() + "auth_picasa?"
                + "token=" + token
                + "&callback=" + encodeURIComponent(optionUrl);
            location.href = url;
        });
    },
    onClickAuthSDrive: function(evt) {
        chrome.runtime.getBackgroundPage(function(bg) {
            var token = bg.ic.getSessionToken();
            var optionUrl = chrome.extension.getURL("options.html");
            var url =
                bg.ic.getServerUrl() + "auth_sdrive?"
                + "token=" + token
                + "&callback=" + encodeURIComponent(optionUrl);
            location.href = url;
        });
    },
    onClickWithoutCreatingFolder: function() {
        this.changeCheckboxConfiguration("without_creating_folder");
    },
    onClickDontCreatePageBookmark: function() {
        this.changeCheckboxConfiguration("dont_create_page_bookmark");
    },
    onClickDontHoverZoom: function() {
        this.changeCheckboxConfiguration("dont_hover_zoom");
    },
    loadMonitor: function() {
        chrome.runtime.getBackgroundPage(function(bg) {
            bg.ic.loadMonitor({
                onSuccess: function(req) {
                    var result = req.responseJSON;
                    $("stat_remaining_job_count").innerText =
                        this.addFigure(result.job_count);
                    $("stat_page_count").innerText =
                        this.addFigure(result.page_count);
                }.bind(this)
            });
        }.bind(this));
    },
    addFigure: function(value) {
        var num = new String(value).replace(/,/g, "");
        while (num != (num = num.replace(/^(-?\d+)(\d{3})/, "$1,$2")));
        return num;
    },
    onChangePreviewPosition: function() {
        var value = $("preview_position").value;
        localStorage["preview_position"] = value;
    },
    onChangeShortcutDownloadService: function() {
        var value = $("shortcut_download_service").value;
        localStorage["shortcut_download_service"] = value;
    },
    onClickUseShortcutDownloadService: function() {
        var checked = $("use_shortcut_download_service").checked;
        if (checked) {
            chrome.permissions.request({
                permissions: [
                    "notifications"
                ]
            }, function(granted) {
                if (granted) {
                    $("shortcut_download_service").disabled = false;
                } else {
                    $("use_shortcut_download_service").checked = false;
                }
                this.changeCheckboxConfiguration("use_shortcut_download_service");
            }.bind(this));
        } else {
            chrome.permissions.remove({
                permissions: [
                    "notifications"
                ]
            }, function(removed) {
                $("shortcut_download_service").disabled = true;
                this.changeCheckboxConfiguration("use_shortcut_download_service");
            }.bind(this));
        }
    }
};

var options = new Options();

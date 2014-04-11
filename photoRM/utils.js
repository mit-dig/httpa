var Utils = function() {
};

Utils.prototype = {
    getOptionValue: function(name, defaultValue) {
        var value = localStorage[name];
        if (value) {
            return value;
        } else {
            return defaultValue;
        }
    },
    setVisible: function(e, visible) {
        Element.setStyle(
            e,
            {display: visible ? "inline-block" : "none"});
    },
    setMessageResources: function(hash) {
        for (var key in hash) {
            $(key).innerHTML = chrome.i18n.getMessage(hash[key]);
        }
    },
    split: function(source, delimiter) {
        if (source && source.length > 0) {
            return source.split(delimiter);
        } else {
            return new Array();
        }
    },
    requestDownloadsPermission: function(callback) {
        chrome.permissions.request({
            permissions: ["downloads"]
        }, function(granted) {
            console.log("Request downloads permissions: " + granted);
            if (granted) {
                callback();
            }
        }.bind(this));
    }
};

var utils = new Utils();

var Utils = function() {
};

// For todays date;
Date.prototype.today = function () { 
    return ((this.getDate() < 10)?"0":"") + this.getDate() +"/"+(((this.getMonth()+1) < 10)?"0":"") + (this.getMonth()+1) +"/"+ this.getFullYear();
}

// For the time now
Date.prototype.timeNow = function () {
     return ((this.getHours() < 10)?"0":"") + this.getHours() +":"+ ((this.getMinutes() < 10)?"0":"") + this.getMinutes() +":"+ ((this.getSeconds() < 10)?"0":"") + this.getSeconds();
}


Utils.prototype = {

    callPhotoRMService: function(method, uri, val, callback){
        var url =  'http://citizenreport.herokuapp.com/' + method + '/' 
                    + encodeURIComponent(uri) 
                    + "/" + JSON.stringify(val);

        var xhrphotorm = new XMLHttpRequest();
        //xhr.setRequestHeader('Cache-Control', 'no-cache');
        xhrphotorm.onreadystatechange = function() {
            //var response = JSON.parse(xhr.response);
            if (xhrphotorm.readyState == 4) {
                callback();
                alert(xhrphotorm.responseText);
            }
        };
        xhrphotorm.open('GET', url, true); 
        xhrphotorm.send(null);
        
    },
            
    getCurrentDate: function(){
        var newDate = new Date();
        var datetime = newDate.today() + " @ " + newDate.timeNow();
        return datetime;

    },
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

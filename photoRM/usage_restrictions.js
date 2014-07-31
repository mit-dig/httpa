//This is not working now, left here for further investigation

var usage_restrictions = [
	{ 	"label" : "No modification" , 		
		"url": "http://no-modifications" },
	{ 	"label" : "No sharing" , 			
		"url": "http://no-sharing" },
	{ 	"label" : "No commercial uses" , 	
		"url": "http://no-commercial-uses" },
	{ 	"label" : "No text additions" , 	
		"url": "http://no-text-additions" },
	{ 	"label" : "No downloading" , 		
		"url": "http://no-downloading" }
];


setTimeout(function() {
    /* Example: Send data to your Chrome extension*/
    document.dispatchEvent(new CustomEvent('RW759_connectExtension', {
        usage_restrictions: usage_restrictions 
    }));
}, 0);
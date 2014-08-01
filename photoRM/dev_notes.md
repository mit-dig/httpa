Online Meme Builders
====================
http://builder.cheezburger.com/builder/#step2



Image Vector Editor
===================
This looks pretty awesome!
http://jsvectoreditor.googlecode.com/svn/trunk/index.html
(there should be more functionalities like this)


Issues with the Image Collector component
==========================================
* Some small images do not get picked up by the background script.


Sending the post data
======================

                      _id:req.user._json.link, 
                      email: req.user._json.email, 
                      name: req.user.displayName, 
                      joined: currentDate}] ;


In the extension for post, remember to send this header:
req.headers['user_email']  like how you send user_name


Obtaining the Logged in user data
===================================

Using this:
chrome.storage.sync.get('user', function(data){
                        alert(JSON.stringify(data));
                    
                });

We get back JSON data in the form of:

{
   "user":{
      "ageRange":{
         "min":21
      },
      "circledByCount":711,
      "cover":{
         "coverInfo":{
            "leftImageOffset":0,
            "topImageOffset":0
         },
         "coverPhoto":{
            "height":624,
            "url":"https://lh3.googleusercontent.com/-4Gd1yK-TAYQ/T9kKAD5V8TI/AAAAAAAAAF4/QyiiRp_b4JA/s630-fcrop64=1,1fff2e05dfffd1f9/Directions.JPG",
            "width":940
         },
         "layout":"banner"
      },
      "displayName":"Oshani Seneviratne",
      "etag":"\"AtDvFRdo1nr9guODqwfbgdIwgiE/DkspmQ6ninlLkiOUQliRbYY3lCs\"",
      "gender":"female",
      "id":"104888544551171873513",
      "image":{
         "isDefault":false,
         "url":"https://lh4.googleusercontent.com/-97nGF2H_PYU/AAAAAAAAAAI/AAAAAAAAAAA/0Hk45DD3J5A/photo.jpg?sz=50"
      },
      "isPlusUser":true,
      "kind":"plus#person",
      "language":"en",
      "name":{
         "familyName":"Seneviratne",
         "givenName":"Oshani"
      },
      "objectType":"person",
      "organizations":[
         {
            "name":"Massachusetts Institute of Technology",
            "primary":false,
            "type":"school"
         },
         {
            "name":"Massachusetts Institute of Technology",
            "primary":false,
            "title":"Research Assistant",
            "type":"work"
         }
      ],
      "placesLived":[
         {
            "primary":true,
            "value":"Cambridge MA"
         }
      ],
      "url":"https://plus.google.com/+OshaniSeneviratne",
      "urls":[
         {
            "label":"Buzz",
            "type":"contributor",
            "value":"https://profiles.google.com/104888544551171873513/buzz"
         },
         {
            "label":"Batch 03 - Ope :-)",
            "type":"contributor",
            "value":"http://batch03ope.blogspot.com/"
         },
         {
            "label":"Blood Cell Recognizer and Counter",
            "type":"contributor",
            "value":"http://bloodcellrecognizer.blogspot.com/"
         },
         {
            "label":"Lohitha",
            "type":"contributor",
            "value":"http://lohitha.blogspot.com/"
         },
         {
            "label":"Chaos",
            "type":"contributor",
            "value":"http://oshanis.blogspot.com/"
         }
      ],
      "verified":false
   }
}
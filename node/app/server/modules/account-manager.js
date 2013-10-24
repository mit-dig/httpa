var crypto 		= require('crypto');
var mongo       = require('mongodb');
var MongoDB 	= require('mongodb').Db;
var Server 		= require('mongodb').Server;
var moment 		= require('moment');

var dbName 		= 'accounts';

/* establish the database connection */

////////////
var database = null;
var accounts = null;
var profiles = null;

mongo.connect(process.env.MONGOLAB_URI, dbName, dbConnectionOpen);

function dbConnectionOpen(err, db) {
    database = db;
    if(!err) {
        console.log("Connected to the database");
        accounts = db.collection('accounts');
        profiles = db.collection('profiles');
    }
    else {
        console.log(err);
    }
}
/* login validation methods */

exports.autoLogin = function(user, pass, callback)
{
	accounts.findOne({user:user}, function(e, o) {
		if (o){
			o.pass == pass ? callback(o) : callback(null);
		}	else{
			callback(null);
		}
	});
}

exports.manualLogin = function(user, pass, callback)
{
	accounts.findOne({user:user}, function(e, o) {
		if (o == null){
			callback('user-not-found');
		}	else{
			validatePassword(pass, o.pass, function(err, res) {
				if (res){
					callback(null, o);
				}	else{
					callback('invalid-password');
				}
			});
		}
	});
}

/* record insertion, update & deletion methods */

exports.addNewAccount = function(newData, callback)
{
	accounts.findOne({user:newData.user}, function(e, o) {
		if (o){
			callback('username-taken');
		}	else{
			accounts.findOne({email:newData.email}, function(e, o) {
				if (o){
					callback('email-taken');
				}	else{
					saltAndHash(newData.pass, function(hash){
						newData.pass = hash;
					// append date stamp when record was created //
						newData.date = moment().format('MMMM Do YYYY, h:mm:ss a');
						accounts.insert(newData, {safe: true}, callback);
					});
				}
			});
		}
	});
}

exports.updateAccount = function(newData, callback)
{   accounts.findOne({user:newData.user}, function(e, o){
        o.name 		= newData.name;
		o.email 	= newData.email;
		o.country 	= newData.country;
		if (newData.pass == ''){
			accounts.save(o, {safe: true}, function(err) {
				if (err) callback(err);
				else callback(null, o);
			});
		}	else{
			saltAndHash(newData.pass, function(hash){
				o.pass = hash;
				accounts.save(o, {safe: true}, function(err) {
					if (err) callback(err);
					else callback(null, o);
				});
			});
		}
	});
}

exports.updateHealthInfo = function(newData, callback)
{   //console.log(newData);
    accounts.findOne({user:newData.user.user}, function(e, o){
                     if (e) {
                     //console.log(e);
                     }
        if (o){
                     
                     dummy_data = [{agent: "Nurse Nadia",
                                 datetime:   "12 Jul 2013",
                                  purpose: "Preparation for doctors visit"},
                                   {agent: "Receptionist Reena",
                                 datetime: "3 Jul 2013",
                                  purpose: "Schedule an appointment"},
                                   {agent: "Pharmacist Phil",
                                 datetime: "12 Jul 2013",
                                  Purpose: "Edit Prescription"},
                                   {agent: "Anshu Kumar",
                                 datetime: "11 Jul 2013",
                                  purpose: "Preparation for patient visit"}
                                   ];
                     //console.log(o);
             o.birthdate = newData.birthdate;
             o.bloodtype = newData.bloodtype;
             o.emergency = newData.emergency;
             o.pcp = newData.pcp;
                     illnesses = newData.illnesses;
                     var illnessesData = {};
                     //Create the dummy access logs
                     if (illnesses != undefined){
                        illnesses.forEach(function(item){
                                          illnessesData[item] = dummy_data;
                                              })}
             o.illnesses = illnessesData;
                     medications = newData.medications;
                     var medicationsData = {};
                     //Create the dummy access logs
                     if (medications != undefined){
                     medications.forEach(function(item){
                                       medicationsData[item] = dummy_data;
                                       })}
                     o.medications = medicationsData;
             console.log(o);
             accounts.save(o,
                           {safe: true},
                           function(err) {
                           if (err) {callback(err);}
                           else {
                           callback(null, o);
                           console.log('successfully saved');
                           
                            }
                                       });
                         
        }
    });
}

exports.updatePassword = function(email, newPass, callback)
{
	accounts.findOne({email:email}, function(e, o){
		if (e){
			callback(e, null);
		}	else{
			saltAndHash(newPass, function(hash){
		        o.pass = hash;
		        accounts.save(o, {safe: true}, callback);
			});
		}
	});
}

/* account lookup methods */

exports.deleteAccount = function(id, callback)
{
	accounts.remove({_id: getObjectId(id)}, callback);
}

exports.getAccountByEmail = function(email, callback)
{
	accounts.findOne({email:email}, function(e, o){ callback(o); });
}

exports.validateResetLink = function(email, passHash, callback)
{
	accounts.find({ $and: [{email:email, pass:passHash}] }, function(e, o){
		callback(o ? 'ok' : null);
	});
}

exports.getAllRecords = function(callback)
{
	accounts.find().toArray(
		function(e, res) {
		if (e) callback(e)
		else callback(null, res)
	});
};

exports.delAllRecords = function(callback)
{
	accounts.remove({}, callback); // reset accounts collection for testing //
}

/* private encryption & validation methods */

var generateSalt = function()
{
	var set = '0123456789abcdefghijklmnopqurstuvwxyzABCDEFGHIJKLMNOPQURSTUVWXYZ';
	var salt = '';
	for (var i = 0; i < 10; i++) {
		var p = Math.floor(Math.random() * set.length);
		salt += set[p];
	}
	return salt;
}

var md5 = function(str) {
	return crypto.createHash('md5').update(str).digest('hex');
}

var saltAndHash = function(pass, callback)
{
	var salt = generateSalt();
	callback(salt + md5(pass + salt));
}

var validatePassword = function(plainPass, hashedPass, callback)
{
	var salt = hashedPass.substr(0, 10);
	var validHash = salt + md5(plainPass + salt);
	callback(null, hashedPass === validHash);
}

/* auxiliary methods */

var getObjectId = function(id)
{
	return accounts.db.bson_serializer.ObjectID.createFromHexString(id)
}

var findById = function(id, callback)
{
	accounts.findOne({_id: getObjectId(id)},
		function(e, res) {
		if (e) callback(e)
		else callback(null, res)
	});
};


var findByMultipleFields = function(a, callback)
{
// this takes an array of name/val pairs to search against {fieldName : 'value'} //
	accounts.find( { $or : a } ).toArray(
		function(e, results) {
		if (e) callback(e)
		else callback(null, results)
	});
}

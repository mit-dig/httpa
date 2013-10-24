
$(document).ready(function(){

	var hc = new HomeController();
	var av = new AccountValidator();
    
    
    //Updating personal health data

                  var ptns = { 'personal' : 'http://personal-ptn.herokuapp.com',
                  'medications' : 'http://medications-ptn.herokuapp.com/',
                  'medical-history': 'http://medical-history-ptn.herokuapp.com/'}
                  
    var medications = { 'Acne' : ['Salicylic acid', 'Benzoyl peroxide', 'Topical and oral antibiotics'],
                  'Back Pain' : ['Muscle Relaxant'],
                  'Rheumatoid Arthritis': ['Corticosteroids', 'Immuno suppressants'],
                  'Heartburn': ['Kapidex', 'Zegerid', 'Prilosec', 'Aciphex', 'Gaviscon', 'Mylanta'],
                  'Hypertension': ['Chlorthalidone', 'Furosemide', 'Indapamide', 'Tenoretic'],
                  'Panic Attacks': ['Citalopram', 'Duloxetine Desipramine'],
                  'Herpes': ['Acyclovir', 'Valacyclovir', 'Famciclovir'],
                  'Tuberculosis': ['Isoniazid', 'Rifampin', 'Ethambutol', 'Pyrazinamide'],
                  'Sinus Infection': ['Penicillin', 'Cephalosporin'],
                  'Pink Eye': ['Erythromycin', 'Doxycycline'],
                  'Cholesterol': ['Niacin'],
                  'HIV AIDS': ['Atripla', 'Complera', 'Stribild'],
                  'Migraines': ['Aspirin', 'Naproxen', 'Ibuprofen', 'Acetaminophen ']};
                  
    
                  
    $('#personal-profile-form-update-btn').click(function(){
                                                 $('.modal-alert .modal-header h3').html('Personal Data Received');
                                                 $('.modal-alert .modal-body p').html('Uploaded to ' + ptns['personal']);
                                                 $('.modal-alert').modal('show');
                                                 $('#personal').hide()
                                                 $('#past-medical-conditions').show()});

      $('#past-medical-conditions-btn').click(function(){
                                              var htmlString = "<h3 class='subheading'>Medications</h3><h5 class='subheading'>Here are some suggested drugs for the medical condition you indicated. </h5><h6>Please feel free to remove, edit and add drugs as necessary.</h6><hr>";
                                              $('#medical-conditions :checked').each(function(){
                                                    var illness = $(this).val();
                                                    var medicines = medications[$(this).val()];
                                                    $.each(medicines, function(i, v){
                                                           var val = v.toString();
                                                           htmlString += "<div class='control-group'><label class='control-label' for='" + val +"'>"+illness+"</label><div class='controls'  input-append span12><input class='input-xlarge' type='text' name='medications[]' value='"+val+"'></input> <button id='remove-illness' class='btn btn-danger btn-mini'>Remove</button></div></div>";
                                              });});
                                              $('#past-medical-conditions').hide();
                                              $('.modal-alert .modal-header h3').html('Medical Condtions Received');
                                              $('.modal-alert .modal-body p').html('Uploaded to ' + ptns['medical-history']);
                                              $('.modal-alert').modal('show');
                                              $('#personal').hide()
                                              
                                              $('#past-medications').show();
                                              $('#form-submit').show();
                                              htmlString += "<button id='add-medication' class='btn btn-inverse btn-mini'>Add New Medication</button><br/><br/>" ;
                                              $('#past-medications').html(htmlString);
                                              $('#past-medications').on('click', '#remove-illness', function(){
                                                                        $(this).closest('.control-group').remove();
                                                                        });
                                              $('#past-medications').on('click', '#add-medication', function(){
                                                                        $(this).closest('#past-medications').append("<div class='control-group'><label class='control-label'> New Medication </label><div class='controls'  input-append span12><input class='input-xlarge' type='text' name='medications[]' value=''></input> <button id='remove-illness' class='btn btn-danger btn-mini'>Remove</button></div></div>");
                                                                        });
                                              
  
                                              });
         
                  $('#form-submit').click(function(e){
                                          
                                          $('.modal-alert .modal-header h3').html('Medications Data Received');
                                          $('.modal-alert .modal-body p').html('Uploaded to ' + ptns['medications']);
                                          $('.modal-alert').modal('show');
                                
                                          })
                  
     //Audit Actions
                  var auditfields = ['uri', 'country', 'date', 'birthdate', 'bloodtype', 'emergency', 'pcp', 'conditions', 'medications'];
                  $.each(auditfields, function(k, item){
                                      $('#auditfields').on('click', '#'+item+'audit', function(event){
                                                           event.preventDefault();
                                                           $('.modal-audit .modal-header h3').html('Audit Logs for '+item );
                                                           $('.modal-audit').modal('show');
                                                        });
                                      
                                        });
                  
	$('#account-form').ajaxForm({
		beforeSubmit : function(formData, jqForm, options){
			if (av.validateForm() == false){
				return false;
			} 	else{
			// push the disabled username field onto the form data array //
				formData.push({name:'user', value:$('#user-tf').val()})
				return true;
			}
		},
		success	: function(responseText, status, xhr, $form){
			if (status == 'success') hc.onUpdateSuccess();
		},
		error : function(e){
			if (e.responseText == 'email-taken'){
			    av.showInvalidEmail();
			}	else if (e.responseText == 'username-taken'){
			    av.showInvalidUserName();
			}
		}
	});

    $('#profile-form').ajaxForm(function(){
                                console.log("profile updated");
                                              });
  
    
    $('#name-tf').focus();
	$('#github-banner').css('top', '41px');

// customize the account settings form //
	
	$('#account-form h1').text('Account Settings');
	$('#account-form #sub1').text('Here are the current settings for your account.');
	$('#user-tf').attr('disabled', 'disabled');
	$('#account-form-btn1').html('Delete');
	$('#account-form-btn1').addClass('btn-danger');
	$('#account-form-btn2').html('Update');

// setup the confirm window that displays when the user chooses to delete their account //

	$('.modal-confirm').modal({ show : false, keyboard : true, backdrop : true });
	$('.modal-confirm .modal-header h3').text('Delete Account');
	$('.modal-confirm .modal-body p').html('Are you sure you want to delete your account?');
	$('.modal-confirm .cancel').html('Cancel');
	$('.modal-confirm .submit').html('Delete');
	$('.modal-confirm .submit').addClass('btn-danger');

})
$(function() {
	chrome.storage.sync.get('resource', function(resource_data){
		$("#content").html('<img src='+JSON.stringify(resource_data.resource)+' width="200px"/><br/>');
        $("#content").append('<a href='+JSON.stringify(resource_data.resource)+' >'+ resource_data.resource+'</a> <br/><hr/>')

        //Now get the actual audit record

		$.get( "http://provenance-tracker.herokuapp.com/logs_temp/audit/" + encodeURIComponent(resource_data.resource), function( data ) {
	  		if (typeof(data) == "string"){
				$( "#content" ).append(document.createTextNode(data));
	  		}
	  		else {
	  			for (var i=0; i< data.length; i++){
	  				
	  				var time_p = $(document.createElement('p'));
	  				time_p.append(data[i].time);
					$( "#content" ).append(time_p);

	  				
	  				var user_span = document.createElement('span');
					user_span.appendChild(document.createTextNode(data[i].name));
	  				user_span.appendChild(document.createTextNode(" by "));
					$( "#content" ).append(user_span);


					var user_a = document.createElement('a');
					//user_a.href = JSON.stringify(data[i].details.user);
					user_a.href = data[i].details.user;
					user_a.target = "_blank";
					user_a.appendChild(document.createTextNode(data[i].details.name + " "));



				 	$( "#content" ).append(user_a);

				 	
					var question_a = document.createElement('a');
					question_a.href = "mailto:"+data[i].details.email;
					question_a.target = "_blank";

					var question_button = document.createElement('button');
					question_button.class = "btn btn-default";
					question_button.appendChild(document.createTextNode("?"));

					question_a.appendChild(question_button);

					$( "#content" ).append(question_a);

					$( "#content" ).append(document.createElement('hr'));

	  			}
	  			
	  		}

		});



    });

});
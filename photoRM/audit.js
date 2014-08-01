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

					if (data[i].name == "download" || data[i].name == "share"){
						
						$( "#content" ).append(document.createElement("br"));
						$( "#content" ).append(document.createTextNode("As "));
						var derivative_a = document.createElement("a");
						
						if (data[i].derivative == undefined){
							derivative_a.appendChild(document.createTextNode(data[i].details.derivative));
						}
						else{
							derivative_a.href = data[i].derivative;
							derivative_a.appendChild(document.createTextNode(data[i].derivative));
						}
						
						$( "#content" ).append(derivative_a);
						
						$( "#content" ).append(document.createElement("br"));

						
						 var usage_restrictions = data[i].details.usage_restrictions;

						 
						 if (usage_restrictions.length > 0){

						  	$( "#content" ).append(document.createTextNode("With these usage restrictions:"));
						
							var usage_restrictions_list = document.createElement("ul");
							
						 	for (var j=0; j< usage_restrictions.length; j++){
						 		
								var usage_restrictions_item = document.createElement("li");
								var usage_restrictions_item_a = document.createElement("a");
								
								alert(usage_restrictions[j].url);
								alert(usage_restrictions[j].label);
								usage_restrictions_item_a.href = usage_restrictions[j].url;
								usage_restrictions_item_a.appendChild(document.createTextNode(usage_restrictions[j].label));
								usage_restrictions_item.appendChild(usage_restrictions_item_a);
								usage_restrictions_list.appendChild(usage_restrictions_item);
								
						 	}
							$( "#content" ).append(usage_restrictions_list);

						 }

						 	
					 }

					$( "#content" ).append(document.createElement('hr'));

	  			}
	  			
	  		}

		});

    });

});
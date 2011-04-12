/* Created by jankoatwarpspeed.com */

(function($) {
    $.fn.formToWizard = function(options) {
        options = $.extend({  
            submitButton: '',
            validationEnabled : true,
            onbuttonpane: false
        }, options); 
        
        var element = this;

        var steps = $(element).find("fieldset");
        var count = steps.size();
        var submmitButtonName = "#" + options.submitButton;
        $(submmitButtonName).hide();
        
        // 2
        $(element).before("<ul id='steps'></ul>");

        steps.each(function(i) {
            $(this).wrap("<div id='step" + i + "'></div>");
            if (options.onbuttonpane) {
            	$('.ui-dialog-buttonset').hide();
            	$('.ui-dialog-buttonpane').append("<p id='step" + i + "commands'></p>");
            }
            else {
            	$(this).append("<p id='step" + i + "commands'></p>");
            }
            

            // 2
            var name = $(this).find("legend").html();
            $("#steps").append("<li id='stepDesc" + i + "'>Paso " + (i + 1) + "<span>" + name + "</span></li>");

            if (i == 0) {
                createNextButton(i);
                selectStep(i);
            }
            else if (i == count - 1) {
                $("#step" + i).hide();
                createPrevButton(i);
            }
            else {
                $("#step" + i).hide();
                createPrevButton(i);
                createNextButton(i);
            }
        });

        function createPrevButton(i) {
            var stepName = "step" + i;
            if ($("#" + stepName + "commands .bottom-nav").length==0) {
        		$("#" + stepName + "commands").html('<div class="bottom-nav" style="text-align:center;padding-top:20px;width:100%;"></div>');
        	}
            $("#" + stepName + "commands .bottom-nav").append("<button type='button' id='" + stepName + "Prev' class='prev'>Atras</button>");

            $("#" + stepName + "Prev").bind("click", function(e) {
                $("#" + stepName).hide();
                $("#step" + (i - 1)).show();
                $(submmitButtonName).hide();
                selectStep(i - 1);
            });
        }

        function createNextButton(i) {
            var stepName = "step" + i;
            if ($("#" + stepName + "commands .bottom-nav").length==0) {
        		$("#" + stepName + "commands").html('<div class="bottom-nav" style="text-align:center;padding-top:20px;width:100%;"></div>');
        	}
            $("#" + stepName + "commands .bottom-nav").append("<button type='button' id='" + stepName + "Next' class='next1'>Siguiente</button>");

            $("#" + stepName + "Next").bind("click", function(e) {
            	
            	

            	if (options.validationEnabled) { 
            	    var stepIsValid = true; 
            	    $("#" + stepName + " :input").each( function(index) { 
            	         stepIsValid = element.validate().element($(this)) && stepIsValid; 
            	    }); 
            	    if (!stepIsValid) { 
            	         return false; 
            	    } 
            	} 
                $("#" + stepName).hide();
                $("#step" + (i + 1)).show();
                if (i + 2 == count) {
                    $(submmitButtonName).show();
                }
                selectStep(i + 1);
            });
        }

        function selectStep(i) {
            $("#steps li").removeClass("current");
            $("#stepDesc" + i).addClass("current");
        }

    }
})(jQuery); 
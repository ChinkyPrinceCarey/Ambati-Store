let success_notification;
let success_notification_src
let error_notification;

$(function(){
    success_notification = $("#success_notification")[0];
    success_notification_src = $(success_notification).attr('src');
    error_notification = $("#error_notification")[0];
});

function play_success_notification(){
    error_notification.pause();

    success_notification.pause();
    $(success_notification).attr('src', '');
    $(success_notification).attr('src', success_notification_src);
    success_notification.play();
}

function play_error_notification(){
    success_notification.pause();
    error_notification.play();
}

document.addEventListener('keypress', e => {
    if(barcode_input.is(":focus") && scanner_form.hasClass("disabled")){
        play_error_notification();
        scanner_form.submit(); //which will trigger and shows modal and plays error
    }else if(!(
            barcode_input.is(":focus")
        ||  $("#details input, #details button, #offer_form input").is(":focus")
    )
    ){
        play_error_notification();
        smallModal(
            "Focus is not on Barcode Field", 
            "Manually click on Barcode Field to keep focus", 
            [
                {
                    "class": "ui positive approve button",
                    "id": "",
                    "text": "Okay",
                }
            ], 
            {
                closable: false,
                onApprove: function(){
                    return true;
                }
            }
        );
    }
})

function calculateNoOfVars(){
    return      (sale_summary.length * 6)
            +   (sale_data.length * 17)
            +   (6) //for billing
            +   (11); //for other vars
}

function scan_items_bulk(){
	setTimeout(function(){
		let barcodes_arr = barcode_input.val().split(" ");
		barcode_input.val('');
		$.each(barcodes_arr, function(){
			barcode_input.val(this);
			scanner_btn.click();
		})
	}, 1000);
}
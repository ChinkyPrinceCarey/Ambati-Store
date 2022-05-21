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
    if(
        $(".modal.active").length 
        && !(
                $("#input_offer_percentage").is(":focus")
            ||  $("#input_offer_amount").is(":focus")
        )
    ){
        //modal is active still scanning with scanner
        play_error_notification();
    }else if(barcode_input.is(":focus") && scanner_form.hasClass("disabled")){
        play_error_notification();
        scanner_form.submit(); //which will trigger and shows modal and plays error
    }else if(!(
            barcode_input.is(":focus")
        ||  $("#details input").is(":focus")
        /*
        ||  ((typeof input_invoice_id != "undefined") && input_invoice_id.is(":focus"))
        ||  ((typeof custom_name != "undefined") && custom_name.is(":focus"))
        ||  ((typeof custom_id != "undefined") && custom_id.is(":focus"))
        ||  ((typeof customer_name != "undefined") && customer_name.is(":focus"))
        ||  ((typeof customer_village != "undefined") && customer_village.is(":focus"))
        ||  ((typeof customer_details != "undefined") && customer_details.is(":focus"))
        ||  $("#input_offer_percentage").is(":focus")
        ||  $("#input_offer_amount").is(":focus")
        ||  $(".dropdown .search").is(":focus")
        */
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
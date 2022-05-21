let scanner_form;
let input_barcode;
let scanner_btn;

let table_current_sale_summary;
let table_current_sale_list;

let table_cancelled_sale_summary;
let table_cancelled_sale_list;

let current_sale_data = [];
let current_sale_summary = [];
let current_sale_billing = {
    making_cost: 0,
    sub_total: 0,
    tax: 0,
    total: 0,
    offer_percentage: 0,
    offer_amount: 0
};

let removed_sale_data = [];
let removed_sale_summary = [];
let removed_sale_billing = {
    making_cost: 0,
    sub_total: 0,
    tax: 0,
    total: 0,
    offer_percentage: 0,
    offer_amount: 0
};

let scanner_state = {
    isEnabled: false,
    reason: 'Page just loaded, save the details to scan items to remove from sale',
    default_error_suffix: "</br>adding/removing items disabled</br>Kindly perform sale ASAP"
}

Object.defineProperty(scanner_state, "isEnabled", {
    get: function () {
        return this._isEnabled;
    },
    set: function (val) {
        this._isEnabled = val;
        updateScannerFormUI();
    }
});

function updateScannerFormUI(){
    if(scanner_state.isEnabled){
        scanner_form.removeClass("disabled");
        scanner_btn.removeClass("disabled");
    }else{
        scanner_form.addClass("disabled");
        scanner_btn.addClass("disabled");
    }
}

$(function(){
    scanner_form = $("#scanner_form");
    input_barcode = $("#barcode_input");
    scanner_btn = $("#scanner_btn");

    scanner_state.isEnabled = false; //just to trigger the updateScannerFormUI()
    
    table_current_sale_summary = $("#current_invoice .card .wrapper div table#sale-summary");
    table_current_sale_list = $("#current_invoice .card .wrapper div table#sale-list");

    table_cancelled_sale_summary = $("#cancelled_invoice .card .wrapper div table#sale-summary");
    table_cancelled_sale_list = $("#cancelled_invoice .card .wrapper div table#sale-list");

    scanner_form
    .form({
		onSuccess: function(event, fields){
            event.preventDefault();
            if(scanner_form.hasClass("disabled")){
                play_error_notification();

                smallModal(
                    "Scanning Disabled", 
                    scanner_state.reason,
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
                            input_barcode.val('');
                            return true;
                        }
                    }
                );
            }else{
                remove_item();
            }
        }
    });
})

function remove_item(){
    if(scanner_state.isEnabled){
        if(input_barcode.val()){
            let sale_item = current_sale_data.find(item => item.barcode == input_barcode.val());
            if(sale_item){
                let removed_data = current_sale_data.filter(item => item.barcode != input_barcode.val());
                if(current_sale_data.length == (removed_data.length + 1)){
                    
                    removed_sale_data.push(sale_item);

                    table_cancelled_sale_list.children("tbody").prepend(`
                        <tr data-barcode="${sale_item.barcode}">
                            <td class="collapsing"></td>
                            <td>${sale_item.item}[${sale_item.shortcode}]</td>
                            <td>${sale_item.barcode}</td>
                            <td class="right aligned collapsing">${sale_item.unit_price}</td>
                            <td class="right aligned collapsing">
                                <i class="large trash icon remove-item"></i>
                            </td>
                        </tr>
                    `);

                    table_cancelled_sale_list.css("counter-reset", `DescendingSerial ${removed_sale_data.length+1}`);


                    current_sale_data = removed_data;
                    removeSale(sale_item, current_sale_summary, current_sale_billing, table_current_sale_summary.children("tbody"), table_current_sale_list.children("tbody"));
                    addSale(sale_item, removed_sale_summary, removed_sale_billing, table_cancelled_sale_summary.children("tbody"), table_cancelled_sale_list.children("tbody"));

                    input_barcode.val('');

                    play_success_notification();
                }else{
                    play_error_notification();

                    scanner_state.isEnabled = false;
                    scanner_state.reason = 'Error at remove_item(): Data Mismatching(i.e. Sale Data and Cancelled Sale Data)';

                    smallModal(
                        "Data not Matching", 
                        scanner_state.reason,
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
                                input_barcode.val('');
                                return true;
                            }
                        }
                    );
                }
            }else{
                play_error_notification();

                smallModal(
                    "Item not exist!", 
                    `The barcode: <b>${input_barcode.val()}</b> is not exist in the sale list </br> Check if it has been removed already or not exist at all!`, 
                    [
                        {
                            "class": "ui violet button",
                            "id": "checkItemExistBtn",
                            "text": "Check",
                        },
                        {
                            "class": "ui positive approve button",
                            "id": "",
                            "text": "Okay",
                        }
                    ], 
                    {
                        closable: false,
                        onApprove: function(){
                            input_barcode.val('');
                            input_barcode.focus();
                            $(".ui.modal .content .message").remove();
                            return true;
                        }
                    }
                );
            }
        }
    }else{
        play_error_notification();

        smallModal(
            "Scanning Disabled", 
            scanner_state.reason,
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
                    input_barcode.val('');
                    return true;
                }
            }
        );
    }
}

$('.actions').on('click', '#checkItemExistBtn', function(){
    let modal_content = $(".ui.modal .content");
    let message_title = "Item not exist in Sale Invoice";
    let message_content = "Item you're trying to remove is not exist in the Sale Invoice";
    let message_class = "negative";
    
    if(removed_sale_data.find(item => item.barcode == input_barcode.val())){
        message_title = "Item Exist in Cancelled Invoice";
        message_content = "Item you're trying to remove is already removed from the Sale Invoice";
        message_class = "success";
    }

    if(modal_content.children(".message")){
        modal_content.children(".message").remove();
    }

    modal_content.append(`
        <div class="ui ${message_class} message" style="margin: 1px;">
            <i class="close icon"></i>
            <div class="header">${message_title}</div>
            <p>${message_content}</p>
        </div>
    `);
});

$(document).on('click', '.remove-item', function(){
    if(scanner_state.isEnabled){
                        //icon  //td      //tr
        let item_row = $(this).parent().parent();
        if(item_row){
            let item_barcode = item_row.attr("data-barcode");
            if(item_barcode){
                let sale_item = removed_sale_data.find(item => item.barcode == item_barcode);
                if(sale_item){
                    let removed_data = removed_sale_data.filter(item => item.barcode != item_barcode);
                    if(removed_sale_data.length == (removed_data.length + 1)){
                        removed_sale_data = removed_data;
                        
                        current_sale_data.push(sale_item);

                        table_current_sale_list.children("tbody").prepend(`
                                <tr data-barcode="${sale_item.barcode}">
                                    <td class="collapsing"></td>
                                    <td>${sale_item.item}[${sale_item.shortcode}]</td>
                                    <td>${sale_item.barcode}</td>
                                    <td class="right aligned collapsing">${sale_item.unit_price}</td>
                                    <td class="right aligned collapsing">
                                        <!--<i class="large trash icon remove-item"></i>-->
                                    </td>
                                </tr>
                        `);

                        addSale(sale_item, current_sale_summary, current_sale_billing, table_current_sale_summary.children("tbody"), table_current_sale_list.children("tbody"))
                        removeSale(sale_item, removed_sale_summary, removed_sale_billing, table_cancelled_sale_summary.children("tbody"), table_cancelled_sale_list.children("tbody"))

                        table_cancelled_sale_list.css("counter-reset", `DescendingSerial ${removed_sale_data.length+1}`);
                    }else{
                        scanner_state.isEnabled = false;
                        scanner_state.reason = `Error at Remove Item: Sale Data and Removing Item Data are not matching`;
                    }
                }else{
                    scanner_state.isEnabled = false;
                    scanner_state.reason = `Unable to find cancelled item with barcode: <b>${item_barcode}</b> in the sale list`;
                }
            }else{
                scanner_state.isEnabled = false;
                scanner_state.reason = "Unable to find barcode of cancelled sale item to remove";
            }
        }else{
            scanner_state.isEnabled = false;
            scanner_state.reason = "Unable to find cancelled sale item row to remove";
        }
    }

    if(!scanner_state.isEnabled){
        smallModal(
            "Error Removing Item",
            scanner_state.reason,
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

function addSale(sale_item_, sale_summary_obj_, sale_billing_obj_, summary_table_body_, list_table_body_){
    if(scanner_state.isEnabled){
        let item_index = sale_summary_obj_.findIndex(item => (item.shortcode == sale_item_.shortcode) && (item.unit_price == sale_item_.unit_price));

        if(item_index >= 0){
            let sale_summary_item_table_row = summary_table_body_.children(`tr[data-item=${sale_item_.shortcode}_${sale_item_.unit_price}]`);
            if(sale_summary_item_table_row){

                sale_summary_obj_[item_index].quantity = parseInt(sale_summary_obj_[item_index].quantity) + 1;
                sale_summary_obj_[item_index].total_price = parseFloat(sale_summary_obj_[item_index].total_price) + parseFloat(sale_item_.unit_price);

                sale_summary_item_table_row.children(".quantity").text(sale_summary_obj_[item_index].quantity);
                sale_summary_item_table_row.children(".total_price").text(sale_summary_obj_[item_index].total_price);

            }else{
                scanner_state.isEnabled = false;
                scanner_state.reason = `Error at addSale(..): Unable to find current item row in Sale Summary Table`;
            }
        }else{
            sale_summary_obj_.push(
                {
                    item: sale_item_.item,
                    shortcode: sale_item_.shortcode,
                    making_cost: sale_item_.making_cost,
                    unit_price: sale_item_.unit_price,
                    quantity: 1,
                    total_price: sale_item_.unit_price
                }
            );

            summary_table_body_.append(`
                <tr data-item="${sale_item_.shortcode}_${sale_item_.unit_price}">
                    <td class="slno collapsing"></td>
                    <td class="item_shortcode">${sale_item_.item}[${sale_item_.shortcode}]</td>
                    <td class="quantity right aligned collapsing">1</td>
                    <td class="unit_price right aligned collapsing">${sale_item_.unit_price}</td>
                    <td class="total_price right aligned collapsing">${sale_item_.unit_price}</td>
                </tr>
            `);
        }

        updateBilling(
            sale_item_,
            sale_billing_obj_,
            summary_table_body_.parent().children("tfoot"), 
            list_table_body_.parent().children("tfoot")
        );
    }

    if(!scanner_state.isEnabled){
        smallModal(
            "Error on Sale Summary Table", 
            scanner_state.reason,
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
                    barcode_input.val('');
                    return true;
                }
            }
        );
    }
}

function removeSale(sale_item_, sale_summary_obj_, sale_billing_obj_, summary_table_body_, list_table_body_){
    if(scanner_state.isEnabled){
        let item_index = sale_summary_obj_.findIndex(item => (item.shortcode == sale_item_.shortcode) && (item.unit_price == sale_item_.unit_price));

        if(item_index >= 0){
            let sale_summary_item_table_row = summary_table_body_.children(`tr[data-item=${sale_item_.shortcode}_${sale_item_.unit_price}]`);
            let sale_list_item_table_row = list_table_body_.children(`tr[data-barcode=${sale_item_.barcode}]`);
            if(sale_summary_item_table_row){
                if(sale_list_item_table_row){
                    sale_list_item_table_row.remove();
                    
                    if(sale_summary_obj_[item_index].quantity > 1){
                        sale_summary_obj_[item_index].quantity = sale_summary_obj_[item_index].quantity - 1;
                        sale_summary_obj_[item_index].total_price = sale_summary_obj_[item_index].total_price - sale_item_.unit_price;

                        sale_summary_item_table_row.children(".quantity").text(sale_summary_obj_[item_index].quantity);
                        sale_summary_item_table_row.children(".total_price").text(sale_summary_obj_[item_index].total_price);
                    }else{
                        sale_summary_item_table_row.remove();

                        let filtered_sale_summary = sale_summary_obj_.filter(function(item, index) {
                            return index !== item_index
                        });

                        sale_summary_obj_.length = 0;
                        sale_summary_obj_.push.apply(sale_summary_obj_, filtered_sale_summary);
                    }
                    updateBilling(
                        sale_item_, 
                        sale_billing_obj_,
                        summary_table_body_.parent().children("tfoot"),
                        list_table_body_.parent().children("tfoot"),
                        "remove"
                    );
                }else{
                    scanner_state.isEnabled = false;
                    scanner_state.reason = `Error at removeSale(..): Unable to find current item row in Sale List Table`;
                }
            }else{
                scanner_state.isEnabled = false;
                scanner_state.reason = `Error at removeSale(..): Unable to find current item row in Sale Summary Table`;
            }
        }else{
            scanner_state.isEnabled = false;
            scanner_state.reason = `Error at removeSale(..): Unable to find current item to remove in Sale Summary Data`;
        }
    }

    if(!scanner_state.isEnabled){
        smallModal(
            "Error on Sale Summary Table",
            scanner_state.reason,
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
}

function updateBilling(sale_item_, billing_obj_, summary_table_billing_foot_, list_table_billing_foot_, action="add"){
    
    if(action == "add"){
        billing_obj_.sub_total += parseInt(sale_item_.unit_price);
        billing_obj_.making_cost += parseInt(sale_item_.making_cost);
    }else{
        billing_obj_.sub_total -= parseInt(sale_item_.unit_price);
        billing_obj_.making_cost -= parseInt(sale_item_.making_cost);
    }

    //18% GST
    //billing_obj_.tax = parseFloat(((billing_obj_.sub_total * 18) / 100).toFixed(2));
    billing_obj_.tax = 0;
    billing_obj_.total = parseFloat((billing_obj_.sub_total + billing_obj_.tax).toFixed(2));

    summary_table_billing_foot_.children("tr").children("#sub_total").text(billing_obj_.sub_total)
    summary_table_billing_foot_.children("tr").children("#tax").text(billing_obj_.tax)
    summary_table_billing_foot_.children("tr").children("#total").text(billing_obj_.total)
    
    list_table_billing_foot_.children("tr").children("#sub_total").text(billing_obj_.sub_total)
    list_table_billing_foot_.children("tr").children("#tax").text(billing_obj_.tax)
    list_table_billing_foot_.children("tr").children("#total").text(billing_obj_.total)
}
let scanner_form;
let scanner_btn;
let barcode_input;

let sale_data = [];
let sale_summary = [];
let billing = {
    making_cost: 0,
    sub_total: 0,
    tax: 0,
    total: 0,
    offer_percentage: 0,
    offer_amount: 0
};

let table_sale_summary;
let table_sale_summary_body;
let table_sale_summary_foot;

let table_sale_list;
let table_sale_list_body;
let table_sale_list_foot;

let scanner_state = {
    isEnabled: false,
    reason: 'Page just loaded, save the details to scan items',
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
    table_sale_summary = $("#sale-summary");
    table_sale_summary_body = table_sale_summary.children("tbody")
    table_sale_summary_foot = table_sale_summary.children("tfoot")

    table_sale_list = $("#sale-list");
    table_sale_list_body = table_sale_list.children("tbody")
    table_sale_list_foot = table_sale_list.children("tfoot")

    scanner_form = $("#scanner_form");
    scanner_btn = $("#scanner_btn");
    barcode_input = $("#barcode_input");

    scanner_state.isEnabled = false; //just to trigger the updateScannerFormUI()
    
    scanner_form
    .form({
		onSuccess: function(event, fields){
            event.preventDefault();
            if(scanner_form.hasClass("disabled")){
                play_error_notification();

                //"It seems you're not saved details, save details then proceed with adding items..."

                smallModal(
                    "Scanning Items Disabled", 
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

            }else{
                add_item();
            }
        }
    });
})

$(document).on('keyup', '#input_offer_percentage, #input_offer_amount', function(e){
    evaluateOffer(e.target.id);
})

$(document).on('click', '#apply_offer_btn', function(e){
    let apply_offer_btn = $("#apply_offer_btn");
    let offer_percentage = parseInt($("#input_offer_percentage").val());
    let offer_amount = parseInt($("#input_offer_amount").val());

    let table_sale_items_overview = $("#sale_items_overview");

    if(apply_offer_btn.hasClass("teal")){
        //check the condition
        if(offer_percentage && offer_amount){
            //then apply the offer
            billing.offer_percentage = offer_percentage;
            billing.offer_amount = offer_amount;
            
            //if by any chance exist then remove it
            table_sale_items_overview.children("#offer_row").remove();

            table_sale_items_overview.append(`
                <tr id="offer_row">
                    <td>Offer(${offer_percentage}%)</td>
                    <td><b>${offer_amount}</b></td>
                </tr>
            `);

            table_sale_summary.children('tfoot').children("tr").children("#offer_percentage").text(`Offer(${offer_percentage}%)`)
            table_sale_summary.children('tfoot').children("tr").children("#offer_amount").text(offer_amount)
            
            table_sale_list.children('tfoot').children("tr").children("#offer_percentage").text(`Offer(${offer_percentage}%)`)
            table_sale_list.children('tfoot').children("tr").children("#offer_amount").text(offer_amount)

        }else{
            //possible bug/error
            //so remove the offer as it will reset any offer
            remove_offer();
        }
        
        //update the button and fields
        apply_offer_btn.removeClass("teal")
        apply_offer_btn.addClass("red")
        apply_offer_btn.children("#text").text("Remove Offer")

        $("#input_offer_percentage").parent().addClass("disabled");
        $("#input_offer_amount").parent().addClass("disabled");
    }else{
        //remove the offer
        remove_offer();
    }
})

function remove_offer(){
    let apply_offer_btn = $("#apply_offer_btn");
    let table_sale_items_overview = $("#sale_items_overview");

    $("#input_offer_percentage").val('');
    $("#input_offer_amount").val('');

    billing.offer_percentage = 0;
    billing.offer_amount = 0;

    table_sale_items_overview.children("#offer_row").remove();
    
    table_sale_summary.children('tfoot').children("tr").children("#offer_percentage").text(`Offer(%)`)
    table_sale_summary.children('tfoot').children("tr").children("#offer_amount").text('')
        
    table_sale_list.children('tfoot').children("tr").children("#offer_percentage").text(`Offer(%)`)
    table_sale_list.children('tfoot').children("tr").children("#offer_amount").text('')

    //update the button and fields
    apply_offer_btn.removeClass("red")
    apply_offer_btn.addClass("teal")
    apply_offer_btn.addClass("disabled")
    apply_offer_btn.children("#text").text("Apply Offer")

    $("#input_offer_percentage").parent().removeClass("disabled");
    $("#input_offer_amount").parent().removeClass("disabled");
}

function evaluateOffer(offer_input_id){
    let input_offer_percentage = $("#input_offer_percentage");
    let input_offer_amount = $("#input_offer_amount");
    let apply_offer_btn = $("#apply_offer_btn");

    let offer_message = $("#offer_message");
    let offer_message_title = $("#offer_message_title");
    let offer_message_limit_percentage = $("#offer_message_content #limit_percentage");
    let offer_message_limit_amount = $("#offer_message_content #limit_amount");

    let making_cost = parseInt(billing.making_cost);
    let sub_total = parseInt(billing.sub_total);
    let pre_profit = parseInt(sub_total - making_cost);

    let offer_limit_percentage = 15;
    let offer_limit_amount = parseInt((offer_limit_percentage/100) * (pre_profit));
    offer_message_limit_percentage.text(offer_limit_percentage)
    offer_message_limit_amount.text(offer_limit_amount)
    
    let offer_percentage = parseInt(input_offer_percentage.val());
    let offer_amount = parseInt(input_offer_amount.val());
    
    if(offer_input_id == "input_offer_percentage"){
        offer_amount = parseInt((offer_percentage/100) * (sub_total))
        input_offer_amount.val(offer_amount);
    }else{
        offer_percentage = parseInt((offer_amount/sub_total)*100);
        input_offer_percentage.val(offer_percentage)
    }

    //update button
    if(parseInt(input_offer_percentage.val()) && parseInt(input_offer_amount.val())){
        apply_offer_btn.removeClass("disabled");
    }else{
        apply_offer_btn.addClass("disabled");
    }

    //update offer message ui
    if(offer_amount < offer_limit_amount){
        //postive profit
        offer_message.removeClass("negative")
        offer_message.addClass("positive")
        offer_message_title.text('Offer in Profit Threshold')
    }else{
        //negetive profit
        offer_message.removeClass("positive")
        offer_message.addClass("negative")
        offer_message_title.text('Offer beyond Profit Threshold')
    }
}

function offer_dialogue(callback){
    smallModal(
        "Verify and Confirm Sale",
        `
        <p><b>Sale Items Overview</b></p>
        <table border="1" id="sale_items_overview">
            <tr>
                <td>Total No.of. Items</td>
                <td><b>${sale_summary.length}</b></td>
            </tr>
            <tr>
                <td>Total No.of. Units</td>
                <td><b>${sale_data.length}</b></td>
            </tr>
            <tr><td colspan="2"></td></tr>
            <tr>
                <td>Total Making Cost <i class="toggle-visibility eye icon"></i></td>
                <td><b class="opacity-0">${billing.making_cost}</b></td>
            </tr>
            <tr>
                <td>Sub Total</td>
                <td><b>${billing.sub_total}</b></td>
            </tr>
            <tr>
                <td>Tax</td>
                <td><b>${billing.tax}</b></td>
            </tr>
            <tr>
                <td>Total</td>
                <td><b>${billing.total}</b></td>
            </tr>
            <tr>
                <td>Profit <i class="toggle-visibility eye icon"></i></td>
                <td><b class="opacity-0">${billing.total - billing.making_cost}</b></td>
            </tr>
            <tr><td colspan="2"></td></tr>
        </table>
        </br>
        <div class="ui form">
            <div class="inline fields">
                <div class="three wide field">
                    <div class="ui left labeled input">
                        <input type="number" id="input_offer_percentage" name="input_offer_percentage" placeholder="">
                        <label for="input_offer_percentage" class="ui label"><b>%</b></label>
                    </div>
                </div>
                <div class="three wide field">
                    <div class="ui left labeled input">
                        <input type="number" id="input_offer_amount" name="input_offer_amount" placeholder="">
                        <label for="input_offer_amount" class="ui label"><b>₹</b></label>
                    </div>
                </div>
                <div class="four wide field">
                    <button class="ui teal right labeled icon disabled button" id="apply_offer_btn">
                        <i class="copy icon"></i>
                        <span id="text">Apply Offer</span>
                    </button>
                </div>
            </div>
        </div>
        <div class="ui message" id="offer_message">
            <div class="header" id="offer_message_title"></div>
            <p id="offer_message_content">
                Offer Amount of ₹<span id="limit_amount"></span> will cross the <span id="limit_percentage"></span>% profit threshold
            </p>
        </div>
        `,
        [
            {
                "class": "ui positive approve medium button",
                "id": "",
                "text": "Sale Stock",
            },
            {
                "class": "ui negative deny button",
                "id": "",
                "text": "Close",
            }
        ], 
        {
            closable: false,
            onApprove: function(){
                callback();
                return true;
            },
            onDeny: function(){
                remove_offer();
                return true;
            }
        }
    );
}

function add_item(){
    if(scanner_state.isEnabled){
        if(barcode_input.val()){
            let stock_item = stock_data.find(item => item.barcode == barcode_input.val());
            if(stock_item){
                let removed_data = stock_data.filter(item => item.barcode != barcode_input.val());
                if(stock_data.length == (removed_data.length + 1)){

                    let sale_item = stock_item;

                    sale_item.unit_price = selected_sale_type == "wholesale" ? sale_item.wholesale_cost : sale_item.retailer_cost;

                    sale_data.push(sale_item);

                    table_sale_list_body.prepend(`
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

                    table_sale_list.css("counter-reset", `DescendingSerial ${sale_data.length+1}`);

                    stock_data = removed_data;
                    updateSale(sale_item);

                    barcode_input.val('');

                    play_success_notification();
                }else{
                    play_error_notification();

                    scanner_state.isEnabled = false;
                    scanner_state.reason = 'Error at add_item(..): Stock Data and Sale Data are not matching';

                    smallModal(
                        "Something went wrong!", 
                        scanner_state.reason + scanner_state.default_error_suffix, 
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
            }else{
                play_error_notification();
                
                smallModal(
                    "Item not exist!", 
                    `The barcode: <b>${barcode_input.val()}</b> is not exist </br> Check if it has been added already or not exist at all!`, 
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
                            barcode_input.val('');
                            barcode_input.focus();
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
            "Scanning Items Stopped", 
            scanner_state.reason + scanner_state.default_error_suffix,
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

$(document).on('click', '.toggle-visibility', function(){
    let toggle = $(this);
    let element = $(this).parent().next().children("b");
    if(element.hasClass("opacity-0")){
        element.removeClass("opacity-0");
        element.addClass("opacity-1")
        toggle.addClass("slash")

        //now have to add the timer
        setTimeout(function(){
            if(element.hasClass("opacity-1")){
                element.removeClass("opacity-1");
                element.addClass("opacity-0");
                toggle.removeClass("slash");
            }
        }, 1000)
    }else{
        element.removeClass("opacity-1");
        element.addClass("opacity-0");
        toggle.removeClass("slash");
    }
    //console.log(element);
});

$(document).on('click', '.remove-item', function(){
    if(scanner_state.isEnabled){
                        //icon  //td      //tr
        let item_row = $(this).parent().parent();
        if(item_row){
            let item_barcode = item_row.attr("data-barcode");
            if(item_barcode){
                let sale_item = sale_data.find(item => item.barcode == item_barcode);
                if(sale_item){
                    let removed_data = sale_data.filter(item => item.barcode != item_barcode);
                    if(sale_data.length == (removed_data.length + 1)){
                        sale_data = removed_data;
                        stock_data.push(sale_item);

                        removeSale(sale_item)
                    }else{
                        scanner_state.isEnabled = false;
                        scanner_state.reason = 'Error at Remove Item: Sale Data and Removing Item Data are not matching';
                    }
                }else{
                    scanner_state.isEnabled = false;
                    scanner_state.reason = `Error at Remove Item: Unable to find item with barcode: <b>${item_barcode}</b> in the sale list`;
                }
            }else{
                scanner_state.isEnabled = false;
                scanner_state.reason = "Error at Remove Item: Unable to find barcode of item to remove in the sale list";
            }
        }else{
            scanner_state.isEnabled = false;
            scanner_state.reason = "Error at Remove Item: Unable to find sale item row to remove";
        }
    }

    //deliberately not using `else if` block
    if(!scanner_state.isEnabled){
        smallModal(
            "Error removing sale item",
            scanner_state.reason + scanner_state.default_error_suffix,
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

$('.ui.modal .content').on('click', '.message .close', function() {
    console.log(`close fired`)
    $(this)
      .closest('.message')
      .transition('fade')
    ;
});

$('.actions').on('click', '#checkItemExistBtn', function(){

    let modal_content = $(".ui.modal .content");
    let message_title = "Item not exist in Sale List";
    let message_content = "Item you're checking for is not exist in the sale list";
    let message_class = "negative";
    
    if(sale_data.find(item => item.barcode == barcode_input.val())){
        message_title = "Item Exist";
        message_content = "Item you're checking for is already in the sale list";
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
})

function updateSale(sale_item_){
    let item_index = sale_summary.findIndex(item => (item.shortcode == sale_item_.shortcode) && (item.unit_price == sale_item_.unit_price));

    if(item_index >= 0){
        let sale_summary_item_table_row = table_sale_summary_body.children(`tr[data-item=${sale_item_.shortcode}_${sale_item_.unit_price}]`);
        if(sale_summary_item_table_row){
            sale_summary[item_index].quantity = sale_summary[item_index].quantity + 1;
            sale_summary[item_index].total_price = sale_summary[item_index].total_price + sale_item_.unit_price;

            sale_summary_item_table_row.children(".quantity").text(sale_summary[item_index].quantity);
            sale_summary_item_table_row.children(".total_price").text(sale_summary[item_index].total_price);

        }else{
            scanner_state.isEnabled = false;
            scanner_state.reason = 'Error at updateSale(..): Unable to find current item row in Sale Summary Table';

            smallModal(
                "Error on Sale Summary Table", 
                scanner_state.reason + scanner_state.default_error_suffix,
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

    }else{
        sale_summary.push(
            {
                item: sale_item_.item,
                shortcode: sale_item_.shortcode,
                making_cost: sale_item_.making_cost,
                unit_price: sale_item_.unit_price,
                quantity: 1,
                sold_quantity: 0,
                total_price: sale_item_.unit_price
            }
        );

        table_sale_summary_body.append(`
            <tr data-item="${sale_item_.shortcode}_${sale_item_.unit_price}">
                <td class="slno collapsing"></td>
                <td class="item_shortcode">${sale_item_.item}[${sale_item_.shortcode}]</td>
                <td class="quantity right aligned collapsing">1</td>
                <td class="unit_price right aligned collapsing">${sale_item_.unit_price}</td>
                <td class="total_price right aligned collapsing">${sale_item_.unit_price}</td>
            </tr>
        `);
    }

    updateBilling(sale_item_);
}

function updateBilling(sale_item_, action="add"){
    
    if(action == "add"){
        billing.sub_total += sale_item_.unit_price;
        billing.making_cost += parseInt(sale_item_.making_cost);
    }else{
        billing.sub_total -= sale_item_.unit_price;
        billing.making_cost -= parseInt(sale_item_.making_cost);
    }

    //18% GST
    //billing.tax = parseFloat(((billing.sub_total * 18) / 100).toFixed(2));
    billing.tax = 0;
    billing.total = parseFloat((billing.sub_total + billing.tax).toFixed(2));

    table_sale_summary_foot.children("tr").children("#sub_total").text(billing.sub_total)
    table_sale_summary_foot.children("tr").children("#tax").text(billing.tax)
    table_sale_summary_foot.children("tr").children("#total").text(billing.total)
    
    table_sale_list_foot.children("tr").children("#sub_total").text(billing.sub_total)
    table_sale_list_foot.children("tr").children("#tax").text(billing.tax)
    table_sale_list_foot.children("tr").children("#total").text(billing.total)
}

function removeSale(sale_item_){
    let item_index = sale_summary.findIndex(item => (item.shortcode == sale_item_.shortcode) && (item.unit_price == sale_item_.unit_price));

    if(item_index >= 0){
        let sale_summary_item_table_row = table_sale_summary_body.children(`tr[data-item=${sale_item_.shortcode}_${sale_item_.unit_price}]`);
        let sale_list_item_table_row = table_sale_list_body.children(`tr[data-barcode=${sale_item_.barcode}]`);
        if(sale_summary_item_table_row){
            if(sale_list_item_table_row){
                sale_list_item_table_row.remove();
                table_sale_list.css("counter-reset", `DescendingSerial ${sale_data.length+1}`);

                if(sale_summary[item_index].quantity > 1){
                    sale_summary[item_index].quantity = sale_summary[item_index].quantity - 1;
                    sale_summary[item_index].total_price = sale_summary[item_index].total_price - sale_item_.unit_price;

                    sale_summary_item_table_row.children(".quantity").text(sale_summary[item_index].quantity);
                    sale_summary_item_table_row.children(".total_price").text(sale_summary[item_index].total_price);
                }else{
                    sale_summary_item_table_row.remove();
                    sale_summary = sale_summary.filter(function(item, index) {
                        return index !== item_index
                    });
                }
                updateBilling(sale_item_, "remove");
            }else{
                scanner_state.isEnabled = false;
                scanner_state.reason = 'Error at removeSale(..): Unable to find current item row in Sale List Table';
            }
        }else{
            scanner_state.isEnabled = false;
            scanner_state.reason = 'Error at removeSale(..): Unable to find current item row in Sale Summary Table';
        }
    }else{
        scanner_state.isEnabled = false;
        scanner_state.reason = 'Error at removeSale(..): Unable to find current item row in Sale Summary Data';
    }

    if(!scanner_state.isEnabled){
        smallModal(
            "Error on Sale Summary Table",
            scanner_state.reason + scanner_state.default_error_suffix,
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
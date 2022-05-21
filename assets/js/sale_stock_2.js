let add_item_form;
let add_item_btn;
let barcode_input;

let seller_dropdown;
let sale_type_dropdown;

let save_details_btn;
let edit_details_btn;
let sale_stock_btn;

let selected_seller_id;
let selected_seller_name;

let custom_fields;
let custom_name;
let custom_id;

let customer_name;
let customer_village;
let customer_details;

let selected_sale_type;

let stock_data = [];

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

let stop_adding_items = false;
let stop_adding_items_info = `Due to error in sale summary table adding more items has been stopped</br>Kindly sale items as of now</br>Add further items in next session...`;

let table_sale_summary;
let table_sale_summary_body;
let table_sale_summary_foot;

let table_sale_list;
let table_sale_list_body;
let table_sale_list_foot;

let success_notification;
let success_notification_src;
let error_notification;

$(function(){

    $("span#date").text(getCurrentDate("dmy"));

    add_item_form = $("#add_item_form");
    add_item_btn = $("#add_item_btn");
    barcode_input = $("#barcode_input");

    seller_dropdown = $(".dropdown.seller-dropdown"); //$("#seller_dropdown");
    sale_type_dropdown = $(".dropdown.sale-type-dropdown"); //$("#sale_type_dropdown");

    custom_fields = $("#custom_fields");
    custom_name = $("#custom_name");
    custom_id = $("#custom_id");

    custom_fields.hide();

    customer_name = $("#customer_name");
    customer_village = $("#customer_village");
    customer_details = $("#customer_details");


    save_details_btn = $("#save_details_btn");
    edit_details_btn = $("#edit_details_btn");
    sale_stock_btn = $("#sale_stock_btn");

    add_item_form.addClass("disabled");
    add_item_btn.addClass("disabled");
    edit_details_btn.hide();
    sale_stock_btn.hide();

    table_sale_summary = $("#sale-summary");
    table_sale_summary_body = table_sale_summary.children("tbody")
    table_sale_summary_foot = table_sale_summary.children("tfoot")

    table_sale_list = $("#sale-list");
    table_sale_list_body = table_sale_list.children("tbody")
    table_sale_list_foot = table_sale_list.children("tfoot")

    success_notification = $("#success_notification")[0];
    success_notification_src = $(success_notification).attr('src');
    error_notification = $("#error_notification")[0];

    initLoadStock();

    initSellersOpts();

    sale_type_dropdown.dropdown({
        onChange: saleTypeOnChange
        }
    );

    save_details_btn.on('click', function(){
        let selected_seller_text = seller_dropdown.dropdown('get text');
        let selected_sale_type_text = sale_type_dropdown.dropdown('get text');
        if(selected_seller_text == "Select Seller"){
            smallModal(
                "Seller Not Selected", 
                "Select a Seller", 
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
        }else if(selected_sale_type_text == "Select Sale Type"){
            smallModal(
                "Sale Type Not Selected", 
                "Select a Sale Type", 
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
        }else{
            add_item_form.removeClass("disabled");
            add_item_btn.removeClass("disabled");

            custom_id.parent().addClass("disabled");
            custom_name.parent().addClass("disabled");

            seller_dropdown.addClass("disabled");
            sale_type_dropdown.addClass("disabled");
            
            customer_name.parent().addClass("disabled");
            customer_village.parent().addClass("disabled");
            customer_details.parent().addClass("disabled");
            
            save_details_btn.hide();

            edit_details_btn.show();
            sale_stock_btn.show();
        }
    });

    edit_details_btn.on('click', function(){
        add_item_form.addClass("disabled");
        add_item_btn.addClass("disabled");

        custom_id.parent().removeClass("disabled");
        custom_name.parent().removeClass("disabled");

        save_details_btn.show();
        seller_dropdown.removeClass("disabled");
        customer_name.parent().removeClass("disabled");
        customer_village.parent().removeClass("disabled");
        customer_details.parent().removeClass("disabled");

        edit_details_btn.hide();
        sale_stock_btn.hide();
    })

    sale_stock_btn.on('click', function(){
        if(!selected_seller_id || !selected_seller_name){
            smallModal(
                "Something went wrong!", 
                "Seller not selected, click on edit details and reselect seller", 
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
        }else if(!selected_sale_type){
            smallModal(
                "Something went wrong!", 
                "Sale Type not selected", 
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
        }else if(!sale_data.length){
            smallModal(
                "Empty Sale Data!", 
                "No items are added to sale",
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
        }else{
            offer_dialogue();
        }
    });

    add_item_form
    .form({
		onSuccess: function(event, fields){
            event.preventDefault();
            if(add_item_form.hasClass("disabled")){
                play_error_notification();
                    smallModal(
                        "Adding Items Disabled!", 
                        "It seems you're not saved details, save details then proceed with adding items...",
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
});

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

function offer_dialogue(){
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
                sale_items();
                return true;
            },
            onDeny: function(){
                remove_offer();
                return true;
            }
        }
    );
}

function sale_items(){
    data_param = {
        action: "sale_items",
        seller_id: selected_seller_id,
        seller_name: selected_seller_name,
        custom_id: custom_id.val(),
        custom_name: custom_name.val(),
        customer_name: customer_name.val(),
        customer_village: customer_village.val(),
        customer_details: customer_details.val(),
        sale_type: selected_sale_type,
        store_id: "",
        store_name: "",
        data: {summary: sale_summary, list: sale_data, billing: billing}
    }

    ajaxPostCall('lib/sale_stock.php', data_param, function(response){

        console.log(response);

        let modal_body; let modal_title = "Parsing Item Data Error";
        if(response.status){
            modal_body = response.status + ": " + response.statusText;
        }else if(response.title){
            modal_title = response.title;
            modal_body = response.content;
        }else if(response.result){
            smallModal(
                "Items Sale Successful",
                `
                <p>Invoice Id#: <b>${response.invoice_id}</b></p>
                <p>Total No.# of items are sold <b>${sale_data.length}</b></p>
                <table>
                    <tr>
                        <td>Total Price of</td>
                        <td><b>${billing.total.toFixed(2)}</b></td>
                    </tr>
                    <tr>
                        <td>Total Making Cost of</td>
                        <td><b>${billing.making_cost.toFixed(2)}</b></td>
                    </tr>
                    <tr>
                        <td>Profit of</td>
                        <td><b>${(billing.total-billing.making_cost).toFixed(2)}</b></td>
                    </tr>
                    <tr>
                        <td>Offer ${billing.offer_percentage}%</td>
                        <td><b>${billing.offer_amount}</b></td>
                    </tr>
                </table>
                `,
                [
                    {
                        "class": "ui approve medium violet button",
                        "id": "printInvoiceSummaryBtn",
                        "text": "Print Invoice Summary",
                    },
                    {
                        "class": "ui approve pink button",
                        "id": "printInvoiceListBtn",
                        "text": "Print Invoice List",
                    },
                    {
                        "class": "ui negative deny button",
                        "id": "modalCloseBtn",
                        "text": "Close",
                    }
                ], 
                {
                    closable: false,
                    onApprove: function(e){
                        let buttonId = e.attr('id');
                        if(buttonId == "printInvoiceSummaryBtn"){
                            $("#printInvoiceSummaryBtn").addClass("loading");
                            printInvoice($("#sale-summary").parent(), "summary", response, function(isCompleted){
                                $("#printInvoiceSummaryBtn").removeClass("loading");
                            });
                        }else if(buttonId == "printInvoiceListBtn"){
                            $("#printInvoiceListBtn").addClass("loading");
                            printInvoice($("#sale-list").parent(), "list", response, function(isCompleted){
                                $("#printInvoiceListBtn").removeClass("loading");
                            });
                        }else{}
                        return false;
                    },
                    onDeny: function(){
                        $("#modalCloseBtn").addClass("loading");
                        window.location.replace(getCurrentPage());
                        return false;
                    }
                }
            );
        }else{
            modal_body = response.info;
        }

        if(modal_body){
            smallModal(
                modal_title, 
                modal_body, 
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
    });
}

function add_item(){
    if(!stop_adding_items){
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
                    smallModal(
                        "Something went wrong!", 
                        "Stock Data and Sale Data not matching", 
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
            "Adding more items for sale has been stopped!", 
            stop_adding_items_info,
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
    console.log(element);
});

$(document).on('click', '.remove-item', function(){

    let modal_title = "Error removing sale item";
    let modal_content;

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
                    modal_content = "Sale Data and Removing Item Data are not matching</br>Kindly perform sale ASAP";
                }
            }else{
                modal_content = `Unable to find item with barcode: <b>${item_barcode}</b> in the sale list </br>Something is incorrect kindly stop adding/removing items and perform sale ASAP`;
                stop_adding_items = true;
                stop_adding_items_info = modal_content;
            }
        }else{    
            modal_content = "Unable to find barcode of item to remove";
        }
    }else{
        modal_content = "Unable to find sale item row to remove";
    }

    if(modal_title && modal_content){
        smallModal(
            modal_title,
            modal_content,
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
            stop_adding_items = true;

            smallModal(
                "Error on Sale Summary Table!", 
                `Unable to find current item row in Sale Summary Table</br>Kindly stop adding more items and sale items as of now`,
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

    let modal_title = "Error on Sale Summary Table!";
    let modal_content;

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
                stop_adding_items = true;
                stop_adding_items_info = `Unable to find current item row in Sale List Table</br>Kindly stop adding/removing items and sale items ASAP`;    
            }
        }else{
            stop_adding_items = true;
            stop_adding_items_info = `Unable to find current item row in Sale Summary Table</br>Kindly stop adding/removing items and sale items ASAP`;
            modal_content = stop_adding_items_info;
        }
    }else{
        stop_adding_items = true;
        stop_adding_items_info = `Unable to find current item to remove in Sale Summary Data</br>So, Kindly stop adding/removing items and sale items ASAP`;
        modal_content = stop_adding_items_info;
    }

    if(modal_content){
        smallModal(
            modal_title,
            modal_content,
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

function initLoadStock(){
    ajaxPostCall("lib/warehouse_stock_reports.php", {action: "fetch_all", data: ["something_random"]}, function(response){
        let modal_title = "Loading Stock Error";
        let modal_body = null;

        if(response.status){
            modal_body = response.status + ": " + response.statusText;
        }else if(response.title){
            modal_title = response.title;
            modal_body = response.content;
        }else if(response.result){
            stock_data = response.data;
        }else{
            modal_body = "Something went wrong on backend connection";
        }

        if(modal_body){
            smallModal(
                modal_title, 
                modal_body, 
                [
                    {
                        "class": "ui positive approve button",
                        "id": "",
                        "text": "Reload",
                    }
                ], 
                {
                    closable: false,
                    onApprove: function(){
                        window.location.replace(getCurrentPage());
                        return false;
                    }
                }
            );    
        }
    });
}

function initSellersOpts(){
    seller_dropdown.addClass("loading");

    ajaxPostCall("lib/sellers.php", {action: "fetch_all", data: 'random_string'}, function(response){
        let modal_title = "Parsing Sellers Options error";
        let modal_body = null;

        if(response.status){
            modal_body = response.status + ": " + response.statusText;
        }else if(response.title){
            modal_title = response.title;
            modal_body = response.content;
        }else if(response.result){
            let optArr = [{value: 's0', name: 'custom(s0)'}];
            $.each(response.data, function(){
                optArr.push({
                    value: this.seller_id,
                    name: `${this.seller_name}(${this.seller_id})`
                });
            });

            seller_dropdown.dropdown({values: optArr, onChange: sellerOnChange});
        }else{
            modal_body = "Something went wrong on backend connection";
        }

        if(modal_body){
            smallModal(
                modal_title, 
                modal_body, 
                [
                    {
                        "class": "ui positive approve button",
                        "id": "",
                        "text": "Reload",
                    }
                ], 
                {
                    closable: false,
                    onApprove: function(){
                        window.location.replace(getCurrentPage());
                        return false;
                    }
                }
            );    
        }
        
        seller_dropdown.removeClass("loading");
    });
}

function saleTypeOnChange(value, text, choice){
    selected_sale_type = value;
}

function sellerOnChange(value, text, choice){
    console.log(value, text, choice)

    selected_seller_id = value;
    selected_seller_name = text.substring(0, text.indexOf("("));

    if(selected_seller_id == "s0"){
        custom_fields.show();
        custom_id.parent().removeClass("disabled")
        custom_name.parent().removeClass("disabled")
    }else{
        custom_id.val('')
        custom_name.val('')

        custom_fields.hide();
        custom_id.parent().addClass("disabled")
        custom_name.parent().addClass("disabled")   
    }
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
    }else if(barcode_input.is(":focus") && add_item_form.hasClass("disabled")){
        play_error_notification();
        add_item_form.submit(); //which will trigger and shows modal and plays error
    }else if(!(
            barcode_input.is(":focus")
        ||  custom_name.is(":focus") 
        ||  custom_id.is(":focus")
        ||  customer_name.is(":focus")
        ||  customer_village.is(":focus")
        ||  customer_details.is(":focus")
        ||  $("#input_offer_percentage").is(":focus")
        ||  $("#input_offer_amount").is(":focus")
    )
    ){
        play_error_notification();
        smallModal(
            "Focus is not on Barcode Field!", 
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



/*
function scan_items_manually(){
	
	let excel_data = ["0702MCHP557", "0702MCHP573", "0702MCHP558", "0702MCHP559", "0702MCHP560", "0702MCHP550", "0702MCHP546", "0702MCHP545", "0702PNT1075", "0702PNT1055", "07022KR10161", "07022KR10155", "07022KR10151", "07022KR10173", "07022KR10169", "07022KR10181", "07022KR10165", "07022KR10177", "07022KR10159", "07022KR10179", "07021BN1012", "07021BN1013", "07021BN1015", "07021BN1011", "07021BN1017", "07021BN1016", "07022KR10163", "0702MCH1062", "0702MCH1066", "0702MCH1067", "0702MCH1039", "0702MCH1073", "0702MCH1072", "0702MCH1071", "0702MCH1070", "0702MCH1054", "0702MCH1068", "0702MCH1061", "0702MCH1055", "0702MCH1063", "0702MCH1059", "0702MCH1064", "0702MCH1065", "0702BOON515", "0702BOON5112", "0702BOON5118", "0702BOON566", "0702BOON524", "0702BOON561", "0702BOON579", "0702BOON5119", "0702BOON558", "0702BOON5115", "0702BOON583", "0702BOON564", "0702BOON5120", "0702BOON534", "0702BOON578", "07025KAR235", "07025KAR258", "07025KAR257", "07025KAR249", "07025KAR248", "07025KAR260", "07025KAR279", "07025KAR247", "07025KAR2101", "07025KAR230", "07025KAR228", "07025KAR2114", "07025KAR283", "07025KAR281", "07025KAR25", "07025KAR288", "07025KAR295", "07025KAR2104", "0702WBATA83", "07025KAR238", "07025KAR2105", "07025KAR2120", "07025KAR2109", "07025KAR292", "07025KAR220", "07025KAR2113", "07025KAR266", "07025KAR239", "0702WBATA30", "0702WBATA32", "0702WBATA89", "0702WBATA91", "0702WBATA33", "0702WBATA34", "0702WBATA40", "0702WBATA39", "07025KAR294", "07025KAR290", "07025KAR293", "0702WBATA28", "0702WBATA27", "0702WBATA110", "0702CHEN535", "0702WBATA23", "0702CHEN582", "0702WBATA108", "0702WBATA90", "07025KAR272", "0702CHEN5126", "0702WBATA64", "0702WBATA63", "07025KAR267", "07025KAR2110", "0702WBATA92", "0702WBATA26", "0702KCHE551", "0702WBATA135", "0702WBATA41", "0702WBATA29", "0702WBATA116", "0702CHEN528", "0702KCHE5103", "0702WBATA112", "0702CHEN558", "0702CHEN58", "0702CHEN556", "0702CHEN585", "0702CHEN521", "0702CHEN513", "0702CHEN544", "0702CHEN5124", "0702CHEN5156", "0702CHEN537", "0702CHEN529", "0702CHEN546", "0702CHEN5155", "0702CHEN5154", "0702CHEN5127", "0702CHEN5152", "0702CHEN547", "07025KAR2106", "0702CHEN563", "0702CHEN580", "0702CHEN5125", "0702CHEN538", "0702CHEN551", "0702CHEN598", "0702CHEN53", "0702CHEN523", "0702CHEN545", "0702CHEN5153", "0702CHEN5121", "0702WBATA111", "0702KCHE596", "0702KCHE5136", "0702KCHE59", "0702WBATA136", "0702KCHE573", "0702KCHE581", "0702KCHE5134", "0702KCHE5123", "0702KCHE549", "0702KCHE5115", "0702KCHE578", "0702KCHE572", "0702KCHE5112", "0702KCHE5106", "0702KCHE5122", "0702KCHE58", "0702KCHE594", "0702KCHE569", "0702KCHE540", "0702KCHE5105", "0702PNUT5130", "0702PNUT5125", "0702PNUT545", "0702PNUT523", "0702PNUT5133", "0702PNUT5140", "0702PNUT510", "0702PNUT551", "0702PNUT581", "0702KCHE5127", "0702PNUT588", "0702PNUT532", "0702PNUT5131", "0702PNUT5121", "0702PNUT5122", "0702PNUT5143", "0702PNUT5136", "0702PNUT517", "0702PNUT5135", "0702PNUT520", "0702PNUT537", "0702PNUT555", "07021KR2068", "07021KR2083", "07022KR4O24", "07022KR4O74", "07022KR4O69", "07022KR4O71", "07022KR4O70", "07022KR4O72", "07022KR4O49", "07022KR4O68", "07022KR4O10", "07022KR4O44", "07022KR4O62", "07022KR4O66", "07022KR4O84", "07022KR4O15", "07022KR4O79", "07022KR4O12", "07022KR4O11", "07022KR4O57", "07022KR4O60", "07022KR4O75", "07022KR4O13", "07022KR4O38", "07022KR4O30", "07022KR4O4", "07022KR4O80", "07022KR4O73", "07022KR4O61", "07022KR4O82", "07022KR4O23", "07021KR2079", "07021KR2062", "07021KR2064", "07021KR2077", "07021KR2038", "07021KR2026", "07021KR2025", "07021KR2096", "07022KR4O58", "07021KR2052", "07021KR2028", "07021KR201", "07021KR2027", "07021KR2012", "07021KR2074", "07021KR2023", "07021KR2078", "07021KR2090", "07021KR209", "07021KR2010", "07021KR2081", "07021KR2029", "07021KR2051", "07021KR2080", "07021KR207", "07021KR2073", "07021KR2019", "07021KR2017", "07021KR2065", "0702MRKL59", "0702MRKL55", "0702MRKL510", "0702MRKL54", "0702JOX114", "0702JOX113", "0702MRKL512", "0702FRU303", "0702FRU301", "0702FRUMK9", "0702FRUMK1", "0702MGL505", "0702MGL502", "0702CHINT2", "0702FRUMK7", "0702GRNAP1", "0702BBUN53", "0702CFRES15", "0702CFRES18", "0702CCNTM3", "0702CFRES25", "0702CCNTM10", "0702PANDA5", "0702MRRY18", "0702MRRY114", "0702MRRY12", "0702FRUPP2", "0702CYCLE7", "0702JLYBX1", "0702CHINT7", "0702DUBAI1", "0702CYCLE9", "0702SPRBT14", "0702JLYBX3", "0702PANDA2", "0702TYCSP2", "0702DNCBT5", "0702DNCBT2", "0702STR1J12", "0702STR1J2", "0702STR1J1", "0702KRCN25", "0702KRCN26", "0702FSTIK10", "0702BRMT112", "0702RYMK512", "0702RYMK510", "0702RYMK59", "0702TRYME9", "0702TRYME17", "0702SKA5J5", "0702SKA5J4", "0702SKA5J7", "0702MNRIP2", "0702UNLMD20", "0702UNLMD10", "0702IM20024", "0702IM20023", "0702IM20021", "0702IM20022", "0702TRUFL8", "0702TRUFL15", "0702PPDR11", "0702BTATU56", "0702BTATU51", "0702BTATU52", "0702BTATU55", "0702CRACK14", "0702CRACK2", "0702CRACK7", "0702CRACK24", "0702FRMT24", "0702ECL1J12", "0702ECL1J5", "0702FRMT27", "0702ECL1J14", "0702ECL1J10", "0702BRMT19", "0702BRMT14", "0702BRMT17", "0702BRMT123", "0702BRMT115", "0702SLXL51", "0702SLXL53", "0702SNPD228", "0702SNPD213", "0702SNPD211", "0702SNPD216", "0702PPP485", "0702PPP481", "07021SPDJ3", "07021SPDJ10", "07021SPDJ8", "07021SPDJ9", "0702BSTIC7", "0702BSTIC8", "0702BSTIC6", "0702HON2423", "0702HON2433", "0702HON247", "0702ECL1P13", "0702ECL1P12", "0702GRNAP4", "0702KCHAM7", "0702KCHAM5", "0702MDOUB3", "0702MDOUB8", "0702KPEDA2", "0702KPEDA1", "0702RNLPP8", "07021RAVL9", "0702RNLPP7", "0702RNLPP10", "07021RAVL6", "07021RAVL11", "07021RAVL8", "0702HTCLT19", "0702RNLPP1", "0702WATCH17", "0702WATCH26", "0702WATCH28", "0702HTCLT11", "0702PPTJ54", "0702PPTJ52"];
	
    $.each(excel_data, function(){
        console.log(this);
        barcode_input.val(this)
        add_item_btn.click();
    })
}
*/
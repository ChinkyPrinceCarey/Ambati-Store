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

let stock_data;
let sale_data;

let table_sale_summary;
let table_sale_list;

$(function(){

    $("span#date").text(getCurrentDate("dmy"));

    table_sale_list = $("#sale-list");
    table_sale_summary = $("#sale-summary");
    
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

    edit_details_btn.hide();
    sale_stock_btn.hide();

    initValues();

    initSellersOpts();

    sale_type_dropdown.dropdown({
        onChange: saleTypeOnChange
        }
    );

    save_details_btn.on('click', function(){
        let selected_seller_text = seller_dropdown.dropdown('get text');
        let selected_sale_type_text = sale_type_dropdown.dropdown('get text');
        if(selected_seller_text == "Select Seller"){

            scanner_state.isEnabled = false;
            scanner_state.reason = 'Seller not selected';

            smallModal(
                scanner_state.reason, 
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

            scanner_state.isEnabled = false;
            scanner_state.reason = 'Sale Type not selected';

            smallModal(
                scanner_state.reason,
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
            scanner_state.isEnabled = true;
            scanner_state.reason = 'Details are saved';

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
        scanner_state.isEnabled = false;
        scanner_state.reason = 'Details are not saved after clicking on edit';

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
        }else if(!sale_data.data.length){
            smallModal(
                "Empty Sale Data", 
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
            offer_dialogue(sale_items);
        }
    });
});

function initValues(){
    stock_data = {
        data: [],
        data_table: false,
        summary: false,
        summary_table: false,
        billing: false,
        sale_obj: true
    }

    sale_data = {
        data: [],
        data_table: true,
        summary: true,
        summary_table: true,
        billing: true,
        stock_obj: true
    }

    sale_data.data_table = table_sale_list;
    sale_data.summary_table = table_sale_summary;

    stock_data = {...stock_data, ...stock_obj_methods};
    sale_data = {...sale_data, ...sale_obj_methods};

    stock_data.sale_obj = sale_data;
    sale_data.stock_obj = stock_data;

    initLoadStock();

    scanner_data = {
        method(action, barcode){
            stock_data.update_data(action, barcode);
        },
        checkItem(barcode){
            sale_data.isItemExist(barcode);
        }
    }
}

function sale_items(){
    data_param = {
        no_of_vars: calculateNoOfVars(),
        action: "sale_items",
        seller_id: selected_seller_id,
        seller_name: selected_seller_name,
        custom_id: custom_id.val(),
        custom_name: custom_name.val(),
        customer_name: customer_name.val(),
        customer_village: customer_village.val(),
        customer_details: customer_details.val(),
        sale_type: selected_sale_type,
        vehicle_id: "",
        vehicle_name: "",
        data: {summary: sale_data.summary, list: sale_data.data, billing: sale_data.billing}
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
                <p>Total No.# of items are sold <b>${sale_data.data.length}</b></p>
                <table>
                    <tr>
                        <td>Total Price of</td>
                        <td><b>${sale_data.billing.total.toFixed(2)}</b></td>
                    </tr>
                    <tr>
                        <td>Total Making Cost of</td>
                        <td><b>${sale_data.billing.making_cost.toFixed(2)}</b></td>
                    </tr>
                    <tr>
                        <td>Profit of</td>
                        <td><b>${(sale_data.billing.total - sale_data.billing.making_cost).toFixed(2)}</b></td>
                    </tr>
                    <tr>
                        <td>Offer ${sale_data.billing.offer_percentage}%</td>
                        <td><b>${sale_data.billing.offer_amount}</b></td>
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

    sale_type_dropdown.dropdown('set text', 'Retailer');
    selected_sale_type = 'retailer';
}

/*begin: OFFER */
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
            sale_data.billing.offer_percentage = offer_percentage;
            sale_data.billing.offer_amount = offer_amount;
            
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

    sale_data.billing.offer_percentage = 0;
    sale_data.billing.offer_amount = 0;

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

    let making_cost = parseInt(sale_data.billing.making_cost);
    let sub_total = parseInt(sale_data.billing.sub_total);
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
                <td><b>${sale_data.summary.length}</b></td>
            </tr>
            <tr>
                <td>Total No.of. Units</td>
                <td><b>${sale_data.data.length}</b></td>
            </tr>
            <tr><td colspan="2"></td></tr>
            <tr>
                <td>Total Making Cost <i class="toggle-visibility eye icon"></i></td>
                <td><b class="opacity-0">${sale_data.billing.making_cost}</b></td>
            </tr>
            <tr>
                <td>Sub Total</td>
                <td><b>${sale_data.billing.sub_total}</b></td>
            </tr>
            <tr>
                <td>Tax</td>
                <td><b>${sale_data.billing.tax}</b></td>
            </tr>
            <tr>
                <td>Total</td>
                <td><b>${sale_data.billing.total}</b></td>
            </tr>
            <tr>
                <td>Profit <i class="toggle-visibility eye icon"></i></td>
                <td><b class="opacity-0">${sale_data.billing.total - sale_data.billing.making_cost}</b></td>
            </tr>
            <tr><td colspan="2"></td></tr>
        </table>
        </br>
        <div class="ui form" id="offer_form">
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
/*end: OFFER */
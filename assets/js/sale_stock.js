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
            scanner_data.offer_dialogue();
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
        },
        offer_dialogue(){
            offer_dialogue(sale_items, sale_data, true);
        },
        evaluateOffer(input_id){
            evaluateOffer(input_id, sale_data);
        },
        apply_offer(){
            apply_offer(sale_data, table_sale_summary, table_sale_list);
        },
        remove_offer(){
            remove_offer(sale_data);
        }
    }
}

function sale_items(){
    data_param = {
        //no_of_vars: calculateNoOfVars(),
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
        data: JSON.stringify({summary: sale_data.summary, list: sale_data.data, billing: sale_data.billing})
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
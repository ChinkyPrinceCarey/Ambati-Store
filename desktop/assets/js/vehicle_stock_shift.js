let vehicle_dropdown;
let selected_vehicle_id;
let selected_vehicle_name;

let selected_sale_type;

let save_details_btn;
let edit_details_btn;
let sale_stock_btn;

let stock_data;

let input_invoice_id;
let input_invoice_date;
let input_total_units;

let vehicle_invoice;

let earlier_invoice_table_summary;
let earlier_invoice_table_list;
let earlier_invoice;

let current_invoice_table_summary;
let current_invoice_table_list;
let current_invoice_table_billing;
let current_invoice;

let final_invoice_table_summary;
let final_invoice_table_list;
let final_invoice_table_billing;
let final_invoice;

$(function(){

    $("span#date").text(getCurrentDate("dmy"));

    input_invoice_id = $("#invoice_id");
    input_invoice_date = $("#invoice_date");
    input_total_units = $("#total_units");

    earlier_invoice_table_summary = $("#earlier_invoice .card .wrapper div table#sale-summary");
    earlier_invoice_table_list = $("#earlier_invoice .card .wrapper div table#sale-list");

    current_invoice_table_summary = $("#current_invoice .card .wrapper div table#sale-summary");
    current_invoice_table_list = $("#current_invoice .card .wrapper div table#sale-list");
    current_invoice_table_billing = current_invoice_table_summary.children('tfoot')
                                    .add(current_invoice_table_list.children('tfoot'))

    final_invoice_table_summary = $("#final_invoice .card .wrapper div table#sale-summary");
    final_invoice_table_list = $("#final_invoice .card .wrapper div table#sale-list");
    final_invoice_table_billing =   final_invoice_table_summary.children('tfoot')
                                    .add(final_invoice_table_list.children('tfoot'))

    vehicle_dropdown = $(".dropdown.vehicle-dropdown");
    initVehicles();

    selected_sale_type = "vehicle";

    save_details_btn = $("#save_details_btn");
    edit_details_btn = $("#edit_details_btn");
    sale_stock_btn = $("#sale_stock_btn");

    edit_details_btn.hide();
    sale_stock_btn.hide();

    resetData();

    save_details_btn.on('click', function(){
        if(isVehicleSelected()){
            resetData();
            fetchVehicleInvoice();
        }else{

            scanner_state.isEnabled = false;
            scanner_state.reason = 'Vehicle not selected';

            smallModal(
                scanner_state.reason, 
                "Select a Vehicle", 
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

    edit_details_btn.on('click', function(){
        scanner_state.isEnabled = false;
        scanner_state.reason = 'Vehicle not selected after clicking on edit';

        resetData();

        save_details_btn.show();
        vehicle_dropdown.removeClass("disabled");

        edit_details_btn.hide();
        sale_stock_btn.hide();
    })

    sale_stock_btn.on('click', function(){
        if(!isVehicleSelected()){
            smallModal(
                "Something went wrong!", 
                "Vehicle not selected, click on edit details and reselect vehicle", 
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
        }else if(!current_invoice.data.length){
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
            scanner_data.offer_dialogue(sale_items, current_invoice, false);
        }
    });
});

function initValues(){
    vehicle_invoice = {};

    stock_data = {
        data: [],
        data_table: false,
        summary: false,
        summary_table: false,
        billing: false,
        sale_obj: true
    }

    earlier_invoice = {
        data: [],
        data_table: false,
        summary: false,
        summary_table: false,
        billing: false
    }

    current_invoice = {
        data: [],
        data_table: true,
        summary: true,
        summary_table: true,
        billing: true,
        stock_obj: true
    }

    final_invoice = {
        data: [],
        data_table: true,
        summary: true,
        summary_table: true,
        billing: true,
        stock_obj: true
    }

    stock_data = {...stock_data, ...stock_obj_methods};    

    current_invoice = {...current_invoice, ...sale_obj_methods};
    current_invoice.data_table = current_invoice_table_list;
    current_invoice.summary_table = current_invoice_table_summary;

    final_invoice = {...final_invoice, ...sale_obj_methods};
    final_invoice.data_table = final_invoice_table_list;
    final_invoice.summary_table = final_invoice_table_summary;

    current_invoice.stock_obj = stock_data;
    stock_data.sale_obj = current_invoice;

    initLoadStock();

    scanner_data = {
        method(action, barcode){

            let final_invoice_action = action == "add" ? "remove" : "add";
            let item = stock_data.update_data(action, barcode)

            if(item){
                final_invoice.update_data(final_invoice_action, item, false);
            }
        },
        checkItem(barcode){
            current_invoice.isItemExist(barcode);
        },
        offer_dialogue(){
            offer_dialogue(sale_items, current_invoice, false);
        },
        evaluateOffer(input_id){
            evaluateOffer(input_id, current_invoice);
        },
        remove_offer(){
            remove_offer(current_invoice);
        }
    }
}

function initVehicles(){
    vehicle_dropdown.addClass("loading");

    ajaxPostCall(`${LIB_API_ENDPOINT}/vehicles.php`, {action: "fetch_all", data: ["something_random"]}, function(response){
        let modal_title = "Loading Vehicles Error";
        let modal_body = null;

        if(response.status){
            modal_body = response.status + ": " + response.statusText;
        }else if(response.title){
            modal_title = response.title;
            modal_body = response.content;
        }else if(response.result){
            let optArr = [];
            $.each(response.data, function(){
                optArr.push({
                    value: this.vehicle_id,
                    name: `${this.vehicle_name}(${this.vehicle_id})`
                });
            });

            vehicle_dropdown.dropdown({values: optArr, onChange: vehicleOnChange});
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

        vehicle_dropdown.removeClass("loading");
    });
}

function isVehicleSelected(){
    return  (
                    selected_vehicle_id  
                &&  selected_vehicle_name  
                &&  (vehicle_dropdown.dropdown('get text') == `${selected_vehicle_name}(${selected_vehicle_id})`)
            )
}

function fetchVehicleInvoice(){
    data_param = {
        action: "fetch_vehicle_invoice",
        vehicle_id: selected_vehicle_id,
        vehicle_name: selected_vehicle_name,
        data: "some_data"
    }

    ajaxPostCall(`${LIB_API_ENDPOINT}/vehicles.php`, data_param, function(response){
        let modal_body; let modal_title = "Parsing Vehicle Invoice Error";
        if(response.status){
            modal_body = response.status + ": " + response.statusText;
        }else if(response.title){
            modal_title = response.title;
            modal_body = response.content;
        }else if(response.result){
            //two types of results
            //1. a invoice id already created
            //2. no invoice id is exist; has to be created
            if(response.data.length <= 1){
                //correct invoice
                vehicle_invoice = response.data;
                initVehicleInvoice();

                scanner_state.isEnabled = true;
                scanner_state.reason = 'Vehicle selected and invoice fetched and it is saved';

                current_invoice.cookie_name = `stock_shift_${selected_vehicle_name}[${selected_vehicle_id}]`;
                current_invoice.initCookieData();

                vehicle_dropdown.addClass("disabled");

                save_details_btn.hide();

                edit_details_btn.show();
                sale_stock_btn.show();
            }else{
                //more than 1 invoice must be error
                modal_body = "something wrong with vehicle invoice";
                save_details_btn.addClass("disabled");
            }

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

function resetData(){
    input_invoice_id.val('');
    input_invoice_date.val('');
    input_total_units.val('');

    initValues();

    $("table tbody").empty('')

    $("table tfoot tr #sub_total").text('')
    $("table tfoot tr #tax").text('')
    $("table tfoot tr #total").text('')
}

function initVehicleInvoice(){
    if(vehicle_invoice.length == 0){
        //create invoice
        //hide earlier and current invoice
        //show only final invoice
        vehicle_invoice.invoice_id = null;
        vehicle_invoice.id = null;
    }else if(vehicle_invoice.length == 1){
        //init invoice
        vehicle_invoice = vehicle_invoice[0];

        input_invoice_id.val(vehicle_invoice.invoice_id);
        input_invoice_date.val(vehicle_invoice.date);
        input_total_units.val(vehicle_invoice.no_of_units);

        /*
        //changing `list` property name to `data` 
        const { list: data, ...otherProps } = earlier_invoice;
        earlier_invoice = { data, ...otherProps };
        */

        earlier_invoice.data = JSON.parse(JSON.stringify(vehicle_invoice.items_details.list));
        earlier_invoice.summary = JSON.parse(JSON.stringify(vehicle_invoice.items_details.summary));
        earlier_invoice.billing = JSON.parse(JSON.stringify(vehicle_invoice.items_details.billing));

        final_invoice.data = JSON.parse(JSON.stringify(earlier_invoice.data));
        final_invoice.summary = JSON.parse(JSON.stringify(earlier_invoice.summary));
        final_invoice.billing = JSON.parse(JSON.stringify(earlier_invoice.billing));

        /* ---begin: updating UI---- */
        
        $("#earlier_invoice").addClass("loading");
        $("#final_invoice").addClass("loading");
        /* -------------------- Summary -------------------- */
        for(let item of earlier_invoice.summary){
            earlier_invoice_table_summary
            .children("tbody")
            .append(`
                <tr data-item="${item.shortcode}_${item.unit_price}">
                    <td class="slno collapsing"></td>
                    <td class="item_shortcode">${item.item}[${item.shortcode}]</td>
                    <td class="quantity right aligned collapsing">${item.quantity}</td>
                    <td class="unit_price right aligned collapsing">${item.unit_price}</td>
                    <td class="total_price right aligned collapsing">${item.total_price}</td>
                </tr>
            `)
        }

        earlier_invoice_table_summary.children('tfoot').children("tr").children("#sub_total").text(earlier_invoice.billing.sub_total)
        earlier_invoice_table_summary.children('tfoot').children("tr").children("#tax").text(earlier_invoice.billing.tax)
        earlier_invoice_table_summary.children('tfoot').children("tr").children("#total").text(earlier_invoice.billing.total)

        /* -------------------- List -------------------- */
        for(let item of earlier_invoice.data){
            earlier_invoice_table_list
            .children("tbody")
            .append(`
                <tr data-barcode="${item.barcode}">
                    <td class="collapsing"></td>
                    <td>${item.item}[${item.shortcode}]</td>
                    <td>${item.barcode}</td>
                    <td class="right aligned collapsing">${item.unit_price}</td>
                    <td class="right aligned collapsing">
                        <!--<i class="large trash icon remove-item"></i>-->
                    </td>
                </tr>
            `)
        }

        earlier_invoice_table_list.children('tfoot').children("tr").children("#sub_total").text(earlier_invoice.billing.sub_total)
        earlier_invoice_table_list.children('tfoot').children("tr").children("#tax").text(earlier_invoice.billing.tax)
        earlier_invoice_table_list.children('tfoot').children("tr").children("#total").text(earlier_invoice.billing.total)
        
        earlier_invoice_table_list
        .add(final_invoice_table_list)
        .css("counter-reset", `DescendingSerial ${earlier_invoice.data.length+1}`);

        final_invoice_table_summary.html(earlier_invoice_table_summary.html())
        final_invoice_table_list.html(earlier_invoice_table_list.html())


        $("#earlier_invoice").removeClass("loading")
        $("#final_invoice").removeClass("loading")
        /* ---end: updating UI---- */

        /* ---begin: reinitialise variable */

        /* ---end: reinitialise variable */

    }else{
        //more than two invoices
        save_details_btn.addClass("disabled");
    }
}

function sale_items(){
    data_param = {
        action: "vehicle_stock_shift",
        is_stock_shift: true,
        id: vehicle_invoice.id,
        invoice_id: vehicle_invoice.invoice_id,
        seller_id: "s0",
        seller_name: "vehicle",
        custom_id: "",
        custom_name: "",
        customer_name: "",
        customer_village: "",
        customer_details: "",
        sale_type: selected_sale_type,
        vehicle_id: selected_vehicle_id,
        vehicle_name: selected_vehicle_name,
        data: JSON.stringify({summary: final_invoice.summary, list: final_invoice.data, billing: final_invoice.billing, current_sale_list: current_invoice.data})
    }

    ajaxPostCall(`${LIB_API_ENDPOINT}/sale_stock.php`, data_param, function(response){

        let modal_body; let modal_title = "Parsing Item Data Error";
        if(response.status){
            modal_body = response.status + ": " + response.statusText;
        }else if(response.title){
            modal_title = response.title;
            modal_body = response.content;
        }else if(response.result){
            current_invoice.reset_cookie();
            
            smallModal(
                "Items Sale Successful",
                `
                <p>Invoice Id#: <b>${response.invoice_id}</b></p>
                <p>Total No.# of items are sold <b>${current_invoice.data.length}</b></p>
                <table>
                    <tr>
                        <td>Total Price of</td>
                        <td><b>${current_invoice.billing.total.toFixed(2)}</b></td>
                    </tr>
                    <tr>
                        <td>Total Making Cost of</td>
                        <td><b>${current_invoice.billing.making_cost.toFixed(2)}</b></td>
                    </tr>
                    <tr>
                        <td>Profit of</td>
                        <td><b>${(current_invoice.billing.total - current_invoice.billing.making_cost).toFixed(2)}</b></td>
                    </tr>
                    <tr>
                        <td>Offer ${current_invoice.billing.offer_percentage}%</td>
                        <td><b>${current_invoice.billing.offer_amount}</b></td>
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

function vehicleOnChange(value, text, choice){
    selected_vehicle_id = value;
    selected_vehicle_name = text.substring(0, text.indexOf("("));

    save_details_btn.removeClass("disabled");
}
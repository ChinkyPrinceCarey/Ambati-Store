let save_details_btn;
let edit_details_btn;
let sale_cancel_btn;

let search_form;
let input_invoice_id;
let search_invoice_btn;

let input_seller_id;
let input_seller_name;
let input_sale_type;

let input_customer_name;
let input_customer_village;
let input_customer_details;

let invoice_details;;

var earlier_sale;
let earlier_sale_summary_table;
let earlier_sale_list_table;
let earlier_sale_billing_table;

let cancelled_sale;
let cancelled_sale_summary_table;
let cancelled_sale_list_table;
let cancelled_sale_billing_table;

let current_sale;
let current_sale_summary_table;
let current_sale_list_table;
let current_sale_billing_table;

$(function(){
    $("span#date").text(getCurrentDate("dmy"));

    save_details_btn = $("#save_details_btn");
    edit_details_btn = $("#edit_details_btn");
    sale_cancel_btn = $("#sale_cancel_btn");

    save_details_btn.hide();
    edit_details_btn.hide();
    sale_cancel_btn.hide();

    search_form = $("#search_form");
    input_invoice_id = $("#invoice_id");
    search_invoice_btn = $("#search_invoice_btn");

    input_seller_id = $("#seller_id");
    input_seller_name = $("#seller_name");
    input_sale_type = $("#sale_type");
    input_customer_village = $("#customer_village");
    input_customer_name = $("#customer_name");
    input_customer_details = $("#customer_details");
    
    earlier_sale_summary_table = $("#earlier_invoice .card .wrapper div table#sale-summary");
    earlier_sale_list_table = $("#earlier_invoice .card .wrapper div table#sale-list");
    earlier_sale_billing_table =    earlier_sale_summary_table.children('tfoot')
                                        .add(earlier_sale_list_table.children('tfoot'));

    cancelled_sale_summary_table = $("#cancelled_invoice .card .wrapper div table#sale-summary");
    cancelled_sale_list_table = $("#cancelled_invoice .card .wrapper div table#sale-list");
    cancelled_sale_billing_table =  cancelled_sale_summary_table.children('tfoot')
                                        .add(cancelled_sale_list_table.children('tfoot'));

    current_sale_summary_table = $("#current_invoice .card .wrapper div table#sale-summary");
    current_sale_list_table = $("#current_invoice .card .wrapper div table#sale-list");
    current_sale_billing_table = current_sale_summary_table.children('tfoot')
                                    .add(current_sale_list_table.children('tfoot'));

    resetData();

    search_invoice_btn.on('click', function(){
        search_form.addClass("loading");

        scanner_state.isEnabled = false;
        scanner_state.reason = 'Loading New Invoice so Scanning Disabled';

        save_details_btn.hide();
        edit_details_btn.hide();
        sale_cancel_btn.hide();

        let invoice_id = input_invoice_id.val();
        resetData();
        if(invoice_id){
            data_param = {
                action: "fetch_invoice",
                type: "invoice_id",
                data: invoice_id
            }
            ajaxPostCall('lib/sale_reports.php', data_param, function(response){
                let modal_body; let modal_title = "Parsing Invoice Error";
                if(response.status){
                    modal_body = response.status + ": " + response.statusText;

                    scanner_state.isEnabled = false;
                    scanner_state.reason = modal_body;
                }else if(response.title){
                    modal_title = response.title;
                    modal_body = response.content;

                    scanner_state.isEnabled = false;
                    scanner_state.reason = response.title;
                }else if(response.result){
                    if(response.data.length > 1){
                        scanner_state.isEnabled = false;
                        scanner_state.reason = "Something is incorrect with the invoice parsed";
                        
                        modal_body = scanner_state.reason;
                    }else if(response.data.length == 0){
                        scanner_state.isEnabled = false;
                        scanner_state.reason = "Something is incorrect empty invoice parsed";

                        modal_body = scanner_state.reason;
                    }else{
                        let invoice_data = response.data[0];

                        invoice_details.id = invoice_data.id;
                        invoice_details.invoice_id = invoice_data.invoice_id;
                        invoice_details.seller_id = invoice_data.seller_id;
                        invoice_details.seller_name = invoice_data.seller_name;
                        invoice_details.custom_id = invoice_data.custom_id;
                        invoice_details.custom_name = invoice_data.custom_name;
                        invoice_details.sale_type = invoice_data.sale_type;
                        invoice_details.customer_name = invoice_data.customer_name;
                        invoice_details.customer_village = invoice_data.customer_village;
                        invoice_details.customer_details = invoice_data.customer_details;

                        let seller_id = invoice_data.seller_id;
                        if(invoice_data.custom_id) seller_id += `(${invoice_data.custom_id})`;
                        
                        let seller_name = invoice_data.seller_name;
                        if(invoice_data.custom_name) seller_name += `(${invoice_data.custom_name})`;
                        
                        input_invoice_id.val(invoice_details.invoice_id);
                        input_seller_id.val(seller_id);
                        input_seller_name.val(seller_name);
                        input_sale_type.val(invoice_data.sale_type);
                        input_customer_village.val(invoice_data.customer_village);
                        input_customer_name.val(invoice_data.customer_name);
                        input_customer_details.val(invoice_data.customer_details);

                        scanner_state.isEnabled = true;
                        scanner_state.reason = "Invoice Data Parsed Successfully";
                        
                        input_invoice_id.parent().addClass('disabled');
                        search_invoice_btn.parent().addClass('disabled');
                        edit_details_btn.show();
                        sale_cancel_btn.show();

                        current_sale.data = invoice_data.items_details.list;
                        current_sale.summary = invoice_data.items_details.summary;
                        current_sale.billing = invoice_data.items_details.billing;

                        earlier_sale.data = JSON.parse(JSON.stringify(current_sale.data));
                        earlier_sale.summary = JSON.parse(JSON.stringify(current_sale.summary));
                        earlier_sale.billing = JSON.parse(JSON.stringify(current_sale.billing));

                        initInvoices();

                        //removing the offer for current sale
                        current_sale.billing.offer_percentage = 0;
                        current_sale.billing.offer_amount = 0;
                    }
                }else{
                    modal_body = response.info;

                    scanner_state.isEnabled = false;
                    scanner_state.reason = modal_body;
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
                                search_form.removeClass("loading");
                                return true;
                            }
                        }
                    );
                }
            });
        }else{
            scanner_state.isEnabled = false;
            scanner_state.reason = 'Empty Invoice Id when Searching';

            smallModal(
                scanner_state.reason, 
                "Enter Invoice Id to cancel items in it", 
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
                        search_form.removeClass("loading");
                        return true;
                    }
                }
            );
        }
    });

    edit_details_btn.on('click', function(){
        smallModal(
            "Are you sure want to edit?", 
            "By clicking Okay all data will be erased...", 
            [
                {
                    "class": "ui positive approve medium button",
                    "id": "",
                    "text": "Okay",
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
                    
                    scanner_state.isEnabled = false;
                    scanner_state.reason = 'Details are not saved after clicking on Edit';

                    input_invoice_id.parent().removeClass('disabled');
                    search_invoice_btn.parent().removeClass('disabled');

                    edit_details_btn.hide();
                    sale_cancel_btn.hide();

                    resetData();

                    return true;
                },
                onDeny: function(){
                    return true;
                }
            }
        );
    })

    sale_cancel_btn.on('click', function(){
        if(!cancelled_sale.data.length){
            smallModal(
                "No items to cancel",
                "No items are added to cancel from the sale, kindly add items to cancel...",
                [
                    {
                        "class": "ui positive approve medium button",
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
        }else if((current_sale.data.length + cancelled_sale.data.length) == (earlier_sale.data.length)){
            smallModal(
                "Are you sure want to cancel?",
                `
                <p>Invoice Id#: <b>${input_invoice_id.val()}</b></p>
                <p><b>${current_sale.summary.length == 0 ? "YOU ARE CANCELLING ALL THE ITEMS IN THIS SALE" : ""}<b></p>
                <p>Verify the data before clicking on Confirm</p>
                </br>
                <p>Cancel Items Overview</b></p>
                <table border="1">
                    <tr>
                        <td>Total No.of. Items</td>
                        <td><b>${cancelled_sale.summary.length}</b></td>
                    </tr>
                    <tr>
                        <td>Total No.of. Units</td>
                        <td><b>${cancelled_sale.data.length}</b></td>
                    </tr>
                    <tr>
                        <td>Total Cost</td>
                        <td><b>${cancelled_sale.billing.total}</b></td>
                    </tr>
                </table>
                `,
                [
                    {
                        "class": "ui positive approve medium button",
                        "id": "",
                        "text": "Confirm",
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
                        sale_cancel();
                        return true;
                    },
                    onDeny: function(){
                        return true;
                    }
                }
            );
        }else{
            scanner_state.isEnabled = false;
            scanner_state.reason = 'Data Mismatching(i.e. Earlier Data, Current Data and Removed Data)';

            smallModal(
                "Data Mismatching",
                scanner_state.reason + "</br>Reload Page and Try...",
                [
                    {
                        "class": "ui positive approve medium button",
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
});

function initValues(){

    invoice_details = {};

    current_sale = {
        data: [],
        data_table: true,
        summary: true,
        summary_table: true,
        billing: true,
        sale_obj: true
    };

    cancelled_sale = {
        data: [],
        data_table: true,
        summary: true,
        summary_table: true,
        billing: true,
        stock_obj: true
    };

    earlier_sale = {
        data: [],
        data_table: false,
        summary: false,
        summary_table: false,
        billing: false,
        sale_obj: false
    };

    current_sale = {...current_sale, ...stock_obj_methods};
    current_sale.data_table = current_sale_list_table;
    current_sale.summary_table = current_sale_summary_table;

    cancelled_sale = {...cancelled_sale, ...sale_obj_methods};
    cancelled_sale.data_table = cancelled_sale_list_table;
    cancelled_sale.summary_table = cancelled_sale_summary_table;

    current_sale.sale_obj = cancelled_sale;
    cancelled_sale.stock_obj = current_sale;


    scanner_data = {
        method(action, barcode){
            current_sale.update_data(action, barcode);
        },
        checkItem(barcode){
           cancelled_sale.isItemExist(barcode);
        }
    }
}


function sale_cancel(){
    let data_param = {
        action: "sale_cancel",
        data: invoice_details,
        current_invoice: {summary: current_sale.summary, list: current_sale.data, billing: current_sale.billing},
        cancelled_invoice: {summary: cancelled_sale.summary, list: cancelled_sale.data, billing: cancelled_sale.billing}
    }

    ajaxPostCall('lib/sale_cancel.php', data_param, function(response){
        console.log(response);

        let modal_body; let modal_title = "Cancelling Sale Error";
        if(response.status){
            modal_body = response.status + ": " + response.statusText;
        }else if(response.title){
            modal_title = response.title;
            modal_body = response.content;
        }else if(response.result){
            smallModal(
                response.success_title,
                response.success_content,
                [   
                    {
                        "class": "ui approve small violet button",
                        "id": "cancelledInvoiceSummaryBtn",
                        "text": "Cancelled Invoice Summary",
                    },
                    {
                        "class": "ui approve small blue button",
                        "id": "currentInvoiceSummaryBtn",
                        "text": "Current Invoice Summary",
                    },
                    {
                        "class": "ui approve small purple button",
                        "id": "earlierInvoiceSummaryBtn",
                        "text": "Earlier Invoice Summary",
                    },
                    {
                        "class": "ui approve small violet button",
                        "id": "cancelledInvoiceListBtn",
                        "text": "Cancelled Invoice List",
                    },
                    {
                        "class": "ui approve small blue button",
                        "id": "currentInvoiceListBtn",
                        "text": "Current Invoice List",
                    },
                    {
                        "class": "ui approve small purple button",
                        "id": "earlierInvoiceListBtn",
                        "text": "Earlier Invoice List",
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
                        if(buttonId == "cancelledInvoiceSummaryBtn"){
                            $("#cancelledInvoiceSummaryBtn").addClass("loading")
                            printInvoice(table_cancelled_sale_summary.parent(), "cancelled summary", response, function(isCompleted){
                                $("#cancelledInvoiceSummaryBtn").removeClass("loading")
                            });
                        }else if(buttonId == "cancelledInvoiceListBtn"){
                            $("#cancelledInvoiceListBtn").addClass("loading")
                            printInvoice(table_cancelled_sale_list.parent(), "cancelled list", response, function(isCompleted){
                                $("#cancelledInvoiceListBtn").removeClass("loading")
                            });
                        }else if(buttonId == "currentInvoiceSummaryBtn"){
                            $("#currentInvoiceSummaryBtn").addClass("loading")
                            printInvoice(current_sale_summary_table.parent(), "summary", response, function(isCompleted){
                                $("#currentInvoiceSummaryBtn").removeClass("loading")
                            });
                        }else if(buttonId == "currentInvoiceListBtn"){
                            $("#currentInvoiceListBtn").addClass("loading")
                            printInvoice(current_sale_list_table.parent(), "list", response, function(isCompleted){
                                $("#currentInvoiceListBtn").removeClass("loading")
                            });
                        }else if(buttonId == "earlierInvoiceSummaryBtn"){
                            $("#earlierInvoiceSummaryBtn").addClass("loading")
                            printInvoice(earlier_sale_summary_table.parent(), "earlier summary", response, function(isCompleted){
                                $("#earlierInvoiceSummaryBtn").removeClass("loading")
                            });
                        }else if(buttonId == "earlierInvoiceListBtn"){
                            $("#earlierInvoiceListBtn").addClass("loading")
                            printInvoice(earlier_sale_list_table.parent(), "earlier list", response, function(isCompleted){
                                $("#earlierInvoiceListBtn").removeClass("loading")
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

function resetData(){

    initValues();

    $('input').val('');

    $("table tbody").empty('')

    $("table tfoot tr #sub_total").text('')
    $("table tfoot tr #tax").text('')
    $("table tfoot tr #total").text('')
    
    $("table tfoot tr#offer_row").remove();
}

function initInvoices(){
    $("#current_invoice").addClass("loading");
    $("#earlier_invoice").addClass("loading");

    /* -------------------- Summary -------------------- */
    current_sale_summary_table.children("tbody").empty();
    current_sale_summary_table.children('tfoot').children("tr").children("#sub_total").text('')
    current_sale_summary_table.children('tfoot').children("tr").children("#tax").text('')
    current_sale_summary_table.children('tfoot').children("tr").children("#total").text('')

    for(let item of earlier_sale.summary){
        current_sale_summary_table
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

    current_sale_summary_table.children('tfoot').children("tr").children("#sub_total").text(current_sale.billing.sub_total)
    current_sale_summary_table.children('tfoot').children("tr").children("#tax").text(current_sale.billing.tax)
    current_sale_summary_table.children('tfoot').children("tr").children("#total").text(current_sale.billing.total)


    /* -------------------- List -------------------- */
    current_sale_list_table.children("tbody").empty();
    current_sale_list_table.children('tfoot').children("tr").children("#sub_total").text('')
    current_sale_list_table.children('tfoot').children("tr").children("#tax").text('')
    current_sale_list_table.children('tfoot').children("tr").children("#total").text('')

    for(let item of earlier_sale.data){
        current_sale_list_table
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

    current_sale_list_table.children('tfoot').children("tr").children("#sub_total").text(current_sale.billing.sub_total)
    current_sale_list_table.children('tfoot').children("tr").children("#tax").text(current_sale.billing.tax)
    current_sale_list_table.children('tfoot').children("tr").children("#total").text(current_sale.billing.total)

    /* -------------------- Copy the Current Sale to Earlier Sale -------------------- */

    earlier_sale_summary_table.html(current_sale_summary_table.html())
    earlier_sale_list_table.html(current_sale_list_table.html())

    //because current invoice will not have the offer row
    //now have to add offer row to the earlier invoice
    earlier_sale_summary_table.children('tfoot').append(`
        <tr id="offer_row">
            <th></th>
            <th id="offer_percentage" class="right aligned" colspan="3">Offer(${current_sale.billing.offer_percentage}%)</th>
            <th id="offer_amount" class="right aligned">${current_sale.billing.offer_amount}</th>
        </tr>
    `);
    
    earlier_sale_list_table.children('tfoot').append(`
        <tr id="offer_row">
            <th></th>
            <th id="offer_percentage" class="right aligned" colspan="2">Offer(${current_sale.billing.offer_percentage}%)</th>
            <th id="offer_amount" class="right aligned">${current_sale.billing.offer_amount}</th>
            <th></th>
        </tr>
    `);

    current_sale_list_table
    .add(earlier_sale_list_table)
    .css("counter-reset", `DescendingSerial ${earlier_sale.data.length+1}`);

    /* -------------------- begin: ReInitialise Variable Values -------------------- */
    /* -------------------- end: ReInitialise Variable Values -------------------- */


    $("#current_invoice").removeClass("loading");
    $("#earlier_invoice").removeClass("loading");
    search_form.removeClass("loading");
}
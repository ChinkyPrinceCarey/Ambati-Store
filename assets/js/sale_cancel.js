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

let table_earlier_sale_summary;
let table_earlier_sale_list;

let invoice_details = {};

let earlier_sale_data = [];
let earlier_sale_summary = [];
let earlier_sale_billing = {
    making_cost: 0,
    sub_total: 0,
    tax: 0,
    total: 0,
    offer_percentage: 0,
    offer_amount: 0
};

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
    
    table_earlier_sale_summary = $("#earlier_invoice .card .wrapper div table#sale-summary");
    table_earlier_sale_list = $("#earlier_invoice .card .wrapper div table#sale-list");

    search_invoice_btn.on('click', function(){
        search_form.addClass("loading");

        scanner_state.isEnabled = false;
        scanner_state.reason = 'Loading New Invoice so Scanning Disabled';

        save_details_btn.hide();
        edit_details_btn.hide();
        sale_cancel_btn.hide();

        input_seller_id.val('');
        input_seller_name.val('');
        input_sale_type.val('');
        input_customer_village.val('');
        input_customer_name.val('');
        input_customer_details.val('');

        let invoice_id = input_invoice_id.val();
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

                        current_sale_data = invoice_data.items_details.list;
                        current_sale_summary = invoice_data.items_details.summary;
                        current_sale_billing = invoice_data.items_details.billing;

                        earlier_sale_data = current_sale_data;
                        earlier_sale_summary = current_sale_summary;
                        earlier_sale_billing = current_sale_billing;
                        
                        initInvoices();

                        //removing the offer for current sale
                        current_sale_billing.offer_percentage = 0;
                        current_sale_billing.offer_amount = 0;
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
        if(!removed_sale_data.length){
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
        }else if((current_sale_data.length + removed_sale_data.length) == (earlier_sale_data.length)){
            smallModal(
                "Are you sure want to cancel?",
                `
                <p>Invoice Id#: <b>${input_invoice_id.val()}</b></p>
                <p><b>${current_sale_summary.length == 0 ? "YOU ARE CANCELLING ALL THE ITEMS IN THIS SALE" : ""}<b></p>
                <p>Verify the data before clicking on Confirm</p>
                </br>
                <p>Cancel Items Overview</b></p>
                <table border="1">
                    <tr>
                        <td>Total No.of. Items</td>
                        <td><b>${removed_sale_summary.length}</b></td>
                    </tr>
                    <tr>
                        <td>Total No.of. Units</td>
                        <td><b>${removed_sale_data.length}</b></td>
                    </tr>
                    <tr>
                        <td>Total Cost</td>
                        <td><b>${removed_sale_billing.total}</b></td>
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


function sale_cancel(){
    let data_param = {
        action: "sale_cancel",
        data: invoice_details,
        current_invoice: {summary: current_sale_summary, list: current_sale_data, billing: current_sale_billing},
        cancelled_invoice: {summary: removed_sale_summary, list: removed_sale_data, billing: removed_sale_billing}
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
                            printInvoice(table_current_sale_summary.parent(), "summary", response, function(isCompleted){
                                $("#currentInvoiceSummaryBtn").removeClass("loading")
                            });
                        }else if(buttonId == "currentInvoiceListBtn"){
                            $("#currentInvoiceListBtn").addClass("loading")
                            printInvoice(table_current_sale_list.parent(), "list", response, function(isCompleted){
                                $("#currentInvoiceListBtn").removeClass("loading")
                            });
                        }else if(buttonId == "earlierInvoiceSummaryBtn"){
                            $("#earlierInvoiceSummaryBtn").addClass("loading")
                            printInvoice(table_earlier_sale_summary.parent(), "earlier summary", response, function(isCompleted){
                                $("#earlierInvoiceSummaryBtn").removeClass("loading")
                            });
                        }else if(buttonId == "earlierInvoiceListBtn"){
                            $("#earlierInvoiceListBtn").addClass("loading")
                            printInvoice(table_earlier_sale_list.parent(), "earlier list", response, function(isCompleted){
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
    invoice_details = {};
    
    current_sale_data = [];
    current_sale_summary = [];
    current_sale_billing = {
        making_cost: 0,
        sub_total: 0,
        tax: 0,
        total: 0,
        offer_percentage: 0,
        offer_amount: 0
    };

    removed_sale_data = [];
    removed_sale_summary = [];
    removed_sale_billing = {
        making_cost: 0,
        sub_total: 0,
        tax: 0,
        total: 0,
        offer_percentage: 0,
        offer_amount: 0
    };

    earlier_sale_data = [];
    earlier_sale_summary = [];
    earlier_sale_billing = {
        making_cost: 0,
        sub_total: 0,
        tax: 0,
        total: 0,
        offer_percentage: 0,
        offer_amount: 0
    };

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
    table_current_sale_summary.children("tbody").empty();
    table_current_sale_summary.children('tfoot').children("tr").children("#sub_total").text('')
    table_current_sale_summary.children('tfoot').children("tr").children("#tax").text('')
    table_current_sale_summary.children('tfoot').children("tr").children("#total").text('')

    for(let item of earlier_sale_summary){
        table_current_sale_summary
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

    table_current_sale_summary.children('tfoot').children("tr").children("#sub_total").text(current_sale_billing.sub_total)
    table_current_sale_summary.children('tfoot').children("tr").children("#tax").text(current_sale_billing.tax)
    table_current_sale_summary.children('tfoot').children("tr").children("#total").text(current_sale_billing.total)


    /* -------------------- List -------------------- */
    table_current_sale_list.children("tbody").empty();
    table_current_sale_list.children('tfoot').children("tr").children("#sub_total").text('')
    table_current_sale_list.children('tfoot').children("tr").children("#tax").text('')
    table_current_sale_list.children('tfoot').children("tr").children("#total").text('')

    for(let item of earlier_sale_data){
        table_current_sale_list
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

    table_current_sale_list.children('tfoot').children("tr").children("#sub_total").text(current_sale_billing.sub_total)
    table_current_sale_list.children('tfoot').children("tr").children("#tax").text(current_sale_billing.tax)
    table_current_sale_list.children('tfoot').children("tr").children("#total").text(current_sale_billing.total)

    /* -------------------- Copy the Current Sale to Earlier Sale -------------------- */

    table_earlier_sale_summary.html(table_current_sale_summary.html())
    table_earlier_sale_list.html(table_current_sale_list.html())

    //because current invoice will not have the offer row
    //now have to add offer row to the earlier invoice
    table_earlier_sale_summary.children('tfoot').append(`
        <tr id="offer_row">
            <th></th>
            <th id="offer_percentage" class="right aligned" colspan="3">Offer(${current_sale_billing.offer_percentage}%)</th>
            <th id="offer_amount" class="right aligned">${current_sale_billing.offer_amount}</th>
        </tr>
    `);
    
    table_earlier_sale_list.children('tfoot').append(`
        <tr id="offer_row">
            <th></th>
            <th id="offer_percentage" class="right aligned" colspan="2">Offer(${current_sale_billing.offer_percentage}%)</th>
            <th id="offer_amount" class="right aligned">${current_sale_billing.offer_amount}</th>
            <th></th>
        </tr>
    `);

    $("#current_invoice").removeClass("loading");
    $("#earlier_invoice").removeClass("loading");
    search_form.removeClass("loading");
}
let get_data_form;
let print_invoice_summary_btn;
let print_invoice_list_btn;

let invoice_response;

$(function(){
    get_data_form = $("#get_data");

    let searchParams = new URLSearchParams(window.location.search)
    let preInvoiceId = searchParams.get('invoice_id')
    if(preInvoiceId){
        $('input[name=invoice_id]').val(preInvoiceId);
        setTimeout(function(){get_data_form.submit();}, 5);
    }

    print_invoice_summary_btn = $("#print_invoice_summary_btn");
    print_invoice_list_btn = $("#print_invoice_list_btn");

    print_invoice_summary_btn.addClass("disabled");
    print_invoice_list_btn.addClass("disabled");

    get_data_form
    .form({
		onSuccess: function(event, fields){
            event.preventDefault();
            
            invoice_response = undefined;
            print_invoice_summary_btn.addClass("disabled");
            print_invoice_list_btn.addClass("disabled");

            $("table tbody").empty('')

            $("table tfoot tr #sub_total").text('')
            $("table tfoot tr #tax").text('')
            $("table tfoot tr #total").text('')
            
            let invoice_id = fields.invoice_id;

            let data_param = {
                action: "fetch_invoice",
                type: "random_param",
                data: invoice_id
            }

            ajaxPostCall(`${LIB_API_ENDPOINT}/sale_reports.php`, data_param, function(response){
                let modal_body; let modal_title = "Parsing Item Data Error";
                if(response.status){
                    modal_body = response.status + ": " + response.statusText;
                }else if(response.title){
                    modal_title = response.title;
                    modal_body = response.content;
                }else if(response.result){
                    invoice_response = response.data[0];
                    
                    print_invoice_summary_btn.removeClass("disabled");
                    print_invoice_list_btn.removeClass("disabled");
                    
                    $("#invoice_id").text(invoice_response.invoice_id);
                    let seller_id = invoice_response.seller_id;
                    let custom_id = invoice_response.custom_id;

                    let seller_name = invoice_response.seller_name;
                    let custom_name = invoice_response.custom_name;

                    if(custom_id) seller_id += `(${custom_id})`;
                    if(custom_name) seller_name += `(${custom_name})`;

                    let sale_type = invoice_response.sale_type;
                    let customer_name = invoice_response.customer_name;
                    let customer_village = invoice_response.customer_village;
                    let customer_details = invoice_response.customer_details;
                    let date = invoice_response.date;

                    $("input#seller_id").val(seller_id);
                    $("input#seller_name").val(seller_name);
                    $("input#sale_type").val(sale_type);
                    $("input#customer_name").val(customer_name);
                    $("input#customer_village").val(customer_village);
                    $("input#customer_details").val(customer_details);
                    $("input#date").val(date);

                    initInvoices(invoice_response);
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
    });

    print_invoice_summary_btn.on('click', function(){
        print_invoice_summary_btn.addClass("loading")
        printInvoice($("#sale-summary").parent(), "summary", invoice_response, function(isCompleted){
            print_invoice_summary_btn.removeClass("loading")
        });
    })
    
    print_invoice_list_btn.on('click', function(){
        print_invoice_list_btn.addClass("loading");
        printInvoice($("#sale-list").parent(), "list", invoice_response, function(isCompleted){
            print_invoice_list_btn.removeClass("loading")
        });
    })
});

function initInvoices(data){
    //$("#current_invoice").addClass("loading");
    //$("#earlier_invoice").addClass("loading");

    let table_current_sale_summary = $("#sale-summary");
    let table_current_sale_list = $("#sale-list");

    let earlier_sale_summary = data.items_details.summary;
    let earlier_sale_data = data.items_details.list;
    let current_sale_billing = data.items_details.billing;

    table_current_sale_list.css("counter-reset", `DescendingSerial ${earlier_sale_data.length+1}`);

    /* -------------------- Summary -------------------- */
    table_current_sale_summary.children("tbody").empty();
    table_current_sale_summary.children('tfoot').children("tr").children("#sub_total").text('')
    table_current_sale_summary.children('tfoot').children("tr").children("#tax").text('')
    table_current_sale_summary.children('tfoot').children("tr").children("#total").text('')
    table_current_sale_summary.children('tfoot').children("tr").children("#offer_percentage").text(`Offer(%)`)
    table_current_sale_summary.children('tfoot').children("tr").children("#offer_amount").text('')

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
    table_current_sale_summary.children('tfoot').children("tr").children("#offer_percentage").text(`Offer(${current_sale_billing.offer_percentage ? current_sale_billing.offer_percentage : ""}%)`)
    table_current_sale_summary.children('tfoot').children("tr").children("#offer_amount").text(current_sale_billing.offer_amount)


    /* -------------------- List -------------------- */
    table_current_sale_list.children("tbody").empty();
    table_current_sale_list.children('tfoot').children("tr").children("#sub_total").text('')
    table_current_sale_list.children('tfoot').children("tr").children("#tax").text('')
    table_current_sale_list.children('tfoot').children("tr").children("#total").text('')
    table_current_sale_list.children('tfoot').children("tr").children("#offer_percentage").text(`Offer(%)`)
    table_current_sale_list.children('tfoot').children("tr").children("#offer_amount").text('')

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
    table_current_sale_list.children('tfoot').children("tr").children("#offer_percentage").text(`Offer(${current_sale_billing.offer_percentage ? current_sale_billing.offer_percentage : ""}%)`)
    table_current_sale_list.children('tfoot').children("tr").children("#offer_amount").text(current_sale_billing.offer_amount)

    //$("#current_invoice").removeClass("loading");
    //$("#earlier_invoice").removeClass("loading");

    get_data_form.removeClass("loading");
}
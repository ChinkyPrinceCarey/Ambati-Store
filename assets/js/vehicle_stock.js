var table;
var tableDom;

let dropdown_reports_type;

let rangestart_input;
let rangeend_input;

let span_reports_type;

let overview;
let summary;
let list;

let overview_datatable;
let summary_datatable;
let list_datatable;

let overview_datatable_options;
let summary_datatable_options;
let list_datatable_options;

$(function(){

    dropdown_reports_type = $('.ui.selection.dropdown.reports-type');
    
    rangestart_input = $("#rangestart_input");
    rangeend_input = $("#rangeend_input");

    rangestart_input.val(getCurrentDate());
    rangeend_input.val(getCurrentDate());

    initCalendar();

    span_reports_type = $("span#reports_type");

    overview = $("#overview");
    summary = $("#summary");
    list = $("#list");

    overview_datatable = overview.children("#example");
    summary_datatable = summary.children("#example");
    list_datatable = list.children("#example");

    dropdown_reports_type
        .dropdown()
        .dropdown('set selected', 'overview')
        .dropdown({ onChange: setTable});

    tableDom = 
    "<'ui stackable grid'"+
        "<'row'"+
            
        ">"+
        "<'row'"+
            "<'left aligned two wide column'l>"+
            "<'six wide column'B>"+
            "<'right aligned eight wide column'f>"+
        ">"+
        "<'row dt-table'"+
            "<'sixteen wide column'tr>"+
        ">"+
        "<'row'"+
            "<'seven wide column'i>"+
            "<'right aligned nine wide column'p>"+
        ">"+
    ">";

    default_datatable_options = {
        responsive: true,
        processing: true,
        serverSide: false, /* this will affect working of filtering */
        autoWidth: true, /* true => disables width calc hence saves optimisation  */
        select: true,
        select: {
            style: 'os',
            className: 'primary'
        },
        dom: tableDom,
        buttons: {
            dom: {
                button: {
                  tag: 'button',
                  className: ''
                }
            },
            buttons: [
                {
                    extend: 'copy', className: "blue ui button"
                },
                {
                    extend: 'csv', className: "violet ui button", filename: function(){ return `Sale_Reports_${getCurrentDate("dmt")}` }
                },
                {
                    extend: 'pdf', className: "purple ui button", filename: function(){ return `Sale_Reports_${getCurrentDate("dmt")}` }
                },
                {
                    extend: 'excel', className: "pink ui button", filename: function(){ return `Sale_Reports_${getCurrentDate("dmt")}` }
                }
            ]
        },
        "ajax": {
            "url": `${LIB_API_ENDPOINT}/sale_reports.php`,
            "type": "POST",
            "data": function(d){
                d.action = "fetch_all";
                d.type = dropdown_reports_type.dropdown('get value');
                d.sale_type = "vehicle";
                d.data = {start: rangestart_input.val(), end: rangeend_input.val()};
            },
            "dataType": 'json',
            "dataSrc": function(json){
                if(!json.result){
                    smallModal(
                        "Error Fetching Records", 
                        json.info,
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
                return json.data;
            },
            "error": function(jqXHR, status, err){
                console.log(jqXHR, status, err);
                smallModal(
                    status, 
                    "Reload the page", 
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
        },
        rowId: 'id'
    };

    overview_datatable_options = {
        columns: [
            { data: "slno", "width": "2%" },
            { data: "date", "width": "9%" },
            { data: "invoice_id" },
            { data: "sale_type" },
            { data: "seller_name", 
              render: function(data, type, row){
                  return row.custom_name ? `${row.seller_name}(${row.custom_name})[${row.seller_id}(${row.custom_id})]` : row.seller_name;
              }  
            },
            {
                data: "vehicle_id"
            },
            {
                data: "vehicle_name"
            },
            { data: "no_of_items" },
            { data: "no_of_units" },
            { data: "making_cost" },
            { data: "total_price" },
            { data: "profit",
              render: function(data, type, row){
                return `${row.profit} 
                ${calculateProfit(row.profit, row.total_price)}`;
              }
            },
            { data: "offer_percentage" },
            { data: "offer_amount" },
            {
                data: "is_sold",
                render: function(data, type, row){
                    let color = data == 0 ? "red" : "green";
                    let text = data == 0 ? "hold" : "sold";
                    return `<div class="ui ${color} horizontal label">${text}</div>`;
                }
            },
            { 
                data: null,
                className: "dt-center print-invoice",
                render: function (data, type, row){
                    return `<i row_id="${row.id}" invoice_id="${row.invoice_id}" class="print icon"></i>`;
                },
                orderable: false
            }
        ],
        footerCallback: function( tfoot, data, start, end, display ) {
            var api = this.api();

            updateSumOnFooter(api, 7, ""); //no of items
            updateSumOnFooter(api, 8, ""); //no of units
            updateSumOnFooter(api, 9); //making_cost
            updateSumOnFooter(api, 10); //total_price
            updateSumOnFooter(api, 11); //profit

        },
        "drawCallback": function(settings){
            updateProfitPercentage(11, 10)
        },
        createdRow: function (row, data, dataIndex) {
            $(row).attr('data-id', data.Id);
            $(row).attr('data-ownerid', data.OwnerId);
        }
    }

    summary_datatable_options = {
        columns: [
            { data: "slno", "width": "2%" },
            { data: "date", "width": "9%" },
            { data: "invoice_id" },
            { data: "sale_type" },
            { data: "seller_name", 
              render: function(data, type, row){
                  return row.custom_name ? `${row.seller_name}(${row.custom_name})[${row.seller_id}(${row.custom_id})]` : row.seller_name;
              }  
            },
            {
                data: "vehicle_id"
            },
            {
                data: "vehicle_name"
            },
            {   data: "item",
                render: function ( data, type, row ) {
                    return `${row.item}[${row.shortcode}]`
                }
            },
            { data: "unit_price" },
            { data: "quantity" },
            { data: "making_cost" },
            { data: "total_price" },
            { data: "profit",
                render: function(data, type, row){
                return `${row.profit} 
                ${calculateProfit(row.profit, row.total_price)}`;
                }
            },
            {
                data: "is_sold",
                render: function(data, type, row){
                    let color = data == 0 ? "red" : "green";
                    let text = data == 0 ? "hold" : "sold";
                    return `<div class="ui ${color} horizontal label">${text}</div>`;
                }
            }
        ],
        footerCallback: function( tfoot, data, start, end, display ) {
            var api = this.api();

            updateSumOnFooter(api, 8, ""); //quantity
            updateSumOnFooter(api, 9, ""); //making_cost
            updateSumOnFooter(api, 10); //total_price
            updateSumOnFooter(api, 11); //profit
            updateSumOnFooter(api, 12); //profit
        },
        "drawCallback": function(settings){
            updateProfitPercentage(12, 11)
        }
    };

    list_datatable_options = {
        columns: [
            { data: "slno", "width": "2%" },
            { data: "date", "width": "9%" },
            { data: "invoice_id" },
            { data: "sale_type" },
            { data: "seller_name", 
              render: function(data, type, row){
                  return row.custom_name ? `${row.seller_name}(${row.custom_name})[${row.seller_id}(${row.custom_id})]` : row.seller_name;
              }  
            },
            {
                data: "vehicle_id"
            },
            {
                data: "vehicle_name"
            },
            {   data: "item",
                render: function ( data, type, row ) {
                    return `${row.item}[${row.shortcode}]`
                }
            },
            { data: "barcode" },
            { data: "unit_price" },
            { data: "making_cost" },
            { data: "profit",
                render: function(data, type, row){
                return `${row.profit} 
                ${calculateProfit(row.profit, row.unit_price)}`;
                }
            }
        ],
        footerCallback: function( tfoot, data, start, end, display ) {
            var api = this.api();

            updateSumOnFooter(api, 9); //unit_price
            updateSumOnFooter(api, 10); //making_cost
            updateSumOnFooter(api, 11); //profit
        },
        "drawCallback": function(settings){
            updateProfitPercentage(11, 9)
        }
    };

    setTable();

    $('#overview #example').on('click', 'td.print-invoice i', function (e) {
        e.preventDefault();

        $('#overview table#example').addClass('disable'); table.processing(true);

        let invoice_id = $(this).attr("invoice_id");

        if(invoice_id){
            window.location.replace(`print_invoice.html?invoice_id=${invoice_id}`);
        }else{
            smallModal(
                "Error Getting Invoice Id for the Item", 
                "Reload the Page and Try", 
                [
                    {
                        "class": "ui positive approve button",
                        "id": "",
                        "text": "Okay",
                    }
                ], 
                {
                    closable: true
                }
            );

            $('#overview table#example').removeClass('disable'); table.processing(false);
        }
    });

    $("#calendar_search").click(function(){
        table.ajax.reload();
    })

    $(".filters_container div button").click(function(){
        table.draw();
    })
});

function updateProfitPercentage(profit_index, total_price_index){
    setTimeout(function(){
        if(table){
            let footer_profit_selector = $(table.column(profit_index).footer());
            let footer_total_price_selector = $(table.column(total_price_index).footer());

            let footer_profit = parseInt(footer_profit_selector.attr('data-value'));
            let footer_total_price = parseInt(footer_total_price_selector.attr('data-value'));

            let footer_profit_selector_text = `₹ ${footer_profit}`;

            if(footer_profit && footer_total_price){
                let profit_percentage = ((footer_profit / footer_total_price) * 100).toFixed(2);
                footer_profit_selector_text += ` (${profit_percentage}%)`;
            }

            footer_profit_selector.html(footer_profit_selector_text);
        }
    }, 2000);
}

function calculateProfit(_profit, _total_price){
    return `(${((_profit/_total_price) * 100).toFixed(2)}%)`;
}

function updateSumOnFooter(api, column_index, prefix = "₹"){
    let total_sum = 0;
    if(api.column(column_index, { search:'applied' }).data().length){
        total_sum = api
           .column(column_index, { search:'applied' } )
           .data()
           .reduce( function (a, b) {
                return Math.round(a) + Math.round(b);
           });
    }

    $(api.column(column_index).footer()).html(`${prefix} ${total_sum}`);
    $(api.column(column_index).footer()).attr('data-value', total_sum);
}

function initCalendar(){
    $('#rangestart').calendar({
        type: 'date',
        endCalendar: $('#rangeend'),
        formatter: {
            date: function (date, settings) {
              if (!date) return '';
              var day = date.getDate();
              var month = date.getMonth() + 1;
              var year = date.getFullYear();
              return year + '-' + month.pad() + '-' + day.pad();
            }
        }
    });
    
    $('#rangeend').calendar({
        type: 'date',
        startCalendar: $('#rangestart'),
        formatter: {
            date: function (date, settings) {
              if (!date) return '';
              var day = date.getDate();
              var month = date.getMonth() + 1;
              var year = date.getFullYear();
              return year + '-' + month.pad() + '-' + day.pad();
            }
        }
    });
}

function setTable(value){
    console.log(`value: ${value}`)
    overview.hide();
    summary.hide();
    list.hide();

    if(table) table.clear().destroy();

    if(!value) value = "overview";

    $(".filters_container div input").val('') //clears previous filter input fields
    $.fn.dataTable.ext.search = []; //clears previous filters

    if(value == "overview"){
        span_reports_type.text("[overview]");
        overview.show();

        table = overview_datatable.DataTable({...default_datatable_options, ...overview_datatable_options});

        $.fn.dataTable.ext.search.push(
            function(settings, data, dataIndex){

                let overview_filters = $("#overview .filters_container");
    
                let return_value = true;
                let filter_date_value = overview_filters.children("#filter_date").children("input").val();
                let filter_invoice_id_value = overview_filters.children("#filter_invoice_id").children("input").val();
                let filter_sale_type_value = overview_filters.children("#filter_sale_type").children("input").val();
                let filter_seller_id_value = overview_filters.children("#filter_seller_id").children("input").val();
                let filter_seller_name_value = overview_filters.children("#filter_seller_name").children("input").val();
                let filter_no_of_items_value = overview_filters.children("#filter_no_of_items").children("input").val();
                let filter_no_of_units_value = overview_filters.children("#filter_no_of_units").children("input").val();
                let filter_making_cost_value = overview_filters.children("#filter_making_cost").children("input").val();
                let filter_total_price_value = overview_filters.children("#filter_total_price").children("input").val();
                let filter_profit_value = overview_filters.children("#filter_profit").children("input").val();
                
                let row_date = data[1];
                let row_invoice_id = data[2];
                let row_sale_type = data[3];
                let row_seller_id = data[4];
                let row_seller_name = data[5];
                let row_no_of_items = data[6];
                let row_no_of_units = data[7];
                let row_making_cost = data[8];
                let row_total_price = data[9];
                let row_profit = data[10];
                
                return_value =      ((!filter_date_value) || (filter_date_value == row_date))
                                &&  ((!filter_invoice_id_value) || (filter_invoice_id_value == row_invoice_id))
                                &&  ((!filter_sale_type_value) || (filter_sale_type_value == row_sale_type))
                                &&  ((!filter_seller_id_value) || (filter_seller_id_value == row_seller_id))
                                &&  ((!filter_seller_name_value) || (filter_seller_name_value == row_seller_name))
                                &&  ((!filter_no_of_items_value) || (filter_no_of_items_value == row_no_of_items))
                                &&  ((!filter_no_of_units_value) || (filter_no_of_units_value == row_no_of_units))
                                &&  ((!filter_making_cost_value) || (filter_making_cost_value == row_making_cost))
                                &&  ((!filter_total_price_value) || (filter_total_price_value == row_total_price))
                                &&  ((!filter_profit_value) || (filter_profit_value == row_profit))
                                
                return return_value;
            }
        );
        
    }else if(value == "summary"){
        span_reports_type.text("[summary]");
        summary.show();

        table = summary_datatable.DataTable({...default_datatable_options, ...summary_datatable_options});

        $.fn.dataTable.ext.search.push(
            function(settings, data, dataIndex){

                let summary_filters = $("#summary .filters_container");
    
                let return_value = true;
                let filter_date_value = summary_filters.children("#filter_date").children("input").val();
                let filter_invoice_id_value = summary_filters.children("#filter_invoice_id").children("input").val();
                let filter_sale_type_value = summary_filters.children("#filter_sale_type").children("input").val();
                let filter_seller_id_value = summary_filters.children("#filter_seller_id").children("input").val();
                let filter_seller_name_value = summary_filters.children("#filter_seller_name").children("input").val();
                let filter_item_value = summary_filters.children("#filter_item").children("input").val();
                let filter_unit_price_value = summary_filters.children("#filter_unit_price").children("input").val();
                let filter_quantity_value = summary_filters.children("#filter_quantity").children("input").val();
                let filter_making_cost_value = summary_filters.children("#filter_making_cost").children("input").val();
                let filter_total_price_value = summary_filters.children("#filter_total_price").children("input").val();
                let filter_profit_value = summary_filters.children("#filter_profit").children("input").val();
                
                let row_date = data[1];
                let row_invoice_id = data[2];
                let row_sale_type = data[3];
                let row_seller_id = data[4];
                let row_seller_name = data[5];
                let row_item = data[6];
                let row_unit_price = data[7];
                let row_quantity = data[8];
                let row_making_cost = data[9];
                let row_total_price = data[10];
                let row_profit = data[11];
                
                return_value =      ((!filter_date_value) || (filter_date_value == row_date))
                                &&  ((!filter_invoice_id_value) || (filter_invoice_id_value == row_invoice_id))
                                &&  ((!filter_sale_type_value) || (filter_sale_type_value == row_sale_type))
                                &&  ((!filter_seller_id_value) || (filter_seller_id_value == row_seller_id))
                                &&  ((!filter_seller_name_value) || (filter_seller_name_value == row_seller_name))
                                &&  ((!filter_item_value) || (filter_item_value == row_item))
                                &&  ((!filter_unit_price_value) || (filter_unit_price_value == row_unit_price))
                                &&  ((!filter_quantity_value) || (filter_quantity_value == row_quantity))
                                &&  ((!filter_making_cost_value) || (filter_making_cost_value == row_making_cost))
                                &&  ((!filter_total_price_value) || (filter_total_price_value == row_total_price))
                                &&  ((!filter_profit_value) || (filter_profit_value == row_profit))
                                
                return return_value;
            }
        );
    }else{
        span_reports_type.text("[list]");
        list.show();
        
        table = list_datatable.DataTable({...default_datatable_options, ...list_datatable_options});

        $.fn.dataTable.ext.search.push(
            function(settings, data, dataIndex){

                let list_filters = $("#list .filters_container");
    
                let return_value = true;
                let filter_date_value = list_filters.children("#filter_date").children("input").val();
                let filter_invoice_id_value = list_filters.children("#filter_invoice_id").children("input").val();
                let filter_sale_type_value = list_filters.children("#filter_sale_type").children("input").val();
                let filter_seller_id_value = list_filters.children("#filter_seller_id").children("input").val();
                let filter_seller_name_value = list_filters.children("#filter_seller_name").children("input").val();
                let filter_item_value = list_filters.children("#filter_item").children("input").val();
                let filter_barcode_value = list_filters.children("#filter_barcode").children("input").val();
                let filter_unit_price_value = list_filters.children("#filter_unit_price").children("input").val();
                let filter_making_cost_value = list_filters.children("#filter_making_cost").children("input").val();
                let filter_profit_value = list_filters.children("#filter_profit").children("input").val();
                
                let row_date = data[1];
                let row_invoice_id = data[2];
                let row_sale_type = data[3];
                let row_seller_id = data[4];
                let row_seller_name = data[5];
                let row_item = data[6];
                let row_barcode = data[7];
                let row_unit_price = data[8];
                let row_making_cost = data[9];
                let row_profit = data[10];
                
                return_value =      ((!filter_date_value) || (filter_date_value == row_date))
                                &&  ((!filter_invoice_id_value) || (filter_invoice_id_value == row_invoice_id))
                                &&  ((!filter_sale_type_value) || (filter_sale_type_value == row_sale_type))
                                &&  ((!filter_seller_id_value) || (filter_seller_id_value == row_seller_id))
                                &&  ((!filter_seller_name_value) || (filter_seller_name_value == row_seller_name))
                                &&  ((!filter_item_value) || (filter_item_value == row_item))
                                &&  ((!filter_barcode_value) || (filter_barcode_value == row_barcode))
                                &&  ((!filter_unit_price_value) || (filter_unit_price_value == row_unit_price))
                                &&  ((!filter_making_cost_value) || (filter_making_cost_value == row_making_cost))
                                &&  ((!filter_profit_value) || (filter_profit_value == row_profit))
                                
                return return_value;
            }
        );
    }

    table.buttons(0, null).container().removeClass('ui'); //or else buttons styling won't be applied
}
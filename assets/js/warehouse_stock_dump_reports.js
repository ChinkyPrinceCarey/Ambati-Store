var table;
var editor;
var tableDom;

let dropdown_reports_type;

let span_reports_type;

let rangestart_input;
let rangeend_input;

let summary;
let monthly;
let list;

let summary_datatable;
let list_datatable;

$(function(){

    dropdown_reports_type = $('.ui.selection.dropdown.reports-type');
    dropdown_reports_type
        .dropdown()
        .dropdown('set selected', 'monthly')
        .dropdown({ onChange: setTable});

    span_reports_type = $("span#reports_type");

    rangestart_input = $("#rangestart_input");
    rangeend_input = $("#rangeend_input");

    rangestart_input.val(getCurrentDate());
    rangeend_input.val(getCurrentDate());

    summary = $("#summary");
    monthly = $("#monthly");
    list = $("#list");

    summary_datatable = summary.children("#example");
    monthly_datatable = monthly.children("#example");
    list_datatable = list.children("#listexample");

    initCalendar();

    tableDom = 
    "<'ui stackable grid'"+
        "<'row'"+
        ">"+
        "<'row'"+
            "<'two wide column'l>"+
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

    editor = new $.fn.dataTable.Editor({
        table: "#listexample",
        ajax: function(method, url, data, success, error){
            $.ajax({
                type: "POST",
                url:  "lib/warehouse_stock_reports.php",
                data: data,
                dataType: "json",
                success: function(json){
                    if(!json.result){
                        console.log("error", json.info)
                        error(json.info);
                        
                        //though it is not firing at the moment
                        smallModal(
                            "Error Removing Stock", 
                            json.info,
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

                        return false;
                    }
                    success(json);
                },
                error: function(jqXHR, exception) {
                    console.log(jqXHR, exception);
                    error(exception);
                },
            });
        },
        i18n: {
            error: {
                system: "Parsing error, please reload the page and report to the admin!"
            }
        },
        idSrc: 'id',
    })

    editor.on('preSubmit', function (e, data, action) {
        if(action == "remove") return true;

        return (function checkValidity(form, scope) {
            var input
            if (!form.checkValidity()) {
              for (var i = 0; i < form.length; i++) {
                // check for each field
                input = form[i]
                if (!input.checkValidity() && input.name) {
                  scope.field(input.name).error(input.validationMessage)
                }
              }
              return false
            }
            return true  
        })(editor.dom.form, this);
    });

    editor.on('onSubmitError', function(e, xhr, err, thrown, data){
        this.error("Parsing error, report to admin!");
        return false;
    });

    editor.on('onSubmitComplete', function(e, xhr, err, thrown, data){
        this.error(xhr);
        return false;
    });
    
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
                    extend: 'remove', editor: editor, className: "negative ui button"
                },
                {
                    extend: 'copy', className: "violet ui button"
                },
                {
                    extend: 'csv', className: "blue ui button", filename: function(){ return `Stock_Reports_${getCurrentDate("dmt")}` }
                },
                {
                    extend: 'pdf', className: "purple ui button", filename: function(){ return `Stock_Reports_${getCurrentDate("dmt")}` }
                }
            ],
        },
        "ajax": {
            "url": "lib/warehouse_stock_reports.php",
            "type": "POST",
            //"data" : {"action": "fetch_all", "data": {from: rangestart_input.val(), end: rangeend_input.val()}},
            "data": function(d){
                d.action = "fetch_all";
                d.table = "stock_dump";
                d.date_column = "row_date";
                d.type = dropdown_reports_type.dropdown('get value');
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
                                "text": "Okay",
                            }
                        ], 
                        {
                            closable: false,
                            onApprove: function(){
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
                            "text": "Okay",
                        }
                    ], 
                    {
                        closable: false,
                        onApprove: function(){
                            return false;
                        }
                    }
                );
            }
        },
        rowId: 'id',
        "init.dt": function(settings, json) {
            console.log(settings, json);
        }
    };

    list_datatable_options = {
        columns: [
            { data: "slno", "width": "2%" },
            { data: "generate_id" },
            { data: "row_date" },
            { data: "material" },
            {   data: "item",
                render: function ( data, type, row ) {
                    return `${row.item}[${row.shortcode}]`
                }
            },
            { data: "type" },
            { data: "unit" },
            { data: "quantity" },
            { data: "making_cost" },
            { data: "retailer_cost" },
            { data: "wholesale_cost" },
            { data: "item_number" },
            { data: "barcode" },
            {
                data: null,
                className: "dt-center print-barcode",
                defaultContent: '<i class="print icon"></i>',
                orderable: false
            }
        ],
        footerCallback: function( tfoot, data, start, end, display ) {
            console.log(`footerCallback`)
            var api = this.api();

            updateSumOnFooter(api, 7, ""); //quantity
            updateSumOnFooter(api, 8); //making_cost
            updateSumOnFooter(api, 9); //retailer_cost
            updateSumOnFooter(api, 10); //wholesale_cost

        }
    };
    
    summary_datatable_options = {
        buttons: {
            dom: {
                button: {
                  tag: 'button',
                  className: ''
                }
            },
            buttons: [
                {
                    extend: 'copy', className: "violet ui button"
                },
                {
                    extend: 'csv', className: "blue ui button", filename: function(){ return `Dump_Reports_${getCurrentDate("dmt")}` }
                },
                {
                    extend: 'pdf', className: "purple ui button", filename: function(){ return `Dump_Reports_${getCurrentDate("dmt")}` }
                }
            ],
        },
        columns: [
            { data: "slno", "width": "2%" },
            { data: "material" },
            {   data: "item",
                render: function ( data, type, row ) {
                    return `${row.item}[${row.shortcode}]`
                }
            },
            { data: "type" },
            { data: "unit" },
            { data: "no_of_items" },
            { data: "total_making_cost" },
            { data: "total_retailer_cost" },
            { data: "total_wholesale_cost" }
        ],
        footerCallback: function(tfoot, data, start, end, display){
            console.log(`footerCallback`)
            var api = this.api();

            updateSumOnFooter(api, 5, ""); //no_of_items
            updateSumOnFooter(api, 6); //making_cost
            updateSumOnFooter(api, 7); //retailer_cost
            updateSumOnFooter(api, 8); //wholesale_cost
        }
    };
    
    monthly_datatable_options = {
        buttons: {
            dom: {
                button: {
                  tag: 'button',
                  className: ''
                }
            },
            buttons: [
                {
                    extend: 'copy', className: "violet ui button"
                },
                {
                    extend: 'csv', className: "blue ui button", filename: function(){ return `Dump_Reports_${getCurrentDate("dmt")}` }
                },
                {
                    extend: 'pdf', className: "purple ui button", filename: function(){ return `Dump_Reports_${getCurrentDate("dmt")}` }
                }
            ],
        },
        columns: [
            { data: "slno", "width": "2%" },
            { data: "month" },
            { data: "no_of_items" },
            { data: "total_making_cost" },
            { data: "total_retailer_cost" },
            { data: "total_wholesale_cost" }
        ],
        footerCallback: function(tfoot, data, start, end, display){
            console.log(`footerCallback`)
            var api = this.api();

            updateSumOnFooter(api, 2, "");
            updateSumOnFooter(api, 3, "");
            updateSumOnFooter(api, 4);
            updateSumOnFooter(api, 5);
        }
    };

    setTable();

    $('#listexample').on('click', 'td.print-barcode i', function (e) {
        e.preventDefault();

        $('table#listexample').addClass('disable'); table.processing(true);

        //console.log($(this).closest('tr').attr('id'));
 
                        //icon   print-barcode   barcode
        let barcode = $(this).closest('td').prev('td').text();

        if(barcode){
            window.location.replace(`print_barcode.html?barcode=${barcode}`);
        }else{
            smallModal(
                "Error Getting Barcode for the Item", 
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

            $('table#listexample').removeClass('disable'); table.processing(false);
        }
    });

    table.on('init.dt', function(){});

    //to disable `edit` button on when multiple rows selected
    table.on('select', function(e, f, g){
        var buttons = table.buttons( ['.buttons-edit'] );
        var data = table.rows( { selected: true } ).data();
        if(data.length > 1){
            buttons.disable();
        }else{
            buttons.enable();
        }
    });

    // Delete a record
    list_datatable.on('click', 'td .actions .ellipse-action-remove', function(e){
        e.preventDefault();

        console.log(`hereremove`)

        //console.log($(this).closest('tr'))

        /*
        editor.remove( $(this).closest('tr'), {
            title: 'Delete record',
            message: 'Are you sure you wish to remove this record?',
            buttons: 'Delete'
        });
        */
    });

    $(".filters_container div button").click(function(){
        table.draw();
    })

    $("#calendar_search").click(function(){
        table.ajax.reload();
    })
})

function updateSumOnFooter(api, column_index, prefix = "₹"){
    let total_sum = 0;
    if(api.column(column_index, { search:'applied' }).data().length){
        total_sum = api
           .column(column_index, { search:'applied' } )
           .data()
           .reduce( function (a, b) {
              return parseInt(a) + parseInt(b);
           });
    }
    $(api.column(column_index).footer()).html(`${prefix} ${total_sum}`);  
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
    summary.hide();
    monthly.hide();
    list.hide();

    if(table) table.clear().destroy();

    if(!value) value = "monthly";

    $(".filters_container div input").val('') //clears previous filter input fields
    $.fn.dataTable.ext.search = []; //clears previous filters

    if(value == "summary"){
        span_reports_type.text("[summary]");
        summary.show();

        table = summary_datatable.DataTable({...default_datatable_options, ...summary_datatable_options});

        $.fn.dataTable.ext.search.push(
            function(settings, data, dataIndex){

                let summary_filters = $("#summary .filters_container");
    
                let filter_material_value = summary_filters.children("#filter_material").children("input").val();
                let filter_item_shortcode_value = summary_filters.children("#filter_item_shortcode").children("input").val();
                let filter_type_value = summary_filters.children("#filter_type").children("input").val();
                let filter_unit_value = summary_filters.children("#filter_unit").children("input").val();
                let filter_no_of_items_value = summary_filters.children("#filter_no_of_items").children("input").val();
                let filter_making_cost_value = summary_filters.children("#filter_making_cost").children("input").val();
                let filter_retailer_cost_value = summary_filters.children("#filter_retailer_cost").children("input").val();
                let filter_wholesale_cost_value = summary_filters.children("#filter_wholesale_cost").children("input").val();
                
                let row_material = data[1];
                let row_item_shortcode = data[2];
                let row_type = data[3];
                let row_unit = data[4];
                let row_no_of_items = data[5];
                let row_making_cost = data[6];
                let row_retailer_cost = data[7];
                let row_wholesale_cost = data[8];
                
                return_value =      ((!filter_material_value) || (filter_material_value == row_material))
                                &&  ((!filter_item_shortcode_value) || (filter_item_shortcode_value == row_item_shortcode))
                                &&  ((!filter_type_value) || (filter_type_value == row_type))
                                &&  ((!filter_unit_value) || (filter_unit_value == row_unit))
                                &&  ((!filter_no_of_items_value) || (filter_no_of_items_value == row_no_of_items))
                                &&  ((!filter_making_cost_value) || (filter_making_cost_value == row_making_cost))
                                &&  ((!filter_retailer_cost_value) || (filter_retailer_cost_value == row_retailer_cost))
                                &&  ((!filter_wholesale_cost_value) || (filter_wholesale_cost_value == row_wholesale_cost))

                return return_value;
            }
        );
    }else if(value == "monthly"){
        span_reports_type.text("[monthly]");
        monthly.show();

        table = monthly_datatable.DataTable({...default_datatable_options, ...monthly_datatable_options});

        $.fn.dataTable.ext.search.push(
            function(settings, data, dataIndex){

                let summary_filters = $("#summary .filters_container");
    
                let filter_material_value = summary_filters.children("#filter_material").children("input").val();
                let filter_item_shortcode_value = summary_filters.children("#filter_item_shortcode").children("input").val();
                let filter_type_value = summary_filters.children("#filter_type").children("input").val();
                let filter_unit_value = summary_filters.children("#filter_unit").children("input").val();
                let filter_no_of_items_value = summary_filters.children("#filter_no_of_items").children("input").val();
                let filter_making_cost_value = summary_filters.children("#filter_making_cost").children("input").val();
                let filter_retailer_cost_value = summary_filters.children("#filter_retailer_cost").children("input").val();
                let filter_wholesale_cost_value = summary_filters.children("#filter_wholesale_cost").children("input").val();
                
                let row_material = data[1];
                let row_item_shortcode = data[2];
                let row_type = data[3];
                let row_unit = data[4];
                let row_no_of_items = data[5];
                let row_making_cost = data[6];
                let row_retailer_cost = data[7];
                let row_wholesale_cost = data[8];
                
                return_value =      ((!filter_material_value) || (filter_material_value == row_material))
                                &&  ((!filter_item_shortcode_value) || (filter_item_shortcode_value == row_item_shortcode))
                                &&  ((!filter_type_value) || (filter_type_value == row_type))
                                &&  ((!filter_unit_value) || (filter_unit_value == row_unit))
                                &&  ((!filter_no_of_items_value) || (filter_no_of_items_value == row_no_of_items))
                                &&  ((!filter_making_cost_value) || (filter_making_cost_value == row_making_cost))
                                &&  ((!filter_retailer_cost_value) || (filter_retailer_cost_value == row_retailer_cost))
                                &&  ((!filter_wholesale_cost_value) || (filter_wholesale_cost_value == row_wholesale_cost))

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

                let filter_generate_id_value = list_filters.children("#filter_generate_id").children("input").val();
                let filter_date_value = list_filters.children("#filter_date").children("input").val();
                let filter_material_value = list_filters.children("#filter_material").children("input").val();
                let filter_item_shortcode_value = list_filters.children("#filter_item_shortcode").children("input").val();
                let filter_type_value = list_filters.children("#filter_type").children("input").val();
                let filter_unit_value = list_filters.children("#filter_unit").children("input").val();
                let filter_quantity_value = list_filters.children("#filter_quantity").children("input").val();
                let filter_making_cost_value = list_filters.children("#filter_making_cost").children("input").val();
                let filter_retailer_cost_value = list_filters.children("#filter_retailer_cost").children("input").val();
                let filter_wholesale_cost_value = list_filters.children("#filter_wholesale_cost").children("input").val();
                let filter_item_no_value = list_filters.children("#filter_item_no").children("input").val();
                let filter_barcode_value = list_filters.children("#filter_barcode").children("input").val();
                
                let row_generated_id = data[1];
                let row_date = data[2];
                let row_material = data[3];
                let row_item_shortcode = data[4];
                let row_type = data[5];
                let row_unit = data[6];
                let row_quantity = data[7];
                let row_making_cost = data[8];
                let row_retailer_cost = data[9];
                let row_wholesale_cost = data[10];
                let row_item_no = data[11];
                let row_barcode = data[12];

                return_value =      ((!filter_generate_id_value) || (filter_generate_id_value == row_generated_id))
                                &&  ((!filter_date_value) || (filter_date_value == row_date))
                                &&  ((!filter_generate_id_value) || (filter_generate_id_value == row_generated_id))
                                &&  ((!filter_material_value) || (filter_material_value == row_material))
                                &&  ((!filter_item_shortcode_value) || (filter_item_shortcode_value == row_item_shortcode))
                                &&  ((!filter_type_value) || (filter_type_value == row_type))
                                &&  ((!filter_unit_value) || (filter_unit_value == row_unit))
                                &&  ((!filter_quantity_value) || (filter_quantity_value == row_quantity))
                                &&  ((!filter_making_cost_value) || (filter_making_cost_value == row_making_cost))
                                &&  ((!filter_retailer_cost_value) || (filter_retailer_cost_value == row_retailer_cost))
                                &&  ((!filter_wholesale_cost_value) || (filter_wholesale_cost_value == row_wholesale_cost))
                                &&  ((!filter_item_no_value) || (filter_item_no_value == row_item_no))
                                &&  ((!filter_barcode_value) || (filter_barcode_value == row_barcode))

                return return_value;
            }
        );
    }

    table.buttons(0, null).container().removeClass('ui'); //or else buttons styling won't be applied
}
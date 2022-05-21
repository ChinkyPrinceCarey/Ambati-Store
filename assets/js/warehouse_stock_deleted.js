var table;
var editor;
var tableDom;
$(function(){

    tableDom = 
    "<'ui stackable grid'"+
        "<'row'"+
            "<'eight wide column'B>"+
        ">"+
        "<'row'"+
            "<'eight wide column'l>"+
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
        ajax: function(method, url, data, success, error){
            $.ajax({
                type: "POST",
                url:  "lib/types.php",
                data: data,
                dataType: "json",
                success: function(json){
                    if(!json.result){
                        console.log("error", json.info)
                        error(json.info);
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
        table: "#example",
        idSrc: 'id',
        fields: [
            {
                label: "Id",
                name: "id"
            },
            {
                label: "Slno",
                name: "slno"
            },
            {
                label: "Type Name",
                name: "type",
                attr: {
                    required: true,
                    name: 'type'
                }
            }
        ],
    })

    editor.on('opened', function(a, b, action){
        //if(action == "create"){} //for future improvements commenting as of now group_name to focus for any fields
        editor.field('id').hide();
        editor.field('slno').hide();
        editor.field('type').focus();
    });

    editor.on( 'preSubmit', function (e, data, action) {
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

    //this.error

    table = $("#example").DataTable({
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
                    extend: 'remove', editor: editor, className: "negative ui button", text: 'Restore'
                }
            ],
        },
        "ajax": {
            "url": "lib/warehouse_stock_deleted.php",
            "type": "POST",
            "data" : {"action": "fetch_all", "data": "random_data"},
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
        columns: [
            { data: "slno", "width": "2%" },
            { data: "generate_id" },
            { data: "date" },
            { data: "material" },
            {   data: "item",
                render: function ( data, type, row ) {
                    return `${row.item}[${row.shortcode}]`
                }
            },
            { data: "unit" },
            { data: "type" },
            { data: "quantity" },
            { data: "making_cost" },
            { data: "retailer_cost" },
            { data: "wholesale_cost" },
            { data: "item_number" },
            { data: "barcode" }
        ]
    });

    //to disable `edit` button on when multiple rows selected
    table.on('select', function(e, f, g){
        /*var buttons = table.buttons( ['.buttons-edit'] );
        var data = table.rows( { selected: true } ).data();
        if(data.length > 1){
            buttons.disable();
        }else{
            buttons.enable();
        }*/
        var buttons = table.buttons( ['.buttons-remove'] );
        buttons.disable();
    });

    // Edit a record
    $('#example').on('click', 'td .actions .ellipse-action-edit', function(e){
        e.preventDefault();
 
        editor.edit( $(this).closest('tr'),{
            title: 'Edit Record',
            buttons: 'Update'
        });
    });

    //table.buttons().container().appendTo( $('div.eight.column:eq(0)', table.table().container()) );
    table.buttons(0, null).container().removeClass('ui');
})
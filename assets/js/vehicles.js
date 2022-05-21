var table;
var editor;
var tableDom;
var selectOptsArr = [{value: '', label: '', disabled: true}];
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
        table: "#example",
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
                label: "Vehicle Id",
                name: "vehicle_id",
                attr: {
                    required: true,
                    name: 'vehicle_id',
                    minlength: 3,
                    maxlength: 15
                }
            },
            {
                label: "Vehicle Name",
                name: "vehicle_name",
                attr: {
                    required: true,
                    name: 'vehicle_name',
                    minlength: 3,
                    maxlength: 25
                }
            }
        ],
        ajax: function(method, url, data, success, error){
            $.ajax({
                type: "POST",
                url:  "lib/vehicles.php",
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
        idSrc: 'id',
    })

    editor.on('opened', function(a, b, action){
        //if(action == "create"){} //for future improvements commenting as of now group_name to focus for any fields
        editor.field('id').hide();
        editor.field('slno').hide();
        editor.field('vehicle_id').focus();
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
                    extend: 'create', editor: editor, className: "positive ui button"
                },
                {
                    extend: 'edit', editor: editor, className: "primary ui button"
                },
                {
                    extend: 'remove', editor: editor, className: "negative ui button"
                }
            ],
        },
        "ajax": {
            "url": "lib/vehicles.php",
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
        columns: [
            { data: "slno", "width": "2%" },
            { data: "vehicle_id" },
            { data: "vehicle_name" },
            {
                data: null,
                className: "dt-center stock-shift",
                defaultContent: '<i class="arrow alternate circle right icon"></i>',
                orderable: false
            }
        ],
        rowId: 'id',
        "init.dt": function( settings, json ) {
            console.log(settings, json);
        }
    });

    $('#example').on('click', 'td.stock-shift i', function (e) {
        e.preventDefault();

        $('table#example').addClass('disable'); table.processing(true);

        //console.log($(this).closest('tr').attr('id'));
 
                        //icon   stock_shift   vehicle_name  vehicle_id
        let vehicle_id = $(this).closest('td').prev('td').prev('td').text();

        if(vehicle_id){
            window.location.replace(`stock_shift.html?vehicle_id=${vehicle_id}`);
        }else{
            smallModal(
                "Error Getting Vehicle Id", 
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

            $('table#example').removeClass('disable'); table.processing(false);
        }
    });

    table.on('init.dt', function(){
        //setSelectOpts('lib/units.php', 'unit');
        //setSelectOpts('lib/types.php', 'type');
    });

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

    // Edit a record
    $('#example').on('click', 'td .actions .ellipse-action-edit', function(e){
        e.preventDefault();
 
        editor.edit( $(this).closest('tr'),{
            title: 'Edit Record',
            buttons: 'Update'
        });
    });

    // Delete a record
    $('#example').on('click', 'td .actions .ellipse-action-remove', function(e){
        e.preventDefault();
 
        editor.remove( $(this).closest('tr'), {
            title: 'Delete record',
            message: 'Are you sure you wish to remove this record?',
            buttons: 'Delete'
        } );
    });

    //table.buttons().container().appendTo( $('div.eight.column:eq(0)', table.table().container()) );
    table.buttons(0, null).container().removeClass('ui');
})

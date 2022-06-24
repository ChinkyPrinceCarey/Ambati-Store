var table;
var editor;
var tableDom;
var selectOptsArr = [{value: '', label: '', disabled: true}];

$(function(){

    $.fn.search.settings.showNoResults = false;

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
        template: "#editorForm",
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
                label: "Material",
                name: "material",
                type: "select",
                options: [{label: "manufactured", value: "manufactured"},{label: "confectury", value: "confectury"},{ label: "raw", value: "raw"}],
                attr: {
                    required: true,
                    name: 'material'
                }
            },
            {
                label: "Item",
                name: "item",
                type: "search",
                attr: {
                    required: true,
                    name: 'item'
                }
            },
            {
                label: "Shortcode",
                name: "shortcode",
                attr: {
                    required: true,
                    name: 'shortcode',
                    minlength: 5,
                    maxlength: 5
                }
            },
            {
                label: "Type",
                name: "type",
                type: "select",
                attr: {
                    required: true,
                    name: 'type'
                }
            },
            {
                label: "Unit",
                name: "unit",
                type: "select",
                attr: {
                    required: true,
                    name: 'unit'
                }
            },
            {
                label: "Description 1",
                name: "desc_1",
                attr: {
                    name: 'desc_1'
                }
            },
            {
                label: "Description 2",
                name: "desc_2",
                attr: {
                    name: 'desc_2'
                }
            },
            {
                label: "Company Name",
                name: "company_name",
                type: "search",
                attr: {
                    name: 'company_name',
                    placeholder: 'Search company...'
                }
            },
            {
                label: "Flavour Name",
                name: "flavour",
                type: "search",
                attr: {
                    name: 'flavour',
                    placeholder: 'Search flavour...'
                }
            },
            {
                label: "Denomination",
                name: "denomination",
                type: "search",
                attr: {
                    name: 'denomination',
                    placeholder: 'Search denomination...',
                    showSearchIcon: false
                }
            },
            {
                label: "Level",
                name: "level",
                type: "select",
                options: [
                    { label: "Level 1", value: "level_1"},
                    {label: "Level 2", value: "level_2"},
                    {label: "Level 3", value: "level_3"},
                    {label: "Level 4", value: "level_4"},
                    {label: "Level 5", value: "level_5"}
                ],
                attr: {
                    name: 'level'
                }
            },
            {
                label: "Making Cost",
                name: "making_cost",
                attr: {
                    readonly: true
                }
            },
            {
                label: "Retailer Cost",
                name: "retailer_cost",
                attr: {
                    readonly: true
                }
            },
            {
                label: "Available Stock",
                name: "available_stock",
                attr: {
                    readonly: true
                }
            },
            {
                label: "Actual Cost",
                name: "actual_cost",
                attr: {
                    name: 'actual_cost'
                }
            },
            {
                label: "Cost",
                name: "cost",
                attr: {
                    name: 'cost'
                }
            },
            {
                label: "In Stock?",
                name: "in_stock",
                type: "select",
                options: [{ label: "Yes", value: "1"},{label: "No", value: "0"}],
                attr: {
                    name: 'level'
                }
            },
            {
                label: "Priority",
                name: "priority",
                type: "select",
                options: [
                    { label: "Default", value: "default"},
                    {label: "Top", value: "top"},
                    {label: "New", value: "new"},
                    {label: "Offer", value: "offer"}
                ],
                attr: {
                    name: 'priority'
                }
            }
        ],
        ajax: function(method, url, data, success, error){
            $.ajax({
                type: "POST",
                url:  "lib/items.php",
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
        if(action == "create"){
            editor.field('making_cost').hide();
            editor.field('retailer_cost').hide();
            editor.field('available_stock').hide();

            editor.field('material').focus();


            editor.field('shortcode').enable();
            $("#generate_btn").show();
        }else if(action == "edit"){
            editor.field('making_cost').show();
            editor.field('retailer_cost').show();
            editor.field('available_stock').show();

            editor.field('shortcode').disable();
            $("#generate_btn").hide();
        }

        editor.field('id').hide();
        editor.field('slno').hide();
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

        setTimeout(function(){
            $('.ui.rating').rating('disable');
        }, 200);

        parseSearchOpts('item');
        parseSearchOpts('company_name');
        parseSearchOpts('flavour');
        parseSearchOpts('denomination');

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
            "url": "lib/items.php",
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
            { data: "material" },
            { data: "type" },
            { data: "unit" },
            { data: "item" },
            { data: "shortcode" },
            { data: "desc_1" },
            { data: "desc_2" },
            { data: "company_name" },
            { data: "flavour" },
            { data: "denomination" },
            { data: "making_cost" },
            { data: "retailer_cost" },
            { data: "available_stock",
            render: function(data, type, row){
                let color = "green";
                data = parseInt(data) ? parseInt(data) : 0 ;

                if(data < 100) color = "orange"
                if(data < 50) color = "red";

                return `<a class="ui ${color} label">${data}</a>`;
            }
            },
            { data: "actual_cost" },
            { data: "cost" },
            { data: "level", 
            render: function(data, type, row){
                let rating = 0
                if(data){
                    rating = parseInt(data.replace("level_", ""));
                }
                return `<div class="ui star rating" data-rating="${rating}" data-max-rating="5"></div>`;
            }
            },
            { data: "in_stock",
            render: function(data, type, row){
                let color = data == 1 ? "green" : "red";
                let text = data == 1 ? "yes" : "no";
                return `<div class="ui ${color} horizontal label">${text}</div>`;
            }
            },
            { data: "priority" },
            {
                data: null,
                className: "dt-center stock-entry",
                defaultContent: '<i class="plus icon"></i>',
                orderable: false
            }
        ],
        rowId: 'id',
        "initComplete": function( settings, json ) {
            //console.log(settings, json);
            $('.ui.rating').rating('disable');
        }
    });

    editor.field('material').input().on( 'change', function (e) {
        fields = ['desc_1', 'desc_2', 'actual_cost', 'cost', 'level', 'in_stock', 'priority']
        if(this.value == "raw"){
            $.each(fields, function(){
                editor.field(this).hide();
            })
        }else{
            $.each(fields, function(){
                editor.field(this).show();
            })
        }
    });

    $('#example').on('click', 'td.stock-entry i', function (e) {
        e.preventDefault();

        $('table#example').addClass('disable'); table.processing(true);

        //console.log($(this).closest('tr').attr('id'));
 
                        //icon   stockentry   shortcode
        //let shortcode = $(this).closest('td').prev('td').text();
        let shortcode = table.row($(this).parent()).data().shortcode;
        
        if(shortcode){
            window.location.replace(`warehouse_stock_entry.html?shortcode=${shortcode}`);
        }else{
            smallModal(
                "Error Getting Shortcode for the Item", 
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
        setSelectOpts('lib/units.php', 'unit');
        setSelectOpts('lib/types.php', 'type');

        parseSearchOpts('item');
        parseSearchOpts('company_name');
        parseSearchOpts('flavour');
        parseSearchOpts('denomination');
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

    editor.field('making_cost').input().parent()
    .add(editor.field('retailer_cost').input().parent())
    .add(editor.field('available_stock').input().parent())
    .addClass('editor-field-disable');

    onInput_fields =    editor.field('item').dom.inputControl
                        .add(editor.field('company_name').dom.inputControl)
                        .add(editor.field('flavour').dom.inputControl)

    $(document).on('input', onInput_fields, function(){
        let item_val = editor.field('item').val();
        if(item_val.length >=5){
            $("#generate_btn").click();
        }
    })
})

function parseSearchOpts(_required_distinct_column){
    ajaxPostCall('lib/items.php', {action: "fetch_distinct_column", data: _required_distinct_column}, function(response){

        let modal_title = `On parse '${_required_distinct_column}' error`;
        let modal_body = null;

        if(response.status){
            modal_body = response.status + ": " + response.statusText;
        }else if(response.title){
            modal_title = response.title;
            modal_body = response.content;
        }else if(response.result){
            let options_arr = [];
            $.each(response.data, function(i){
                options_arr.push({ title: this[_required_distinct_column] });
            });
            editor.field(_required_distinct_column).update(options_arr);
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
                        "text": "Okay",
                    }
                ], 
                {
                    closable: true
                }
            );    
        }
    });
}

function setSelectOpts(url, fieldName){
    ajaxPostCall(url, {action: "fetch_all", data: "random_data"}, function(response){

        let modal_title = "On create `types` error";
        let modal_body = null;

        if(response.status){
            modal_body = response.status + ": " + response.statusText;
        }else if(response.title){
            modal_title = response.title;
            modal_body = response.content;
        }else if(response.result){
            $.each(response.data, function(i){
                selectOptsArr.push({
                    value: this.type ? this.type : this.unit,
                    label: this.type ? this.type : this.unit
                });
            });
            editor.field(fieldName).update(selectOptsArr);
            selectOptsArr = [];
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
                        "text": "Okay",
                    }
                ], 
                {
                    closable: true
                }
            );    
        }
    });
}

function randomString(charSet, strLength = 5){
    var result = [];
    
    strLength = strLength || 5;
    charSet = charSet || 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    
    while (strLength--){
        result.push(charSet.charAt(Math.floor(Math.random() * charSet.length)));
    }
    
    return result.join('');
}

$(document).on('click', '#generate_btn', function(e){
    e.preventDefault();

    let item = "";
    item = editor.field('item').val();
    
    let company_name = "";
    company_name = editor.field('item').val();
    
    let flavour_name = "";
    flavour_name = editor.field('flavour').val();

    let compiled_string = "";

    if(item.length) compiled_string += item;
    if(company_name.length) compiled_string += company_name;
    if(flavour_name.length) compiled_string += flavour_name;

    compiled_string = compiled_string.replaceAll(/[\W_]/g,"")

    if(compiled_string.length){
        compiled_string = compiled_string.toUpperCase();
        editor.field('shortcode').val(randomString(compiled_string));
    }
})
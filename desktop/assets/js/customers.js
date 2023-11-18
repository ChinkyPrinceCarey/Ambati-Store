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
                label: "User Name",
                name: "username"
            },
            {
                label: "Name",
                name: "name",
                attr:{
                  required: true,
                  name: "name"
                }
            },
            {
                label: "Mobile Number",
                name: "mobile_number",
                attr:{
                  required: true,
                  length: 10,
                  name: "mobile_number"
                }
            },
            {
                label: "Address State",
                name: "state_id",
                type: "select",
                options: [{label: "Telangana", value: 1}],
                attr:{
                    required: true,
                    name: 'state_id'
                }
            },
            {
                label: "Address District",
                name: "district_id",
                type: "select",
                attr:{
                    required: true,
                    name: 'district_id'
                }
            },
            {
                label: "Address Mandals",
                name: "mandal_id",
                type: "select",
                attr:{
                    required: true,
                    name: 'mandal_id'
                }
            },
            {
                label: "Address Villages",
                name: "village_id",
                type: "select",
                attr:{
                    required: true,
                    name: 'village_id'
                }
            },
            {
                label: "Landmark",
                name: "landmark"
            },
            {
                label: "Address",
                name: "address"
            },
            {
                label: "Password",
                name: "password",
                type: "password"
            },
            {
                label: "Allowed?",
                name: "is_allowed",
                type: "select",
                options: [{label: "Allow", value: "1"},{label: "Block", value: "0"}],
                attr: {
                    required: true,
                    name: 'is_allowed'
                }
            }
        ],
        ajax: function(method, url, data, success, error){
            $.ajax({
                type: "POST",
                url: `${LIB_API_ENDPOINT}/customers.php`,
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
        editor.field('password').hide();
        
        if(action == "create"){
          editor.field('username').hide();
        }
        editor.field('name').focus();

        $('.DTE_Field_Name_state_id .fluid.dropdown')
        .add('.DTE_Field_Name_district_id .fluid.dropdown')
        .add('.DTE_Field_Name_mandal_id .fluid.dropdown')
        .add('.DTE_Field_Name_village_id .fluid.dropdown')
        .addClass('search')
        .dropdown();
    });

    editor.on('preSubmit', function(e, data, action){
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
                    extend: 'create', editor: editor, className: "positive ui button"
                },
                {
                    extend: 'edit', editor: editor, className: "purple ui button"
                },
                {
                    extend: 'remove', editor: editor, className: "negative ui button"
                }
            ],
        },
        "ajax": {
            "url": `${LIB_API_ENDPOINT}/customers.php`,
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
                            },
                            {
                                "class": "ui negative deny button",
                                "id": "",
                                "text": "Okay",
                            }
                        ], 
                        {
                            closable: false,
                            onApprove: function(){
                                window.location.replace(getCurrentPage());
                                return true;
                            },
                            onDeny: function(){
                                return true;
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
                        },
                        {
                            "class": "ui negative deny button",
                            "id": "",
                            "text": "Okay",
                        }
                    ], 
                    {
                        closable: false,
                        onApprove: function(){
                            window.location.replace(getCurrentPage());
                            return false;
                        },
                        onDeny: function(){
                            return true;
                        }
                    }
                );
            }
        },
        columns: [
            { data: "slno", "width": "2%" },
            { data: "username" },
            { data: "name" },
            { data: "mobile_number" },
            { data: "state_name",
              render: function(data, type, row){
                if(row.village_name && row.mandal_name && row.state_name){
                    return `${row.village_name} (V), ${row.mandal_name} (M), ${row.district_name} (D), ${row.state_name}`;
                }else{
                    return "";
                }
              }
            },
            { data: "landmark" },
            { data: "address" },
            { data: "is_allowed",
              render: function(data, type, row){
              color = parseInt(data) ? "green" : "red" ;
              text = parseInt(data) ? "Allowed" : "Blocked" ;
              return `<a class="ui ${color} label">${text}</a>`;
          }
            }
        ],
        rowId: 'id'
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
    $('#example').on('click', 'td .actions .ellipse-action-create', function(e){
        e.preventDefault();
 
        editor.edit($(this).closest('tr'),{
            title: 'Add Customer',
            buttons: 'Add'
        });
    });
    
    $('#example').on('click', 'td .actions .ellipse-action-edit', function(e){
        e.preventDefault();
 
        editor.edit($(this).closest('tr'),{
            title: 'Edit Record',
            buttons: 'Update'
        });
    });

    // Delete a record
    $('#example').on('click', 'td .actions .ellipse-action-remove', function(e){
        e.preventDefault();
 
        editor.remove( $(this).closest('tr'), {
            title: 'Delete Customer',
            message: 'Are you sure you wish to remove this customer?',
            buttons: 'Delete'
        } );
    });

    editor.dependent('state_id', function(value, data, callback){
        let domm = editor.field("district_id").dom.container.find(".fluid.dropdown");
        domm.addClass("loading");
        domm.addClass("disabled");
        
        paramData = {
            action: "fetch_address_fields",
            type: "district_id",
            data: {
                state_id: data.values.state_id
            }
        }
        $.ajax({
            type: "POST",
            url: `${LIB_API_ENDPOINT}/customers.php`,
            data: paramData,
            dataType: "json",
            success: function(response){
                if(response.result){
                    editor.field("district_id").update(response.data);
                    
                    domm.removeClass("loading");
                    domm.removeClass("disabled");
                }else{
                    smallModal(
                        "Error Fetching Records", 
                        response.info,
                        [
                            {
                                "class": "ui negative deny button",
                                "id": "",
                                "text": "Okay",
                            }
                        ], 
                        {
                            closable: false,
                            onDeny: function(){
                                return true;
                            }
                        }
                    );
                }
            }
        });

        callback({});
    });

    editor.dependent('district_id', function(value, data, callback){
        let domm = editor.field("mandal_id").dom.container.find(".fluid.dropdown");
        domm.addClass("loading");
        domm.addClass("disabled");
        
        paramData = {
            action: "fetch_address_fields",
            type: "mandal_id",
            data: {
                state_id: data.values.state_id,
                district_id: data.values.district_id
            }
        }
        $.ajax({
            type: "POST",
            url: `${LIB_API_ENDPOINT}/customers.php`,
            data: paramData,
            dataType: "json",
            success: function(response){
                if(response.result){
                    editor.field("mandal_id").update(response.data);
                    
                    domm.removeClass("loading");
                    domm.removeClass("disabled");
                }else{
                    
                }
            }
        });

        callback({});
    });

    editor.dependent('mandal_id', function(value, data, callback){
        let domm = editor.field("village_id").dom.container.find(".fluid.dropdown");
        domm.addClass("loading");
        domm.addClass("disabled");
        
        paramData = {
            action: "fetch_address_fields",
            type: "village_id",
            data: {
                state_id: data.values.state_id,
                district_id: data.values.district_id,
                mandal_id: data.values.mandal_id
            }
        }
        $.ajax({
            type: "POST",
            url: `${LIB_API_ENDPOINT}/customers.php`,
            data: paramData,
            dataType: "json",
            success: function(response){
                if(response.result){
                    editor.field("village_id").update(response.data);
                    
                    domm.removeClass("loading");
                    domm.removeClass("disabled");
                }else{
                    
                }
            }
        });

        callback({});
    });

    //table.buttons().container().appendTo( $('div.eight.column:eq(0)', table.table().container()) );
    table.buttons(0, null).container().removeClass('ui');
});
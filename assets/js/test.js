var editor; // use a global for the submit and return data rendering in the examples
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
                label: "Unit Name",
                name: "unit",
                attr: {
                    required: true,
                    name: 'unit'
                }
            }
        ],
        ajax: function(method, url, data, success, error){
            $.ajax({
                type: "POST",
                url: `${LIB_API_ENDPOINT}/units.php`,
                data: data,
                dataType: "json",
                success: function(json){
                    console.log(json);
                    if(!json.result){
                        console.log("error", json.info)
                        error(json.info);
                        return false;
                    }
                    success(json);
                },
                error: function(jqXHR, exception) {
                    error("");
                },
            });
        },
        i18n: {
            error: {
                system: "Parsing error, please reload the page and report to the admin!"
            }
        }
    });
 
    var table = $('#example').DataTable({
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
        ajax: {
            "url": `${LIB_API_ENDPOINT}/units.php`,
            "type": "POST",
            "data" : {"action": "fetch_all", "data": "random_data"},
            "dataType": 'json',
            "dataSrc": function(json){
                if(!json.result){
                    //manageModal(true, "Alert", "Error fetching the records: " + json.info);
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
            { data: "unit" }
        ]
    });

    table.buttons().container()
        .appendTo($('div.eight.column:eq(0)', table.table().container()));

    editor.on('opened', function(a, b, action){
        //if(action == "create"){} //for future improvements commenting as of now group_name to focus for any fields
        editor.field('id').hide();
        editor.field('slno').hide();
        editor.field('unit').focus();
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

});
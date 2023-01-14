(function ($, DataTable) {
 
  if ( ! DataTable.ext.editorFields ) {
      DataTable.ext.editorFields = {};
  }
   
  var Editor = DataTable.Editor;
  var _fieldTypes = DataTable.ext.editorFields;
   
  _fieldTypes.select_multiple = {
      create: function(conf){
          conf._enabled = true;

          conf._input = $(
          `
          <select name="roles" multiple="" class="ui fluid dropdown">
            <option value="">Roles</option>
            <option value="picker">Picker</option>
            <option value="delivery">Delivery</option>
          </select>
          `
          );

          return conf._input;
      },
   
      get: function(conf){
        value = conf._input.dropdown("get value");
        
        return value;
      },

      set: function(conf, value){
        if(value.length == 1){
          setTimeout(function(){
            conf._input.dropdown("set exactly", value);
          }, 500);
        }else{
          conf._input.dropdown("set exactly", value);
        }
      },

      enable: function(conf){
          conf._enabled = true;
          $(conf._input).removeClass('disabled');
      },
   
      disable: function(conf){
          conf._enabled = false;
          $(conf._input).addClass('disabled');
      }

  };
   
})(jQuery, jQuery.fn.dataTable);
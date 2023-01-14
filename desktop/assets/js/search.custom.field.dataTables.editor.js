(function ($, DataTable) {
 
  if ( ! DataTable.ext.editorFields ) {
      DataTable.ext.editorFields = {};
  }
   
  var Editor = DataTable.Editor;
  var _fieldTypes = DataTable.ext.editorFields;
   
  _fieldTypes.search = {
      create: function(conf){
          var that = this;
   
          conf._enabled = true;

          let placeholder = "Search...";
          let search_icon = '';
          if(conf && conf.attr){
            if(conf.attr.placeholder){
              placeholder = conf.attr.placeholder
            }

            if(conf.attr.showSearchIcon){
              search_icon = '<i class="search icon"></i>';
            }
          }

          conf._input = $(
            `<div class="ui search" id="${Editor.safeId(conf.id)}">
            <div class="ui icon input">
              <input class="prompt" type="text" placeholder="${placeholder}" style="margin: 0px;">
              ${search_icon}
            </div>
            <div class="results"></div>
          </div>`);

          conf._input.search();

          return conf._input;
      },
   
      get: function(conf){
        let value = $(conf._input)
        .search('get value');
        return value;
      },

      set: function (conf, val){
        $(conf._input)
        .search('set value', val);
      },

      update: function(conf, data_set){
        $(conf._input)
        .search({
          source: data_set
        });
        return true;
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
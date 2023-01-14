(function ($, DataTable) {
 
  if ( ! DataTable.ext.editorFields ) {
      DataTable.ext.editorFields = {};
  }
   
  var Editor = DataTable.Editor;
  var _fieldTypes = DataTable.ext.editorFields;
   
  _fieldTypes.select_two = {
      create: function(conf){
          conf._enabled = true;

          conf._input = $(
          `
            <div class="two fields">
                <div class="field">
                    <select name="tracking_select_one" class="ui search dropdown" required>
                      <option value=""></option>
                      <option value="A">A</option>
                      <option value="B">B</option>
                      <option value="C">C</option>
                      <option value="D">D</option>
                      <option value="E">E</option>
                      <option value="F">F</option>
                      <option value="G">G</option>
                      <option value="H">H</option>
                      <option value="I">I</option>
                      <option value="J">J</option>
                      <option value="K">K</option>
                      <option value="L">L</option>
                      <option value="M">M</option>
                      <option value="N">N</option>
                      <option value="O">O</option>
                      <option value="P">P</option>
                      <option value="Q">Q</option>
                      <option value="R">R</option>
                      <option value="S">S</option>
                      <option value="T">T</option>
                      <option value="U">U</option>
                      <option value="V">V</option>
                      <option value="W">W</option>
                      <option value="X">X</option>
                      <option value="Y">Y</option>
                      <option value="Z">Z</option>
                    </select>
                </div>
                <div class="field">
                    <select name="tracking_select_two" class="ui search dropdown" required>
                      <option value=""></option>
                      <option value="A">A</option>
                      <option value="B">B</option>
                      <option value="C">C</option>
                      <option value="D">D</option>
                      <option value="E">E</option>
                      <option value="F">F</option>
                      <option value="G">G</option>
                      <option value="H">H</option>
                      <option value="I">I</option>
                      <option value="J">J</option>
                      <option value="K">K</option>
                      <option value="L">L</option>
                      <option value="M">M</option>
                      <option value="N">N</option>
                      <option value="O">O</option>
                      <option value="P">P</option>
                      <option value="Q">Q</option>
                      <option value="R">R</option>
                      <option value="S">S</option>
                      <option value="T">T</option>
                      <option value="U">U</option>
                      <option value="V">V</option>
                      <option value="W">W</option>
                      <option value="X">X</option>
                      <option value="Y">Y</option>
                      <option value="Z">Z</option>
                    </select>
                </div>
            </div>
          `
          );

          return conf._input;
      },
   
      get: function(conf){
        value = conf._input.find(".field select[name='tracking_select_one']").dropdown("get value");
        value += "-"
        value += conf._input.find(".field select[name='tracking_select_two']").dropdown("get value");
        
        return value;
      },

      set: function(conf, value){
        
        //clear previous values
        conf._input.find(".field select[name='tracking_select_one']").dropdown("clear");
        conf._input.find(".field select[name='tracking_select_two']").dropdown("clear");

        value = value.split("-");
        
        conf._input.find(".field select[name='tracking_select_one']").dropdown("set value", value[0]);
        conf._input.find(".field select[name='tracking_select_one']").dropdown("set text", value[0]);
        
        conf._input.find(".field select[name='tracking_select_two']").dropdown("set value", value[1]);
        conf._input.find(".field select[name='tracking_select_two']").dropdown("set text", value[1]);
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
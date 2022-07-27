(function ($, DataTable) {
 
  if ( ! DataTable.ext.editorFields ) {
      DataTable.ext.editorFields = {};
  }
   
  var Editor = DataTable.Editor;
  var _fieldTypes = DataTable.ext.editorFields;
   
  _fieldTypes.imagesUpload = {
      create: function(conf){
          conf._enabled = true;

          conf._input = $(
            `
            <input type="file" name="imageupload" value="imageupload" id="imageupload">
            <div class="cell">
              <div class="rendered">
                <ul id="imageList"></ul>
              </div>
            </div>
            `
          );

          return conf._input;
      },
   
      get: function(conf){
        let fileInput = $(conf._input)

        let images = fileInput.parent().find(".cell .rendered #imageList li");

        let dataArr = [];
        
        $(images).each(function(){
          dataArr.push({
            thumb: $(this).children("img").attr("src"),
            orginal: $(this).children("img").data("orginal")
          })
        });

        return dataArr.length ? dataArr : "1";
      },

      set: function(conf, dataArr){
        //clears previous images
        $(conf._input).parent().find("#imageList").empty();

        let fileInput = $(conf._input);

        let popupDom = `
        <div class="ui customised-popup">
            <i class="trash icon link remove-image"></i>
            <i class="arrow alternate circle left icon move-image-left"></i>
            <i class="arrow alternate circle right icon move-image-right"></i>
        </div>`;

        let imagesList = fileInput.parent().find(".cell .rendered #imageList");

        for(var key in dataArr){
          imagesList.append(`
          <li class="s-200px image-container">
              <img class="maxWidth100" src="${dataArr[key].thumb}" data-orginal="${dataArr[key].orginal}" />
              ${popupDom}
          </li>
          `);
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
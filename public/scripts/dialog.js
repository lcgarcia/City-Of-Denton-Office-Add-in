Office.initialize = function(reason) {
  $(document).ready(function() {
    var user = $('#param').text();
    if (user === 'true') {
      closeWithUser();
    }
  });
};

function closeWithUser() {
  $.get('/SessionInfo', function(data) {
    try {
      localStorage.setItem('user', JSON.stringify(data));
      
      // Show success 
      $('#success').show();
      $('#login').hide();
      Office.context.ui.messageParent(JSON.stringify(data));
    }
    catch (e) {
      $('#hello').html(JSON.stringify(e));
    }
  });
}
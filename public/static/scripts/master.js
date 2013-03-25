'use strict';
var socket = io.connect();

var CACHE_TIME = 15 * 60 * 1000;
var cache = {};

var Media = {
  onNewMedia: function (ev) {
    $(ev.media).each(function (index, media) {
      var imgUrl = media.images.low_resolution.url;
      if (cache[imgUrl] || $('.cube img[src="' + imgUrl + '"]').length > 0) {
        return;
      }
      cache[imgUrl] = 1;
      setTimeout(function () {
        delete cache[imgUrl];
      }, CACHE_TIME);

      $('<img/>').attr('src', imgUrl).load(function () {
        var numChildren = $('#wrapper').children().length;
        var index = Math.floor(Math.random() * numChildren);
        var $container = $($('#wrapper').children()[index]);
        var $oldCube = $('.cube', $container);
        if ($.browser.webkit) {
          var $newCube = $('<div class="cube in"><span class="location"></span><span class="channel"></span</div>');
          $newCube.prepend(this);
          $('.location', $newCube).html(media.location.name);
          $('.channel', $newCube).html(media.meta.location);
          $container.addClass('animating').append($newCube);
          $oldCube.addClass('out').bind('webkitAnimationEnd', function () {
            $container.removeClass('animating');
            $(this).remove();
          });
        } else {
          $('img', $oldCube).attr('src', imgUrl);
          $('.location', $oldCube).html(media.location.name);
          $('.channel', $oldCube).html(media.meta.location);
        }
      });
    });
  },
  positionAll: function () {
    var columns = 5;
    var width = parseInt($('.container').css('width'), 10);
    $('.container').each(function (index, item) {
      $(item).css('top', 10 + parseInt(index / columns, 10) * width + 'px')
           .css('left', 10 + (index % columns) * width + 'px');
    });
  }
};

socket.on('message', function (update) {
  var data = $.parseJSON(decodeURIComponent(update));
  $(document).trigger(data);
});

$(document).bind('newMedia', Media.onNewMedia);
$(document).ready(function () {
  $('.cube img').each(function () {
    var imgUrl = $(this).attr('src');
    cache[imgUrl] = 1;
    setTimeout(function () {
      delete cache[imgUrl];
    }, CACHE_TIME);
  });
});

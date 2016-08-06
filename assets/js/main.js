$(function() {
    var $theGrid = $('.index .grid #the-posts').imagesLoaded(function() {
        $theGrid.masonry({
            columnWidth: 500,
            itemSelector: '.post',
            gutter: 20
        });
    });


    // vertically center audio info
    $('.audio-info').each(function() {
        var $cont = $(this),
            $cell = $cont.children('.the-info');

        if ($cont.innerHeight() > 150 || $cell.height() >= $cont.height()) {
            $cell.css('opacity', '1');
            return true;
        }

        $cont.css({
            'height': '150px',
            'display': 'table',
            'padding-top': '0'
        });

        $cell.css({
            'display': 'table-cell',
            'vertical-align': 'middle',
            'opacity': 1
        });
    });
    // end vertically center audio info


    // begin photo and photoset functionality
    $('.photo-container:not(.panorama)').each(function() {
        var $photoset = $(this),
            images    = [];

        // enable tumblr lightbox
        $photoset.children('.photo-link').each(function(index) {
            var image = $(this).data();

            images.push({
                width: image['width'],
                height: image['height'],
                low_res: image['lowres'],
                high_res: image['highres']
            });

            $(this).click(function() {
                Tumblr.Lightbox.init(images, index);
                return false;
            });
        });

        // initialize photoset grid
        // todo: hi-res photoset width, window resizing
        if (!$photoset.hasClass('photoset')) return true;
        $.each($photoset.data('layout'), function(i, columns) {
            var $row = $photoset.children('.photo-link:lt(' + columns + ')');
            $row.wrapAll('<div class="photoset-row columns-' + columns + '" />').imagesLoaded(function() {
                var $rowImgs  = $row.find('img'),
                    minHeight = Math.min.apply(null, $rowImgs.map(function() {
                        return $(this).height();
                    }));
                $row.parent('.photoset-row').height(minHeight);
                $rowImgs.each(function() {
                    if ($(this).height() == minHeight) return true;
                    var margin = 0 - Math.ceil( ($(this).height() - minHeight) / 2 );
                    $(this).css('top', margin + 'px');
                });
            });
        });
    });
    // end photo and photoset functionality


    // fade-in scroll to top
    var $elevator   = $('#elevator'),
        $spinner    = $('#spinner'),
        bottomInit  = $spinner.css('bottom'),
        bottomShift = $elevator.css('bottom');

    $(window).scroll(function() {
        if ($(this).scrollTop() > 200) {
            $spinner.css('bottom', bottomInit);
            $elevator.fadeIn();
        } else {
            $elevator.fadeOut(400, function() {
                $spinner.css('bottom', bottomShift);
            });
        }
    });

    $elevator.click(function() {
        $('body,html').animate({
            scrollTop: 0
        }, 500);
        return false;
    });
    // end fade-in scroll to top


    // add icon to tumblr gif attribution
    $('figure[data-tumblr-attribution] .tmblr-attribution a').addClass('icon-link-ext');
});

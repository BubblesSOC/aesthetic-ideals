(function( $, window ) {
    'use strict';

    // vertically center audio info
    var centerAudioInfo = function( $post ) {
        if ( !$post.hasClass('type-audio') ) return;

        var $cont = $post.find('.audio-info'),
            $cell = $cont.children('.the-info');

        if ( $cont.innerHeight() > 150 || $cell.height() >= $cont.height() ) {
            $cell.css('opacity', 1);
            return;
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
    };


    // enable tumblr lightbox for non-panorama photos
    var initLightbox = function( $post ) {
        if ( !$post.hasClass('type-photo') ) return;

        var $photoset = $post.find('.photo-container:not(.panorama)'),
            images    = [];

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
    };


    // initialize photoset grid
    // todo: hi-res photoset width
    var initPhotosetGrid = function( $post ) {
        if ( !$post.hasClass('type-photo') ) return;

        var $photoset = $post.find('.photo-container.photoset'),
            layout    = $photoset.data('layout') || [];

        // wrap the photos in row divs according to the layout array
        // ex: layout = ["2","2"]
        $.each(layout, function(i, columns) {
            $photoset.children('.photo-link').slice(0, columns)
                     .wrapAll('<div class="photoset-row columns-' + columns + '" />');
        });

        var resizePhotoset = function() {
            $photoset.children('.photoset-row').each(function() {

                // equalize the heights of the row's images by setting the height
                // of the row div to the height of the smallest image
                // see: 'Photoset Grid' section in main.css

                var $row  = $(this),
                    $imgs = $row.find('img'),
                    minHeight = Math.min.apply( null, $imgs.map(function() {
                        return $(this).height();
                    }).get() );

                $row.height(minHeight);
                $imgs.each(function() {
                    if ( $(this).height() == minHeight ) return true;

                    // vertically center the larger images within view
                    var top = 0 - Math.ceil( ($(this).height() - minHeight) / 2 );
                    $(this).css('top', top + 'px');
                });
            });
        };

        $photoset.imagesLoaded(function() {
            resizePhotoset();
            $(window).on('resize', resizePhotoset);
        });
    };


    $.fn.idealize = function() {
        return this.each(function() {
            var $ele = $(this);

            if ( $ele.hasClass('idealized') ) return true;

            centerAudioInfo( $ele );
            initLightbox( $ele );
            initPhotosetGrid( $ele );

            // add icon to tumblr gif attribution
            $ele.find('figure[data-tumblr-attribution] .tmblr-attribution a').addClass('icon-link-ext');

            // mark element with class to prevent duplicate work
            $ele.addClass('idealized');
        });
    };


    $(function() {
        var $indexWrap = $('.index #wrapper'),
            initGrid   = $indexWrap.hasClass('grid'),
            $theGrid   = null,
            initInfScr = $indexWrap.hasClass('infinite-scroll'),
            $infScr    = null,
            $loading   = $('#loading'),
            $spinner   = $('#spinner');

        $('.post').idealize();

        if (initGrid) {
            $theGrid = $('.index .grid #the-posts').imagesLoaded(function() {
                $theGrid.masonry({
                    columnWidth: 500,
                    itemSelector: '.post',
                    gutter: 20
                });
            });
        }


        // begin infinite scroll setup
        if (initInfScr) {

            // refs:
            // http://www.infinite-scroll.com/
            // https://github.com/infinite-scroll/infinite-scroll/blob/master/jquery.infinitescroll.js
            // https://gist.github.com/gregrickaby/10383879
            // https://github.com/fk/masonite/blob/master/js/masonite.js

            var Spinner = {
                on: function(currPage) {
                    var title = $loading.data('loading') + ' ' + currPage + ' / ' + $loading.data('total-pages');
                    return $spinner.attr('title', title).addClass('spin');
                },
                off: function() {
                    return $spinner.attr('title', '').removeClass('spin');
                }
            };

            $infScr = $('.index .infinite-scroll #the-posts').infinitescroll({
                loading: {
                    finishedMsg: $loading.data('finished'),
                    msg: $('<p id="loading-message"></p>'),
                    selector: '#loading',
                    speed: 400,
                    start: function(opts) {
                        var instance = $(this).data('infinitescroll'),
                            $loadMsg = opts.loading.msg.appendTo(opts.loading.selector),
                            currPage = opts.state.currPage + 1;

                        if (currPage <= opts.maxPage) {
                            $loadMsg.text('Loading Page ' + currPage + ' of ' + opts.maxPage + '...');
                            Spinner.on(currPage);
                        } else {
                            $loadMsg.text( opts.loading.finishedMsg );
                        }

                        $(opts.navSelector).hide();
                        $loadMsg.fadeIn(opts.loading.speed, function() {
                            instance.beginAjax(opts);
                        });
                    },
                    finished: function() {
                        return;
                    }
                },
                state: {
                    currPage: $loading.data('current-page')
                },
                nextSelector: '#next-page a.next',
                navSelector: '#blog-pagination',
                itemSelector: '.post',
                pathParse: function(path, nextPage) {
                    return [ path.substring(0, path.lastIndexOf('/')) + '/', '' ];
                },
                errorCallback: function() {
                    var opts = $infScr.data('infinitescroll').options;
                    setTimeout(function() {
                        opts.loading.msg.fadeOut(opts.loading.speed, function() {
                            $(opts.navSelector).show();
                        });
                    }, 2000);
                },
                maxPage: $loading.data('total-pages')
                // debug: true
            },
            function( newElements ) {
    			var $posts  = $(newElements).css({ opacity: 0 }),
                    postIds = $posts.map(function() {
                        return this.id;
                    }).get(),
                    opts = $infScr.data('infinitescroll').options;

                $infScr.infinitescroll('pause');
                $posts.idealize().imagesLoaded(function() {
                    Tumblr.LikeButton.get_status_by_post_ids(postIds);

                    if (initGrid) {
                        $posts.css({ opacity: 1 });
                        $theGrid.masonry('appended', $posts);
                    } else {
                        $posts.animate({ opacity: 1 });
                    }

                    if (opts && !opts.state.isBeyondMaxPage) {
                        Spinner.off();
                        opts.loading.msg.fadeOut(opts.loading.speed);
                    }

                    $infScr.infinitescroll('resume');
                });
            });
        }
        // end infinite scroll setup


        // fade-in scroll to top
        var $elevator  = $('#elevator'),
            spinInit   = $spinner.css('bottom'),
            spinShift  = $elevator.css('bottom');

        $(window).scroll(function() {
            if ($(this).scrollTop() > 200) {
                $spinner.css('bottom', spinInit);
                $elevator.fadeIn();
            } else {
                $elevator.fadeOut(400, function() {
                    $spinner.css('bottom', spinShift);
                });
            }
        });

        $elevator.click(function() {
            $('body,html').animate({
                scrollTop: 0
            }, 500);
            return false;
        });
    });

}( jQuery, window ));

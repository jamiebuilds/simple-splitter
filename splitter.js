/* ############################################################################
 *
 * INSTRUCTIONS:
 *
 * To init, call...
 * $('selector').splitter({ options })
 *
 * Some time later...
 * $('selector').splitter('snap', 'left' || 'center' || 'right' );
 * $('selector').splitter('snap', {{ number }});
 * $('selector').splitter('control', 'selector', 'left' || 'center' || 'right');
 * $('selector').splitter('control', {{ number }});
 *
 * DETAILS:
 * Once inited with $('selector').splitter({ options }), you can call
 * $('selector').myPluginName('myAction') where myAction is a method in this
 * class.
 *
 * The scope, ie "this", **is the object itself**. The jQuery match is stored
 * in the property this.$T. In general this value should be returned to allow
 * for jQuery chaining by the user.
 *
 * Methods which begin with underscore are private and not
 * publically accessible.
 *
 * ######################################################################### */

(function( $ ) {

  var PLUGIN_NS = 'splitter';

  var Plugin = function( target, options ) {
    this.$T = $(target);

    /** #### OPTIONS #### */

    this.options = $.extend(
      // deep extend
      true,
      {
        DEBUG: false,
        handle:    this.$T.find('.splitter-handle'),

        sections:  this.$T.find('.splitter-section'),
        leftSide:  this.$T.find('.splitter-section-left'),
        rightSide: this.$T.find('.splitter-section-right'),

        cover: $('<div class="splitter-overlay"></div>').appendTo('body'),

        minWidth: 650,

        initPos: 50,

        classes: {
          target: 'splitter',

          splitter: {
            ready:     'splitter--ready',
            resizing:  'splitter--resizing',
            moving:    'splitter--moving',
            animating: 'splitter--animating'
          },

          controls: {
            handle: {
              active: 'splitter-handle-active'
            },

            snap: {
              active: 'splitter-snap-active'
            }
          },

          position: {
            left:   'splitter-position-left',
            center: 'splitter-position-center',
            right:  'splitter-position-right'
          }
        }
      },
      options
    );

    /** #### PROPERTIES #### */

    // Here rather than below in Plugin.prototype.myProp and in _init() as this way is DRY-er
    // Private property declaration, underscore optional

    this._totalWidth;
    this._offsetPos;
    this._currentPos;

    this._startX;
    this._moveX;
    this._stopX;

    this._movePos;

    this._iframes = this.$T.find('iframe');

    this._init( target, options );
    return this;
  }

  /** #### CONSTANTS #### */

  Plugin.RESIZE_TIMER;

  /** #### INITIALISER #### */

  Plugin.prototype._init = function( target, options ) {
    var self = this;

    if (self.options.classes.target === 'splitter') {
      self.options.classes.target = self.$T;
    }

    self._totalWidth = self.$T.outerWidth();
    self._offsetPos = self.options.handle.outerWidth() / 2;
    self._currentPos = self.options.handle.offset().left + self._offsetPos;

    self.snap([self.options.initPos, 0]);

    $(window).bind('resize', function() {
      self._totalWidth = self.$T.outerWidth();
      self._offsetPos = self.options.handle.outerWidth() / 2;

      if (Plugin.RESIZE_TIMER) {
        clearTimeout( Plugin.RESIZE_TIMER );
        Plugin.RESIZE_TIMER = null;
      } else {
        self._addClass('splitter', 'resizing');
      }

      Plugin.RESIZE_TIMER = setTimeout(function() {
        self._removeClass('splitter', 'resizing');

        self._currentPos = self.options.handle.offset().left + self._offsetPos;

        self.snap([ self._currentPos / self._totalWidth * 100, 300 ]);
        clearTimeout( Plugin.RESIZE_TIMER );
        Plugin.RESIZE_TIMER = null;
      }, 300);
    });

    self._addClass('splitter', 'ready');

    self.options.handle
      .attr('unselectable', 'on')
      .bind('mousedown', function(e) {
        self._start(e.clientX);
      });

    self.DLOG('initialized');
  };

  /** #### PUBLIC API (see notes) #### */

  Plugin.prototype.snap = function() {

    console.log("FUCK");

    var self = this, a, c, x, n;

    arguments = arguments[0];

    var pos = arguments[0],
        time = arguments[1];

    if ( self._totalWidth < self.options.minWidth * 2 ) {
      a = [0, 100];
    } else if ( self._totalWidth < self.options.minWidth * 2 + 200  ) {
      a = [0, 50, 100];
    } else {
      x = self.options.minWidth / self._totalWidth * 100;
      a = [0, x, 50, 100 - x, 100];
    }

    if (isNaN(pos)) {
      c = self._getClosest(self._currentPos / self._totalWidth * 100, a);

      if ( pos === 'left' ) {
        if ( a.length < 3 ) {
          pos = 0;
        } else {
          pos = self._getClosest( c - 50.001, [0, 50] );
        }
      }

      if (pos === 'center') {
        pos = self._getClosest(50.001, a);
      }

      if ( pos === 'right' ) {
        if ( a.length < 3 ) {
          pos = 100;
        } else {
          pos = self._getClosest( c + 50.001, [50, 100] );
        }
      }
    } else {
      pos = self._getClosest(pos + 0.001, a);
    }

    if ( pos !== self._currentPos ) {
      self._addClass('splitter', 'animating');

      if ( pos === 0 ) {
        self._addClass('position', 'left');
      } else {
        self._removeClass('position', 'left');
      }

      if ( pos > 0 && pos < 100 ) {
        self._addClass('position', 'center');
      } else {
        self._removeClass('position', 'center');
      }

      if ( pos === 100 ) {
        self._addClass('position', 'right');
      } else {
        self._removeClass('position', 'right');
      }

      self.options.handle.animate({ left: pos + '%' }, time);
      self.options.leftSide.animate({ width: pos + '%'}, time);
      self.options.rightSide.animate({ width: 100 - pos + '%'}, time, function() {
        self._currentPos = self.options.handle.offset().left + self._offsetPos;
        self._removeClass('splitter', 'animating');
      });
    }

    // support jQuery chaining
    return self.$T;
  };

  Plugin.prototype.control = function() {
    arguments = arguments[0];
    var self = this,
        target = $(arguments[0]),
        action = arguments[1];

    target.bind('mousedown', function() {
      target.bind({
        mouseup: function() {
          self.snap([ action, 300 ]);
        },

        mousemove: function() {
          target.unbind('mouseup mousemove');
        }
      });
    });
  };

  /** #### PRIVATE METHODS #### */

  Plugin.prototype._start = function(startX) {
    var self = this;
    self._startX = startX;

    self._startPos = self._currentPos;

    self.options.cover.show();
    self.options.sections.attr('unselectable', 'on');
    self._iframes.attr('unselectable', 'on');
    self._addClass('splitter', 'moving');

    $(document).bind({
      mousemove: function(e) {
        self._move(e.clientX);
      },

      mouseup: function(e) {
        self._stop(e.clientX);
      }
    });
  };

  Plugin.prototype._move = function(moveX) {
    var self = this;
    self._moveX = moveX;

    self._movePos = (self._startPos - (self._startX - self._moveX));

    if (self._movePos < 0 ) { self._movePos = 0; }
    if (self._movePos > self._totalWidth ) { self._movePos = self._totalWidth; }

    self.options.handle.css('left', self._movePos + 'px');
    self.options.leftSide.css('width', self._movePos + 'px');
    self.options.rightSide.css('width', self._totalWidth - self._movePos + 'px');
  };

  Plugin.prototype._stop = function(stopX) {
    var self = this;
    self._stopX = stopX;
    self._stopPos = self._currentPos = self._movePos;

    self.options.cover.hide();
    self.options.sections.removeAttr('unselectable');
    self._iframes.removeAttr('unselectable');
    self._removeClass('splitter', 'moving');

    $(document).unbind('mousemove mouseup');

    if (self._startX !== self._stopX) {
      var width = (self._stopPos / self._totalWidth) * 100;

      self.options.handle.css('left', width + '%');
      self.options.leftSide.css('width', width + '%');
      self.options.rightSide.css('width', 100 - width + '%');

      self.snap([width, 300]);
    }
  };

  Plugin.prototype._addClass = function() {
    var cls = this.options.classes;

    for (var i in arguments) {
      cls = cls[arguments[i]];
    }

    this.options.classes.target.addClass(cls);
  };

  Plugin.prototype._toggleClass = function() {
    var cls = this.options.classes;

    for (var i in arguments) {
      cls = cls[arguments[i]];
    }

    this.options.classes.target.toggleClass(cls);
  };

  Plugin.prototype._removeClass = function() {
    var cls = this.options.classes;

    for (var i in arguments) {
      cls = cls[arguments[i]];
    }

    this.options.classes.target.removeClass(cls);
  };

  Plugin.prototype._getClosest = function(n, a) {
    var c;

    for (var i = 0; i < a.length; i++) {
      x = a[i];
      if (typeof c === 'undefined' || Math.abs(x - n) < Math.abs(c - n)) {
        c = x;
      }
    }

    return c;
  };

  /**
   * EZ Logging/Warning (technically private but saving an '_' is worth it imo)
   */

  Plugin.prototype.DLOG = function() {
    if (!this.options.DEBUG || !console) {
      return;
    }

    for (var i in arguments) {
      console.log( PLUGIN_NS + ': ', arguments[i] );
    }
  }

  Plugin.prototype.DWARN = function() {
    this.options.DEBUG && console && console.warn( arguments );
  };

  Plugin.prototype.DERR = function() {
    this.options.DEBUG && console && console.error( arguments );
  };

  /* ##########################################################################
   * JQUERY HOOK
   * ####################################################################### */

  /**
   * Generic jQuery plugin instantiation method call logic
   *
   * Method options are stored via jQuery's data() method in the relevant element(s)
   * Notice, myActionMethod mustn't start with an underscore (_) as this is used to
   * indicate private methods on the PLUGIN class.
   */

  $.fn[ PLUGIN_NS ] = function( methodOrOptions ) {
    if (!$(this).length) {
      return $(this);
    }

    var instance = $(this).data(PLUGIN_NS);

    // CASE: action method (public method on PLUGIN class)
    if ( instance
        && methodOrOptions.indexOf('_') !== 0
        && instance[ methodOrOptions ]
        && typeof instance[ methodOrOptions ] === 'function' ) {

      return instance[ methodOrOptions ]( Array.prototype.slice.call( arguments, 1 ) );

    // CASE: argument is options object or empty = initialize
    } else if ( typeof methodOrOptions === 'object' || ! methodOrOptions ) {

      // ok to overwrite if this is a re-init
      instance = new Plugin( $(this), methodOrOptions );
      $(this).data( PLUGIN_NS, instance );
      return $(this);

    // CASE: method called before init
    } else if ( !instance ) {
      $.error( 'Plugin must be initialised before using method: ' + methodOrOptions );

    // CASE: private method
    } else if ( methodOrOptions.indexOf('_') === 0 ) {
      $.error( 'Method ' + methodOrOptions + ' is private!' );

    // CASE: method does not exist
    } else {
      $.error( 'Method ' + methodOrOptions + ' does not exist.' );
    }
  };

})(jQuery);

(function(global) {
  'use strict';

  /**
   * Find the CSS transition end event that we should listen for.
   *
   * @returns {string} t - the transition string
   */
  function _whichTransitionEndEvent() {
    var t;
    var el = document.createElement('fakeelement');
    var transitions = {
      WebkitTransition: 'webkitTransitionEnd',
      MozTransition: 'transitionend',
      MSTransition: 'msTransitionEnd',
      OTransition: 'otransitionend',
      transition: 'transitionend',
    };
    for (t in transitions) {
      if (transitions.hasOwnProperty(t)) {
        if (el.style[t] !== undefined) {
          return transitions[t];
        }
      }
    }
  }

  /**
   * Get the anchor tag that triggered the event being clicked.
   *
   * @param {Object} e - the click event
   *
   * @returns {Node} the anchor element
   */
  function _getTargetAnchor(e) {
    var url;
    if (e.target.href) {
      return e.target;
    } else {
      for (var i = 0; i < e.path.length; i++) {
        if (e.path[i].href) {
          return e.path[i];
        }
      }
    }
  }

  /**
   * Return just the pathname for the `href` attribute of the passed anchor tag
   *
   * @param {Node} anchor - the anchor tag to get the path from
   * @returns {string} just the pathname part of the `href` attribute
   */
  function _getAnchorPath(anchor) {
    return anchor.href.replace(window.location.origin, '');
  }

  /**
   * The PageAnimation constructor
   *
   * @param {Object} options - Configuration options
   * @param {bool} options.shouldScroll - whether or we should scroll the page
   *   as part of the animation.
   *   default: true
   * @param {string} options.scrollTiming - the defualt scroll timing.
   *   options:
   *     'before': scroll the page before starting animations
   *     'during': scroll the page and start the animations at the same time
   *     'after': scroll once the animations are complete
   *   default: 'before'
   * @param {bool} options.animateLinksToSelf - whether or not links to the
   *   current page should be ignored.
   *   default: true
   * @param {function} options.computeScrollOffset - a function to compute the
   *   offset from the top of the page to scroll to as a part of the animation.
   *   default: function that returns 0, to scroll to the top of the page
   * @param {function} options.shouldAnimate - a function to compute whether or
   *   not we should animate.
   *   default: a function that returns true, so we always animate.
   * @param {function} options.beforeAnimationStart - a function to run before
   *   the animation starts.
   * @param {function} options.onTransitionEnd - a function to run once the
   *   animation is complete.
   */
  function PageAnimation(options) {

    var opts = options || {};

    this.defaults = {
      shouldScroll: options.shouldScroll || true,
      scrollTiming: options.scrollTiming || 'before'
    };

    this.settings = {
      animateLinksToSelf: options.animateLinksToSelf || false,
    };

    this.cb = {
      computeScrollOffset: options.computeScrollOffset || function() { return 0; },
      shouldAnimate: options.shouldAnimate || function() { return true; },
      beforeAnimationStart: options.beforeAnimationStart || function() {},
      onTransitionEnd: options.onTransitionEnd || function() {},
    };

    this.animations = {};
    this.body = document.getElementsByTagName('body')[0];
    this.transitionEndEvent = _whichTransitionEndEvent();
    this.links = document.getElementsByTagName('a');
    this.currentAnimation = null;
    this.boundOnTransitionEnd = this._onTransitionEnd.bind(this);
    this.boundOnClick = this._onClick.bind(this);

    if (this.links.length === 0) {
      console.error('No links found in page.');
    }

    return this;
  }

  /**
   * Register a new animation on this page.
   *
   * @param {string} urlRegex - the pattern to be passed to `new RegExp()` to
   *   match the URL paths that this animation should apply to.
   * @param {string} finalElementId - the ID of the element that is last to
   *   transition. We listen to the transitionEnd event on this element to
   *   know when to navigate to the next page.
   * @param {string} bodyClass - the class to apply to the body to start the
   *   animations.
   * @param {Object} options - Configuration options
   * @param {bool} options.shouldScroll - whether or not we should scroll the
   *   page as part of this animation.
   *   defualt: the value of options.shouldScroll passed into PageAnimation()
   * @param {bool} options.scrollTiming - the scroll timing for this animation
   *   options:
   *     'before': scroll the page before starting animations
   *     'during': scroll the page and start the animations at the same time
   *     'after': scroll once the animations are complete
   *   default: the value of options.scrollTiming passed into PageAnimation()
   *
   * @returns the new PageAnimation instance.
   */
  PageAnimation.prototype.register = function(urlRegex, finalElementId, bodyClass, options) {
    // Create the animation
    var opts = options || {};
    var animation = {
      anchor: null,
      bodyClass: bodyClass,
      finalElement: document.getElementById(finalElementId),
      path: null,
      regex: new RegExp(urlRegex),
      shouldScroll: opts.shouldScroll || this.defaults.shouldScroll,
      scrollTiming: opts.scrollTiming || this.defaults.scrollTiming,
    };

    // Error checking
    if (!animation.finalElement) {
      console.error('No element with ID ' + finalElementId);
    }

    // Regsiter event listener and animation
    this.animations[urlRegex] = animation;

    return this;
  };

  /**
   * Deregisters the animation for the passed urlRegex
   *
   * @param {string} urlRegex - the same pattern that was passed into
   *   PageAnimation.register()
   *
   * @returns the PageAnimation instance.
   */
  PageAnimation.prototype.deregister = function(urlRegex) {
    if (!this.animations[urlRegex]) {
      console.error('No animation registered with regex ' + urlRegex);
    }

    // Deregister the animation
    delete this.animations[urlRegex];

    return this;
  };

  /**
   * Enable the PageAnimation library by beginning to listen to click events,
   * running animations appropriately.
   */
  PageAnimation.prototype.enable = function() {
    for (var i = 0; i < this.links.length; i++) {
      this.links[i].addEventListener('click', this.boundOnClick);
    }
  };

  /**
   * Disable the PageAnimation library by removing event listeners set in
   * `PageAnimation.enable()`.
   */
  PageAnimation.prototype.disable = function() {
    for (var i = 0; i < this.links.length; i++) {
      this.links[i].removeEventListener('click', this.boundOnClick);
    }
  };

  /**
   * Scroll to the top of the page, for scrollDuration ms, calling cb when done.
   *
   * @param {int} offset - the offset from the top of the document to scroll to
   * @param {int} scrollDuration - how long the scroll should take, in ms
   * @param {function} cb - callback to call when the scroll is complete
   */
  PageAnimation.scrollTo = function(offset, scrollDuration, cb) {
    cb = cb || function() {};
    var scrollHeight = window.scrollY;
    var scrollStep = Math.PI / (scrollDuration / 15);
    var cosParameter = (scrollHeight - offset) / 2;
    var scrollCount = 0;
    var cosArgument;
    var scrollMargin;
    requestAnimationFrame(step);

    function step() {
      setTimeout(function() {
        if (Math.abs(window.scrollY - offset) > 5) {
          requestAnimationFrame(step);
          scrollCount = scrollCount + 1;
          cosArgument = Math.max(0, Math.min(Math.PI, scrollCount * scrollStep));
          scrollMargin = cosParameter - cosParameter * Math.cos(cosArgument);
          window.scrollTo(0, (scrollHeight - scrollMargin));
        } else {
          window.scrollTo(0, offset);
          cb();
        }
      }, 15);
    }
  };

  /**
   * Called when the animation is complete.
   *
   * @param {Object} e - the transition end event object.
   */
  PageAnimation.prototype._onTransitionEnd = function(e) {
    if (!this.currentAnimation) {
      return;
    }

    var animation = this.currentAnimation;
    this.currentAnimation = null;

    var followLink = function() {
      if (window.location.pathname === this.targetUrl) {
        window.location.reload();
      } else {
        window.location = this.targetUrl;
      }
    }.bind(this);

    if (animation.shouldScroll && animation.scrollTiming === 'after') {
      PageAnimation.scrollTo(this.cb.computeScrollOffset(animation), 200, followLink);
    } else {
      followLink();
    }
  };

  /**
   * Runs the animation.  If animation.scrollTiming is 'before' or 'during',
   * the page scrolling will occur now.
   *
   * @param {Object} animation - the animation to run.
   * @param {Node} animation.anchor - the anchor tag that was clicked.
   * @param {string} animation.bodyClass - the class
   * @param {Node} animation.finalElement - the element to attach the
   *   transitionEnd listener to.
   * @param {string} animation.path - the path being navigated to.
   * @param {string} animation.regex - the RegExp of that matches the path.
   * @param {string} animation.shouldScroll - whether or not we should scroll
   *   as part of this animation
   * @param {string} animation.scrollTiming - when to scroll the page
   */
  PageAnimation.prototype._animate = function(animation) {
    this.cb.beforeAnimationStart(animation);
    animation.finalElement.addEventListener(this.transitionEndEvent, this.boundOnTransitionEnd);
    this.currentAnimation = animation;

    var startAnimation = function() {
      this.targetUrl = animation.path;
      this.body.className = animation.bodyClass;
    }.bind(this);

    if (animation.shouldScroll && animation.scrollTiming === 'before') {
      PageAnimation.scrollTo(this.cb.computeScrollOffset(animation), 200, startAnimation);
    } else if (animation.shouldScroll && animation.scrollTiming === 'during') {
      setTimeout(startAnimation, 0);
      PageAnimation.scrollTo(this.cb.computeScrollOffset(animation), 200);
    } else {
      startAnimation();
    }
  };

  /**
   * Listener to be bound and attached to anchor tags.  Whenever any anchor tag
   * on the page is clicked, this method is called, which determines wheter or
   * not we have any animations registered against the path we're navigating
   * to, and runs that animation if one exists.
   *
   * @param {Object} e - the click event object.
   */
  PageAnimation.prototype._onClick = function(e) {
    var anchor = _getTargetAnchor(e);
    var path = _getAnchorPath(anchor);

    // Only animate if we are not in another animation, we should animate, and
    // we're not just supposed to refresh the page.
    if (!this.currentAnimation &&
        this.cb.shouldAnimate() &&
        (this.settings.animateLinksToSelf || this.path !== window.location.pathname)) {
      for (var urlRegex in this.animations) {
        if (this.animations.hasOwnProperty(urlRegex) && this.animations[urlRegex].regex.test(path)) {
          e.preventDefault();
          var animation = this.animations[urlRegex];
          animation.anchor = anchor;
          animation.path = path;
          this._animate(animation);
          return;
        }
      }
    }
  };

  if (typeof define === 'function' && define.amd) {
    define(PageAnimation);
  } else if (typeof module !== 'undefined' && module.exports) {
    module.exports = PageAnimation;
  } else {
    global.PageAnimation = PageAnimation;
  }

}(this));

![pangea.js logo](pangeajs-logo.png "pangea.js logo")

pangea.js
=========

Choreograph elegant, performant exit animations on the web. This library is design from a "less is more" additude in regards to JavaScript code. Animations are expected to be implemented separately, using pure CSS transitions & animations.

## Getting Started

#### Step 0: Install

[Download the latest release][download].

#### Step 1: Write your markup

```html
<!-- 1. Include the pangea.js library -->
<script src="pangea.min.js"></script>

<!-- 2. Tag an element as being the last to animate, using any ID you see fit -->
<h1>Test webpage</h1>
<p><a href="/about">More about me</a></p>
<p id="last-to-animate">This element is last to animate</p>

```

#### Step 2: Write your CSS transitions

```css
/*
 * Example default styles.
 */
body {
    backgrond-color: white;
    /* We use CSS transitions to create the animations. */
    transition: 0.3s ease background;
}

h1, p {
    opacity: 1;
    transition: 0.3s ease opacity;
}

/*
 * Example animation styles.
 * 
 * Here, we fade out text and fade the background to black when the
 * Pangea library gives the body the animating-to-about-page class.
 */
body.animating-to-about-page {
    background-color: black;
}

body.animating-to-about-page h1, 
body.animating-to-about-page p {
    opacity: 0;
}
```

#### Step 3: Register a new animation.

```js
/*
 * When we click links to the /about page, the library gives the body the 
 * animating-to-about-page class.  When the element with ID last-to-animate
 * is done transitioning, we will navigate to the /about page.
 */
var pangea = new Pangea()
    .register(/\/about/, 'last-to-animate', 'animating-to-about-page')
    .enable();
```


## API

### Pangea([_options_])

The `Pangea`constructor will setup a new page animation manager instances. Returns a new instance of the `Pangea` class.

You can customize the instance by passing the `options` parameter. The example below uses all options and their defaults:

```javascript
var opts = {
  shouldScroll: true,
  scrollTiming: 'before',
  animateLinksToSelf: true,
  computeScrollOffset: function() { return 0; },
  shouldAnimate: function() { return true; },
  beforeAnimationStart: function() {},
  onTransitionEnd: function() {},
};
var pangea = new Pangea(opts)
```

##### `options`
> **Type**: `Object`
> 
> **Default**: See below
> 
> **Description**: Configuration options.

##### `options.shouldScroll`
> **Type**: `bool`
> 
> **Default**: true
> 
> **Description**: Whether or we should scroll the page as part of the animation.

##### `options.scrollTiming`
> **Type**: `string`
> 
> **Default**: `"before"`
> 
> **Description**: The defualt scroll timing.  One of:
> 
> - `"before"`: scroll the page before starting animations
> - `"during"`: scroll the page and start the animations at the same time
> - `"after"`: scroll once the animations are complete
> 

##### `options.animateLinksToSelf`
> **Type**: `bool`
> 
> **Default**: `true`
> 
> **Description**: Whether or not links to the current page should be ignored.

##### `options.computeScrollOffset`
> **Type**: `function`
> 
> **Default**: `function() { return 0; }`
> **Description**: A function to compute the offset from the top of the page to scroll to as a part of the animation.

##### `options.shouldAnimate`
> **Type**: `function`
> 
> **Default**: `function() { return true; }`
> 
> **Description**: A function to compute whether or not we should animate.

##### `options.beforeAnimationStart`
> **Type**: `function`
> 
> **Default**: `function() {}`
> 
> **Description**: A function to run before the animation starts.

##### `options.onTransitionEnd`
> **Type**: `function`
> 
> **Default**: `function() {}`
> 
> **Description**: A function to run once the animation is complete.

### register(_urlRegex_, _finalElementId_, _bodyClass_, [_options_])

Register a new animation on this page.


#### `urlRegex`
> **Type**: `string`
> 
> **Description**: The pattern to be passed to `new RegExp()` to match the URL paths that this animation should apply to.

#### `finalElementId`
> **Type**: `string`
> 
> **Description**: The ID of the element that is last to transition. We listen to the transitionEnd event on this element to know when to navigate to the next page.

#### `bodyClass`
> **Type**: `string`
> 
> **Description**: The class to apply to the body to start the animations.

#### `options`
> **Type**: `Object`
> 
> **Description**: Configuration options

#### `options.shouldScroll`
> **Type**: `bool`
> 
> **Defualt**: The value of `options.shouldScroll` passed into `Pangea()`.
> 
> **Description**: Whether or not we should scroll the page as part of this animation. 

#### `options.scrollTiming`
> **Type**: `bool`
> 
> **Default**: the value of `options.scrollTiming` passed into `Pangea()`.
> 
> **Description**: The scroll timing for this animation
> 
> **Options**:
> 
> - `"before"`: scroll the page before starting animations
> - `"during"`: scroll the page and start the animations at the same time
> - `"after"`: scroll once the animations are complete

### deregister(_urlRegex_)
Deregisters the animation for the passed `urlRegex`. Returns the Pangea instance.

#### `urlRegex`
> **Type**: `string`
> 
> **Description** The same pattern that was passed into `Pangea.register()`.

### enable()

Enable the Pangea library by beginning to listen to click events, running animations appropriately.

### disable()

Disable the Pangea library by removing event listeners set in `Pangea.enable()`.

[download]: https://github.com/minimill/pangea.js/releases/download/v0.2.0/pangea.min.js

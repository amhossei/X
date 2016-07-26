/*
 *
 *                  xxxxxxx      xxxxxxx
 *                   x:::::x    x:::::x
 *                    x:::::x  x:::::x
 *                     x:::::xx:::::x
 *                      x::::::::::x
 *                       x::::::::x
 *                       x::::::::x
 *                      x::::::::::x
 *                     x:::::xx:::::x
 *                    x:::::x  x:::::x
 *                   x:::::x    x:::::x
 *              THE xxxxxxx      xxxxxxx TOOLKIT
 *
 *                  http://www.goXTK.com
 *
 * Copyright (c) 2012 The X Toolkit Developers <dev@goXTK.com>
 *
 *    The X Toolkit (XTK) is licensed under the MIT License:
 *      http://www.opensource.org/licenses/mit-license.php
 *
 *      "Free software" is a matter of liberty, not price.
 *      "Free" as in "free speech", not as in "free beer".
 *                                         - Richard M. Stallman
 *
 *
 */

// provides
goog.provide('X.renderer2D');
// requires
goog.require('X.renderer');
goog.require('goog.math.Vec3');
goog.require('goog.vec.Vec4');


/**
 * Create a 2D renderer inside a given DOM Element.
 *
 * @constructor
 * @extends X.renderer
 */
X.renderer2D = function() {

  //
  // call the standard constructor of X.renderer
  goog.base(this);

  //
  // class attributes

  /**
   * @inheritDoc
   * @const
   */
  this._classname = 'renderer2D';

  /**
   * The orientation of this renderer.
   *
   * @type {?string}
   * @protected
   */
  this._orientation = null;

  /**
   * The orientation index in respect to the
   * attached volume and its scan direction.
   *
   * @type {!number}
   * @protected
   */
  this._orientationIndex = -1;

  /**
   * The array of orientation colors.
   *
   * @type {!Array}
   * @protected
   */
  this._orientationColors = [];

  /**
   * A frame buffer for slice data.
   *
   * @type {?Element}
   * @protected
   */
  this._frameBuffer = null;

  /**
   * The rendering context of the slice frame buffer.
   *
   * @type {?Object}
   * @protected
   */
  this._frameBufferContext = null;

  /**
   * A frame buffer for label data.
   *
   * @type {?Element}
   * @protected
   */
  this._labelFrameBuffer = null;

  /**
   * The rendering context of the label frame buffer.
   *
   * @type {?Object}
   * @protected
   */
  this._labelFrameBufferContext = null;

  /**
   * The current slice width.
   *
   * @type {number}
   * @protected
   */

  this._drawingframeBuffer = null;

  /**
   * The rendering context of the slice frame drawing.
   *
   * @type {?Object}
   * @protected
   */
  this._drawingframeBufferContext = null;

  /**
   * A frame buffer for drawing data.
   *
   * @type {?Element}
   * @protected
   */
  this._sliceWidth = 0;

  /**
   * The current slice height.
   *
   * @type {number}
   * @protected
   */
  this._sliceHeight = 0;

  /**
   * The current slice width spacing.
   *
   * @type {number}
   * @protected
   */
  this._sliceWidthSpacing = 0;

  /**
   * The current slice height spacing.
   *
   * @type {number}
   * @protected
   */
  this._sliceHeightSpacing = 0;

  /**
   * The buffer of the current slice index.
   *
   * @type {!number}
   * @protected
   */
  this._currentSlice = -1;

  /**
   * The buffer of the current lower threshold.
   *
   * @type {!number}
   * @protected
   */
  this._lowerThreshold = -1;

  /**
   * The buffer of the current upper threshold.
   *
   * @type {!number}
   * @protected
   */
  this._upperThreshold = -1;

  /**
   * The buffer of the current w/l low value.
   *
   * @type {!number}
   * @protected
   */
  this._windowLow = -1;

  /**
   * The buffer of the current w/l high value.
   *
   * @type {!number}
   * @protected
   */
  this._windowHigh = -1;

  /**
   * The buffer of the showOnly labelmap color.
   *
   * @type {!Float32Array}
   * @protected
   */
  this._labelmapShowOnlyColor = new Float32Array([-255, -255, -255, -255]);

  /**
   * The convention we follow to draw the 2D slices. TRUE for RADIOLOGY, FALSE for NEUROLOGY.
   *
   * @type {!boolean}
   * @protected
   */
  this._radiological = true;

  this._normalizedScale = 1;

};
// inherit from X.base
goog.inherits(X.renderer2D, X.renderer);

/**
 * @inheritDoc
 */
X.renderer2D.prototype.remove = function(object) {

  // call the remove_ method of the superclass
  goog.base(this, 'remove', object);

  this._objects.remove(object);

  return true;

};
/**
 * Overload this function to execute code after scrolling has completed and just
 * before the next rendering call.
 *
 * @public
 */
X.renderer2D.prototype.onScroll = function() {

  // do nothing
};


/**
 * Overload this function to execute code after window/level adjustment has
 * completed and just before the next rendering call.
 *
 * @public
 */
X.renderer2D.prototype.onWindowLevel = function() {

  // do nothing
};


/**
 * @inheritDoc
 */
X.renderer2D.prototype.onScroll_ = function(event) {

  goog.base(this, 'onScroll_', event);

  // grab the current volume
  var _volume = this._topLevelObjects[0];

  // .. if there is none, exit right away
  if (!_volume) {

    return;

  }

  // switch between different orientations
  var _orientation = "";

  if (this._orientationIndex == 0) {

    _orientation = "indexX";

  } else if (this._orientationIndex == 1) {

    _orientation = "indexY";

  } else {

    _orientation = "indexZ";

  }

  if (event._up) {

    // yes, scroll up
    _volume[_orientation] = _volume[_orientation] + 1;

  } else {

    // yes, so scroll down
    _volume[_orientation] = _volume[_orientation] - 1;

  }

  // execute the callback
  eval('this.onScroll();');

  // .. and trigger re-rendering
  // this.render_(false, false);
};


/**
 * Performs window/level adjustment for the currently loaded volume.
 *
 * @param {!X.event.WindowLevelEvent} event The window/level event from the
 *          camera.
 */
X.renderer2D.prototype.onWindowLevel_ = function(event) {

  // grab the current volume
  var _volume = this._topLevelObjects[0];

  // .. if there is none, exit right away
  if (!_volume) {
    return;
  }

  // update window level
  var _old_window = _volume._windowHigh - _volume._windowLow;
  var _old_level = _old_window / 2;

  // shrink/expand window
  var _new_window = parseInt(_old_window + (_old_window / 15) * -event._window,
      10);

  // increase/decrease level
  var _new_level = parseInt(_old_level + (_old_level / 15) * event._level, 10);

  // TODO better handling of these cases
  if (_old_window == _new_window) {
    _new_window++;
  }
  if (_old_level == _new_level) {
    _new_level++;
  }

  // re-propagate
  _volume._windowLow -= parseInt(_old_level - _new_level, 10);
  _volume._windowLow -= parseInt(_old_window - _new_window, 10);
  _volume._windowLow = Math.max(_volume._windowLow, _volume._min);
  _volume._windowHigh -= parseInt(_old_level - _new_level, 10);
  _volume._windowHigh += parseInt(_old_window - _new_window, 10);
  _volume._windowHigh = Math.min(_volume._windowHigh, _volume._max);

  // execute the callback
  eval('this.onWindowLevel();');

};


/**
 * Get the orientation of this renderer. Valid orientations are 'x','y','z' or
 * null.
 *
 * @return {?string} The orientation of this renderer.
 */
X.renderer2D.prototype.__defineGetter__('orientation', function() {

  return this._orientation;

});


/**
 * Set the orientation for this renderer. Valid orientations are 'x','y' or 'z' or 'axial',
 * 'sagittal' or 'coronal'.
 *
 * AXIAL == Z
 * SAGITTAL == X
 * CORONAL == Y
 *
 * @param {!string} orientation The orientation for this renderer: 'x','y' or
 *          'z' or 'axial', 'sagittal' or 'coronal'.
 * @throws {Error} An error, if the given orientation was wrong.
 */
X.renderer2D.prototype.__defineSetter__('orientation', function(orientation) {

  orientation = orientation.toUpperCase();

  if (orientation == 'AXIAL') {

    orientation = 'Z';
    this._orientationIndex = 2;

  } else if (orientation == 'SAGITTAL') {

    orientation = 'X';
    this._orientationIndex = 0;

  } else if (orientation == 'CORONAL') {

    orientation = 'Y';
    this._orientationIndex = 1;

  }

  if (orientation != 'X' && orientation != 'Y' && orientation != 'Z') {

    throw new Error('Invalid orientation.');

  }

  this._orientation = orientation;

  var _volume = this._topLevelObjects[0];

});


/**
 * Get the convention of this renderer.
 *
 * @return {!boolean} TRUE if the RADIOLOGY convention is used, FALSE if the
 *                    NEUROLOGY convention is used.
 */
X.renderer2D.prototype.__defineGetter__('radiological', function() {

  return this._radiological;

});

X.renderer2D.prototype.__defineGetter__('normalizedScale', function() {

  return this._normalizedScale;

});

X.renderer2D.prototype.__defineGetter__('canvasWidth', function() {

  return this._canvas.width;

});

X.renderer2D.prototype.__defineGetter__('canvasHeight', function() {

  return this._canvas.height;

});

X.renderer2D.prototype.__defineGetter__('sliceWidth', function() {

  return this._sliceWidth;

});

X.renderer2D.prototype.__defineGetter__('sliceHeight', function() {

  return this._sliceHeight;

});


/**
 * Set the convention for this renderer. There is a difference between radiological and neurological
 * convention in terms of treating the coronal left and right.
 *
 * Default is the radiological convention.
 *
 * @param {!boolean} radiological TRUE if the RADIOLOGY convention is used, FALSE if the
 *                                NEUROLOGY convention is used.
 */
X.renderer2D.prototype.__defineSetter__('radiological', function(radiological) {

  this._radiological = radiological;

});


/**
 * @inheritDoc
 */
X.renderer2D.prototype.init = function() {

  // make sure an orientation is configured
  if (!this._orientation) {

    throw new Error('No 2D orientation set.');

  }

  // call the superclass' init method
  goog.base(this, 'init', '2d');

  // use the background color of the container by setting transparency here
  this._context.fillStyle = "rgba(50,50,50,0)";

  // .. and size
  this._context.fillRect(0, 0, this._canvas.width, this._canvas.height);

  // create an invisible canvas as a framebuffer
  this._frameBuffer = goog.dom.createDom('canvas');
  this._labelFrameBuffer = goog.dom.createDom('canvas');
  this._drawingFrameBuffer = goog.dom.createDom('canvas');

  //
  //
  // try to apply nearest-neighbor interpolation -> does not work right now
  // so we ignore it
  // this._labelFrameBuffer.style.imageRendering = 'optimizeSpeed';
  // this._labelFrameBuffer.style.imageRendering = '-moz-crisp-edges';
  // this._labelFrameBuffer.style.imageRendering = '-o-crisp-edges';
  // this._labelFrameBuffer.style.imageRendering = '-webkit-optimize-contrast';
  // this._labelFrameBuffer.style.imageRendering = 'optimize-contrast';
  // this._labelFrameBuffer.style.msInterpolationMode = 'nearest-neighbor';
    this._labelFrameBuffer.style.imageRendering = 'pixelated';
    this._drawingFrameBuffer.style.imageRendering = 'pixelated';

  // listen to window/level events of the camera
  goog.events.listen(this._camera, X.event.events.WINDOWLEVEL,
      this.onWindowLevel_.bind(this));

  //TRY CHANGE
  /*//document.getElementById("Zoombutt").addEventListener('mousedown',this.resetViewAndRender,false);
    goog.events.listen(document.getElementById("Zoombutt"), X.event.events.RESETVIEW,
      this.resetViewAndRender.bind(this));*/

};


/**
 * @inheritDoc
 */
X.renderer2D.prototype.onResize_ = function() {

  // call the super class
  goog.base(this, 'onResize_');

  // in 2D we also want to perform auto scaling
  this.autoScale_();

};


/**
 * @inheritDoc
 */
X.renderer2D.prototype.resetViewAndRender = function() {

  // call the super class
  goog.base(this, 'resetViewAndRender');

  // .. and perform auto scaling
  this.autoScale_();

  // .. and reset the window/level
  var _volume = this._topLevelObjects[0];

  // .. if there is none, exit right away
  if (_volume) {

    _volume._windowHigh = _volume._max;
    _volume._windowLow = _volume._min;

  }
  // .. render
  // this.render_(false, false);
};


/**
 * Convenience method to get the index of the volume container for a given
 * orientation.
 *
 * @param {?string} targetOrientation The orientation required.
 * @return {!number} The index of the volume children.
 * @private
 */
X.renderer2D.prototype.volumeChildrenIndex_ = function(targetOrientation) {

  if (targetOrientation == 'X') {

    return 0;

  } else if (targetOrientation == 'Y') {


    return 1;

  } else {

    return 2;
  }
};


 /**
 * Get the existing X.object with the given id.
 * 
 * @param {!X.object} object The displayable object to setup within this
 *          renderer.
 * @public
 */
 X.renderer2D.prototype.update = function(object) {
    // update volume info
    this.update_(object);
    // force redraw
    this._currentSlice = -1;
 }

/**
 * @inheritDoc
 */
X.renderer2D.prototype.update_ = function(object) {

  // call the update_ method of the superclass
  goog.base(this, 'update_', object);

  // check if object already existed..
  var existed = false;
  if (this.get(object._id)) {

    // this means, we are updating
    existed = true;

  }

  if (!(object instanceof X.volume)) {

    // we only add volumes in the 2d renderer for now
    return;

  }

  // var id = object._id;
  // var texture = object._texture;
  var file = object._file;
  var labelmap = object._labelmap; // here we access directly since we do not
  // want to create one using the labelmap() singleton accessor

  var colortable = object._colortable;

  //
  // LABEL MAP
  //
  if (goog.isDefAndNotNull(labelmap) && goog.isDefAndNotNull(labelmap._file) &&
      labelmap._file._dirty) {

    // a labelmap file is associated to this object and it is dirty..
    // background: we always want to parse label maps first
    // run the update_ function on the labelmap object

    this.update_(labelmap);

    // jump out
    return;

  }

  //
  // COLOR TABLE
  //
  if (goog.isDefAndNotNull(colortable) &&
      goog.isDefAndNotNull(colortable._file) && colortable._file._dirty) {

    // a colortable file is associated to this object and it is dirty..
    // start loading
    this._loader.load(colortable, object);

    return;

  }

  //
  // VOLUME
  //
  // with multiple files
  if (goog.isDefAndNotNull(file) && goog.isArray(file)) {

    // this object holds multiple files, a.k.a it is a DICOM series
    // check if we already loaded all the files
    if (!goog.isDefAndNotNull(object.MRI)) {

      // no files loaded at all, start the loading
      var _k = 0;
      var _len = file.length;

      for (_k = 0; _k < _len; _k++) {

        // start loading of each file..
        this._loader.load(file[_k], object);

      }

      return;

    } else if (object.MRI.loaded_files != file.length) {

      // still loading
      return;

    }

    // just continue

  }

  // with one file
  else if (goog.isDefAndNotNull(file) && file._dirty) {

    // this object is based on an external file and it is dirty..
    // start loading..
    this._loader.load(object, object);

    return;

  }

  //
  // at this point the orientation of this renderer might have changed so we
  // should recalculate all the cached values

  // volume dimensions
  var _dim = object._dimensions;

  // check the orientation and store a pointer to the slices
  this._orientationIndex = this.volumeChildrenIndex_(this._orientation);

  // size
  this._slices = object._children[this._orientationIndex]._children;

  var _currentSlice = null;
  if (this._orientationIndex == 0) {

    _currentSlice = object['indexX'];

  } else if (this._orientationIndex == 1) {

    _currentSlice = object['indexY'];

  } else {

    _currentSlice = object['indexZ'];

  }

  var _width = object._children[this._orientationIndex]._children[_currentSlice]._iWidth;
  var _height = object._children[this._orientationIndex]._children[_currentSlice]._iHeight;
  // spacing
  this._sliceWidthSpacing = object._children[this._orientationIndex]._children[_currentSlice]._widthSpacing;
  this._sliceHeightSpacing = object._children[this._orientationIndex]._children[_currentSlice]._heightSpacing;

  // .. and store the dimensions
  this._sliceWidth = _width;
  this._sliceHeight = _height;

  // update the invisible canvas to store the current slice
  var _frameBuffer = this._frameBuffer;
  _frameBuffer.width = _width;
  _frameBuffer.height = _height;

  var _frameBuffer2 = this._labelFrameBuffer;
  _frameBuffer2.width = _width;
  _frameBuffer2.height = _height;

  var _frameBuffer3 = this._drawingFrameBuffer;
  _frameBuffer3.width = _width;
  _frameBuffer3.height = _height;

  // .. and the context
  this._frameBufferContext = _frameBuffer.getContext('2d');
  this._labelFrameBufferContext = _frameBuffer2.getContext('2d');
  this._drawingFrameBufferContext = _frameBuffer3.getContext('2d');

  // do the following only if the object is brand-new
  if (!existed) {

    this._objects.add(object);
    this.autoScale_();

  }

};


/**
 * Adjust the zoom (scale) to best fit the current slice.
 */
X.renderer2D.prototype.autoScale_ = function() {

  if(this._orientation == "X"){
    var tmp = this._sliceWidth;
    this._sliceWidth = this._sliceHeight;
    this._sliceHeight = tmp;

    tmp = this._sliceWidthSpacing;
    this._sliceWidthSpacing = this._sliceHeightSpacing;
    this._sliceHeightSpacing = tmp;
  }

  // let's auto scale for best fit
  var _wScale = this._width / (this._sliceWidth * this._sliceWidthSpacing);
  var _hScale = this._height / (this._sliceHeight * this._sliceHeightSpacing);

  var _autoScale = Math.min(_wScale, _hScale);

  // propagate scale (zoom) to the camera
  var _view = this._camera._view;
  _view[14] = _autoScale;


};


/**
 * Callback for slice navigation, f.e. to update sliders.
 *
 * @public
 */
X.renderer2D.prototype.onSliceNavigation = function() {

  // should be overloaded

};


/**
 * Convert viewport (canvas) coordinates to volume (index) coordinates.
 *
 * @param x The x coordinate.
 * @param y The y coordinate.
 * @return {?Array} An array of [i,j,k] coordinates or null if out of frame.
 */
X.renderer2D.prototype.xy2ijk = function(x, y) {

  // un-zoom and un-offset
  // there get coordinates in a normla view

  var _volume = this._topLevelObjects[0];
  var _view = this._camera._view;
  var _currentSlice = null;
  var _sliceWidth = this._sliceWidth;
  var _sliceHeight = this._sliceHeight;
  var _sliceWSpacing = null;
  var _sliceHSpacing = null;

  // get current slice
  // which color?
  if (this._orientation == "Y") {
    _currentSlice = this._slices[parseInt(_volume['indexY'], 10)];
    _sliceWSpacing = _currentSlice._widthSpacing;
    _sliceHSpacing = _currentSlice._heightSpacing;
    this._orientationColors[0] = 'rgba(255,255,255,.3)';
    this._orientationColors[1] = 'rgba(255,255,255,.3)';

  } else if (this._orientation == "Z") {
    _currentSlice = this._slices[parseInt(_volume['indexZ'], 10)];
    _sliceWSpacing = _currentSlice._widthSpacing;
    _sliceHSpacing = _currentSlice._heightSpacing;
    this._orientationColors[0] = 'rgba(255,255,255,.3)';
    this._orientationColors[1] = 'rgba(255,255,255,.3)';

  } else {
    _currentSlice = this._slices[parseInt(_volume['indexX'], 10)];
    _sliceWSpacing = _currentSlice._heightSpacing;
    _sliceHSpacing = _currentSlice._widthSpacing;
    this._orientationColors[0] = 'rgba(255,255,255,.3)';
    this._orientationColors[1] = 'rgba(255,255,255,.3)';

    var _buf = _sliceWidth;
    _sliceWidth = _sliceHeight;
    _sliceHeight = _buf;
  }

  // padding offsets
  var _x = 1 * _view[12];
  var _y = -1 * _view[13]; // we need to flip y here

  // .. and zoom
  var _center = [this._width / 2, this._height / 2];

  // the slice dimensions in canvas coordinates
  var _sliceWidthScaled = _sliceWidth * _sliceWSpacing *
    this._normalizedScale;
  var _sliceHeightScaled = _sliceHeight * _sliceHSpacing *
    this._normalizedScale;

  // the image borders on the left and top in canvas coordinates
  var _image_left2xy = _center[0] - (_sliceWidthScaled / 2);
  var _image_top2xy = _center[1] - (_sliceHeightScaled / 2);

  // incorporate the padding offsets (but they have to be scaled)
  _image_left2xy += _x * this._normalizedScale;
  _image_top2xy += _y * this._normalizedScale;

  if(x>_image_left2xy && x < _image_left2xy + _sliceWidthScaled &&
    y>_image_top2xy && y < _image_top2xy + _sliceHeightScaled){

    var _xNorm = (x - _image_left2xy)/ _sliceWidthScaled;
    var _yNorm = (y - _image_top2xy)/ _sliceHeightScaled;

    _x = _xNorm*_sliceWidth;
    _y = _yNorm*_sliceHeight;
    var _z = _currentSlice._xyBBox[4];

    if (this._orientation == "X") {
      // invert cols
      // then invert x and y to compensate camera +90d rotation
      _x = _sliceWidth - _x;

      var _buf = _x;
      _x = _y;
      _y = _buf;

    }
    else if (this._orientation == "Y") {

      // invert cols
      _x = _sliceWidth - _x;

    }
    else if (this._orientation == "Z") {

      // invert all
      _x = _sliceWidth - _x;
      _y = _sliceHeight - _y;

    }

    // map indices to xy coordinates
    _x = _currentSlice._wmin + _x*_currentSlice._widthSpacing;// - _currentSlice._widthSpacing/2;
    _y = _currentSlice._hmin + _y*_currentSlice._heightSpacing;// - _currentSlice._heightSpacing/2;

    var _xyz = goog.vec.Vec4.createFloat32FromValues(_x, _y, _z, 1);
    var _ijk = goog.vec.Mat4.createFloat32();
    goog.vec.Mat4.multVec4(_currentSlice._XYToIJK, _xyz, _ijk);

    _ijk = [Math.floor(_ijk[0]),Math.floor(_ijk[1]),Math.floor(_ijk[2])];
    // why < 0??
    var _ras = goog.vec.Mat4.createFloat32();
    goog.vec.Mat4.multVec4(_currentSlice._XYToRAS, _xyz, _ras);

    var _dx = _volume._childrenInfo[0]._sliceNormal[0]*_ras[0]
      + _volume._childrenInfo[0]._sliceNormal[1]*_ras[1]
      + _volume._childrenInfo[0]._sliceNormal[2]*_ras[2]
      + _volume._childrenInfo[0]._originD;

    var _ix = Math.round(_dx/_volume._childrenInfo[0]._sliceSpacing);
     if(_ix >= _volume._childrenInfo[0]._nb){
       _ix = _volume._childrenInfo[0]._nb - 1;
     }
     else if(_ix < 0){
       _ix = 0;
      }


    var _dy = _volume._childrenInfo[1]._sliceNormal[0]*_ras[0]
      + _volume._childrenInfo[1]._sliceNormal[1]*_ras[1]
      + _volume._childrenInfo[1]._sliceNormal[2]*_ras[2]
      + _volume._childrenInfo[1]._originD;

    var _iy = Math.round(_dy/_volume._childrenInfo[1]._sliceSpacing);
    if(_iy >= _volume._childrenInfo[1]._nb){
       _iy = _volume._childrenInfo[1]._nb - 1;
    }
    else if(_iy < 0) {
      _iy = 0;
    }

    // get plane distance from the origin
    var _dz = _volume._childrenInfo[2]._sliceNormal[0]*_ras[0]
      + _volume._childrenInfo[2]._sliceNormal[1]*_ras[1]
      + _volume._childrenInfo[2]._sliceNormal[2]*_ras[2]
      + _volume._childrenInfo[2]._originD;

    var _iz = Math.round(_dz/_volume._childrenInfo[2]._sliceSpacing);
    if(_iz >= _volume._childrenInfo[2]._nb){
      _iz = _volume._childrenInfo[2]._nb - 1;
    }
    else if(_iz < 0){
      // translate origin by distance
      _iz = 0;
    }

    return [[_ix, _iy, _iz], [_ijk[0], _ijk[1], _ijk[2]], [_ras[0], _ras[1], _ras[2]]];
    }

  return null;
};

/**
3 functions allowing the the draw of dashed lines
xA,yA : coordinates of the beginning point of the dashed line
xB,yb : coordinates of the ending point of the dashed line
l,L : length of the lines and space between the lines respetively
ctx : ctx onwhich the drawing is made
**/

function Norm(xA,yA,xB,yB) {return Math.sqrt(Math.pow(xB-xA,2)+Math.pow(yB-yA,2));}

function DashedLine(xA,yA,xB,yB,L,l,ctx) {
 Nhatch=Norm(xA,yA,xB,yB)/(L+l);
 x1=xA;y1=yA;
 for (i=0;i < Nhatch; i++) {
  newXY=Hatch(xA,yA,xB,yB,x1,y1,L);
  x2=newXY[0];y2=newXY[1];
  ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();
  newXY=Hatch(xA,yA,xB,yB,x2,y2,l);
  x1=newXY[0];
  y1=newXY[1];
 }
 //ctx.closePath();
}

function Hatch(xA,yA,xB,yB,x1,y1,l) {
 a=(yB-yA)/(xB-xA);b=yA-a*xA;// Equation reduite y=ax+b de (AB): 
 if ((xB-xA)>0) {sgn=1;} else {sgn=-1;}
 x2=sgn*l/Math.sqrt(1+a*a)+x1;
 y2=a*x2+b;
 if (Norm(x1,y1,x2,y2)>Norm(x1,y1,xB,yB)) {x2=xB;y2=yB;}
 return [x2,y2];
}


////


function InitializeDrawinterface(drawingcontext, labelcontext, interactor, upperobject, CurrentVolume) {
  //var _self = this;
  var CurrVolume = CurrentVolume; 
  var _upperobject = upperobject;
  var labelctx, drawingctx;
  var colorchosen = "rgba(255,255,0,1)";
    //listHisto holds the history of polygon drawn , after edition only one polygon is permitted, this variable doesn't make any sense 
    // in this configuration
    var listHisto = [];
    //listTools will contain all the tools implemented
    var listTools = [];
    // if the polygon is closed, is set to true
    var polygonClosed = false;
    var tool;
    var tool_default = 'pencil';
    var current_tool = "pencil";
  //variable used to decide which tool should be used at which moment especially for selectp and zoom
  var pointmoved = false;
  var pointmoved2 = false;
  // position of the mouse
  var mousex = 0;
  var mousey = 0;

    // variable grouping the points of a single polygon
  var points = [];

  function init () {
    labelctx = labelcontext;
    drawingctx = drawingcontext;

    labelctx.imageSmoothingEnabled = false;
    drawingctx.imageSmoothingEnabled = false;

    // Activate the default tool.
      if (tools[tool_default]) {
        tool = new tools[tool_default]();
        current_tool = tool_default;
      }

      document.addEventListener('mousedown',function (ev) {
        ev_canvasReady(ev);
      },false);

    document.addEventListener('mouseup', ev_canvasReady, false);
    document.addEventListener('mousemove',   function(ev) {
          //this variable is used to attache the keydown to the right viewer
          //lastDownTarget = ev.target.id;
          ev_canvasReady(ev);
    }, false);

    document.addEventListener('click',function (ev) {
        CurrVolume.modified;
        if (ev.which == 1) {
            ev_canvasReady(ev);
        }
    },false);

      document.addEventListener('keydown', function(ev) {
        // if we push enter and the polygon is closed, then validate it ( draw it on the right canvas in red)
        if (ev.keyCode == 13 && polygonClosed){
          ev.preventDefault();
          img_update();
          ev.stopPropagation();
        }
      }, false);

    // document.addEventListener("mousemove",function (ev) {
    //   if (interactor._mouseInside){
    //       for (var i = listHisto.length - 1; i >= 0; i--) {
    //         indexp = nearpListe([ev._x,ev._y],listHisto[i],5);
    //         if (indexp !=1000){
    //             document.getElementById('canvasXTKP').style.cursor = "pointer";
    //           break;}
    //         else{document.getElementById('canvasXTKP').style.cursor = "auto";}
    //       };
    //   }
    // },false);
  }


  function ev_canvasReady(ev){
      //ev_canvas(ev);

      if (ev.layerX || ev.layerX == 0) { // Firefox
        ev._x = ev.layerX;
        ev._y = ev.layerY;
      } if (ev.offsetX || ev.offsetX == 0) { // Opera
        ev._x = ev.offsetX;
        ev._y = ev.offsetY;
      }
      // Call the event handler of the tool.
      var __ijk = _upperobject.xy2ijk(ev._x,ev._y);
      if (__ijk) {
        mousex = __ijk[0][0];
        mousey = __ijk[0][1];
      }
      else{
        mousex = 0;
        mousey = 0;
      };
      var func = tool[ev.type];
      if (func) {
        func(ev);
      }
  }

  // This function draws the #imageTemp canvas on top of #imageView, after which 
  // #imageTemp is cleared. This function is called each time when the user 
  // completes a drawing operation.
  function img_update (ev) {
      //rend2 = document.getElementById("rendimage2");
      var oldcolor = colorchosen;
      colorchosen = "rgba(255,0,0,0.6)";
      drawingctx.clearRect(0, 0, drawingctx.canvas.width, drawingctx.canvas.height);
      var oldbrushWidth = brushWidth;
      brushWidth = 1;
      redrawall(false);
      brushWidth = oldbrushWidth;
    labelctx.drawImage(context.canvas, 0, 0);
    drawingctx.clearRect(0, 0, drawingctx.canvas.width, drawingctx.canvas.height);
      var ImageData = labelctx.getImageData(0,0,context.canvas.width,context.canvas.height);
      var data = ImageData.data;
      for (var i = 0; i < data.length; i+=4) {
        if (data[i+3]>0) {
          data[i]=255;
          data[i+1]=0;
          data[i+2]=0;
          data[i+3]=150;
        };
      };
      labelctx.putImageData(ImageData,0,0);
      listHisto = [];
      colorchosen = oldcolor;
      polygonClosed = false;
      tool = new tools["pencil"]();
      current_tool = "pencil";
      Majtoolsbutt();
      // call the funciton that save the file server-side
      //ExportFile(ev);
  }

    // This object holds the implementation of each drawing tool.
    var tools = {};

  // The drawing pencil.
  tools.pencil = function () {
      document.getElementById('canvasXTKP').style.cursor = "none";
      var tool = this;
      this.name = "pencil";
      this.started = false;
      changeBrushwidth(6);
      //document.getElementById("thicknessInput").style.opacity = 1;

      // This is called when you start holding down the mouse button.
      // This starts the pencil drawing.
      this.mousedown = function (ev) {
          // window.console.log("mousedown");
          tool.started = true;
          // get the right canvas (red one)
          labelctx.beginPath();
          labelctx.moveTo(mousex, mousey);
          labelctx.fillStyle = "rgba(255,0,0,0.6)";
          labelctx.fillRect(mousex - brushWidth/2, mousey- brushWidth/2, brushWidth,brushWidth);
          ev.stopPropagation();
      };

      // This function is called every time you move the mouse. Obviously, it only 
      // draws if the tool.started state is set to true (when you are holding down 
      // the mouse button).
      this.mousemove = function (ev) {
        // window.console.log("mousemove");
        //mousex = ev._x;
        //mousey = ev._y;
        if (tool.started) {
          // window.console.log("tool started");
          labelctx.lineTo(mousex, mousey);
          labelctx.strokeStyle = "rgba(255,0,0,0.4)";
          labelctx.lineWidth = brushWidth;
          labelctx.stroke();
        }

        drawingctx.fillStyle = "rgba(255,0,0,0.6)";
        drawingctx.lineWidth = 1;
        drawingctx.clearRect(0, 0, drawingctx.canvas.width, drawingctx.canvas.height);
        drawingctx.fillRect(mousex - brushWidth/2, mousey- brushWidth/2, brushWidth,brushWidth);
        redrawall(true);
      };

      // This is called when you release the mouse button.
      this.mouseup = function (ev) {
        if (tool.started) {
          tool.mousemove(ev);
          tool.started = false;
          // var ImageData = labelctx.getImageData(0,0,drawingctx.canvas.width,drawingctx.canvas.height);
          // var data = ImageData.data;
          // for (var i = 0; i < data.length; i+=4) {
          //   if (data[i+3]>0) {
          //     data[i]=255;
          //     data[i+1]=0;
          //     data[i+2]=0;
          //     data[i+3]=150;
          //   };
          // };
          // // put the pixel in the canvas
          // labelctx.putImageData(ImageData,0,0);
        }
      };
  };

  // change the brushwidth
  function changeBrushwidth (newsize) {
      //var brushw = document.getElementById("brushw");
      brushWidth = newsize;
      //brushw.value = newsize;
  }

  // draw all the polygons, 
  //if point is set to true : draw big points on the edges of the polygon
  //if point is set to false: doesn't draw the bigpoints, and fill the polygon
  function redrawall (point) {
      // if point = true, draw the points
      //var lnhisto = listHisto.length;
      for (var i = listHisto.length - 1; i >= 0; i--) {
        var lnfigure = listHisto[i].length;
        var points = listHisto[i];
        drawingctx.beginPath();
        drawingctx.lineWidth = 0.5;
        drawingctx.moveTo(points[0][0], points[0][1]);
        drawingctx.fillStyle = colorchosen;
        for (var j = 0; j < lnfigure; j++) {
          //draw big points
          if (point){
            drawingctx.fillStyle = "rgba(255,255,102,0.6)";
            drawPoint(points[j][0],points[j][1],3);
            drawingctx.fillStyle = colorchosen;
          }
          //draw line
          drawingctx.lineTo(points[j][0], points[j][1]);
        }
        drawingctx.strokeStyle = colorchosen;
        drawingctx.lineWidth = 0.5;
        if(point){
          drawingctx.stroke();
          drawingctx.closePath();
        }
        else{
          drawingctx.closePath();
          drawingctx.fill();
        }

      };
  }

  init();

}


////






/**
 * @inheritDoc
 */
X.renderer2D.prototype.render_ = function(picking, invoked) {

  // call the render_ method of the superclass
  goog.base(this, 'render_', picking, invoked);

  // only proceed if there are actually objects to render
  var _objects = this._objects.values();

  var _numberOfObjects = _objects.length;
  if (_numberOfObjects == 0) {

    // there is nothing to render
    // get outta here
    return;

  }

  var _volume = this._topLevelObjects[0];
  var _currentSlice = null;
  if (this._orientationIndex == 0) {
    _currentSlice = _volume['indexX'];

  } else if (this._orientationIndex == 1) {
    _currentSlice = _volume['indexY'];

  } else {

    _currentSlice = _volume['indexZ'];

  }
  
  //if slice do not exist yet, we have to set slice dimensions
  var _width2 = this._slices[parseInt(_currentSlice, 10)]._iWidth;
  var _height2 = this._slices[parseInt(_currentSlice, 10)]._iHeight;
  // spacing
  this._sliceWidthSpacing = this._slices[parseInt(_currentSlice, 10)]._widthSpacing;
  this._sliceHeightSpacing = this._slices[parseInt(_currentSlice, 10)]._heightSpacing;

  // .. and store the dimensions
  this._sliceWidth = _width2;
  this._sliceHeight = _height2;
  //
  // grab the camera settings

  //
  // viewport size
  var _width = this._width;
  var _height = this._height;

  // first grab the view matrix which is 4x4 in favor of the 3D renderer
  var _view = this._camera._view;

  // clear the canvas
  this._context.save();
  this._context.clearRect(-_width, -_height, 2 * _width, 2 * _height);
  this._context.restore();

  // transform the canvas according to the view matrix
  // .. this includes zoom
  this._normalizedScale = Math.max(_view[14], 0.0001);
  this._context.setTransform(this._normalizedScale, 0, 0, this._normalizedScale, 0, 0);

  // .. and pan
  // we need to flip y here
  var _x = 1 * _view[12];
  var _y = -1 * _view[13];
  //
  // grab the volume and current slice
  //

  var _labelmap = _volume._labelmap;
  var _labelmapShowOnlyColor = null;

  if (_labelmap) {

    // since there is a labelmap, get the showOnlyColor property
    _labelmapShowOnlyColor = _volume._labelmap._showOnlyColor;

  }

  // .. here is the current slice
  var _slice = this._slices[parseInt(_currentSlice, 10)];
  var _sliceData = _slice._texture._rawData;
  var _currentLabelMap = _slice._labelmap;
  var _labelData = null;
  if (_currentLabelMap) {

    _labelData = _currentLabelMap._rawData;

  }

  var _sliceWidth = this._sliceWidth;
  var _sliceHeight = this._sliceHeight;

  //
  // FRAME BUFFERING
  //
  var _imageFBContext = this._frameBufferContext;
  var _labelFBContext = this._labelFrameBufferContext;
  var _drawingFBContext = this._drawingFrameBufferContext;

  // grab the current pixels
  var _imageData = _imageFBContext
      .getImageData(0, 0, _sliceWidth, _sliceHeight);
  var _labelmapData = _labelFBContext.getImageData(0, 0, _sliceWidth,
      _sliceHeight);
  var _drawingData = _drawingFBContext.getImageData(0, 0, _sliceWidth,
      _sliceHeight);
  var _pixels = _imageData.data;
  var _labelPixels = _labelmapData.data;
  var _drawingPixels = _drawingData.data;
  var _pixelsLength = _pixels.length;

  // threshold values
  var _maxScalarRange = _volume._max;
  var _lowerThreshold = _volume._lowerThreshold;
  var _upperThreshold = _volume._upperThreshold;
  var _windowLow = _volume._windowLow;
  var _windowHigh = _volume._windowHigh;

  // caching mechanism
  // we need to redraw the pixels only
  // - if the _currentSlice has changed
  // - if the threshold has changed
  // - if the window/level has changed
  // - the labelmap show only color has changed
  var _redraw_required = (this._currentSlice != _currentSlice ||
      this._lowerThreshold != _lowerThreshold ||
      this._upperThreshold != _upperThreshold ||
      this._windowLow != _windowLow || this._windowHigh != _windowHigh || (_labelmapShowOnlyColor && !X.array
      .compare(_labelmapShowOnlyColor, this._labelmapShowOnlyColor, 0, 0, 4)));

  if (_redraw_required) {
    // update FBs with new size
    // has to be there, not sure why, too slow to be in main loop?
     var _frameBuffer = this._frameBuffer;
    _frameBuffer.width = _width2;
    _frameBuffer.height = _height2;

    var _frameBuffer2 = this._labelFrameBuffer;
    _frameBuffer2.width = _width2;
    _frameBuffer2.height = _height2;

    var _frameBuffer3 = this._drawingFrameBuffer;
    _frameBuffer3.width = _width2;
    _frameBuffer3.height = _height2;

    // loop through the pixels and draw them to the invisible canvas
    // from bottom right up
    // also apply thresholding
    var _index = 0;
    do {

      // default color and label is just transparent
      var _color = [0, 0, 0, 0];
      var _label = [0, 0, 0, 0];
      var _fac1 = _volume._max - _volume._min;

      // grab the pixel intensity
      // slice data is normalized (probably shouldn't ?)
      // de-normalize it (get real value)
      var _intensity = (_sliceData[_index] / 255) * _fac1 + _volume._min;

      // apply window/level
      var _window = _windowHigh - _windowLow;
      var _level = _window/2 + _windowLow;

      var _origIntensity = 0;
      if(_intensity < _level - _window/2 ){
        _origIntensity = 0;
      }
      else if(_intensity > _level + _window/2 ){
        _origIntensity = 255;
      }
      else{
        _origIntensity  = 255 * (_intensity - (_level - _window / 2))/_window;
      }

      // apply thresholding
      if (_intensity >= _lowerThreshold && _intensity <= _upperThreshold) {

        // current intensity is inside the threshold range so use the real
        // intensity

        // map volume scalars to a linear color gradient
        var maxColor = new goog.math.Vec3(_volume._maxColor[0],
            _volume._maxColor[1], _volume._maxColor[2]);
        var minColor = new goog.math.Vec3(_volume._minColor[0],
            _volume._minColor[1], _volume._minColor[2]);
        _color = maxColor.scale(_origIntensity).add(
            minColor.scale(255 - _origIntensity));

        // .. and back to an array
        _color = [Math.floor(_color.x), Math.floor(_color.y),
                  Math.floor(_color.z), 255];

        if (_currentLabelMap) {
          // window.console.log(this._orientation);

          // we have a label map here
          // check if all labels are shown or only one
          if (_labelmapShowOnlyColor[3] == -255) {

            // all labels are shown
            _label = [_labelData[_index], _labelData[_index + 1],
                      _labelData[_index + 2], _labelData[_index + 3]];

          } else {

            // show only the label which matches in color
            if (X.array.compare(_labelmapShowOnlyColor, _labelData, 0, _index,
                4)) {

              // this label matches
              _label = [_labelData[_index], _labelData[_index + 1],
                        _labelData[_index + 2], _labelData[_index + 3]];

            }

          }

        }

      }

      if(this._orientation == "X"){
        // invert nothing
        _pixels[_index] = _color[0]; // r
        _pixels[_index + 1] = _color[1]; // g
        _pixels[_index + 2] = _color[2]; // b
        _pixels[_index + 3] = _color[3]; // a
        _labelPixels[_index] = _label[0]; // r
        _labelPixels[_index + 1] = _label[1]; // g
        _labelPixels[_index + 2] = _label[2]; // b
        _labelPixels[_index + 3] = _label[3]; // a
      }
      else if(this._orientation == "Y"){
        // invert cols
        var row = Math.floor(_index/(_sliceWidth*4));
        var col = _index - row*_sliceWidth*4;
        var invCol = 4*(_sliceWidth-1) - col ;
        var _invertedColsIndex = row*_sliceWidth*4 + invCol;
        _pixels[_invertedColsIndex] = _color[0]; // r
        _pixels[_invertedColsIndex + 1] = _color[1]; // g
        _pixels[_invertedColsIndex + 2] = _color[2]; // b
        _pixels[_invertedColsIndex + 3] = _color[3]; // a
        _labelPixels[_invertedColsIndex] = _label[0]; // r
        _labelPixels[_invertedColsIndex + 1] = _label[1]; // g
        _labelPixels[_invertedColsIndex + 2] = _label[2]; // b
        _labelPixels[_invertedColsIndex + 3] = _label[3]; // a
      }
      else{
        // invert all
        var _invertedIndex = _pixelsLength - 1 - _index;
        _pixels[_invertedIndex - 3] = _color[0]; // r
        _pixels[_invertedIndex - 2] = _color[1]; // g
        _pixels[_invertedIndex - 1] = _color[2]; // b
        _pixels[_invertedIndex] = _color[3]; // a
        _labelPixels[_invertedIndex - 3] = _label[0]; // r
        _labelPixels[_invertedIndex - 2] = _label[1]; // g
        _labelPixels[_invertedIndex - 1] = _label[2]; // b
        _labelPixels[_invertedIndex] = _label[3]; // a
      }

      _index += 4; // increase by 4 units for r,g,b,a

    } while (_index < _pixelsLength);

    // store the generated image data to the frame buffer context
    _imageFBContext.putImageData(_imageData, 0, 0);
    _labelFBContext.putImageData(_labelmapData, 0, 0);
    _drawingFBContext.putImageData(_drawingData, 0, 0);

    // cache the current slice index and other values
    // which might require a redraw
    this._currentSlice = _currentSlice;
    this._lowerThreshold = _lowerThreshold;
    this._upperThreshold = _upperThreshold;
    this._windowLow = _windowLow;
    this._windowHigh = _windowHigh;

    if (_currentLabelMap) {

      // only update the setting if we have a labelmap
      this._labelmapShowOnlyColor = _labelmapShowOnlyColor;

    }

  }

  //
  // the actual drawing (rendering) happens here
  //

  // draw the slice frame buffer (which equals the slice data) to the main
  // context
  this._context.globalAlpha = 1.0; // draw fully opaque}

  // move to the middle
  this._context.translate(_width / 2 /this._normalizedScale, _height / 2 /
      this._normalizedScale);

  // Rotate the Sagittal viewer
  if(this._orientation == "X") {

    this._context.rotate(Math.PI * 0.5);

    var _buf = _x;
    _x = _y;
    _y = -_buf;

  }

  var _offset_x = -_sliceWidth * this._sliceWidthSpacing / 2 + _x;
  var _offset_y = -_sliceHeight * this._sliceHeightSpacing / 2 + _y;

  // draw the slice
  this._context.drawImage(this._frameBuffer, _offset_x, _offset_y, _sliceWidth *
      this._sliceWidthSpacing, _sliceHeight * this._sliceHeightSpacing);

  // draw the labels with a configured opacity
  if (_currentLabelMap && _volume._labelmap._visible) {

    var _labelOpacity = 1;//_volume._labelmap._opacity;
    this._context.globalAlpha = _labelOpacity; // draw transparent depending on
    // opacity
    this._context.drawImage(this._labelFrameBuffer, _offset_x, _offset_y,
        _sliceWidth * this._sliceWidthSpacing, _sliceHeight *
            this._sliceHeightSpacing);

  }

  // draw the drawing
  drawingCondition = true;
  if (drawingCondition){
    this._context.drawImage(this._drawingFrameBuffer, _offset_x, _offset_y,
        _sliceWidth * this._sliceWidthSpacing, _sliceHeight *
            this._sliceHeightSpacing);
  }

  // if (this._orientation == "Y") {

  // };

  if (drawingCondition && this._orientation == "Z"){
    InitializeDrawinterface(_drawingFBContext, _labelFBContext, this._interactor,this,_volume);
     // window.console.log(_offset_x,_offset_y,_width,_height);
    // window.console.log(_volume._labelmap._image[_volume['indexZ']][75][40]);
     // var ImageData = _labelFBContext.getImageData(_offset_x,_offset_y, _sliceWidth * this._sliceWidthSpacing,_sliceHeight *
     //         this._sliceHeightSpacing);
    var ImageData = _labelFBContext.getImageData(0,0,150,150);
    var data = ImageData.data;
    // var _currentImage =  _volume._labelmap._IJKVolume[_volume['indexZ']];


    // // var iterator = 0;
    // for (var i = 0; i <  150; i++) {
    //   for (var j = 0; j < 150; j++) {
    //     // window.console.log("ici2");
    //     // if (data[iterator+3]>0) {
    //       // var __ijk = this.xy2ijk(i,j);
    //        // window.console.log("ici");

    //       _currentImage[i][j] = 2000;
    //     // }
    //     // iterator = iterator+4;
    //   };
    // };

    labelMouse= document.getElementById("mousePos2");
    labelMouse.innerHTML = "xcoor, yccor : "+ _volume['indexZ'];

    var xcoor = 0;
    var ycoor = 0;
    var _currentImage =  _volume._labelmap._IJKVolume;
    for (var i = 0; i < data.length; i+=4) {
      if (data[i+3]>0) {
        // var __ijk = this.xy2ijk(ycoor,xcoor);
        // window.console.log(xcoor,ycoor);
        _currentImage[_volume['indexZ']][ycoor][xcoor] = 2000;
        // labelMouse.innerHTML += " (" + xcoor  + " , "+ ycoor + " "+ _volume['indexZ'] + ") ";
        // if (__ijk) {
        //   var _currentImage =  _volume._labelmap._IJKVolume;
        //   _currentImage[__ijk[0][2]][__ijk[0][1]][__ijk[0][0]] = 2000;
        //   window.console.log(xcoor,ycoor,__ijk[0][0],__ijk[0][1]);
        // };
      };

      // window.console.log(data.length, xcoor, ycoor);
      xcoor = xcoor+1;
      if (xcoor >= 150){
        //labelMouse.innerHTML += " (" + xcoor  + " , "+ ycoor + " "+ _volume['indexZ'] + ") ";
        xcoor=0;
        ycoor=ycoor+1;
      }
    };

  }

    var _mousePosition = this._interactor._mousePosition;

    // UPDATE

    labelMouse= document.getElementById("mousePos");
    // labelMouse.value = " ";
    labelMouse.innerHTML = "Mouse Position : " + _mousePosition[0]  + " , "+ _mousePosition[1];
    
  // if enabled, show slice navigators
  if (this._config['SLICENAVIGATORS']) {
    //this._canvas.style.cursor = "none";
    // but only if the shift key is down and the left mouse is not
    //UPDATE CHANGE  : THE CROSS HAIR IS DISABLED , TO ENABLE IT PUT disable = false;
    var disabled = false;
    if (this._interactor._mouseInside && this._interactor._shiftDown &&
        !this._interactor._leftButtonDown && !disabled) {

      // window.console.log(_volume._labelmap._children.modified());
      // _volume.modified(true);
      this._canvas.style.cursor = "none";
    
      var _mousePosition = this._interactor._mousePosition;

      // check if we are over the slice
      // window.console.log(_mousePosition[0], _mousePosition[1]);
      var ijk = this.xy2ijk(_mousePosition[0], _mousePosition[1]);

      if (ijk) {
        // // we are over the slice
        // update the volume
        _volume._indexX = ijk[0][0];
        _volume._indexY = ijk[0][1];
        _volume._indexZ = ijk[0][2];
        _volume.modified(false);


        this['onSliceNavigation']();

        // draw the navigators
        // see http://diveintohtml5.info/canvas.html#paths

        // in x-direction
        this._context.setTransform(1, 0, 0, 1, 0, 0);
        //this._context.strokeStyle = "red";
        //DashedLine(this._interactor._mousePosition[0],0,this._interactor._mousePosition[0], this._height,20,5,this._context);
        this._context.beginPath();
        this._context.moveTo(this._interactor._mousePosition[0], 0);
        this._context.lineTo(this._interactor._mousePosition[0],
            this._interactor._mousePosition[1] - 4);
        this._context.strokeStyle = this._orientationColors[0];
        //this._context.lineWidth=3;
        //DashedLine(this._interactor._mousePosition[0],0,this._interactor._mousePosition[0], this._interactor._mousePosition[1] - 4,20,5,this._context);
        //this._context.closePath();
        //this._context.beginPath();
        this._context.moveTo(this._interactor._mousePosition[0],
            this._interactor._mousePosition[1] + 4);
        this._context.lineTo(this._interactor._mousePosition[0],
            this._height);
        this._context.strokeStyle = this._orientationColors[0];
        this._context.stroke();
        this._context.closePath();

        // in y-direction
        this._context.beginPath();
        this._context.moveTo(0, this._interactor._mousePosition[1]);
        this._context.lineTo(this._interactor._mousePosition[0] - 4,
            this._interactor._mousePosition[1]);
        this._context.moveTo(this._interactor._mousePosition[0] + 4, this._interactor._mousePosition[1]);
        this._context.lineTo(this._width,
            this._interactor._mousePosition[1]);
        this._context.strokeStyle = this._orientationColors[1];
        this._context.stroke();
        this._context.closePath();


        // _labelFBContext.beginPath();
        // _labelFBContext.moveTo(ijk[0][0], ijk[0][1]);
        // _labelFBContext.fillStyle = "rgba(0,0,255,0.4)";
        // _labelFBContext.fillRect(ijk[0][0]-2, ijk[0][1]-2,4,4);
        // //_labelFBContext.strokeStyle = "rgba(0,0,255,0.4)";
        // //_drawingFBContext.lineWidth = 1;
        // _labelFBContext.stroke();

        //         // in x-direction
        // this._context.setTransform(1, 0, 0, 1, 0, 0);
        // this._context.beginPath();
        // this._context.moveTo(ijk[0][0], 0);
        // this._context.lineTo(ijk[0][0],
        //     ijk[0][1] - 1);
        // this._context.moveTo(ijk[0][0],
        //     ijk[0][1] + 1);
        // this._context.lineTo(ijk[0][0],
        //     this._height);
        // this._context.strokeStyle = this._orientationColors[0];
        // this._context.stroke();
        // this._context.closePath();

        // // in y-direction
        // this._context.beginPath();
        // this._context.moveTo(0, ijk[0][1]);
        // this._context.lineTo(ijk[0][0] - 1,
        //     ijk[0][1]);
        // this._context.moveTo(ijk[0][0] + 1, ijk[0][1]);
        // this._context.lineTo(this._width,
        //     ijk[0][1]);
        // this._context.strokeStyle = this._orientationColors[0];
        // this._context.stroke();
        // this._context.closePath();

        /*var CanvasXTKP = document.getElementById('canvasXTKPOver');
        var heightPrinc = CanvasXTKP.height;
        var widthPrinc = CanvasXTKP.width;
        var contextXTKP = CanvasXTKP.getContext('2d');
        contextXTKP.clearRect(0, 0, CanvasXTKP.width, CanvasXTKP.height);
        //contextXTKP.fillText('RAS',50,50);

        // in x-direction
        contextXTKP.setTransform(1, 0, 0, 1, 0, 0);
        contextXTKP.beginPath();
        contextXTKP.moveTo(ijk[0][0], 0);
        contextXTKP.lineTo(ijk[0][0],
            ijk[0][1] - 1);
        contextXTKP.moveTo(ijk[0][0],
            ijk[0][1] + 1);
        contextXTKP.lineTo(ijk[0][0],
            CanvasXTKP.height);
        contextXTKP.strokeStyle = 'rgba(255,255,255,1)';
        contextXTKP.stroke();
        contextXTKP.closePath();

        // in y-direction
        contextXTKP.beginPath();
        contextXTKP.moveTo(0, ijk[0][1]);
        contextXTKP.lineTo(ijk[0][0] - 1,
            ijk[0][1]);
        contextXTKP.moveTo(ijk[0][0] + 1, ijk[0][1]);
        contextXTKP.lineTo(CanvasXTKP.width,
            ijk[0][1]);
        contextXTKP.strokeStyle = 'rgba(255,255,255,1)';
        contextXTKP.stroke();
        contextXTKP.closePath();

        // SECOND VIEWER
        var CanvasXTKP = document.getElementById('canvasXTKXOver');
        var contextXTKP = CanvasXTKP.getContext('2d');
        var jX = Math.round((ijk[0][1]*CanvasXTKP.width)/heightPrinc);
        var kX = Math.round((ijk[0][2]*CanvasXTKP.height)/CanvasXTKP.getAttribute("nbslices"));
        kX = CanvasXTKP.height - kX;
        contextXTKP.clearRect(0, 0, CanvasXTKP.width, CanvasXTKP.height);


        // in x-direction
        contextXTKP.setTransform(1, 0, 0, 1, 0, 0);
        contextXTKP.beginPath();
        contextXTKP.moveTo(jX, 0);
        contextXTKP.lineTo(jX,
            kX - 1);
        contextXTKP.moveTo(jX,
            kX + 1);
        contextXTKP.lineTo(jX,
            CanvasXTKP.height);
        contextXTKP.strokeStyle = 'rgba(255,255,255,1)';
        contextXTKP.stroke();
        contextXTKP.closePath();

        // in y-direction
        contextXTKP.beginPath();
        contextXTKP.moveTo(0, kX);
        contextXTKP.lineTo(jX - 1,
            kX);
        contextXTKP.moveTo(jX + 1, kX);
        contextXTKP.lineTo(CanvasXTKP.width,
            kX);
        contextXTKP.strokeStyle = 'rgba(255,255,255,1)';
        contextXTKP.stroke();
        contextXTKP.closePath();


        // THIRD VIEWER

        var CanvasXTKP = document.getElementById('canvasXTKYOver');
        var contextXTKP = CanvasXTKP.getContext('2d');
        var iX = Math.round((ijk[0][0]*CanvasXTKP.width)/widthPrinc);
        var kX = Math.round((ijk[0][2]*CanvasXTKP.height)/CanvasXTKP.getAttribute("nbslices"));
        kX = CanvasXTKP.height - kX;
        contextXTKP.clearRect(0, 0, CanvasXTKP.width, CanvasXTKP.height);

        // in x-direction
        contextXTKP.setTransform(1, 0, 0, 1, 0, 0);
        contextXTKP.beginPath();
        contextXTKP.moveTo(iX, 0);
        contextXTKP.lineTo(iX,
            kX - 1);
        contextXTKP.moveTo(iX,
            kX + 1);
        contextXTKP.lineTo(iX,
            CanvasXTKP.height );
        contextXTKP.strokeStyle = 'rgba(255,255,255,1)';
        contextXTKP.stroke();
        contextXTKP.closePath();

        // in y-direction
        contextXTKP.beginPath();
        contextXTKP.moveTo(0, kX);
        contextXTKP.lineTo(iX - 1,
            kX);
        contextXTKP.moveTo(iX + 1, kX);
        contextXTKP.lineTo(CanvasXTKP.width,
            kX);
        contextXTKP.strokeStyle = 'rgba(255,255,255,1)';
        contextXTKP.stroke();
        contextXTKP.closePath();
        //CHANGEMENT
      */
    }



    }
else{
    this._canvas.style.cursor = "auto";
  }
  }

};

// export symbols (required for advanced compilation)
goog.exportSymbol('X.renderer2D', X.renderer2D);
goog.exportSymbol('X.renderer2D.prototype.init', X.renderer2D.prototype.init);
goog.exportSymbol('X.renderer2D.prototype.add', X.renderer2D.prototype.add);
goog.exportSymbol('X.renderer2D.prototype.onShowtime',
    X.renderer2D.prototype.onShowtime);
goog.exportSymbol('X.renderer2D.prototype.onRender',
    X.renderer2D.prototype.onRender);
goog.exportSymbol('X.renderer2D.prototype.onScroll',
    X.renderer2D.prototype.onScroll);
goog.exportSymbol('X.renderer2D.prototype.onWindowLevel',
    X.renderer2D.prototype.onWindowLevel);
goog.exportSymbol('X.renderer2D.prototype.get', X.renderer2D.prototype.get);
goog.exportSymbol('X.renderer2D.prototype.resetViewAndRender',
    X.renderer2D.prototype.resetViewAndRender);
goog.exportSymbol('X.renderer2D.prototype.xy2ijk',
    X.renderer2D.prototype.xy2ijk);
goog.exportSymbol('X.renderer2D.prototype.render',
    X.renderer2D.prototype.render);
goog.exportSymbol('X.renderer2D.prototype.destroy',
    X.renderer2D.prototype.destroy);
goog.exportSymbol('X.renderer2D.prototype.onSliceNavigation', X.renderer2D.prototype.onSliceNavigation);

goog.exportSymbol('X.renderer2D.prototype.afterRender', X.renderer2D.prototype.afterRender);
goog.exportSymbol('X.renderer2D.prototype.resize', X.renderer2D.prototype.resize);

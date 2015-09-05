var $JssorSlideshowFormations$ = window.$JssorSlideshowFormations$ = new function () {
    var _This = this;


    var COLUMN_INCREASE = 0;
    var COLUMN_DECREASE = 1;
    var ROW_INCREASE = 2;
    var ROW_DECREASE = 3;

    var DIRECTION_HORIZONTAL = 0x0003;
    var DIRECTION_VERTICAL = 0x000C;

    var TO_LEFT = 0x0001;
    var TO_RIGHT = 0x0002;
    var TO_TOP = 0x0004;
    var TO_BOTTOM = 0x0008;

    var FROM_LEFT = 0x0100;
    var FROM_TOP = 0x0200;
    var FROM_RIGHT = 0x0400;
    var FROM_BOTTOM = 0x0800;

    var ASSEMBLY_BOTTOM_LEFT = FROM_BOTTOM + TO_LEFT;
    var ASSEMBLY_BOTTOM_RIGHT = FROM_BOTTOM + TO_RIGHT;
    var ASSEMBLY_TOP_LEFT = FROM_TOP + TO_LEFT;
    var ASSEMBLY_TOP_RIGHT = FROM_TOP + TO_RIGHT;
    var ASSEMBLY_LEFT_TOP = FROM_LEFT + TO_TOP;
    var ASSEMBLY_LEFT_BOTTOM = FROM_LEFT + TO_BOTTOM;
    var ASSEMBLY_RIGHT_TOP = FROM_RIGHT + TO_TOP;
    var ASSEMBLY_RIGHT_BOTTOM = FROM_RIGHT + TO_BOTTOM;


    function isToLeft(roadValue) {
        return (roadValue & TO_LEFT) == TO_LEFT;
    }

    function isToRight(roadValue) {
        return (roadValue & TO_RIGHT) == TO_RIGHT;
    }

    function isToTop(roadValue) {
        return (roadValue & TO_TOP) == TO_TOP;
    }

    function isToBottom(roadValue) {
        return (roadValue & TO_BOTTOM) == TO_BOTTOM;
    }

    function PushFormationOrder(arr, order, formationItem) {
        formationItem.push(order);
        arr[order] = arr[order] || [];
        arr[order].push(formationItem);
    }

    _This.$FormationRandom = function (transition) {
        var a = [];
        var r, col, i;
        for (r = 0; r < transition.$Rows; r++) {
            for (col = 0; col < transition.$Cols; col++)
                PushFormationOrder(a, Math.ceil(100000 * Math.random()) % 13, [r, col]);
        }

        return a;
    };
};



var $JssorSlideshowRunner$ = window.$JssorSlideshowRunner$ = function (slideContainer, slideContainerWidth, slideContainerHeight, slideshowOptions, isTouchDevice) {

    var _SelfSlideshowRunner = this;

    var _EndTime;

    var _SliderFrameCount;

    var _SlideshowPlayerBelow;
    var _SlideshowPlayerAbove;

    var _PrevItem;
    var _SlideItem;

    var _TransitionIndex = 0;
    var _TransitionsOrder = slideshowOptions.$TransitionsOrder;

    var _SlideshowTransition;

    var _SlideshowPerformance = 8;

    function EnsureTransitionInstance(options, slideshowInterval) {

        var slideshowTransition = {
            $Interval: slideshowInterval, 
            $Duration: 1,
            $Delay: 0,
            $Cols: 1,
            $Rows: 1,
            $Opacity: 0,
            $Zoom: 0,
            $Clip: 0,
            $Move: false,
            $SlideOut: false, 
            $Reverse: false,
            $Formation: $JssorSlideshowFormations$.$FormationRandom,
            $Assembly: 0x0408,
            $ChessMode: { $Column: 0, $Row: 0 },
            $Easing: $JssorEasing$.$EaseSwing,
            $Round: {},
            $Blocks: [],
            $During: {}
        };

        $Jssor$.$Extend(slideshowTransition, options);

        slideshowTransition.$Count = slideshowTransition.$Cols * slideshowTransition.$Rows;
        if ($Jssor$.$IsFunction(slideshowTransition.$Easing))
            slideshowTransition.$Easing = { $Default: slideshowTransition.$Easing };

        slideshowTransition.$FramesCount = Math.ceil(slideshowTransition.$Duration / slideshowTransition.$Interval);

        slideshowTransition.$GetBlocks = function (width, height) {
            width /= slideshowTransition.$Cols;
            height /= slideshowTransition.$Rows;
            var wh = width + 'x' + height;
            if (!slideshowTransition.$Blocks[wh]) {
                slideshowTransition.$Blocks[wh] = { $Width: width, $Height: height };
                for (var col = 0; col < slideshowTransition.$Cols; col++) {
                    for (var r = 0; r < slideshowTransition.$Rows; r++)
                        slideshowTransition.$Blocks[wh][r + ',' + col] = { $Top: r * height, $Right: col * width + width, $Bottom: r * height + height, $Left: col * width };
                }
            }

            return slideshowTransition.$Blocks[wh];
        };

        if (slideshowTransition.$Brother) {
            slideshowTransition.$Brother = EnsureTransitionInstance(slideshowTransition.$Brother, slideshowInterval);
            slideshowTransition.$SlideOut = true;
        }

        return slideshowTransition;
    }

    function JssorSlideshowPlayer(slideContainer, slideElement, slideTransition, beginTime, slideContainerWidth, slideContainerHeight) {
        var _Self = this;

        var _Block;
        var _StartStylesArr = {};
        var _AnimationStylesArrs = {};
        var _AnimationBlockItems = [];
        var _StyleStart;
        var _StyleEnd;
        var _StyleDif;
        var _ChessModeColumn = slideTransition.$ChessMode.$Column || 0;
        var _ChessModeRow = slideTransition.$ChessMode.$Row || 0;

        var _Blocks = slideTransition.$GetBlocks(slideContainerWidth, slideContainerHeight);
        var _FormationInstance = GetFormation(slideTransition);
        var _MaxOrder = _FormationInstance.length - 1;
        var _Period = slideTransition.$Duration + slideTransition.$Delay * _MaxOrder;
        var _EndTime = beginTime + _Period;

        var _SlideOut = slideTransition.$SlideOut;
        var _IsIn;

        _EndTime += 50;


        function GetFormation(transition) {

            var formationInstance = transition.$Formation(transition);

            return transition.$Reverse ? formationInstance.reverse() : formationInstance;

        }

        _Self.$EndTime = _EndTime;

        _Self.$ShowFrame = function (time) {
            time -= beginTime;

            var isIn = time < _Period;

            if (isIn || _IsIn) {
                _IsIn = isIn;

                if (!_SlideOut)
                    time = _Period - time;

                var frameIndex = Math.ceil(time / slideTransition.$Interval);

                $Jssor$.$Each(_AnimationStylesArrs, function (value, index) {

                    var itemFrameIndex = Math.max(frameIndex, value.$Min);
                    itemFrameIndex = Math.min(itemFrameIndex, value.length - 1);

                    if (value.$LastFrameIndex != itemFrameIndex) {
                        if (!value.$LastFrameIndex && !_SlideOut) {
                            $Jssor$.$ShowElement(_AnimationBlockItems[index]);
                        }
                        else if (itemFrameIndex == value.$Max && _SlideOut) {
                            $Jssor$.$HideElement(_AnimationBlockItems[index]);
                        }
                        value.$LastFrameIndex = itemFrameIndex;
                        $Jssor$.$SetStylesEx(_AnimationBlockItems[index], value[itemFrameIndex]);
                    }
                });
            }
        };

        {
            slideElement = $Jssor$.$CloneNode(slideElement);
            if ($Jssor$.$IsBrowserIe9Earlier()) {
                var hasImage = !slideElement["no-image"];
                var slideChildElements = $Jssor$.$FindChildrenByTag(slideElement);
                $Jssor$.$Each(slideChildElements, function (slideChildElement) {
                    if (hasImage || slideChildElement["jssor-slider"])
                        $Jssor$.$CssOpacity(slideChildElement, $Jssor$.$CssOpacity(slideChildElement), true);
                });
            }

            $Jssor$.$Each(_FormationInstance, function (formationItems, order) {
                $Jssor$.$Each(formationItems, function (formationItem) {
                    var row = formationItem[0];
                    var col = formationItem[1];
                    {
                        var columnRow = row + ',' + col;

                        var chessHorizontal = false;
                        var chessVertical = false;
                        var chessRotate = false;

                        if (_ChessModeColumn && col % 2) {
                            if (_ChessModeColumn & 3/*$JssorDirection$.$IsHorizontal(_ChessModeColumn)*/) {
                                chessHorizontal = !chessHorizontal;
                            }
                            if (_ChessModeColumn & 12/*$JssorDirection$.$IsVertical(_ChessModeColumn)*/) {
                                chessVertical = !chessVertical;
                            }

                            if (_ChessModeColumn & 16)
                                chessRotate = !chessRotate;
                        }

                        if (_ChessModeRow && row % 2) {
                            if (_ChessModeRow & 3/*$JssorDirection$.$IsHorizontal(_ChessModeRow)*/) {
                                chessHorizontal = !chessHorizontal;
                            }
                            if (_ChessModeRow & 12/*$JssorDirection$.$IsVertical(_ChessModeRow)*/) {
                                chessVertical = !chessVertical;
                            }
                            if (_ChessModeRow & 16)
                                chessRotate = !chessRotate;
                        }

                        slideTransition.$Top = slideTransition.$Top || (slideTransition.$Clip & 4);
                        slideTransition.$Bottom = slideTransition.$Bottom || (slideTransition.$Clip & 8);
                        slideTransition.$Left = slideTransition.$Left || (slideTransition.$Clip & 1);
                        slideTransition.$Right = slideTransition.$Right || (slideTransition.$Clip & 2);

                        var topBenchmark = chessVertical ? slideTransition.$Bottom : slideTransition.$Top;
                        var bottomBenchmark = chessVertical ? slideTransition.$Top : slideTransition.$Bottom;
                        var leftBenchmark = chessHorizontal ? slideTransition.$Right : slideTransition.$Left;
                        var rightBenchmark = chessHorizontal ? slideTransition.$Left : slideTransition.$Right;

                        slideTransition.$Clip = topBenchmark || bottomBenchmark || leftBenchmark || rightBenchmark;

                        _StyleDif = {};
                        _StyleEnd = { $Top: 0, $Left: 0, $Opacity: 1, $Width: slideContainerWidth, $Height: slideContainerHeight };
                        _StyleStart = $Jssor$.$Extend({}, _StyleEnd);
                        _Block = $Jssor$.$Extend({}, _Blocks[columnRow]);

                        if (slideTransition.$Opacity) {
                            _StyleEnd.$Opacity = 2 - slideTransition.$Opacity;
                        }

                        if (slideTransition.$ZIndex) {
                            _StyleEnd.$ZIndex = slideTransition.$ZIndex;
                            _StyleStart.$ZIndex = 0;
                        }

                        var allowClip = slideTransition.$Cols * slideTransition.$Rows > 1 || slideTransition.$Clip;

                        if (slideTransition.$Zoom || slideTransition.$Rotate) {
                            var allowRotate = true;
                            if ($Jssor$.$IsBrowserIe9Earlier()) {
                                if (slideTransition.$Cols * slideTransition.$Rows > 1)
                                    allowRotate = false;
                                else
                                    allowClip = false;
                            }

                            if (allowRotate) {
                                _StyleEnd.$Zoom = slideTransition.$Zoom ? slideTransition.$Zoom - 1 : 1;
                                _StyleStart.$Zoom = 1;

                                if ($Jssor$.$IsBrowserIe9Earlier() || $Jssor$.$IsBrowserOpera())
                                    _StyleEnd.$Zoom = Math.min(_StyleEnd.$Zoom, 2);

                                var rotate = slideTransition.$Rotate;

                                _StyleEnd.$Rotate = rotate * 360 * ((chessRotate) ? -1 : 1);
                                _StyleStart.$Rotate = 0;
                            }
                        }

                        if (allowClip) {
                            if (slideTransition.$Clip) {
                                var clipScale = slideTransition.$ScaleClip || 1;
                                var blockOffset = _Block.$Offset = {};
                                if (topBenchmark && bottomBenchmark) {
                                    blockOffset.$Top = _Blocks.$Height / 2 * clipScale;
                                    blockOffset.$Bottom = -blockOffset.$Top;
                                }
                                else if (topBenchmark) {
                                    blockOffset.$Bottom = -_Blocks.$Height * clipScale;
                                }
                                else if (bottomBenchmark) {
                                    blockOffset.$Top = _Blocks.$Height * clipScale;
                                }

                                if (leftBenchmark && rightBenchmark) {
                                    blockOffset.$Left = _Blocks.$Width / 2 * clipScale;
                                    blockOffset.$Right = -blockOffset.$Left;
                                }
                                else if (leftBenchmark) {
                                    blockOffset.$Right = -_Blocks.$Width * clipScale;
                                }
                                else if (rightBenchmark) {
                                    blockOffset.$Left = _Blocks.$Width * clipScale;
                                }
                            }

                            _StyleDif.$Clip = _Block;
                            _StyleStart.$Clip = _Blocks[columnRow];
                        }

                        {
                            var chessHor = chessHorizontal ? 1 : -1;
                            var chessVer = chessVertical ? 1 : -1;

                            if (slideTransition.x)
                                _StyleEnd.$Left += slideContainerWidth * slideTransition.x * chessHor;

                            if (slideTransition.y)
                                _StyleEnd.$Top += slideContainerHeight * slideTransition.y * chessVer;
                        }

                        $Jssor$.$Each(_StyleEnd, function (propertyEnd, property) {
                            if ($Jssor$.$IsNumeric(propertyEnd)) {
                                if (propertyEnd != _StyleStart[property]) {
                                    _StyleDif[property] = propertyEnd - _StyleStart[property];
                                }
                            }
                        });

                        _StartStylesArr[columnRow] = _SlideOut ? _StyleStart : _StyleEnd;

                        var animationStylesArr = [];
                        var framesCount = slideTransition.$FramesCount;
                        var virtualFrameCount = Math.round(order * slideTransition.$Delay / slideTransition.$Interval);
                        _AnimationStylesArrs[columnRow] = new Array(virtualFrameCount);
                        _AnimationStylesArrs[columnRow].$Min = virtualFrameCount;
                        _AnimationStylesArrs[columnRow].$Max = virtualFrameCount + framesCount - 1;

                        for (var frameN = 0; frameN <= framesCount; frameN++) {
                            var styleFrameN = $Jssor$.$Cast(_StyleStart, _StyleDif, frameN / framesCount, slideTransition.$Easing, slideTransition.$During, slideTransition.$Round, { $Move: slideTransition.$Move, $OriginalWidth: slideContainerWidth, $OriginalHeight: slideContainerHeight })

                            styleFrameN.$ZIndex = styleFrameN.$ZIndex || 1;

                            _AnimationStylesArrs[columnRow].push(styleFrameN);
                        }

                    } 
                });
            });

            _FormationInstance.reverse();
            $Jssor$.$Each(_FormationInstance, function (formationItems) {
                $Jssor$.$Each(formationItems, function (formationItem) {
                    var row = formationItem[0];
                    var col = formationItem[1];

                    var columnRow = row + ',' + col;

                    var image = slideElement;
                    if (col || row)
                        image = $Jssor$.$CloneNode(slideElement);

                    $Jssor$.$SetStyles(image, _StartStylesArr[columnRow]);
                    $Jssor$.$CssOverflow(image, "hidden");

                    $Jssor$.$CssPosition(image, "absolute");
                    slideContainer.$AddClipElement(image);
                    _AnimationBlockItems[columnRow] = image;
                    $Jssor$.$ShowElement(image, !_SlideOut);
                });
            });
        }
    }

    function SlideshowProcessor() {
        var _SelfSlideshowProcessor = this;
        var _CurrentTime = 0;

        $JssorAnimator$.call(_SelfSlideshowProcessor, 0, _EndTime);

        _SelfSlideshowProcessor.$OnPositionChange = function (oldPosition, newPosition) {
            if ((newPosition - _CurrentTime) > _SlideshowPerformance) {
                _CurrentTime = newPosition;

                _SlideshowPlayerAbove && _SlideshowPlayerAbove.$ShowFrame(newPosition);
                _SlideshowPlayerBelow && _SlideshowPlayerBelow.$ShowFrame(newPosition);
            }
        };

        _SelfSlideshowProcessor.$Transition = _SlideshowTransition;
    }

    _SelfSlideshowRunner.$GetTransition = function (slideCount) {
        var n = 0;

        var transitions = slideshowOptions.$Transitions;

        var transitionCount = transitions.length;

        if (_TransitionsOrder) { 
            n = _TransitionIndex++ % transitionCount;
        }
        else { 
            n = Math.floor(Math.random() * transitionCount);
        }

        transitions[n] && (transitions[n].$Index = n);

        return transitions[n];
    };

    _SelfSlideshowRunner.$Initialize = function (slideIndex, prevIndex, slideItem, prevItem, slideshowTransition) {
        $JssorDebug$.$Execute(function () {
            if (_SlideshowPlayerBelow) {
                $JssorDebug$.$Fail("slideshow runner has not been cleared.");
            }
        });

        _SlideshowTransition = slideshowTransition;

        slideshowTransition = EnsureTransitionInstance(slideshowTransition, _SlideshowPerformance);

        _SlideItem = slideItem;
        _PrevItem = prevItem;

        var prevSlideElement = prevItem.$Item;
        var currentSlideElement = slideItem.$Item;
        prevSlideElement["no-image"] = !prevItem.$Image;
        currentSlideElement["no-image"] = !slideItem.$Image;

        var slideElementAbove = prevSlideElement;
        var slideElementBelow = currentSlideElement;

        var slideTransitionAbove = slideshowTransition;
        var slideTransitionBelow = slideshowTransition.$Brother || EnsureTransitionInstance({}, _SlideshowPerformance);

        if (!slideshowTransition.$SlideOut) {
            slideElementAbove = currentSlideElement;
            slideElementBelow = prevSlideElement;
        }

        var shift = slideTransitionBelow.$Shift || 0;

        _SlideshowPlayerBelow = new JssorSlideshowPlayer(slideContainer, slideElementBelow, slideTransitionBelow, Math.max(shift - slideTransitionBelow.$Interval, 0), slideContainerWidth, slideContainerHeight);
        _SlideshowPlayerAbove = new JssorSlideshowPlayer(slideContainer, slideElementAbove, slideTransitionAbove, Math.max(slideTransitionBelow.$Interval - shift, 0), slideContainerWidth, slideContainerHeight);

        _SlideshowPlayerBelow.$ShowFrame(0);
        _SlideshowPlayerAbove.$ShowFrame(0);

        _EndTime = Math.max(_SlideshowPlayerBelow.$EndTime, _SlideshowPlayerAbove.$EndTime);

        _SelfSlideshowRunner.$Index = slideIndex;
    };

    _SelfSlideshowRunner.$Clear = function () {
        slideContainer.$Clear();
        _SlideshowPlayerBelow = null;
        _SlideshowPlayerAbove = null;
    };

    _SelfSlideshowRunner.$GetProcessor = function () {
        var slideshowProcessor = null;

        if (_SlideshowPlayerAbove)
            slideshowProcessor = new SlideshowProcessor();

        return slideshowProcessor;
    };
};

var $JssorSlider$ = window.$JssorSlider$ = function (elmt, options) {
    var _SelfSlider = this;

    function Conveyor() {
        var _SelfConveyor = this;
        $JssorAnimator$.call(_SelfConveyor, -100000000, 200000000);

        _SelfConveyor.$GetCurrentSlideInfo = function () {
            var positionDisplay = _SelfConveyor.$GetPosition_Display();
            var virtualIndex = Math.floor(positionDisplay);
            var slideIndex = GetRealIndex(virtualIndex);
            var slidePosition = positionDisplay - Math.floor(positionDisplay);

            return { $Index: slideIndex, $VirtualIndex: virtualIndex, $Position: slidePosition };
        };

        _SelfConveyor.$OnPositionChange = function (oldPosition, newPosition) {

            var index = Math.floor(newPosition);
            if (index != newPosition && newPosition > oldPosition)
                index++;

            ResetNavigator(index, true);

            _SelfSlider.$TriggerEvent($JssorSlider$.$EVT_POSITION_CHANGE, GetRealIndex(newPosition), GetRealIndex(oldPosition), newPosition, oldPosition);
        };
    }

    function Carousel() {
        var _SelfCarousel = this;

        $JssorAnimator$.call(_SelfCarousel, 0, 0, { $LoopLength: _SlideCount });

        {
            $Jssor$.$Each(_SlideItems, function (slideItem) {
                (_Loop & 1) && slideItem.$SetLoopLength(_SlideCount);
                _SelfCarousel.$Chain(slideItem);
                slideItem.$Shift(_ParkingPosition / _StepLength);
            });
        }
    }

    function Slideshow() {
        var _SelfSlideshow = this;
        var _Wrapper = _SlideContainer.$Elmt;

        $JssorAnimator$.call(_SelfSlideshow, -1, 2, { $Easing: $JssorEasing$.$EaseLinear, $Setter: { $Position: SetPosition }, $LoopLength: _SlideCount }, _Wrapper, { $Position: 1 }, { $Position: -2 });

        _SelfSlideshow.$Wrapper = _Wrapper;

        {
            $JssorDebug$.$Execute(function () {
                $Jssor$.$Attribute(_SlideContainer.$Elmt, "debug-id", "slide_container");
            });
        }
    }

    function CarouselPlayer(carousel, slideshow) {
        var _SelfCarouselPlayer = this;
        var _FromPosition;
        var _ToPosition;
        var _Duration;
        var _StandBy;
        var _StandByPosition;

        $JssorAnimator$.call(_SelfCarouselPlayer, -100000000, 200000000, { $IntervalMax: 100 });

       

        _SelfCarouselPlayer.$OnStop = function () {

            _IsSliding = false;
            _StandBy = false;

            var currentSlideInfo = _Conveyor.$GetCurrentSlideInfo();

            _SelfSlider.$TriggerEvent($JssorSlider$.$EVT_SWIPE_END, GetRealIndex(_Conveyor.$GetPosition()), _Conveyor.$GetPosition());

            if (!currentSlideInfo.$Position) {
                OnPark(currentSlideInfo.$VirtualIndex, _CurrentSlideIndex);
            }
        };

        _SelfCarouselPlayer.$OnPositionChange = function (oldPosition, newPosition) {

            var toPosition;

            if (_StandBy)
                toPosition = _StandByPosition;
            else {
                toPosition = _ToPosition;

                if (_Duration) {
                    var interPosition = newPosition / _Duration;
                    toPosition = _Options.$SlideEasing(interPosition) * (_ToPosition - _FromPosition) + _FromPosition;
                }
            }

            _Conveyor.$GoToPosition(toPosition);
        };

        _SelfCarouselPlayer.$PlayCarousel = function (fromPosition, toPosition, duration, callback) {
            $JssorDebug$.$Execute(function () {
                if (_SelfCarouselPlayer.$IsPlaying())
                    $JssorDebug$.$Fail("The carousel is already playing.");
            });

            _FromPosition = fromPosition;
            _ToPosition = toPosition;
            _Duration = duration;

            _Conveyor.$GoToPosition(fromPosition);
            _SelfCarouselPlayer.$GoToPosition(0);

            _SelfCarouselPlayer.$PlayToPosition(duration, callback);
        };

        _SelfCarouselPlayer.$StandBy = function (standByPosition) {
            _StandBy = true;
            _StandByPosition = standByPosition;
            _SelfCarouselPlayer.$Play(standByPosition, null, true);
        };

        _SelfCarouselPlayer.$SetStandByPosition = function (standByPosition) {
            _StandByPosition = standByPosition;
        };

        _SelfCarouselPlayer.$MoveCarouselTo = function (position) {
            _Conveyor.$GoToPosition(position);
        };

        {
            _Conveyor = new Conveyor();

            _Conveyor.$Combine(carousel);
            _Conveyor.$Combine(slideshow);
        }
    }

    function SlideContainer() {
        var _Self = this;
        var elmt = CreatePanel();

        $Jssor$.$CssZIndex(elmt, 0);
        $Jssor$.$Css(elmt, "pointerEvents", "none");

        _Self.$Elmt = elmt;

        _Self.$AddClipElement = function (clipElement) {
            $Jssor$.$AppendChild(elmt, clipElement);
            $Jssor$.$ShowElement(elmt);
        };

        _Self.$Clear = function () {
            $Jssor$.$HideElement(elmt);
            $Jssor$.$Empty(elmt);
        };
    }

    function SlideItem(slideElmt, slideIndex) {

        var _SelfSlideItem = this;

        var _CaptionSliderIn;
        var _CaptionSliderOut;
        var _CaptionSliderCurrent;
        var _IsCaptionSliderPlayingWhenDragStart;

        var _Wrapper;
        var _BaseElement = slideElmt;

        var _LoadingScreen;

        var _ImageItem;
        var _ImageElmts = [];
        var _LinkItemOrigin;
        var _LinkItem;
        var _ImageLoading;
        var _ImageLoaded;
        var _ImageLazyLoading;
        var _ContentRefreshed;

        var _Processor;

        var _PlayerInstanceElement;
        var _PlayerInstance;

        var _SequenceNumber;  

        $JssorAnimator$.call(_SelfSlideItem, -_DisplayPieces, _DisplayPieces + 1, { $SlideItemAnimator: true });

        function ResetCaptionSlider(fresh) {
            _CaptionSliderOut && _CaptionSliderOut.$Revert();
            _CaptionSliderIn && _CaptionSliderIn.$Revert();

            RefreshContent(slideElmt, fresh);
            _ContentRefreshed = true;

            _CaptionSliderIn = new _CaptionSliderOptions.$Class(slideElmt, _CaptionSliderOptions, 1);
            $JssorDebug$.$LiveStamp(_CaptionSliderIn, "caption_slider_" + _CaptionSliderCount + "_in");
            _CaptionSliderOut = new _CaptionSliderOptions.$Class(slideElmt, _CaptionSliderOptions);
            $JssorDebug$.$LiveStamp(_CaptionSliderOut, "caption_slider_" + _CaptionSliderCount + "_out");

            $JssorDebug$.$Execute(function () {
                _CaptionSliderCount++;
            });

            _CaptionSliderOut.$GoToPosition(0);
            _CaptionSliderIn.$GoToPosition(0);
        }

        function EnsureCaptionSliderVersion() {
            if (_CaptionSliderIn.$Version < _CaptionSliderOptions.$Version) {
                ResetCaptionSlider();
            }
        }

        function LoadImageCompleteEventHandler(completeCallback, loadingScreen, image) {
            if (!_ImageLoaded) {
                _ImageLoaded = true;

                if (_ImageItem && image) {
                    var imageWidth = image.width;
                    var imageHeight = image.height;
                    var fillWidth = imageWidth;
                    var fillHeight = imageHeight;

                    if (imageWidth && imageHeight && _Options.$FillMode) {

                        if (_Options.$FillMode & 3 && (!(_Options.$FillMode & 4) || imageWidth > _SlideWidth || imageHeight > _SlideHeight)) {
                            var fitHeight = false;
                            var ratio = _SlideWidth / _SlideHeight * imageHeight / imageWidth;

                            if (_Options.$FillMode & 1) {
                                fitHeight = (ratio > 1);
                            }
                            else if (_Options.$FillMode & 2) {
                                fitHeight = (ratio < 1);
                            }
                            fillWidth = fitHeight ? imageWidth * _SlideHeight / imageHeight : _SlideWidth;
                            fillHeight = fitHeight ? _SlideHeight : imageHeight * _SlideWidth / imageWidth;
                        }

                        $Jssor$.$CssWidth(_ImageItem, fillWidth);
                        $Jssor$.$CssHeight(_ImageItem, fillHeight);
                        $Jssor$.$CssTop(_ImageItem, (_SlideHeight - fillHeight) / 2);
                        $Jssor$.$CssLeft(_ImageItem, (_SlideWidth - fillWidth) / 2);
                    }

                    $Jssor$.$CssPosition(_ImageItem, "absolute");

                    _SelfSlider.$TriggerEvent($JssorSlider$.$EVT_LOAD_END, slideIndex);
                }
            }

            $Jssor$.$HideElement(loadingScreen);
            completeCallback && completeCallback(_SelfSlideItem);
        }

        function LoadSlideshowImageCompleteEventHandler(nextIndex, nextItem, slideshowTransition, loadingTicket) {
            if (loadingTicket == _LoadingTicket && _CurrentSlideIndex == slideIndex && _AutoPlay) {
                if (!_Frozen) {
                    var nextRealIndex = GetRealIndex(nextIndex);
                    _SlideshowRunner.$Initialize(nextRealIndex, slideIndex, nextItem, _SelfSlideItem, slideshowTransition);
                    nextItem.$HideContentForSlideshow();
                    _Slideshow.$Locate(nextRealIndex, 1);
                    _Slideshow.$GoToPosition(nextRealIndex);
                    _CarouselPlayer.$PlayCarousel(nextIndex, nextIndex, 0);
                }
            }
        }


        function SlideReadyEventHandler(loadingTicket) {
            if (loadingTicket == _LoadingTicket && _CurrentSlideIndex == slideIndex) {

                if (!_Processor) {
                    var slideshowProcessor = null;
                    if (_SlideshowRunner) {
                        if (_SlideshowRunner.$Index == slideIndex)
                            slideshowProcessor = _SlideshowRunner.$GetProcessor();
                        else
                            _SlideshowRunner.$Clear();
                    }

                    EnsureCaptionSliderVersion();

                    _Processor = new Processor(slideElmt, slideIndex, slideshowProcessor, _SelfSlideItem.$GetCaptionSliderIn(), _SelfSlideItem.$GetCaptionSliderOut());
                    _Processor.$SetPlayer(_PlayerInstance);
                }

                !_Processor.$IsPlaying() && _Processor.$Replay();
            }
        }

        function ParkEventHandler(currentIndex, previousIndex, manualActivate) {
            if (currentIndex == slideIndex) {

                if (currentIndex != previousIndex)
                    _SlideItems[previousIndex] && _SlideItems[previousIndex].$ParkOut();
                else
                    !manualActivate && _Processor && _Processor.$AdjustIdleOnPark();

                _PlayerInstance && _PlayerInstance.$Enable();

                var loadingTicket = _LoadingTicket = $Jssor$.$GetNow();
                _SelfSlideItem.$LoadImage($Jssor$.$CreateCallback(null, SlideReadyEventHandler, loadingTicket));
            }
            else {
                var distance = Math.abs(slideIndex - currentIndex);
                var loadRange = _DisplayPieces + _Options.$LazyLoading - 1;
                if (!_ImageLazyLoading || distance <= loadRange) {
                    _SelfSlideItem.$LoadImage();
                }
            }
        }

        function SwipeStartEventHandler() {
            if (_CurrentSlideIndex == slideIndex && _Processor) {
                _Processor.$Stop();
                _PlayerInstance && _PlayerInstance.$Quit();
                _PlayerInstance && _PlayerInstance.$Disable();
                _Processor.$OpenSlideshowPanel();
            }
        }

        function FreezeEventHandler() {
            if (_CurrentSlideIndex == slideIndex && _Processor) {
                _Processor.$Stop();
            }
        }

        function SlideClickEventHandler(event) {
            if (!_LastDragSucceded) {
                _SelfSlider.$TriggerEvent($JssorSlider$.$EVT_CLICK, slideIndex, event);
            }
        }


        _SelfSlideItem.$LoadImage = function (completeCallback, loadingScreen) {
            loadingScreen = loadingScreen || _LoadingScreen;

            if (_ImageElmts.length && !_ImageLoaded) {

                $Jssor$.$ShowElement(loadingScreen);

                if (!_ImageLoading) {
                    _ImageLoading = true;
                    _SelfSlider.$TriggerEvent($JssorSlider$.$EVT_LOAD_START, slideIndex);

                    $Jssor$.$Each(_ImageElmts, function (imageElmt) {

                        if (!$Jssor$.$Attribute(imageElmt, "src")) {
                            imageElmt.src = $Jssor$.$AttributeEx(imageElmt, "src2");
                            $Jssor$.$CssDisplay(imageElmt, imageElmt["display-origin"]);
                        }
                    });
                }
                $Jssor$.$LoadImages(_ImageElmts, _ImageItem, $Jssor$.$CreateCallback(null, LoadImageCompleteEventHandler, completeCallback, loadingScreen));
            }
            else {
                LoadImageCompleteEventHandler(completeCallback, loadingScreen);
            }
        };

        _SelfSlideItem.$GoForNextSlide = function () {

            var index = slideIndex;
            if (_Options.$AutoPlaySteps < 0)
                index -= _SlideCount;

            var nextIndex = index + _Options.$AutoPlaySteps * _PlayReverse;

            
            if (nextIndex != slideIndex) {
                if (_SlideshowRunner) {
                    var slideshowTransition = _SlideshowRunner.$GetTransition(_SlideCount);

                    if (slideshowTransition) {
                        var loadingTicket = _LoadingTicket = $Jssor$.$GetNow();

                        var nextItem = _SlideItems[GetRealIndex(nextIndex)];
                        return nextItem.$LoadImage($Jssor$.$CreateCallback(null, LoadSlideshowImageCompleteEventHandler, nextIndex, nextItem, slideshowTransition, loadingTicket), _LoadingScreen);
                    }
                }

                PlayTo(nextIndex);
            }
        };

        _SelfSlideItem.$ParkOut = function () {
            _PlayerInstance && _PlayerInstance.$Quit();
            _PlayerInstance && _PlayerInstance.$Disable();
            _SelfSlideItem.$UnhideContentForSlideshow();
            _Processor && _Processor.$Abort();
            _Processor = null;
            ResetCaptionSlider();
        };


        _SelfSlideItem.$HideContentForSlideshow = function () {
            $Jssor$.$HideElement(slideElmt);
        };

        _SelfSlideItem.$UnhideContentForSlideshow = function () {
            $Jssor$.$ShowElement(slideElmt);
        };



        _SelfSlideItem.$EnablePlayer = function () {
            _PlayerInstance && _PlayerInstance.$Enable();
        };

        function RefreshContent(elmt, fresh, level) {
            $JssorDebug$.$Execute(function () {
                if ($Jssor$.$Attribute(elmt, "jssor-slider"))
                    $JssorDebug$.$Log("Child slider found.");
            });

            if ($Jssor$.$Attribute(elmt, "jssor-slider"))
                return;

            level = level || 0;

            if (!_ContentRefreshed) {
                if (elmt.tagName == "IMG") {
                    _ImageElmts.push(elmt);

                    if (!$Jssor$.$Attribute(elmt, "src")) {
                        _ImageLazyLoading = true;
                        elmt["display-origin"] = $Jssor$.$CssDisplay(elmt);
                        $Jssor$.$HideElement(elmt);
                    }
                }
                if ($Jssor$.$IsBrowserIe9Earlier()) {
                    $Jssor$.$CssZIndex(elmt, ($Jssor$.$CssZIndex(elmt) || 0) + 1);
                }
                if (_Options.$HWA && $Jssor$.$WebKitVersion()) {
                    if ($Jssor$.$WebKitVersion() < 534 || (!_SlideshowEnabled && !$Jssor$.$IsBrowserChrome())) {
                        $Jssor$.$EnableHWA(elmt);
                    }
                }
            }

            var childElements = $Jssor$.$Children(elmt);

            $Jssor$.$Each(childElements, function (childElement, i) {

                var childTagName = childElement.tagName;
                var uAttribute = $Jssor$.$AttributeEx(childElement, "u");
                if (uAttribute == "player" && !_PlayerInstanceElement) {
                    _PlayerInstanceElement = childElement;
                    if (_PlayerInstanceElement.pInstance) {
                        PlayerAvailableEventHandler();
                    }
                    else {
                        $Jssor$.$AddEvent(_PlayerInstanceElement, "dataavailable", PlayerAvailableEventHandler);
                    }
                }

                if (uAttribute == "caption") {
                    if (!$Jssor$.$IsBrowserIE() && !fresh) {


                        var captionElement = $Jssor$.$CloneNode(childElement, false, true);
                        $Jssor$.$InsertBefore(captionElement, childElement, elmt);
                        $Jssor$.$RemoveElement(childElement, elmt);
                        childElement = captionElement;

                        fresh = true;
                    }
                }
                else if (!_ContentRefreshed && !level && !_ImageItem) {

                    if (childTagName == "A") {
                        if ($Jssor$.$AttributeEx(childElement, "u") == "image") {
                            _ImageItem = $Jssor$.$FindChildByTag(childElement, "IMG");

                            $JssorDebug$.$Execute(function () {
                                if (!_ImageItem) {
                                    $JssorDebug$.$Error("slide html code definition error, no 'IMG' found in a 'image with link' slide.\r\n" + elmt.outerHTML);
                                }
                            });
                        }
                        else {
                            _ImageItem = $Jssor$.$FindChild(childElement, "image", true);
                        }

                        if (_ImageItem) {
                            _LinkItemOrigin = childElement;
                            $Jssor$.$SetStyles(_LinkItemOrigin, _StyleDef);

                            _LinkItem = $Jssor$.$CloneNode(_LinkItemOrigin, true);

                            $Jssor$.$CssDisplay(_LinkItem, "block");
                            $Jssor$.$SetStyles(_LinkItem, _StyleDef);
                            $Jssor$.$CssOpacity(_LinkItem, 0);
                            $Jssor$.$Css(_LinkItem, "backgroundColor", "#000");
                        }
                    }
                    else if (childTagName == "IMG" && $Jssor$.$AttributeEx(childElement, "u") == "image") {
                        _ImageItem = childElement;
                    }

                    if (_ImageItem) {
                        _ImageItem.border = 0;
                        $Jssor$.$SetStyles(_ImageItem, _StyleDef);
                    }
                }


                RefreshContent(childElement, fresh, level +1);
            });
        }

        _SelfSlideItem.$OnInnerOffsetChange = function (oldOffset, newOffset) {
            var slidePosition = _DisplayPieces - newOffset;

            SetPosition(_Wrapper, slidePosition);

            
        };

        _SelfSlideItem.$GetCaptionSliderIn = function () {
            return _CaptionSliderIn;
        };


        _SelfSlideItem.$GetCaptionSliderOut = function () {
            return _CaptionSliderOut;
        };

        _SelfSlideItem.$Index = slideIndex;

        $JssorObject$.call(_SelfSlideItem);

        {

            var thumb = $Jssor$.$FindChild(slideElmt, "thumb", true);
            if (thumb) {
                _SelfSlideItem.$Thumb = $Jssor$.$CloneNode(thumb);
                $Jssor$.$RemoveAttribute(thumb, "id");
                $Jssor$.$HideElement(thumb);
            }
            $Jssor$.$ShowElement(slideElmt);

            _LoadingScreen = $Jssor$.$CloneNode(_LoadingContainer);
            $Jssor$.$CssZIndex(_LoadingScreen, 1000);

            $Jssor$.$AddEvent(slideElmt, "click", SlideClickEventHandler);

            ResetCaptionSlider(true);

            _SelfSlideItem.$Image = _ImageItem;
            _SelfSlideItem.$Link = _LinkItem;

            _SelfSlideItem.$Item = slideElmt;

            _SelfSlideItem.$Wrapper = _Wrapper = slideElmt;
            $Jssor$.$AppendChild(_Wrapper, _LoadingScreen);

            _SelfSlider.$On(203, ParkEventHandler);
            _SelfSlider.$On(28, FreezeEventHandler);
            _SelfSlider.$On(24, SwipeStartEventHandler);

            $JssorDebug$.$Execute(function () {
                _SequenceNumber = _SlideItemCreatedCount++;
            });

            $JssorDebug$.$Execute(function () {
                $Jssor$.$Attribute(_Wrapper, "debug-id", "slide-" + slideIndex);
            });
        }
    }

    function Processor(slideElmt, slideIndex, slideshowProcessor, captionSliderIn, captionSliderOut) {

        var _SelfProcessor = this;

        var _ProgressBegin = 0;
        var _SlideshowBegin = 0;
        var _SlideshowEnd;
        var _CaptionInBegin;
        var _IdleBegin;
        var _IdleEnd;
        var _ProgressEnd;

        var _IsSlideshowRunning;
        var _IsRollingBack;

        var _PlayerInstance;
        var _IsPlayerOnService;

        var slideItem = _SlideItems[slideIndex];

        $JssorAnimator$.call(_SelfProcessor, 0, 0);

        function UpdateLink() {

            $Jssor$.$Empty(_LinkContainer);

            if (_ShowLink && _IsSlideshowRunning && slideItem.$Link) {
                $Jssor$.$AppendChild(_LinkContainer, slideItem.$Link);
            }

            $Jssor$.$ShowElement(_LinkContainer, !_IsSlideshowRunning && slideItem.$Image);
        }

        function ProcessCompleteEventHandler() {

            if (_IsRollingBack) {
                _IsRollingBack = false;
                _SelfSlider.$TriggerEvent($JssorSlider$.$EVT_ROLLBACK_END, slideIndex, _IdleEnd, _ProgressBegin, _IdleBegin, _IdleEnd, _ProgressEnd);
                _SelfProcessor.$GoToPosition(_IdleBegin);
            }

            _SelfProcessor.$Replay();
        }

        function PlayerSwitchEventHandler(isOnService) {
            _IsPlayerOnService = isOnService;

            _SelfProcessor.$Stop();
            _SelfProcessor.$Replay();
        }

        _SelfProcessor.$Replay = function () {

            var currentPosition = _SelfProcessor.$GetPosition_Display();

            if (!_IsDragging && !_IsSliding && !_IsPlayerOnService && _CurrentSlideIndex == slideIndex) {

                if (!currentPosition) {
                    if (_SlideshowEnd && !_IsSlideshowRunning) {
                        _IsSlideshowRunning = true;

                        _SelfProcessor.$OpenSlideshowPanel(true);

                        _SelfSlider.$TriggerEvent($JssorSlider$.$EVT_SLIDESHOW_START, slideIndex, _ProgressBegin, _SlideshowBegin, _SlideshowEnd, _ProgressEnd);
                    }

                    UpdateLink();
                }

                var toPosition;
                var stateEvent = $JssorSlider$.$EVT_STATE_CHANGE;

                if (currentPosition != _ProgressEnd) {
                    if (currentPosition == _IdleEnd) {
                        toPosition = _ProgressEnd;
                    }
                    else if (currentPosition == _IdleBegin) {
                        toPosition = _IdleEnd;
                    }
                    else if (!currentPosition) {
                        toPosition = _IdleBegin;
                    }
                    else if (currentPosition > _IdleEnd) {
                        _IsRollingBack = true;
                        toPosition = _IdleEnd;
                        stateEvent = $JssorSlider$.$EVT_ROLLBACK_START;
                    }
                    else {
                        toPosition = _SelfProcessor.$GetPlayToPosition();
                    }
                }

                _SelfSlider.$TriggerEvent(stateEvent, slideIndex, currentPosition, _ProgressBegin, _IdleBegin, _IdleEnd, _ProgressEnd);

                var allowAutoPlay = _AutoPlay && (!_HoverToPause || _NotOnHover);

                if (currentPosition == _ProgressEnd) {
                    (_IdleEnd != _ProgressEnd && !(_HoverToPause & 12) || allowAutoPlay) && slideItem.$GoForNextSlide();
                }
                else if (allowAutoPlay || currentPosition != _IdleEnd) {
                    _SelfProcessor.$PlayToPosition(toPosition, ProcessCompleteEventHandler);
                }
            }
        };

        _SelfProcessor.$AdjustIdleOnPark = function () {
            if (_IdleEnd == _ProgressEnd && _IdleEnd == _SelfProcessor.$GetPosition_Display())
                _SelfProcessor.$GoToPosition(_IdleBegin);
        };

        _SelfProcessor.$Abort = function () {
            _SlideshowRunner && _SlideshowRunner.$Index == slideIndex && _SlideshowRunner.$Clear();

            var currentPosition = _SelfProcessor.$GetPosition_Display();
            if (currentPosition < _ProgressEnd) {
                _SelfSlider.$TriggerEvent($JssorSlider$.$EVT_STATE_CHANGE, slideIndex, -currentPosition - 1, _ProgressBegin, _IdleBegin, _IdleEnd, _ProgressEnd);
            }
        };

        _SelfProcessor.$OpenSlideshowPanel = function (open) {
            if (slideshowProcessor) {
                $Jssor$.$CssOverflow(_SlideshowPanel, open && slideshowProcessor.$Transition.$Outside ? "" : "hidden");
            }
        };

        _SelfProcessor.$OnInnerOffsetChange = function (oldPosition, newPosition) {

            if (_IsSlideshowRunning && newPosition >= _SlideshowEnd) {
                _IsSlideshowRunning = false;
                UpdateLink();
                slideItem.$UnhideContentForSlideshow();
                _SlideshowRunner.$Clear();

                _SelfSlider.$TriggerEvent($JssorSlider$.$EVT_SLIDESHOW_END, slideIndex, _ProgressBegin, _SlideshowBegin, _SlideshowEnd, _ProgressEnd);
            }

            _SelfSlider.$TriggerEvent($JssorSlider$.$EVT_PROGRESS_CHANGE, slideIndex, newPosition, _ProgressBegin, _IdleBegin, _IdleEnd, _ProgressEnd);
        };

        _SelfProcessor.$SetPlayer = function (playerInstance) {
            if (playerInstance && !_PlayerInstance) {
                _PlayerInstance = playerInstance;

                playerInstance.$On($JssorPlayer$.$EVT_SWITCH, PlayerSwitchEventHandler);
            }
        };

        {
            if (slideshowProcessor) {
                _SelfProcessor.$Chain(slideshowProcessor);
            }

            _SlideshowEnd = _SelfProcessor.$GetPosition_OuterEnd();
            _CaptionInBegin = _SelfProcessor.$GetPosition_OuterEnd();
            _SelfProcessor.$Chain(captionSliderIn);
            _IdleBegin = captionSliderIn.$GetPosition_OuterEnd();
            _IdleEnd = _IdleBegin + ($Jssor$.$ParseFloat($Jssor$.$AttributeEx(slideElmt, "idle")) || _AutoPlayInterval);

            captionSliderOut.$Shift(_IdleEnd);
            _SelfProcessor.$Combine(captionSliderOut);
            _ProgressEnd = _SelfProcessor.$GetPosition_OuterEnd();
        }
    }
    
    function SetPosition(elmt, position) {
        var orientation = _DragOrientation > 0 ? _DragOrientation : _PlayOrientation;
        var x = _StepLengthX * position * (orientation & 1);
        var y = _StepLengthY * position * ((orientation >> 1) & 1);

        x = Math.round(x);
        y = Math.round(y);

        $Jssor$.$CssLeft(elmt, x);
        $Jssor$.$CssTop(elmt, y);
    }

    
    function RecordFreezePoint() {
        _CarouselPlaying_OnFreeze = _IsSliding;
        _PlayToPosition_OnFreeze = _CarouselPlayer.$GetPlayToPosition();
        _Position_OnFreeze = _Conveyor.$GetPosition();
    }

    function Freeze() {
        RecordFreezePoint();

        if (_IsDragging || !_NotOnHover && (_HoverToPause & 12)) {
            _CarouselPlayer.$Stop();

            _SelfSlider.$TriggerEvent($JssorSlider$.$EVT_FREEZE);
        }
    }

    function Unfreeze(byDrag) {

        if (!_IsDragging && (_NotOnHover || !(_HoverToPause & 12)) && !_CarouselPlayer.$IsPlaying()) {

            var currentPosition = _Conveyor.$GetPosition();
            var toPosition = Math.ceil(_Position_OnFreeze);

            if (byDrag && Math.abs(_DragOffsetTotal) >= _Options.$MinDragOffsetToSlide) {
                toPosition = Math.ceil(currentPosition);
                toPosition += _DragIndexAdjust;
            }

            if (!(_Loop & 1)) {
                toPosition = Math.min(_SlideCount - _DisplayPieces, Math.max(toPosition, 0));
            }

            var t = Math.abs(toPosition - currentPosition);
            t = 1 - Math.pow(1 - t, 5);

            if (!_LastDragSucceded && _CarouselPlaying_OnFreeze) {
                _CarouselPlayer.$Continue(_PlayToPosition_OnFreeze);
            }
            else if (currentPosition == toPosition) {
                _CurrentSlideItem.$EnablePlayer();
                _CurrentSlideItem.$TryActivate();
            }
            else {

                _CarouselPlayer.$PlayCarousel(currentPosition, toPosition, t * _SlideDuration);
            }
        }
    }

    function PreventDragSelectionEvent(event) {
        if (!$Jssor$.$AttributeEx($Jssor$.$EvtSrc(event), "nodrag")) {
            $Jssor$.$CancelEvent(event);
        }
    }

    function OnTouchStart(event) {
        OnDragStart(event, 1);
    }

    function OnDragStart(event, touch) {
        event = $Jssor$.$GetEvent(event);
        var eventSrc = $Jssor$.$EvtSrc(event);

        if (!_DragOrientationRegistered && !$Jssor$.$AttributeEx(eventSrc, "nodrag") && RegisterDrag() && (!touch || event.touches.length == 1)) {
            _IsDragging = true;
            _DragInvalid = false;
            _LoadingTicket = null;

            $Jssor$.$AddEvent(document, touch ? "touchmove" : "mousemove", OnDragMove);

            _LastTimeMoveByDrag = $Jssor$.$GetNow() - 50;

            _LastDragSucceded = 0;
            Freeze();

            if (!_CarouselPlaying_OnFreeze)
                _DragOrientation = 0;

            if (touch) {
                var touchPoint = event.touches[0];
                _DragStartMouseX = touchPoint.clientX;
                _DragStartMouseY = touchPoint.clientY;
            }
            else {
                var mousePoint = $Jssor$.$MousePosition(event);

                _DragStartMouseX = mousePoint.x;
                _DragStartMouseY = mousePoint.y;
            }

            _DragOffsetTotal = 0;
            _DragOffsetLastTime = 0;
            _DragIndexAdjust = 0;

            _SelfSlider.$TriggerEvent($JssorSlider$.$EVT_DRAG_START, GetRealIndex(_Position_OnFreeze), _Position_OnFreeze, event);
        }
    }

    function OnDragMove(event) {
        if (_IsDragging) {
            event = $Jssor$.$GetEvent(event);

            var actionPoint;

            if (event.type != "mousemove") {
                var touch = event.touches[0];
                actionPoint = { x: touch.clientX, y: touch.clientY };
            }
            else {
                actionPoint = $Jssor$.$MousePosition(event);
            }

            if (actionPoint) {
                var distanceX = actionPoint.x - _DragStartMouseX;
                var distanceY = actionPoint.y - _DragStartMouseY;


                if (Math.floor(_Position_OnFreeze) != _Position_OnFreeze)
                    _DragOrientation = _DragOrientation || (_PlayOrientation & _DragOrientationRegistered);

                if ((distanceX || distanceY) && !_DragOrientation) {
                    if (_DragOrientationRegistered == 3) {
                        if (Math.abs(distanceY) > Math.abs(distanceX)) {
                            _DragOrientation = 2;
                        }
                        else
                            _DragOrientation = 1;
                    }
                    else {
                        _DragOrientation = _DragOrientationRegistered;
                    }

                    if (_IsTouchDevice && _DragOrientation == 1 && Math.abs(distanceY) - Math.abs(distanceX) > 3) {
                        _DragInvalid = true;
                    }
                }

                if (_DragOrientation) {
                    var distance = distanceY;
                    var stepLength = _StepLengthY;

                    if (_DragOrientation == 1) {
                        distance = distanceX;
                        stepLength = _StepLengthX;
                    }

                    if (!(_Loop & 1)) {
                        if (distance > 0) {
                            var normalDistance = stepLength * _CurrentSlideIndex;
                            var sqrtDistance = distance - normalDistance;
                            if (sqrtDistance > 0) {
                                distance = normalDistance + Math.sqrt(sqrtDistance) * 5;
                            }
                        }

                        if (distance < 0) {
                            var normalDistance = stepLength * (_SlideCount - _DisplayPieces - _CurrentSlideIndex);
                            var sqrtDistance = -distance - normalDistance;

                            if (sqrtDistance > 0) {
                                distance = -normalDistance - Math.sqrt(sqrtDistance) * 5;
                            }
                        }
                    }

                    if (_DragOffsetTotal - _DragOffsetLastTime < -2) {
                        _DragIndexAdjust = 0;
                    }
                    else if (_DragOffsetTotal - _DragOffsetLastTime > 2) {
                        _DragIndexAdjust = -1;
                    }

                    _DragOffsetLastTime = _DragOffsetTotal;
                    _DragOffsetTotal = distance;
                    _PositionToGoByDrag = _Position_OnFreeze - _DragOffsetTotal / stepLength / (_ScaleRatio || 1);

                    if (_DragOffsetTotal && _DragOrientation && !_DragInvalid) {
                        $Jssor$.$CancelEvent(event);
                        if (!_IsSliding) {
                            _CarouselPlayer.$StandBy(_PositionToGoByDrag);
                        }
                        else
                            _CarouselPlayer.$SetStandByPosition(_PositionToGoByDrag);
                    }
                }
            }
        }
    }

    function OnDragEnd() {
        UnregisterDrag();

        if (_IsDragging) {

            _IsDragging = false;

            _LastTimeMoveByDrag = $Jssor$.$GetNow();

            $Jssor$.$RemoveEvent(document, "mousemove", OnDragMove);
            $Jssor$.$RemoveEvent(document, "touchmove", OnDragMove);

            _LastDragSucceded = _DragOffsetTotal;

            _CarouselPlayer.$Stop();

            var currentPosition = _Conveyor.$GetPosition();

            _SelfSlider.$TriggerEvent($JssorSlider$.$EVT_DRAG_END, GetRealIndex(currentPosition), currentPosition, GetRealIndex(_Position_OnFreeze), _Position_OnFreeze);

            (_HoverToPause & 12) && RecordFreezePoint();

            Unfreeze(true);
        }
    }

    function SlidesClickEventHandler(event) {
        if (_LastDragSucceded) {
            $Jssor$.$StopEvent(event);

            var checkElement = $Jssor$.$EvtSrc(event);
            while (checkElement && _SlidesContainer !== checkElement) {
                if (checkElement.tagName == "A") {
                    $Jssor$.$CancelEvent(event);
                }
                try {
                    checkElement = checkElement.parentNode;
                } catch (e) {
                  
                    break;
                }
            }
        }
    }

    function SetCurrentSlideIndex(index) {
        _PrevSlideItem = _SlideItems[_CurrentSlideIndex];
        _PreviousSlideIndex = _CurrentSlideIndex;
        _CurrentSlideIndex = GetRealIndex(index);
        _CurrentSlideItem = _SlideItems[_CurrentSlideIndex];
        ResetNavigator(index);
        return _CurrentSlideIndex;
    }

    function OnPark(slideIndex, prevIndex) {
        _DragOrientation = 0;

        SetCurrentSlideIndex(slideIndex);

        _SelfSlider.$TriggerEvent($JssorSlider$.$EVT_PARK, GetRealIndex(slideIndex), prevIndex);
    }

    function ResetNavigator(index, temp) {
        _TempSlideIndex = index;
        $Jssor$.$Each(_Navigators, function (navigator) {
            navigator.$SetCurrentIndex(GetRealIndex(index), index, temp);
        });
    }

    function RegisterDrag() {
        var dragRegistry = $JssorSlider$.$DragRegistry || 0;
        var dragOrientation = _DragEnabled;
        if (_IsTouchDevice)
            (dragOrientation & 1) && (dragOrientation &= 1);
        $JssorSlider$.$DragRegistry |= dragOrientation;

        return (_DragOrientationRegistered = dragOrientation & ~dragRegistry);
    }

    function UnregisterDrag() {
        if (_DragOrientationRegistered) {
            $JssorSlider$.$DragRegistry &= ~_DragEnabled;
            _DragOrientationRegistered = 0;
        }
    }

    function CreatePanel() {
        var div = $Jssor$.$CreateDiv();

        $Jssor$.$SetStyles(div, _StyleDef);
        $Jssor$.$CssPosition(div, "absolute");

        return div;
    }

    function GetRealIndex(index) {
        return (index % _SlideCount + _SlideCount) % _SlideCount;
    }

    function IsCurrentSlideIndex(index) {
        return GetRealIndex(index) == _CurrentSlideIndex;
    }

    function IsPreviousSlideIndex(index) {
        return GetRealIndex(index) == _PreviousSlideIndex;
    }

    function NavigationClickHandler(index, relative) {
        var toIndex = index;

        if (relative) {
            if (!_Loop) {
                toIndex = Math.min(Math.max(toIndex + _TempSlideIndex, 0), _SlideCount - _DisplayPieces);
                relative = false;
            }
            else if (_Loop & 2) {
                toIndex = GetRealIndex(toIndex + _TempSlideIndex);
                relative = false;
            }
        }
        else if (_Loop) {
            toIndex = _SelfSlider.$GetVirtualIndex(toIndex);
        }

        PlayTo(toIndex, _Options.$SlideDuration, relative);
    }

    function ShowNavigators() {
        $Jssor$.$Each(_Navigators, function (navigator) {
            navigator.$Show(navigator.$Options.$ChanceToShow <= _NotOnHover);
        });
    }

    function MainContainerMouseLeaveEventHandler() {
        if (!_NotOnHover) {


            _NotOnHover = 1;

            ShowNavigators();

            if (!_IsDragging) {
                (_HoverToPause & 12) && Unfreeze();
                (_HoverToPause & 3) && _SlideItems[_CurrentSlideIndex].$TryActivate();
            }
        }
    }

    function MainContainerMouseEnterEventHandler() {

        if (_NotOnHover) {


            _NotOnHover = 0;

            ShowNavigators();

            _IsDragging || !(_HoverToPause & 12) || Freeze();
        }
    }

    function AdjustSlidesContainerSize() {
        _StyleDef = { $Width: _SlideWidth, $Height: _SlideHeight, $Top: 0, $Left: 0 };

        $Jssor$.$Each(_SlideElmts, function (slideElmt, i) {

            $Jssor$.$SetStyles(slideElmt, _StyleDef);
            $Jssor$.$CssPosition(slideElmt, "absolute");
            $Jssor$.$CssOverflow(slideElmt, "hidden");

            $Jssor$.$HideElement(slideElmt);
        });

        $Jssor$.$SetStyles(_LoadingContainer, _StyleDef);
    }

    function PlayToOffset(offset, slideDuration) {
        PlayTo(offset, slideDuration, true);
    }

    function PlayTo(slideIndex, slideDuration, relative) {
       
        if (_CarouselEnabled && (!_IsDragging && (_NotOnHover || !(_HoverToPause & 12)) || _Options.$NaviQuitDrag)) {
            _IsSliding = true;
            _IsDragging = false;
            _CarouselPlayer.$Stop();

            {
                if (slideDuration == undefined)
                    slideDuration = _SlideDuration;

                var positionDisplay = _Carousel.$GetPosition_Display();
                var positionTo = slideIndex;
                if (relative) {
                    positionTo = positionDisplay + slideIndex;
                    if (slideIndex > 0)
                        positionTo = Math.ceil(positionTo);
                    else
                        positionTo = Math.floor(positionTo);
                }

                if (_Loop & 2) {
                    positionTo = GetRealIndex(positionTo);
                }
                if (!(_Loop & 1)) {
                    positionTo = Math.max(0, Math.min(positionTo, _SlideCount - _DisplayPieces));
                }

                var positionOffset = (positionTo - positionDisplay) % _SlideCount;
                positionTo = positionDisplay + positionOffset;

                var duration = positionDisplay == positionTo ? 0 : slideDuration * Math.abs(positionOffset);
                duration = Math.min(duration, slideDuration * _DisplayPieces * 1.5);

                _CarouselPlayer.$PlayCarousel(positionDisplay, positionTo, duration || 1);
            }
        }
    }

    _SelfSlider.$PlayTo = PlayTo;

    _SelfSlider.$GoTo = function (slideIndex) {
        
            _Conveyor.$GoToPosition(slideIndex);
    };

    _SelfSlider.$Next = function () {
    
        PlayToOffset(1);
    };

    _SelfSlider.$Prev = function () {
       
        PlayToOffset(-1);
    };

    _SelfSlider.$Pause = function () {
        
        _AutoPlay = false;
    };

    _SelfSlider.$Play = function () {
       
        if (!_AutoPlay) {
            _AutoPlay = true;
            _SlideItems[_CurrentSlideIndex] && _SlideItems[_CurrentSlideIndex].$TryActivate();
        }
    };

    _SelfSlider.$SetSlideshowTransitions = function (transitions) {
        
        $JssorDebug$.$Execute(function () {
            if (!transitions || !transitions.length) {
                $JssorDebug$.$Error("Can not set slideshow transitions, no transitions specified.");
            }
        });

        _Options.$SlideshowOptions.$Transitions = transitions;
    };

    _SelfSlider.$SetCaptionTransitions = function (transitions) {
      
        $JssorDebug$.$Execute(function () {
            if (!transitions || !transitions.length) {
                $JssorDebug$.$Error("Can not set caption transitions, no transitions specified");
            }
        });

        _CaptionSliderOptions.$CaptionTransitions = transitions;
        _CaptionSliderOptions.$Version = $Jssor$.$GetNow();
    };

    _SelfSlider.$SlidesCount = function () {
       
        return _SlideElmts.length;
    };

    _SelfSlider.$CurrentIndex = function () {
       
        return _CurrentSlideIndex;
    };

    _SelfSlider.$IsAutoPlaying = function () {
       
        return _AutoPlay;
    };

    _SelfSlider.$IsDragging = function () {
       
        return _IsDragging;
    };

    _SelfSlider.$IsSliding = function () {
       
        return _IsSliding;
    };

    _SelfSlider.$IsMouseOver = function () {
        
        return !_NotOnHover;
    };

    _SelfSlider.$LastDragSucceded = function () {
       
        return _LastDragSucceded;
    };

    function OriginalWidth() {
      
        return $Jssor$.$CssWidth(_ScaleWrapper || elmt);
    }

    function OriginalHeight() {
       
        return $Jssor$.$CssHeight(_ScaleWrapper || elmt);
    }

    _SelfSlider.$OriginalWidth = _SelfSlider.$GetOriginalWidth = OriginalWidth;

    _SelfSlider.$OriginalHeight = _SelfSlider.$GetOriginalHeight = OriginalHeight;

    function Scale(dimension, isHeight) {
       

        if (dimension == undefined)
            return $Jssor$.$CssWidth(elmt);

        if (!_ScaleWrapper) {
            $JssorDebug$.$Execute(function () {
                var originalWidthStr = $Jssor$.$Css(elmt, "width");
                var originalHeightStr = $Jssor$.$Css(elmt, "height");
                var originalWidth = $Jssor$.$CssP(elmt, "width");
                var originalHeight = $Jssor$.$CssP(elmt, "height");

                if (!originalWidthStr || originalWidthStr.indexOf("px") == -1) {
                    $JssorDebug$.$Fail("Cannot scale jssor slider, 'width' of 'outer container' not specified. Please specify 'width' in pixel. e.g. 'width: 600px;'");
                }

                if (!originalHeightStr || originalHeightStr.indexOf("px") == -1) {
                    $JssorDebug$.$Fail("Cannot scale jssor slider, 'height' of 'outer container' not specified. Please specify 'height' in pixel. e.g. 'height: 300px;'");
                }

                if (originalWidthStr.indexOf('%') != -1) {
                    $JssorDebug$.$Fail("Cannot scale jssor slider, 'width' of 'outer container' not valid. Please specify 'width' in pixel. e.g. 'width: 600px;'");
                }

                if (originalHeightStr.indexOf('%') != -1) {
                    $JssorDebug$.$Fail("Cannot scale jssor slider, 'height' of 'outer container' not valid. Please specify 'height' in pixel. e.g. 'height: 300px;'");
                }

                if (!originalWidth) {
                    $JssorDebug$.$Fail("Cannot scale jssor slider, 'width' of 'outer container' not valid. 'width' of 'outer container' should be positive number. e.g. 'width: 600px;'");
                }

                if (!originalHeight) {
                    $JssorDebug$.$Fail("Cannot scale jssor slider, 'height' of 'outer container' not valid. 'height' of 'outer container' should be positive number. e.g. 'height: 300px;'");
                }
            });

            var innerWrapper = $Jssor$.$CreateDiv(document);
            $Jssor$.$ClassName(innerWrapper, $Jssor$.$ClassName(elmt));
            $Jssor$.$CssCssText(innerWrapper, $Jssor$.$CssCssText(elmt));
            $Jssor$.$CssDisplay(innerWrapper, "block");

            $Jssor$.$CssPosition(innerWrapper, "relative");
            $Jssor$.$CssTop(innerWrapper, 0);
            $Jssor$.$CssLeft(innerWrapper, 0);
            $Jssor$.$CssOverflow(innerWrapper, "visible");

            _ScaleWrapper = $Jssor$.$CreateDiv(document);

            $Jssor$.$CssPosition(_ScaleWrapper, "absolute");
            $Jssor$.$CssTop(_ScaleWrapper, 0);
            $Jssor$.$CssLeft(_ScaleWrapper, 0);
            $Jssor$.$CssWidth(_ScaleWrapper, $Jssor$.$CssWidth(elmt));
            $Jssor$.$CssHeight(_ScaleWrapper, $Jssor$.$CssHeight(elmt));
            $Jssor$.$SetStyleTransformOrigin(_ScaleWrapper, "0 0");

            $Jssor$.$AppendChild(_ScaleWrapper, innerWrapper);

            var children = $Jssor$.$Children(elmt);
            $Jssor$.$AppendChild(elmt, _ScaleWrapper);

            $Jssor$.$Css(elmt, "backgroundImage", "");

           

            $Jssor$.$Each(children, function (child) {
                $Jssor$.$AppendChild($Jssor$.$AttributeEx(child, "noscale") ? elmt : innerWrapper, child);
               
            });
        }

        $JssorDebug$.$Execute(function () {
            if (!dimension || dimension < 0) {
                $JssorDebug$.$Fail("'$ScaleWidth' error, 'dimension' should be positive value.");
            }
        });

        $JssorDebug$.$Execute(function () {
            if (!_InitialScrollWidth) {
                _InitialScrollWidth = _SelfSlider.$Elmt.scrollWidth;
            }
        });

        _ScaleRatio = dimension / (isHeight ? $Jssor$.$CssHeight : $Jssor$.$CssWidth)(_ScaleWrapper);
        $Jssor$.$CssScale(_ScaleWrapper, _ScaleRatio);

        var scaleWidth = isHeight ? (_ScaleRatio * OriginalWidth()) : dimension;
        var scaleHeight = isHeight ? dimension : (_ScaleRatio * OriginalHeight());

        $Jssor$.$CssWidth(elmt, scaleWidth);
        $Jssor$.$CssHeight(elmt, scaleHeight);

        $Jssor$.$Each(_Navigators, function (navigator) {
            navigator.$Relocate(scaleWidth, scaleHeight);
        });
    }

    _SelfSlider.$ScaleHeight = _SelfSlider.$GetScaleHeight = function (height) {
      

        if (height == undefined)
            return $Jssor$.$CssHeight(elmt);

        Scale(height, true);
    };

    _SelfSlider.$ScaleWidth = _SelfSlider.$SetScaleWidth = _SelfSlider.$GetScaleWidth = Scale;

    _SelfSlider.$GetVirtualIndex = function (index) {
        var parkingIndex = Math.ceil(GetRealIndex(_ParkingPosition / _StepLength));
        var displayIndex = GetRealIndex(index - _TempSlideIndex + parkingIndex);

        if (displayIndex > _DisplayPieces) {
            if (index - _TempSlideIndex > _SlideCount / 2)
                index -= _SlideCount;
            else if (index - _TempSlideIndex <= -_SlideCount / 2)
                index += _SlideCount;
        }
        else {
            index = _TempSlideIndex + displayIndex - parkingIndex;
        }

        return index;
    };

   

    $JssorObject$.call(_SelfSlider);

    $JssorDebug$.$Execute(function () {
        var outerContainerElmt = $Jssor$.$GetElement(elmt);
        if (!outerContainerElmt)
            $JssorDebug$.$Fail("Outer container '" + elmt + "' not found.");
    });

    _SelfSlider.$Elmt = elmt = $Jssor$.$GetElement(elmt);

    var _InitialScrollWidth;   
    var _CaptionSliderCount = 1;  

    var _Options = $Jssor$.$Extend({
        $FillMode: 0,                   
        $LazyLoading: 1,               
        $StartIndex: 0,                 
        $AutoPlay: false,
        $Loop: 1,   
        $HWA: true,               
        $NaviQuitDrag: true,
        $AutoPlaySteps: 1,             
        $AutoPlayInterval: 3000,      
        $PauseOnHover: 1,              

        $SlideDuration: 500, 
        $SlideEasing: $JssorEasing$.$EaseOutQuad,
        $MinDragOffsetToSlide: 20, 
        $SlideSpacing: 0, 	
        $DisplayPieces: 1,              
        $ParkingPosition: 0,            
        $UISearchMode: 1,               
        $PlayOrientation: 1,            
        $DragOrientation: 1             

    }, options);

    if (_Options.$Idle != undefined)
        _Options.$AutoPlayInterval = _Options.$Idle;

    if (_Options.$Cols != undefined)
        _Options.$DisplayPieces = _Options.$Cols;

    $JssorDebug$.$Execute(function () {
        _Options = $Jssor$.$Extend({
            $ArrowKeyNavigation: undefined,
            $SlideWidth: undefined,
            $SlideHeight: undefined,
            $SlideshowOptions: undefined,
            $CaptionSliderOptions: undefined,
            $BulletNavigatorOptions: undefined,
            $ArrowNavigatorOptions: undefined,
            $ThumbnailNavigatorOptions: undefined
        },
        _Options);
    });

    var _PlayOrientation = _Options.$PlayOrientation & 3;
    var _PlayReverse = (_Options.$PlayOrientation & 4) / -4 || 1;

    var _SlideshowOptions = _Options.$SlideshowOptions;
    var _CaptionSliderOptions = $Jssor$.$Extend({ $Class: $JssorCaptionSliderBase$, $PlayInMode: 1, $PlayOutMode: 1 }, _Options.$CaptionSliderOptions);
    var _BulletNavigatorOptions = _Options.$BulletNavigatorOptions;
    var _ArrowNavigatorOptions = _Options.$ArrowNavigatorOptions;
    var _ThumbnailNavigatorOptions = _Options.$ThumbnailNavigatorOptions;

    $JssorDebug$.$Execute(function () {
        if (_SlideshowOptions && !_SlideshowOptions.$Class) {
            $JssorDebug$.$Fail("Option $SlideshowOptions error, class not specified.");
        }
    });

    $JssorDebug$.$Execute(function () {
        if (_Options.$CaptionSliderOptions && !_Options.$CaptionSliderOptions.$Class) {
            $JssorDebug$.$Fail("Option $CaptionSliderOptions error, class not specified.");
        }
    });

    $JssorDebug$.$Execute(function () {
        if (_BulletNavigatorOptions && !_BulletNavigatorOptions.$Class) {
            $JssorDebug$.$Fail("Option $BulletNavigatorOptions error, class not specified.");
        }
    });

    $JssorDebug$.$Execute(function () {
        if (_ArrowNavigatorOptions && !_ArrowNavigatorOptions.$Class) {
            $JssorDebug$.$Fail("Option $ArrowNavigatorOptions error, class not specified.");
        }
    });

    $JssorDebug$.$Execute(function () {
        if (_ThumbnailNavigatorOptions && !_ThumbnailNavigatorOptions.$Class) {
            $JssorDebug$.$Fail("Option $ThumbnailNavigatorOptions error, class not specified.");
        }
    });

    var _UISearchNoDeep = !_Options.$UISearchMode;
    var _ScaleWrapper;
    var _SlidesContainer = $Jssor$.$FindChild(elmt, "slides", _UISearchNoDeep);
    var _LoadingContainer = $Jssor$.$FindChild(elmt, "loading", _UISearchNoDeep) || $Jssor$.$CreateDiv(document);

    var _BulletNavigatorContainer = $Jssor$.$FindChild(elmt, "navigator", _UISearchNoDeep);

    var _ArrowLeft = $Jssor$.$FindChild(elmt, "arrowleft", _UISearchNoDeep);
    var _ArrowRight = $Jssor$.$FindChild(elmt, "arrowright", _UISearchNoDeep);

    var _ThumbnailNavigatorContainer = $Jssor$.$FindChild(elmt, "thumbnavigator", _UISearchNoDeep);

    $JssorDebug$.$Execute(function () {
        if (_BulletNavigatorContainer && !_BulletNavigatorOptions) {
            throw new Error("Bullet navigator container defined but $BulletNavigatorOptions not specified.");
        }

        if ((_ArrowLeft || _ArrowRight) && !_ArrowNavigatorOptions) {
            throw new Error("arrowleft or arrowright defined, but $ArrowNavigatorOptions not specified.");
        }

        if (_ThumbnailNavigatorContainer && !_ThumbnailNavigatorOptions) {
            throw new Error("Thumbnail navigator container defined, but $ThumbnailNavigatorOptions not specified.");
        }
    });

    var _SlidesContainerWidth = $Jssor$.$CssWidth(_SlidesContainer);
    var _SlidesContainerHeight = $Jssor$.$CssHeight(_SlidesContainer);

    $JssorDebug$.$Execute(function () {
        if (isNaN(_SlidesContainerWidth))
            $JssorDebug$.$Fail("Width of slides container wrong specification, it should be specified in pixel (like style='width: 600px;').");

        if (_SlidesContainerWidth == undefined)
            $JssorDebug$.$Fail("Width of slides container not specified, it should be specified in pixel (like style='width: 600px;').");

        if (isNaN(_SlidesContainerHeight))
            $JssorDebug$.$Fail("Height of slides container wrong specification, it should be specified in pixel (like style='height: 300px;').");

        if (_SlidesContainerHeight == undefined)
            $JssorDebug$.$Fail("Height of slides container not specified, it should be specified in pixel (like style='height: 300px;').");

        var slidesContainerOverflow = $Jssor$.$CssOverflow(_SlidesContainer);
        var slidesContainerOverflowX = $Jssor$.$Css(_SlidesContainer, "overflowX");
        var slidesContainerOverflowY = $Jssor$.$Css(_SlidesContainer, "overflowY");
        if (slidesContainerOverflow != "hidden" && (slidesContainerOverflowX != "hidden" || slidesContainerOverflowY != "hidden"))
            $JssorDebug$.$Fail("Overflow of slides container wrong specification, it should be specified as 'hidden' (style='overflow:hidden;').");
    });

    $JssorDebug$.$Execute(function () {
        if (!$Jssor$.$IsNumeric(_Options.$DisplayPieces))
            $JssorDebug$.$Fail("Option $DisplayPieces error, it should be a numeric value and greater than or equal to 1.");

        if (_Options.$DisplayPieces < 1)
            $JssorDebug$.$Fail("Option $DisplayPieces error, it should be greater than or equal to 1.");

        if (_Options.$DisplayPieces > 1 && _Options.$DragOrientation && _Options.$DragOrientation != _PlayOrientation)
            $JssorDebug$.$Fail("Option $DragOrientation error, it should be 0 or the same of $PlayOrientation when $DisplayPieces is greater than 1.");

        if (!$Jssor$.$IsNumeric(_Options.$ParkingPosition))
            $JssorDebug$.$Fail("Option $ParkingPosition error, it should be a numeric value.");

        if (_Options.$ParkingPosition && _Options.$DragOrientation && _Options.$DragOrientation != _PlayOrientation)
            $JssorDebug$.$Fail("Option $DragOrientation error, it should be 0 or the same of $PlayOrientation when $ParkingPosition is not equal to 0.");
    });

    var _StyleDef;

    var _SlideElmts = [];

    {
        var slideElmts = $Jssor$.$Children(_SlidesContainer);
        $Jssor$.$Each(slideElmts, function (slideElmt) {
            if (slideElmt.tagName == "DIV" && !$Jssor$.$AttributeEx(slideElmt, "u")) {
                _SlideElmts.push(slideElmt);
            }
            else if ($Jssor$.$IsBrowserIe9Earlier()) {
                $Jssor$.$CssZIndex(slideElmt, ($Jssor$.$CssZIndex(slideElmt) || 0) + 1);
            }
        });
    }

    $JssorDebug$.$Execute(function () {
        if (_SlideElmts.length < 1) {
            $JssorDebug$.$Error("Slides html code definition error, there must be at least 1 slide to initialize a slider.");
        }
    });

    var _SlideItemCreatedCount = 0; 
    var _SlideItemReleasedCount = 0;
    var _PreviousSlideIndex;
    var _CurrentSlideIndex = -1;
    var _TempSlideIndex;
    var _PrevSlideItem;
    var _CurrentSlideItem;
    var _SlideCount = _SlideElmts.length;

    var _SlideWidth = _Options.$SlideWidth || _SlidesContainerWidth;
    var _SlideHeight = _Options.$SlideHeight || _SlidesContainerHeight;

    var _SlideSpacing = _Options.$SlideSpacing;
    var _StepLengthX = _SlideWidth + _SlideSpacing;
    var _StepLengthY = _SlideHeight + _SlideSpacing;
    var _StepLength = (_PlayOrientation & 1) ? _StepLengthX : _StepLengthY;
    var _DisplayPieces = Math.min(_Options.$DisplayPieces, _SlideCount);

    var _SlideshowPanel;
    var _CurrentBoardIndex = 0;
    var _DragOrientation;
    var _DragOrientationRegistered;
    var _DragInvalid;

    var _Navigators = [];
    var _BulletNavigator;
    var _ArrowNavigator;
    var _ThumbnailNavigator;

    var _ShowLink;

    var _Frozen;
    var _AutoPlay;
    var _AutoPlaySteps = _Options.$AutoPlaySteps;
    var _HoverToPause = _Options.$PauseOnHover;
    var _AutoPlayInterval = _Options.$AutoPlayInterval;
    var _SlideDuration = _Options.$SlideDuration;

    var _SlideshowRunnerClass;
    var _TransitionsOrder;

    var _SlideshowEnabled;
    var _ParkingPosition;
    var _CarouselEnabled = _DisplayPieces < _SlideCount;
    var _Loop = _CarouselEnabled ? _Options.$Loop : 0;

    var _DragEnabled;
    var _LastDragSucceded;

    var _NotOnHover = 1;  
    var _IsSliding;
    var _IsDragging;
    var _LoadingTicket;

  
    var _DragStartMouseX = 0;
   
    var _DragStartMouseY = 0;
    var _DragOffsetTotal;
    var _DragOffsetLastTime;
    var _DragIndexAdjust;

    var _Carousel;
    var _Conveyor;
    var _Slideshow;
    var _CarouselPlayer;
    var _SlideContainer = new SlideContainer();
    var _ScaleRatio;

    {
        _AutoPlay = _Options.$AutoPlay;
        _SelfSlider.$Options = options;

        AdjustSlidesContainerSize();

        $Jssor$.$Attribute(elmt, "jssor-slider", true);

        $Jssor$.$CssZIndex(_SlidesContainer, $Jssor$.$CssZIndex(_SlidesContainer) || 0);
        $Jssor$.$CssPosition(_SlidesContainer, "absolute");
        _SlideshowPanel = $Jssor$.$CloneNode(_SlidesContainer, true);
        $Jssor$.$InsertBefore(_SlideshowPanel, _SlidesContainer);

        if (_SlideshowOptions) {
            _ShowLink = _SlideshowOptions.$ShowLink;
            _SlideshowRunnerClass = _SlideshowOptions.$Class;

            $JssorDebug$.$Execute(function () {
                if (!_SlideshowOptions.$Transitions || !_SlideshowOptions.$Transitions.length) {
                    $JssorDebug$.$Error("Invalid '$SlideshowOptions', no '$Transitions' specified.");
                }
            });

            _SlideshowEnabled = _DisplayPieces == 1 && _SlideCount > 1 && _SlideshowRunnerClass && (!$Jssor$.$IsBrowserIE() || $Jssor$.$BrowserVersion() >= 8);
        }

        _ParkingPosition = (_SlideshowEnabled || _DisplayPieces >= _SlideCount || !(_Loop & 1)) ? 0 : _Options.$ParkingPosition;

        _DragEnabled = ((_DisplayPieces > 1 || _ParkingPosition) ? _PlayOrientation : -1) & _Options.$DragOrientation;


        var _SlideboardElmt = _SlidesContainer;
        var _SlideItems = [];

        var _SlideshowRunner;
        var _LinkContainer;

        var _Device = $Jssor$.$Device();
        var _IsTouchDevice = _Device.$Touchable;

        var _LastTimeMoveByDrag;
        var _Position_OnFreeze;
        var _CarouselPlaying_OnFreeze;
        var _PlayToPosition_OnFreeze;
        var _PositionToGoByDrag;

        {
            if (_Device.$TouchActionAttr) {
                $Jssor$.$Css(_SlideboardElmt, _Device.$TouchActionAttr, [null, "pan-y", "pan-x", "none"][_DragEnabled] || "");
            }

            _Slideshow = new Slideshow();

            if (_SlideshowEnabled)
                _SlideshowRunner = new _SlideshowRunnerClass(_SlideContainer, _SlideWidth, _SlideHeight, _SlideshowOptions, _IsTouchDevice);

            $Jssor$.$AppendChild(_SlideshowPanel, _Slideshow.$Wrapper);
            $Jssor$.$CssOverflow(_SlidesContainer, "hidden");

            {
                _LinkContainer = CreatePanel();
                $Jssor$.$Css(_LinkContainer, "backgroundColor", "#000");
                $Jssor$.$CssOpacity(_LinkContainer, 0);
                $Jssor$.$InsertBefore(_LinkContainer, _SlideboardElmt.firstChild, _SlideboardElmt);
            }

            for (var i = 0; i < _SlideElmts.length; i++) {
                var slideElmt = _SlideElmts[i];
                var slideItem = new SlideItem(slideElmt, i);
                _SlideItems.push(slideItem);
            }

            $Jssor$.$HideElement(_LoadingContainer);

            $JssorDebug$.$Execute(function () {
                $Jssor$.$Attribute(_LoadingContainer, "debug-id", "loading-container");
            });

            _Carousel = new Carousel();
            _CarouselPlayer = new CarouselPlayer(_Carousel, _Slideshow);

            $JssorDebug$.$Execute(function () {
                $Jssor$.$Attribute(_SlideboardElmt, "debug-id", "slide-board");
            });

            if (_DragEnabled) {
                $Jssor$.$AddEvent(_SlidesContainer, "mousedown", OnDragStart);
                $Jssor$.$AddEvent(_SlidesContainer, "touchstart", OnTouchStart);
                $Jssor$.$AddEvent(_SlidesContainer, "dragstart", PreventDragSelectionEvent);
                $Jssor$.$AddEvent(_SlidesContainer, "selectstart", PreventDragSelectionEvent);
                $Jssor$.$AddEvent(document, "mouseup", OnDragEnd);
                $Jssor$.$AddEvent(document, "touchend", OnDragEnd);
                $Jssor$.$AddEvent(document, "touchcancel", OnDragEnd);
                $Jssor$.$AddEvent(window, "blur", OnDragEnd);
            }
        }

        _HoverToPause &= (_IsTouchDevice ? 10 : 5);

        if (_BulletNavigatorContainer && _BulletNavigatorOptions) {
            _BulletNavigator = new _BulletNavigatorOptions.$Class(_BulletNavigatorContainer, _BulletNavigatorOptions, OriginalWidth(), OriginalHeight());
            _Navigators.push(_BulletNavigator);
        }

        if (_ArrowNavigatorOptions && _ArrowLeft && _ArrowRight) {
            _ArrowNavigatorOptions.$Loop = _Loop;
            _ArrowNavigatorOptions.$DisplayPieces = _DisplayPieces;
            _ArrowNavigator = new _ArrowNavigatorOptions.$Class(_ArrowLeft, _ArrowRight, _ArrowNavigatorOptions, OriginalWidth(), OriginalHeight());
            _Navigators.push(_ArrowNavigator);
        }

        if (_ThumbnailNavigatorContainer && _ThumbnailNavigatorOptions) {
            _ThumbnailNavigatorOptions.$StartIndex = _Options.$StartIndex;
            _ThumbnailNavigator = new _ThumbnailNavigatorOptions.$Class(_ThumbnailNavigatorContainer, _ThumbnailNavigatorOptions);
            _Navigators.push(_ThumbnailNavigator);
        }

        $Jssor$.$Each(_Navigators, function (navigator) {
            navigator.$Reset(_SlideCount, _SlideItems, _LoadingContainer);
            navigator.$On($JssorNavigatorEvents$.$NAVIGATIONREQUEST, NavigationClickHandler);
        });

        Scale(OriginalWidth());

        $Jssor$.$AddEvent(_SlidesContainer, "click", SlidesClickEventHandler);
        $Jssor$.$AddEvent(elmt, "mouseout", $Jssor$.$MouseOverOutFilter(MainContainerMouseLeaveEventHandler, elmt));
        $Jssor$.$AddEvent(elmt, "mouseover", $Jssor$.$MouseOverOutFilter(MainContainerMouseEnterEventHandler, elmt));

        ShowNavigators();

        if (_Options.$ArrowKeyNavigation) {
            $Jssor$.$AddEvent(document, "keydown", function (e) {
                if (e.keyCode == 37/*$JssorKeyCode$.$LEFT*/) {
                    PlayToOffset(-1);
                }
                else if (e.keyCode == 39/*$JssorKeyCode$.$RIGHT*/) {
                    PlayToOffset(1);
                }
            });
        }

        var startPosition = _Options.$StartIndex;
        if (!(_Loop & 1)) {
            startPosition = Math.max(0, Math.min(startPosition, _SlideCount - _DisplayPieces));
        }
        _CarouselPlayer.$PlayCarousel(startPosition, startPosition, 0);
    }
};
var $JssorSlideo$ = window.$JssorSlideo$ = $JssorSlider$;

$JssorSlider$.$EVT_CLICK = 21;
$JssorSlider$.$EVT_DRAG_START = 22;
$JssorSlider$.$EVT_DRAG_END = 23;
$JssorSlider$.$EVT_SWIPE_START = 24;
$JssorSlider$.$EVT_SWIPE_END = 25;

$JssorSlider$.$EVT_LOAD_START = 26;
$JssorSlider$.$EVT_LOAD_END = 27;
$JssorSlider$.$EVT_FREEZE = 28;

$JssorSlider$.$EVT_POSITION_CHANGE = 202;
$JssorSlider$.$EVT_PARK = 203;

$JssorSlider$.$EVT_SLIDESHOW_START = 206;
$JssorSlider$.$EVT_SLIDESHOW_END = 207;

$JssorSlider$.$EVT_PROGRESS_CHANGE = 208;
$JssorSlider$.$EVT_STATE_CHANGE = 209;
$JssorSlider$.$EVT_ROLLBACK_START = 210;
$JssorSlider$.$EVT_ROLLBACK_END = 211;


var $JssorNavigatorEvents$ = {
    $NAVIGATIONREQUEST: 1,
    $INDEXCHANGE: 2,
    $RESET: 3
};



var $JssorArrowNavigator$ = window.$JssorArrowNavigator$ = function (arrowLeft, arrowRight, options, containerWidth, containerHeight) {
    var self = this;
    $JssorObject$.call(self);

    $JssorDebug$.$Execute(function () {

        if (!arrowLeft)
            $JssorDebug$.$Fail("Option '$ArrowNavigatorOptions' spepcified, but UI 'arrowleft' not defined. Define 'arrowleft' to enable direct navigation, or remove option '$ArrowNavigatorOptions' to disable direct navigation.");

        if (!arrowRight)
            $JssorDebug$.$Fail("Option '$ArrowNavigatorOptions' spepcified, but UI 'arrowright' not defined. Define 'arrowright' to enable direct navigation, or remove option '$ArrowNavigatorOptions' to disable direct navigation.");

        if (isNaN($Jssor$.$CssWidth(arrowLeft))) {
            $JssorDebug$.$Fail("Width of 'arrow left' not specified.");
        }

        if (isNaN($Jssor$.$CssWidth(arrowRight))) {
            $JssorDebug$.$Fail("Width of 'arrow right' not specified.");
        }

        if (isNaN($Jssor$.$CssHeight(arrowLeft))) {
            $JssorDebug$.$Fail("Height of 'arrow left' not specified.");
        }

        if (isNaN($Jssor$.$CssHeight(arrowRight))) {
            $JssorDebug$.$Fail("Height of 'arrow right' not specified.");
        }
    });

    var _Hide;
    var _Length;
    var _CurrentIndex;
    var _Options;
    var _Steps;
    var _ArrowWidth = $Jssor$.$CssWidth(arrowLeft);
    var _ArrowHeight = $Jssor$.$CssHeight(arrowLeft);

    function OnNavigationRequest(steps) {
        self.$TriggerEvent($JssorNavigatorEvents$.$NAVIGATIONREQUEST, steps, true);
    }

    function ShowArrows(hide) {
        $Jssor$.$ShowElement(arrowLeft, hide || !options.$Loop && _CurrentIndex == 0);
        $Jssor$.$ShowElement(arrowRight, hide || !options.$Loop && _CurrentIndex >= _Length - options.$DisplayPieces);

        _Hide = hide;
    }

    self.$GetCurrentIndex = function () {
        return _CurrentIndex;
    };

    self.$SetCurrentIndex = function (index, virtualIndex, temp) {
        if (temp) {
            _CurrentIndex = virtualIndex;
        }
        else {
            _CurrentIndex = index;

            ShowArrows(_Hide);
        }
    };

    self.$Show = ShowArrows;

    var _Located;
    self.$Relocate = function (conainerWidth, containerHeight) {
        if (!_Located || _Options.$Scale == false) {

            var containerWidth = $Jssor$.$ParentNode(arrowLeft).clientWidth;
            var containerHeight = $Jssor$.$ParentNode(arrowLeft).clientHeight;

            if (_Options.$AutoCenter & 1) {
                $Jssor$.$CssLeft(arrowLeft, (containerWidth - _ArrowWidth) / 2);
                $Jssor$.$CssLeft(arrowRight, (containerWidth - _ArrowWidth) / 2);
            }

            if (_Options.$AutoCenter & 2) {
                $Jssor$.$CssTop(arrowLeft, (containerHeight - _ArrowHeight) / 2);
                $Jssor$.$CssTop(arrowRight, (containerHeight - _ArrowHeight) / 2);
            }

            _Located = true;
        }
    };

    var _Initialized;
    self.$Reset = function (length) {
        _Length = length;
        _CurrentIndex = 0;

        if (!_Initialized) {

            $Jssor$.$AddEvent(arrowLeft, "click", $Jssor$.$CreateCallback(null, OnNavigationRequest, -_Steps));
            $Jssor$.$AddEvent(arrowRight, "click", $Jssor$.$CreateCallback(null, OnNavigationRequest, _Steps));

            $Jssor$.$Buttonize(arrowLeft);
            $Jssor$.$Buttonize(arrowRight);

            _Initialized = true;
        }

    };

    {
        self.$Options = _Options = $Jssor$.$Extend({
            $Steps: 1
        }, options);

        _Steps = _Options.$Steps;

        if (_Options.$Scale == false) {
            $Jssor$.$Attribute(arrowLeft, "noscale", true);
            $Jssor$.$Attribute(arrowRight, "noscale", true);
        }
    }
};



function $JssorCaptionSliderBase$() {
    $JssorAnimator$.call(this, 0, 0);
    this.$Revert = $Jssor$.$EmptyFunction;
}

var $JssorCaptionSlider$ = window.$JssorCaptionSlider$ = function (container, captionSlideOptions, playIn) {
    $JssorDebug$.$Execute(function () {
        if (!captionSlideOptions.$CaptionTransitions) {
            $JssorDebug$.$Error("'$CaptionSliderOptions' option error, '$CaptionSliderOptions.$CaptionTransitions' not specified.");
        }
    });

    var _Self = this;
    var _ImmediateOutCaptionHanger;
    var _PlayMode = playIn ? captionSlideOptions.$PlayInMode : captionSlideOptions.$PlayOutMode;

    var _CaptionTransitions = captionSlideOptions.$CaptionTransitions;
    var _CaptionTuningFetcher = { $Transition: "t", $Delay: "d", $Duration: "du", x: "x", y: "y", $Rotate: "r", $Zoom: "z", $Opacity: "f", $BeginTime: "b" };
    var _CaptionTuningTransfer = {
        $Default: function (value, tuningValue) {
            if (!isNaN(tuningValue.$Value))
                value = tuningValue.$Value;
            else
                value *= tuningValue.$Percent;

            return value;
        },
        $Opacity: function (value, tuningValue) {
            return this.$Default(value - 1, tuningValue);
        }
    };
    _CaptionTuningTransfer.$Zoom = _CaptionTuningTransfer.$Opacity;

    $JssorAnimator$.call(_Self, 0, 0);

    function GetCaptionItems(element, level) {

        var itemsToPlay = [];
        var lastTransitionName;
        var namedTransitions = [];
        var namedTransitionOrders = [];

        function FetchRawTransition(captionElmt, index) {
            var rawTransition = {};

            $Jssor$.$Each(_CaptionTuningFetcher, function (fetchAttribute, fetchProperty) {
                var attributeValue = $Jssor$.$AttributeEx(captionElmt, fetchAttribute + (index || ""));
                if (attributeValue) {
                    var propertyValue = {};

                    if (fetchAttribute == "t") {
                        propertyValue.$Value = attributeValue;
                    }
                    else if (attributeValue.indexOf("%") + 1)
                        propertyValue.$Percent = $Jssor$.$ParseFloat(attributeValue) / 100;
                    else
                        propertyValue.$Value = $Jssor$.$ParseFloat(attributeValue);

                    rawTransition[fetchProperty] = propertyValue;
                }
            });

            return rawTransition;
        }

        function GetRandomTransition() {
            return _CaptionTransitions[Math.floor(Math.random() * _CaptionTransitions.length)];
        }

        function EvaluateCaptionTransition(transitionName) {

            var transition;

            if (transitionName == "*") {
                transition = GetRandomTransition();
            }
            else if (transitionName) {

                
                var tempTransition = _CaptionTransitions[$Jssor$.$ParseInt(transitionName)] || _CaptionTransitions[transitionName];

                if ($Jssor$.$IsArray(tempTransition)) {
                    if (transitionName != lastTransitionName) {
                        lastTransitionName = transitionName;
                        namedTransitionOrders[transitionName] = 0;

                        namedTransitions[transitionName] = tempTransition[Math.floor(Math.random() * tempTransition.length)];
                    }
                    else {
                        namedTransitionOrders[transitionName]++;
                    }

                    tempTransition = namedTransitions[transitionName];

                    if ($Jssor$.$IsArray(tempTransition)) {
                        tempTransition = tempTransition.length && tempTransition[namedTransitionOrders[transitionName] % tempTransition.length];

                        if ($Jssor$.$IsArray(tempTransition)) {
                            
                            tempTransition = tempTransition[Math.floor(Math.random() * tempTransition.length)];
                        }
 
                    }

                }
                transition = tempTransition;

                if ($Jssor$.$IsString(transition))
                    transition = EvaluateCaptionTransition(transition);
            }

            return transition;
        }

        var captionElmts = $Jssor$.$Children(element);
        $Jssor$.$Each(captionElmts, function (captionElmt, i) {

            var transitionsWithTuning = [];
            transitionsWithTuning.$Elmt = captionElmt;
            var isCaption = $Jssor$.$AttributeEx(captionElmt, "u") == "caption";

            $Jssor$.$Each(playIn ? [0, 3] : [2], function (j, k) {

                if (isCaption) {
                    var transition;
                    var rawTransition;

                    if (j != 2 || !$Jssor$.$AttributeEx(captionElmt, "t3")) {
                        rawTransition = FetchRawTransition(captionElmt, j);

                        if (j == 2 && !rawTransition.$Transition) {
                            rawTransition.$Delay = rawTransition.$Delay || { $Value: 0 };
                            rawTransition = $Jssor$.$Extend(FetchRawTransition(captionElmt, 0), rawTransition);
                        }
                    }

                    if (rawTransition && rawTransition.$Transition) {

                        transition = EvaluateCaptionTransition(rawTransition.$Transition.$Value);

                        if (transition) {

                            var transitionWithTuning = $Jssor$.$Extend({ $Delay: 0 }, transition);

                            $Jssor$.$Each(rawTransition, function (rawPropertyValue, propertyName) {
                                var tuningPropertyValue = (_CaptionTuningTransfer[propertyName] || _CaptionTuningTransfer.$Default).apply(_CaptionTuningTransfer, [transitionWithTuning[propertyName], rawTransition[propertyName]]);
                                if (!isNaN(tuningPropertyValue))
                                    transitionWithTuning[propertyName] = tuningPropertyValue;
                            });

                            if (!k) {
                                if (rawTransition.$BeginTime)
                                    transitionWithTuning.$BeginTime = rawTransition.$BeginTime.$Value || 0;
                                else if ((_PlayMode) & 2)
                                    transitionWithTuning.$BeginTime = 0;
                            }
                        }
                    }

                    transitionsWithTuning.push(transitionWithTuning);
                }

                if ((level % 2) && !k) {
                    transitionsWithTuning.$Children = GetCaptionItems(captionElmt, level + 1);
                }
            });

            itemsToPlay.push(transitionsWithTuning);
        });

        return itemsToPlay;
    }

    function CreateAnimator(item, transition, immediateOut) {

        var animatorOptions = {
            $Easing: transition.$Easing,
            $Round: transition.$Round,
            $During: transition.$During,
            $Reverse: playIn && !immediateOut
        };

        $JssorDebug$.$Execute(function () {
            animatorOptions.$CaptionAnimator = true;
        });

        var captionItem = item;
        var captionParent = $Jssor$.$ParentNode(item);

        var captionItemWidth = $Jssor$.$CssWidth(captionItem);
        var captionItemHeight = $Jssor$.$CssHeight(captionItem);
        var captionParentWidth = $Jssor$.$CssWidth(captionParent);
        var captionParentHeight = $Jssor$.$CssHeight(captionParent);

        var fromStyles = {};
        var difStyles = {};
        var scaleClip = transition.$ScaleClip || 1;

        if (transition.$Opacity) {
            difStyles.$Opacity = 1 - transition.$Opacity;
        }

        animatorOptions.$OriginalWidth = captionItemWidth;
        animatorOptions.$OriginalHeight = captionItemHeight;

        if (transition.$Zoom || transition.$Rotate) {
            difStyles.$Zoom = (transition.$Zoom || 2) - 2;

            if ($Jssor$.$IsBrowserIe9Earlier() || $Jssor$.$IsBrowserOpera()) {
                difStyles.$Zoom = Math.min(difStyles.$Zoom, 1);
            }

            fromStyles.$Zoom = 1;

            var rotate = transition.$Rotate || 0;

            difStyles.$Rotate = rotate * 360;
            fromStyles.$Rotate = 0;
        }
        else if (transition.$Clip) {
            var fromStyleClip = { $Top: 0, $Right: captionItemWidth, $Bottom: captionItemHeight, $Left: 0 };
            var toStyleClip = $Jssor$.$Extend({}, fromStyleClip);

            var blockOffset = toStyleClip.$Offset = {};

            var topBenchmark = transition.$Clip & 4;
            var bottomBenchmark = transition.$Clip & 8;
            var leftBenchmark = transition.$Clip & 1;
            var rightBenchmark = transition.$Clip & 2;

            if (topBenchmark && bottomBenchmark) {
                blockOffset.$Top = captionItemHeight / 2 * scaleClip;
                blockOffset.$Bottom = -blockOffset.$Top;
            }
            else if (topBenchmark)
                blockOffset.$Bottom = -captionItemHeight * scaleClip;
            else if (bottomBenchmark)
                blockOffset.$Top = captionItemHeight * scaleClip;

            if (leftBenchmark && rightBenchmark) {
                blockOffset.$Left = captionItemWidth / 2 * scaleClip;
                blockOffset.$Right = -blockOffset.$Left;
            }
            else if (leftBenchmark)
                blockOffset.$Right = -captionItemWidth * scaleClip;
            else if (rightBenchmark)
                blockOffset.$Left = captionItemWidth * scaleClip;

            animatorOptions.$Move = transition.$Move;
            difStyles.$Clip = toStyleClip;
            fromStyles.$Clip = fromStyleClip;
        }

        {
            var toLeft = 0;
            var toTop = 0;

            if (transition.x)
                toLeft -= captionParentWidth * transition.x;

            if (transition.y)
                toTop -= captionParentHeight * transition.y;

            if (toLeft || toTop || animatorOptions.$Move) {
                difStyles.$Left = toLeft;
                difStyles.$Top = toTop;
            }
        }

        var duration = transition.$Duration;

        fromStyles = $Jssor$.$Extend(fromStyles, $Jssor$.$GetStyles(captionItem, difStyles));

        animatorOptions.$Setter = $Jssor$.$StyleSetterEx();

        return new $JssorAnimator$(transition.$Delay, duration, animatorOptions, captionItem, fromStyles, difStyles);
    }

    function CreateAnimators(streamLineLength, captionItems) {

        $Jssor$.$Each(captionItems, function (captionItem, i) {

            $JssorDebug$.$Execute(function () {
                if (captionItem.length) {
                    var top = $Jssor$.$CssTop(captionItem.$Elmt);
                    var left = $Jssor$.$CssLeft(captionItem.$Elmt);
                    var width = $Jssor$.$CssWidth(captionItem.$Elmt);
                    var height = $Jssor$.$CssHeight(captionItem.$Elmt);

                    var error = null;

                    if (isNaN(top))
                        error = "Style 'top' for caption not specified. Please always specify caption like 'position: absolute; top: ...px; left: ...px; width: ...px; height: ...px;'.";
                    else if (isNaN(left))
                        error = "Style 'left' not specified. Please always specify caption like 'position: absolute; top: ...px; left: ...px; width: ...px; height: ...px;'.";
                    else if (isNaN(width))
                        error = "Style 'width' not specified. Please always specify caption like 'position: absolute; top: ...px; left: ...px; width: ...px; height: ...px;'.";
                    else if (isNaN(height))
                        error = "Style 'height' not specified. Please always specify caption like 'position: absolute; top: ...px; left: ...px; width: ...px; height: ...px;'.";

                    if (error)
                        $JssorDebug$.$Error("Caption " + (i + 1) + " definition error, \r\n" + error + "\r\n" + captionItem.$Elmt.outerHTML);
                }
            });

            var animator;
            var captionElmt = captionItem.$Elmt;
            var transition = captionItem[0];
            var transition3 = captionItem[1];

            if (transition) {

                animator = CreateAnimator(captionElmt, transition);
                streamLineLength = animator.$Locate(transition.$BeginTime == undefined ? streamLineLength : transition.$BeginTime, 1);
            }

            streamLineLength = CreateAnimators(streamLineLength, captionItem.$Children);

            if (transition3) {
                var animator3 = CreateAnimator(captionElmt, transition3, 1);
                animator3.$Locate(streamLineLength, 1);
                _Self.$Combine(animator3);
                _ImmediateOutCaptionHanger.$Combine(animator3);
            }

            if (animator)
                _Self.$Combine(animator);
        });

        return streamLineLength;
    }

    _Self.$Revert = function () {
        _Self.$GoToPosition(_Self.$GetPosition_OuterEnd() * (playIn || 0));
        _ImmediateOutCaptionHanger.$GoToPosition(0);
    };

    {
        _ImmediateOutCaptionHanger = new $JssorAnimator$(0, 0);

        CreateAnimators(0, _PlayMode ? GetCaptionItems(container, 1) : []);
    }
};

var $JssorCaptionSlideo$ = function (container, captionSlideoOptions, playIn) {
    $JssorDebug$.$Execute(function () {
        if (!captionSlideoOptions.$CaptionTransitions) {
            $JssorDebug$.$Error("'$CaptionSlideoOptions' option error, '$CaptionSlideoOptions.$CaptionTransitions' not specified.");
        }
        else if (!$Jssor$.$IsArray(captionSlideoOptions.$CaptionTransitions)) {
            $JssorDebug$.$Error("'$CaptionSlideoOptions' option error, '$CaptionSlideoOptions.$CaptionTransitions' is not an array.");
        }
    });

    var _This = this;

    var _Easings;
    var _TransitionConverter = {};
    var _CaptionTransitions = captionSlideoOptions.$CaptionTransitions;

    $JssorAnimator$.call(_This, 0, 0);

    function ConvertTransition(transition, isEasing) {
        $Jssor$.$Each(transition, function (property, name) {
            var performName = _TransitionConverter[name];
            if (performName) {
                if (isEasing || name == "e") {
                    if ($Jssor$.$IsNumeric(property)) {
                        property = _Easings[property];
                    }
                    else if ($Jssor$.$IsPlainObject(property)) {
                        ConvertTransition(property, true);
                    }
                }

                transition[performName] = property;
                delete transition[name];
            }
        });
    }

};

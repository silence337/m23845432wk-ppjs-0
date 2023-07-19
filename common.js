"use strict";

var SUI = SUI || {}; /* global namespace */

/*********************************
 * utils
 * 
 * // body crop 
 * @method SUI.Utils.LockBody(s,scroll); 
 * @param {Boolean} s lockbody true, false
 * @param {Number} scroll 현재 스크롤 수치
 * 
 * // get scrollTop
 * @method SUI.Utils.ScrollTop();
 * 
 * // promise
 * @method SUI.Utils.Promise(timer);  
 * @param {Number} timer setTimeout time
 * 
 * // TransitionEnd state
 * @method SUI.Utils.TransitionEnd();
 *  * 
 * // RequestAF
 * @param {Function} cb requestAnimationFrame callback
 * 
 * // LayerZindex
 * @method SUI.Utils.LayerZindex(popup,current);
 * @param {Element} popup  filter visible layer popup element
 * @param {Element} current open layer element
 * 
 * // ScrollListener
 * @method SUI.Utils.ScrollListener(fn);
 * @param {Function} fn scroll event actions
 * 
 * // Device useragent
 * @method SUI.Utils.isDevice();
 * 
 * // Device handler change
 * @method SUI.Utils.deviceHandler(); 
 * 
 * // toggleClass
 * @method SUI.Utils.toggleClass(t,className);
 * @param {Element} t add class element
 * @param {String} className add class name 
 * 
 * // load, backspace BFCache call function
 * @method SUI.Utils.loadFn(fn) 
 * @param {Function} fn
 *
 * 
**********************************/
SUI.Utils = {
    LOCKSTATE : false,
    LockBody (s, scroll) {
        if (s) {
            if (this.LOCKSTATE) {
                 return;
            }
            this.LOCKSTATE = true;
            //document.body.style.top = -scroll + 'px';
            document.body.classList.add('lockBody');
            return;
        }

        var isVisible = $('[data-actionsheet], [data-alert], [data-full-layer]').is(':visible');
        if (isVisible) return;

        this.LOCKSTATE = false;
        //document.body.removeAttribute('style');
        document.body.classList.remove('lockBody');
        //window.scrollTo( 0, scroll );
    },

    ScrollTop () {
        var scrollTop = window.scrollTop || document.documentElement.scrollTop || document.body.scrollTop;
        return scrollTop;
    },

    Promise (timer) {
        return new Promise(resolve =>{
            setTimeout(() => {
                resolve();
            }, timer);
        });
    },

    TransitionEnd () {
        var t, el = document.createElement('fakeelement');
            var transitions = {
            'transition'      : 'transitionend',
            'OTransition'     : 'oTransitionEnd',
            'MozTransition'   : 'transitionend',
            'WebkitTransition': 'webkitTransitionEnd'
        };
        for (t in transitions){
            if (el.style[t] !== undefined){
                return transitions[t];
            }
        }
    },

    RequestAF (cb) {
        var rAfTimeout = null;
        return () => {
            if (rAfTimeout) {
                window.cancelAnimationFrame(rAfTimeout);
            }
            rAfTimeout = window.requestAnimationFrame(() => {
                cb();
            })
        }
    },

    LayerZindex (popups, current) {
        if (popups === 'layer') {
            popups = $('[data-actionsheet], [data-alert], [data-full-layer]').filter(':visible');
        }
        if (popups.length !== 0) {
            var idx = 0; 
            popups.each(function(index) {
                idx = Math.max(parseInt($(this).css('zIndex')), idx);
            });
            current.css({ 'z-index' : idx + 1 }); 
        }
    },

    ScrollListener (target, fn) {
        return target.addEventListener('scroll', this.RequestAF(() => {
            if (typeof fn === 'function') {
                fn();
            } else {
                window[fn].call();
            }
        }, false));
    },

    isDevice : function () {
		return (navigator.userAgent.match(/Android|Mobile|iP(hone|od|ad)|BlackBerry|IEMobile|Kindle|NetFront|Silk-Accelerated|(hpw|web)OS|Fennec|Minimo|Opera M(obi|ini)|Blazer|Dolfin|Dolphin|Skyfire|Zune/));
	},

    // 디바이스 하위 버전에서 document click 이벤트가 보안상 적용안되는 문제로 디바이스에서는 touchstart 로 변경
    deviceHandler () {
		var event = (this.isDevice()) ? 'touchstart' : 'click';
		return event;
	},

    toggleClass (t,className) {
        $(t).toggleClass(className);

        // 지점안내 탭 일 경우 - 브랜드키워드 영역 사이즈 변경
        if ( t === '.choice_wrap.type4' && document.querySelector('.branch_wrap') ) {
            SUI.BrandKeyword.resizeInit();
        }

    },

    top : function () {
        return $('html, body').stop().animate({scrollTop:0}, 300);
    },

    fadeOut : function (t) {
        return $(t).fadeOut('fast');
    },

    loadFn (fn) {
        // reload
        $(function(){
            fn();
        })
        // backspace BFCache 
        window.onpageshow = function (event) {
            if (event.persisted) fn();
        };
    },

    navigator (selector) {
        if (!!!selector) return;
        if (window.getComputedStyle(selector).overflowX === 'visible') return;

        var h = selector.clientWidth / 2;
        var ul = selector;
        var li = selector.querySelector('.on');

        if (!!!li) return;

        var max = selector.scrollWidth - selector.clientWidth;
        var x = Math.round(li.offsetLeft - ul.offsetLeft - h + li.clientWidth / 2);
        
        if ( x < 0 ) {
            x = 0;
        } else if ( x > max ) {
            x = max;
        }
        $(selector).stop().animate({scrollLeft:x}, 500);
    },
}

/*********************************
 * ActionSheet
 * 
 * @method SUI.Act.show(t);  
 * @method SUI.Act.hide(t); 
 * @param {string} t data-actionsheet value
 * 
**********************************/
SUI.Act = {
    isMoving : false,
    duration : 700,

    _element (t) {
        this.el = null;
        this.getAtt = t;
        this.el = document.querySelector( '[data-actionsheet='+ this.getAtt +']' );
        this.inner = this.el ? this.el.querySelector( '[data-actionsheet-inner]' ) : '';
    },

    show (t, handler) {
        if (this.isMoving) return;

        var handlerIS = 
            handler === undefined || 
            handler === document || 
            handler === window || 
            handler === null

        if ( !handlerIS ) {
            this.handler = handler;
            this.handler.classList.add('on');
        } 

        this._element(t);

        if (!this.el) {
            return console.log('%c error: data-actionsheet element not found', 'background: #222; color: #bada55');
        }

        this.isMoving = true;
        this.scrollY = SUI.Utils.ScrollTop();

        // css position setting
        this.el.classList.add('show');

        // layer zindex ++
        SUI.Utils.LayerZindex('layer', $(this.el));

        this.h = this.inner.clientHeight;
        this.inner.style.cssText = `bottom: ${-this.h}px`;
        this._dimmedClose();

        // body lock true
        SUI.Utils.LockBody(true, this.scrollY);

        // show transition
        SUI.Utils.Promise().then(() => {
            this.el.classList.add('isAnimate');
            this.inner.style.cssText =  this._isTransition( true );
            if(this.el.querySelector('[data-navi-scroll]')) {
                SUI.NaviScroll.init();
            }
        });
    },
    
    hide (t) {
        if (t !== this.getAtt) return;

        if ( typeof this.handler !== 'undefined')  {
            this.handler.classList.remove('on');

            // quick menu actionsheet case
            if (this.handler.classList.contains('quick')) {
                SUI.Interaction.quick(this.handler);
            }
        }

        // hide transition
        this.inner.style.cssText =  this._isTransition( false );
        this.el.classList.remove('isAnimate');
        
        // end
        var endComplete = () => {
            this.el.classList.remove('show');
            this.el.removeAttribute('style');
            this.inner.removeAttribute('style');
            this.isMoving = false;
            // body lock false
            SUI.Utils.LockBody( false, this.scrollY );

            this.inner.removeEventListener( SUI.Utils.TransitionEnd (), endComplete);
            this.endCallback(t);
        };
        
        // transition end complete
        this.inner.addEventListener( SUI.Utils.TransitionEnd (), endComplete);
    },

    endCallback (t) {},

    _isTransition (s) {
        if (s) {
           return  `bottom: ${ -this.h }px; transform: translateY( ${ -this.h }px); transition: ${ this.duration }ms;`
        }
        return `bottom: ${ -this.h }px; transform: translateY(0); transition: ${ this.duration - 200 }ms;`
    },

    _dimmedClose () {
        if (this.el.hasAttribute('data-dimmed-false') && this.isMoving) return;
        
        var closeEvent = e => {
            if(this.el === e.target){
                this.hide(this.getAtt);
               document.body.removeEventListener( SUI.Utils.deviceHandler() , closeEvent);
            }
            e.stopPropagation();
        };
        document.body.addEventListener( SUI.Utils.deviceHandler() , closeEvent);
    }
}

/*********************************
 * defalut layer popup : 시스템 알럿 대체용
 * 
 * @method SUI.Alert.show(t);  
 * @method SUI.Alert.hide(t,callback); 
 * @param {String} t data-actionsheet value
 * @param {Function} callback  팝업이 닫히면서 수행되어야 할 callback 액션
 * 
**********************************/
SUI.Alert = {
    _element (t) {
        this.el = null;
        this.getAtt = t;
        this.el = document.querySelector( '[data-alert='+ this.getAtt +']' );
    },

    show (t) {
        this._element(t);

        if (!this.el) {
            return console.log('%c error: data-alert element not found', 'background: #222; color: #bada55');
        }

        this.scrollY = SUI.Utils.ScrollTop();

        // body lock true
        SUI.Utils.LockBody(true, this.scrollY);

        // show transition
        this.el.classList.add('show');
        SUI.Utils.Promise().then(() => {
            this.el.classList.add('isAnimate');
        });
    },
    
    hide (t, callback) {
        if (t !== this.getAtt) return;

        this.el.classList.remove('isAnimate');
        SUI.Utils.Promise(100).then(() => {
            this.el.classList.remove('show');

            // body lock false
            SUI.Utils.LockBody( false, this.scrollY );
        });
        
        // callback 
        try {
            if (callback) {
                SUI.Utils.Promise(280).then(() => { 
                    // promise 280 = 팝업이 사라지는 transition delay가 존재하여 적용. ( 속도가 조정되면 수정이 필요할수 있음 )
                    if (typeof callback === 'function') {
                        callback();
                    } else {
                        window[callback].call();
                    }
                })
            }
        } catch (e) {
            console.log(e);
        }
    }
}
SUI.Modal = {
    show (t) {
        return SUI.Alert.show(t);
    },

    hide (t, callback) {
        return SUI.Alert.hide(t,callback);
    }
}

/*********************************
 * full layer popup : 전체 풀창 팝업
 * 
 * @method SUI.FullLayer.show(t);  
 * @method SUI.FullLayer.hide(t); 
 * @param {String} t data-actionsheet value
 * 
**********************************/
SUI.FullLayer = {
    _element (t) {
        this.el = null;
        this.getAtt = t;
        this.el = document.querySelector( '[data-full-layer='+ this.getAtt +']' );
        this.$el = $(this.el);
    },

    show (t) {
        this._element(t);

        if (!this.el) {
            console.log('%c error: data-full-layer element not found', 'background: #222; color: #bada55');
        }
        
        if (!this.el || !!this.el.style.display) return; 

        this.scrollY = SUI.Utils.ScrollTop();

        // body lock true
        SUI.Utils.LockBody(true, this.scrollY);
        // layer zindex ++
        SUI.Utils.LayerZindex('layer', this.$el);

        this.$el.fadeIn('fast');
        if(this.el.querySelector('[data-navi-scroll]')) {
            SUI.NaviScroll.init();
        }
    },
    
    hide (t) {
        this._element(t);

        this.$el.fadeOut('fast', () => {
            // body lock false
            SUI.Utils.LockBody(false, this.scrollY);
            this.$el.removeAttr('style');
        });
    }
}

/*********************************
 * Toast Popup
 * 
 * @method SUI.Toast(t);
 * @param {String} t data-toast value 
 * 
**********************************/
SUI.Toast = t => {
    var elem = document.querySelector('[data-toast=' + t + ']');
    var duration = 500, timer = elem.dataset.toastTimer - (duration *2);
    
    $(elem).fadeIn(duration).delay(timer).fadeOut(duration);
}

/*********************************
 * Accordion - Dom 로드시 적용이며, 비동기 방식으로 html 을 불러들일 경우에는 마크업 complete 이후 재호출
 * 
 * @method SUI.Accordion.init();
 * 
**********************************/
SUI.Accordion = {
    init () {
        this._for('[data-accordion]');
        this._for('[data-accordion-sub]');
    },

    _for (el) {
        var elem = document.querySelectorAll(el);
        if ( elem.length < 1 ) return;

        elem.forEach(acn => {
            this._buttonEach(acn);
        });
    },
    
    _buttonEach (acn) {
        var menu, view;
        var accodion = acn.hasAttribute("data-accordion"), 
            accodionSub = acn.hasAttribute("data-accordion-sub");

        if ( accodion ) {
            menu = "[data-acn-menu]", view = "[data-acn-view]";
        } else if ( accodionSub ) {
            menu = "[data-acn-submenu]", view = "[data-acn-subview]";
        }

        var button = acn.querySelectorAll(menu), content = acn.querySelectorAll(view);
        
        button.forEach((el, idx) => {
            
            el.onclick = e => {
                e.preventDefault();               
                var isMore = el.dataset.acnMenu || el.dataset.acnSubmenu;
                var onlyShow = acn.dataset.accordion || acn.dataset.accordionSub;
                var parent = el.closest('[data-accordion]');
                var isShow = false;
                if ( onlyShow === 'onlyShow' ) {
                    isShow = true;
                }
                var element = content[idx];

                // CASE : default 더보기 & 닫기 버튼
                if ( isMore === 'more' ) {
                    if ( el.classList.contains('on')) {
                        el.classList.remove('on');
                        this._ContentEach(content, button, isShow, false);
                        return;
                    }
                    this._ContentEach(content, button, isShow, true);

                    content[idx].classList.add('on');
                    el.classList.add('on');
                    return;
                }

                // CASE : default accordion
                if ( el.classList.contains('on') || element.offsetWidth > 0 && element.offsetHeight > 0 ) {
                    if ( isShow ) {
                        el.classList.remove('on');
                        content[idx].classList.remove('on');

                        var isVisible = el.parentElement.querySelectorAll(menu + '.on');
                        if (isVisible.length < 1) {
                            parent.classList.remove('on');
                        }
                        //content[idx].style.display ='none'; //css 에서 처리
                        return;
                    }
                    parent.classList.remove('on');
                    el.classList.remove('on');
                    this._ContentEach(content, button, isShow, false);
                    return;
                }

                this._ContentEach(content, button, isShow, true);

                parent.classList.add('on');
                content[idx].classList.add('on');
                //content[idx].style.display = 'block'; //css 에서 처리
                el.classList.add('on');
            };
        });	
    },

    _ContentEach (content, button, isShow,  state) {
        content.forEach((cont, i) => {
            if ( isShow ) return;
            if ( !state ) {
                //cont.style.display = 'none';  //css 에서 처리
                cont.classList.remove('on');
                return;
            }
            //cont.style.display = 'none';  //css 에서 처리
            cont.classList.remove('on');
            button[i].classList.remove('on');
        });
    },
};

/*********************************
 * Tab content - Dom 로드시 적용이며, 비동기 방식으로 html 을 불러들일 경우에는 마크업 complete 이후 재호출
 * 
 * @method SUI.Tab.init();
 * 
**********************************/
SUI.Tab = {
    init () {
        var tab = document.querySelectorAll('[data-tab]');
        if ( tab.length < 1 ) return;

        tab.forEach(data => {
            var a = data.querySelectorAll('a');
            a.forEach((el, idx) => {
                var set = {
                    a : a,
                    data : data,
                    el : el,
                    idx : idx
                }
               this._eventHandler(set);
            });
        });
    },

    _eventHandler (set) {
        set.el.addEventListener( 'click' , e => {
            var value = set.data.dataset.tab;
            var isDatasetTop = set.data.hasAttribute('data-tab-scrolltop');

            if (value !== '') {
                var content = document.querySelectorAll('[data-tab-content=' + value + '] > div');
                content.forEach(function(cont, i) {
                    cont.style.display = 'none';
                    cont.classList.remove('on');
                });

                if (isDatasetTop) {
                    var contentParent = content[set.idx].parentElement;
                    var isLayerScroll = window.getComputedStyle(contentParent).overflow === 'auto';

                    isLayerScroll ? contentParent.scrollTo(0, 0) :window.scrollTo(0, 0);
                }
                
                content[set.idx].classList.add('on');
                content[set.idx].style.display = 'block';
            }

            for (var i = 0; i < set.a.length;i++ ) {
                set.a[i].parentElement.classList.remove('on');
            }
            set.el.parentElement.classList.add('on');
        });
    }
}


/*********************************
 * Time count down - Dom 로드시 적용이며, 비동기 방식으로 html 을 불러들일 경우에는 마크업 complete 이후 재호출
 * 
 * @method SUI.CountDown.init();
 * 
**********************************/
SUI.CountDown = {
    init () {
        var elem = document.querySelectorAll('[data-count-down]');

        if ( elem.length < 1 ) return;

        elem.forEach(el => {
            var time = el.dataset.countDown;

            this._getTime(time, el);

            setInterval(() => {
              this._getTime(time, el);
            }, 1000);
        });
    },

    _getTime (t, el) {
        var eventDay = new Date(t.replace(/\s+/g, 'T').concat('.000+09:00'));
        var currDay = new Date(),
            endTime = eventDay / 1000,
            elapsed = currDay / 1000,
            totalSec =  endTime - elapsed;
        
        var days = parseInt( totalSec / 86400 ),
            hours = parseInt( totalSec / 3600 ) % 24,
            min = parseInt( totalSec / 60 ) % 60,
            sec = parseInt(totalSec % 60, 10);
        
        var timeout =  eventDay - currDay;

        if( timeout < 0 ) return;

        var hours = (hours < 10) ? '0' + hours : hours;
        var min = (min < 10) ? '0' + min : min;
        var sec = (sec < 10) ? '0' + sec : sec;
        el.innerHTML = hours + ' <span>:</span> ' + min + ' <span>:</span> ' + sec;
    }
}

/*********************************
 * Show Hide Layer - Dom 로드시 적용이며, 비동기 방식으로 html 을 불러들일 경우에는 마크업 complete 이후 재호출
 * 
 * @method SUI.LayerShow.init();
 * @method SUI.LayerShow.hide('target');
 * @param {String} target data-layer-view value
 * 
**********************************/
SUI.LayerShow = {
    init () {
        var me = this;
        var layerShow = document.querySelectorAll('[data-layer-show]');
        
        if (layerShow.length < 1) return;

        layerShow.forEach((el) => {
            var elDataset = el.dataset.layerShow;
            var element = {
                handler : el,
                layer : document.querySelector('[data-layer-view=' + elDataset +']'),
            }
            me._handlerEvent(element);
        });
    },

    _handlerEvent (element) {
        this.isAnimate = false;
        element.handler.addEventListener('click', (e) => {
            if (this.isAnimate && !element.layer.classList.contains('isDimmedCrop') && this.prevHandler === e.target) return;
            if ( element.handler.classList.contains('on') ) {
                this._insertClass('remove', element);
                document.body.removeEventListener(SUI.Utils.deviceHandler() , this.action);
                return;
            }
            this._insertClass('add', element);
            return;
        });
    },

    _insertClass (s, element) {
        var isTransition = element.layer.hasAttribute('data-layer-transition');
        var handler = element.handler, layer = element.layer;
        this.prevHandler = element.handler;

        // lockbody crop function
        var _hasDataCrop = (state) => {
            if ( handler.hasAttribute('data-layer-crop') ) {
                if (state) {
                    this.scrollY = SUI.Utils.ScrollTop();
                    layer.classList.add('isDimmedCrop');
                    SUI.Utils.LockBody(true, this.scrollY);
                    return;
                }
                layer.classList.remove('isDimmedCrop');
                SUI.Utils.LockBody(false, this.scrollY);
                return;
            }
        }

        var animated = () => {
            this.isAnimate = false;
            layer.removeEventListener('transitionend', animated)
        }

        this.isAnimate = true;
        
        // CASE : add
        if ( s === 'add') {
            handler.classList.add('on');
            layer.classList.add('on');

            this._documentClose(element);

            if ( isTransition ) {
                setTimeout(() => {
                    layer.classList.add('isTransition');
                }, 30);
                layer.addEventListener('transitionend', animated)
            }
            _hasDataCrop(true);
            return;
        } 

        // CASE : remove
        if ( isTransition ) {
            var getDuration = $(layer).css('transition-duration');
            var sec = parseFloat(getDuration) * (/\ds$/.test(getDuration) ? 1000 : 1);

            layer.classList.remove('isTransition');
            handler.classList.remove('on');

            _hasDataCrop(false);

            setTimeout(() => {
                layer.classList.remove('on');
                this.isAnimate = false;
            }, (sec / 2));
            return;
        }

        handler.classList.remove('on');
        layer.classList.remove('on');
        this.isAnimate = false;
 
        _hasDataCrop(false);
    },

    _documentClose (element) {
        this.action = e => {
            // CASE : has data-layer-crop 
            if ( element.layer.classList.contains('isDimmedCrop') &&  element.layer.classList.contains('on')) {
                if ( element.layer.contains(e.target) ) {
                    var parent = e.target.closest('[data-layer-view]'),
                        close = parent.querySelector('.close').contains(e.target),
                        dimmed = parent.querySelector('.dimmed').contains(e.target);

                    if (close || dimmed) {
                        SUI.LayerShow._insertClass('remove', element);
                    }
                }
                return;
            }

            if ( e.target === element.handler || element.handler.contains(e.target)) return;

            if (e.target === element.layer.querySelector('[data-layer-hide]') || !element.layer.contains(e.target)) {
               this._insertClass('remove', element);
               document.body.removeEventListener(SUI.Utils.deviceHandler() , this.action);
            }
        }
        document.body.addEventListener(SUI.Utils.deviceHandler() , this.action);
    },

    hide (target) {
        var element = {
            handler : document.querySelector('[data-layer-show=' + target +']'),
            layer : document.querySelector('[data-layer-view=' + target +']'),
        }
        this._insertClass('remove', element);
    },

    callback : function (e) {},
}


/*********************************
 * Sticky - Dom 로드시 적용이며, 비동기 방식으로 html 을 불러들일 경우에는 마크업 complete 이후 재호출
 * 
 * @method SUI.Sticky.init(); //GNB 가 있을 경우에는 BODY 태그에 id="gnb" 필수 (해당 셀렉터에는 padding-top 적용)
 * 
**********************************/
SUI.Sticky = {
    init () {
        this.el = document.querySelectorAll('[data-sticky]');

        if ( this.el.length < 1 ) return;

        var header = document.querySelector('#header');
        this.headerHeight = header ? header.clientHeight : '0';

        this.el.forEach((el, i) => {
            el.style.top = `${this.headerHeight}px`;
            this._bindEvent(el, i);
        });
    },

    _bindEvent (el, i) {
        var headerH = this.headerHeight;
        var prev = this.el[(i - 1)];

        var observer = new IntersectionObserver(([e]) => {
            e.target.classList.toggle('adjoin', e.intersectionRatio < 1);
        },{
            rootMargin: `-${headerH + 1}px 0px 0px 0px`,
            threshold: [1]
        });

        observer.observe(el)

        var _insertClass = () => {
            if ( SUI.Utils.LOCKSTATE ) return; // body crop scroll event return
            
            if (el.parentElement.classList.contains('header_wrap')) return; // header inside sticky return

            var rectTop =  el.getBoundingClientRect().top;

            if (typeof prev  === 'undefined' || el.offsetWidth === 0 && el.offsetHeight === 0) return;

            var h = headerH + prev.offsetHeight;
            var y = (rectTop - prev.offsetHeight);
            
            
            if ( rectTop < h && rectTop !== h) {
                if (el.classList.contains('adjoin')) y = 0;
                prev.style.cssText = `top:${y}px`;
         
            } else {
                if (el.classList.contains('adjoin')) return;
                y = y > headerH ? headerH : y;
                prev.style.cssText = `top:${y}px`;
            }

       }

        SUI.Utils.loadFn(_insertClass);

        // scroll event
        //document.addEventListener('scroll', _insertClass)
        SUI.Utils.ScrollListener(document, _insertClass);
    }
}
/*********************************
 * nav Collapsed - footer  - Dom 로드시 적용이며, 비동기 방식으로 html 을 불러들일 경우에는 마크업 complete 이후 재호출 
 * 
 * @method SUI.NavCollapsed.init();
 * @method SUI.NavCollapsed.quick(t); // 퀵링크 버튼
 * @param {Element} t click this element 
 * 
**********************************/
SUI.NavCollapsed = {
    init () {
        var branchWrap = document.querySelector('.branch_wrap');
        
        // 지점안내 케이스
        if (branchWrap) {
            var hasBrandKeyword = branchWrap.querySelectorAll('.category_index_all');
            // 지점안내에 브랜드키워드가 있을 경우 scroll target 변경
            if (hasBrandKeyword) {
                hasBrandKeyword.forEach((el) => {
                    this._changeCollapsed(el);
                })
            } else {
                this._changeCollapsed(document);
            }
            return;
        } 

        this._changeCollapsed(document);
        this._topHandler();
    },

    _changeCollapsed (scrollTarget) {
        var footerNav = document.querySelector('[data-footer-collapsed]'),
            quickNav = document.querySelector('.quick_menu'),
            floating = document.querySelector('.floating_popup');
        
        // footer fnb_wrap scroll up down
        var footerNavEvent  = (s) => {
            if (!footerNav) return;

            if (s) {
                footerNav.classList.add('isHide');
                quickNav ? quickNav.classList.add('isHide') : null;
                floating ? floating.classList.add('isHide') : null;
                return;
            }
            footerNav.classList.remove('isHide');
            quickNav ? quickNav.classList.remove('isHide') : null;
            floating ? floating.classList.remove('isHide') : null;
        }

        // side qucik_menu scroll up down
        var quickNavEvent  = (s) => {
            if (!quickNav) return;
            s ?  quickNav.classList.add('down') : quickNav.classList.remove('down');
        }

        var scroll = 0;
        SUI.Utils.ScrollListener(scrollTarget, () => {
            var st = (scrollTarget === document) ? SUI.Utils.ScrollTop() : scrollTarget.scrollTop;

            if ( SUI.Utils.LOCKSTATE ) return; // body crop scroll event return

            if ( st > scroll ) { // down
                footerNavEvent(true);
                quickNavEvent(true);
            } else { // up
                footerNavEvent(false);

                if (st === 0) {
                    quickNavEvent(false);
                }
            }
            scroll = st <= 0 ? 0 : st;
        })

        var _scrollStopped = (callback, timeout = 1500) => {
            SUI.Utils.ScrollListener(scrollTarget, () => {
                clearTimeout(callback.timeout);
                callback.timeout = setTimeout(callback, timeout);
            });
        }
        _scrollStopped(() => {
            footerNavEvent(false);
        });
    },

    quick (t) {
        var wrap = t.closest('.fnb_wrap');

        var act = document.querySelector('[data-actionsheet=pop-quick]');

        if (!!!act) return;

        var observer = new MutationObserver((mutations) => {
            if (!!!t.classList.contains('on') && !SUI.Act.isMoving) {
                wrap.removeAttribute('style');
            }
        })
        var option = {
            attributes: true,
            childList: true,
            characterData: true
        };
        observer.observe(act, option);

        if (!t.classList.contains('on') ) {
            SUI.Act.show('pop-quick', t);
            wrap.style.cssText = 'z-index:115;'
            return;
        }

        SUI.Act.hide('pop-quick', t);
        SUI.Interaction.quick(t); // quick button interaction
    },

    _topHandler () {
        var topButton = document.querySelector('.quick_menu .btn_top');

        if(!topButton) return;

        topButton.addEventListener('click', SUI.Utils.top);
    }
}

/*********************************
 * Brand Keyword - Dom 로드시 적용이며, 비동기 방식으로 html 을 불러들일 경우에는 마크업 complete 이후 재호출 
 * 
 * @method SUI.BrandKeyword.init();
 * 
**********************************/
SUI.BrandKeyword = {
    init () {
        this.brand = document.querySelectorAll('[data-keyword-brand]');
        
        if ( this.brand.length < 1) return;

        this.brand.forEach(el => {
            var brandList = el.querySelector('.category_index_all');
            var navigator = el.querySelector('.category_index_group');
            var ul = brandList.querySelector('ul');
            var li = ul.querySelectorAll(':scope > li');

            var elements = {
                brand : {
                    wrap : brandList,
                    ul : ul,
                    li : li,
                },
                navigator : navigator
            }

            if (!navigator) return;
            this._handlerEvent(elements);
            this._scrollEvent(elements);
        });
    },

    // navigator handler event
    _handlerEvent (el) {
        var brand = el.brand.wrap,  li = el.brand.li, navigator = el.navigator;
        var a = navigator.querySelectorAll('a');

        a.forEach((button, idx) => {
            // right navigator event
            button.addEventListener('click' , e => {
                try {
                    brand.scrollTo(0, li[idx].offsetTop);
                    this._navigatorPos(navigator);
                } catch (e) {
                    console.log(e);
                }
            });
        });
    },

    // navigator scroll pos
    _navigatorPos (navigator) {
        var h = navigator.clientHeight / 2;
        var ul = navigator.querySelector('ul');
        var li = navigator.querySelector('.active');

        var max = ul.scrollHeight - navigator.clientHeight;
        var y = Math.round(li.offsetTop - ul.offsetTop - h + li.clientHeight / 3);
        
        if ( y < 0 ) {
            y = 0;
        } else if ( y > max ){
            y = max;
        }
        //keywordScroll.scrollTo({top:y, left:0, behavior:'smooth'}); // IOS not working smooth
        $(navigator).stop().animate({scrollTop:y}, 300);
    },

    // brand list scroll 
    _scrollEvent (el) {
        var brand = el.brand.wrap, li = el.brand.li, navigator = el.navigator;

        var handler;

        var _removeClass = () => {
            handler = navigator.querySelectorAll('li');
            handler.forEach(all => {
                all.classList.remove('active');
            });
        }
        // brand list scroll event
        SUI.Utils.ScrollListener(brand, () => {
            try {
                li.forEach((el,idx) => {
                    var offsetTop = el.offsetTop;

                    // AS-IS 카테고리의 브랜드 형태 ( 리스트의 sticky 되는 자음의 offset().top 으로 체크 )
                    // if ($(el).find('strong').offset().top === 260) {
                    //     _removeClass();
                    //     handler[idx].classList.add('active');
                    //     this._navigatorPos(navigator);
                    // }

                    // TO-BE 는 자음이 있거나 없거나 하여 구간으로 체크
                    //console.log(offsetTop);
                    if ( brand.scrollTop > offsetTop-10) {
                        _removeClass();
                        handler[idx].classList.add('active');
                        this._navigatorPos(navigator);
                    }
                });
            } catch (e) {
                console.log(e);
            }
        });
    },
    // 상위 탭 컨텐츠가 있을때 열리고 닫힐때마다 브랜드 상위 div에 height calc 변경하는 method 
    resizeInit () {
        var parent = this.brand[0].parentElement;
        var parentTop = parent.offsetParent.offsetTop + document.querySelector('[data-footer-collapsed]').clientHeight + 12; // 12 is footer top dropshadow  + 10 margin
        parent.style.setProperty('height', `calc(100vh - ${parentTop}px)`);
    }
}


/*********************************
 * onepage Anchor - Dom 로드시 적용이며, 비동기 방식으로 html 을 불러들일 경우에는 마크업 complete 이후 재호출 
 * 
 * @method SUI.Anchor.init();
 * 적용 컨텐츠 - 브랜드위크, 상품상세, 안내형 컨텐츠 + fulllayer popup 
 * layer popup 안에 앵커기능일때 - data-anchor="layer"
**********************************/
SUI.Anchor = {
    init () {
        this.anchor = document.querySelector('[data-anchor]');

        if (!this.anchor) return;

        this.isLayer = this.anchor.dataset.anchor === 'layer' ? true : false;

        if (this.isLayer) {
            this.layerContent = document.querySelector('.popup_content');
        }

        this._handlerEvent();
        this._bindEvent();
    },

    _handlerEvent () {
        var header = document.querySelector('#header');
        this.headerHeight = header ? header.offsetHeight : '0';
        this.handler = this.anchor.querySelectorAll('a');

        this.handler.forEach(button => {
            button.addEventListener('click', e => {
                e.preventDefault();
                var name = button.getAttribute('href').split("#");
                var elem = document.getElementById(name[1]);
                var top = elem.offsetParent.offsetTop + elem.offsetTop;
                var anchorParent = this.anchor.parentElement;
                var anchorHeight = anchorParent.classList.contains('product_detail_tab') ? '0' : anchorParent.offsetHeight;

                if ( this.isLayer ) {
                    this.headerHeight = document.querySelector('.popup_head').offsetHeight;
                }
                var move = (top - anchorHeight - this.headerHeight) + 2;

                // 브랜드 상품상세 
                if ( document.querySelector('#brand') ) { 
                    move = top - 100
                } 

                var moveElement = this.isLayer ? this.layerContent : 'html, body';
                $(moveElement).stop().animate({scrollTop:move}, 600);
            });
        });
    },

    _bindEvent () {
        var scrollTarget = this.isLayer ? this.layerContent : document;
        var anchorArea = document.querySelectorAll('[data-anchor-area]');
        var _sectionEvent = () => {
            anchorArea.forEach((el, i) => {
                var navList = this.anchor.querySelectorAll('li');
                var top = el.getBoundingClientRect().top,
                    lastIndex = anchorArea.length - 1,
                    lastRect = anchorArea[lastIndex].getBoundingClientRect().top,
                    lastSection = window.innerHeight - anchorArea[lastIndex].offsetHeight;

                if ( this.isLayer ) {
                    this.headerHeight = this.layerContent.offsetTop + 100;
                }

                // 마지막 섹션에 다다를때 세로가 작을 경우
                if (lastRect <= lastSection && lastRect > 0) {
                    navList.forEach(link => {
                        link.classList.remove('on');
                        navList[lastIndex].classList.add('on');
                        SUI.Utils.navigator(this.anchor);
                    });
                    return;
                }

                if (top < this.headerHeight + this.anchor.parentElement.offsetHeight) {
                    if (top === 0) {
                        return;
                    }
                   
                    navList.forEach(link => {
                        link.classList.remove('on');
                        navList[i].classList.add('on');
                        SUI.Utils.navigator(this.anchor);
                    });
                } 
            })
        }

       SUI.Utils.loadFn(_sectionEvent);

        // scroll event
       SUI.Utils.ScrollListener(scrollTarget, _sectionEvent);

    },
}

/*********************************
 * More content : 해당 '더보기' 유형은 정해진 목록에서 show, hide 인 형태의 '더보기' ('infinity scroll' 이 아님 )
 * Dom 로드시 적용이며, 비동기 방식으로 html 을 불러들일 경우에는 마크업 complete 이후 재호출 
 * 
 * @method SUI.More.init();
 * 
**********************************/
SUI.More = {
    init () {
        var moreContent = document.querySelectorAll('[data-more-content]');

        if (moreContent.length < 1) return;

        moreContent.forEach(elements => {
            var more = {
                listParent : elements.querySelector('[data-more-list]'),
                button : elements.querySelector('[data-more-button]')
            }
            this._listEvent(more);
        });
    },

    _listEvent (more) {
        var parent = more.listParent, button = more.button;
        var parentValue = parent.dataset.moreList;
        var list = parent.querySelectorAll('li');

        if (parentValue === '') return;

        // init, show, hide controll
        var _showcase = (s) => {
            var length = ( s === 'init' || s === 'hide' ) ? parentValue : list.length;;

            if ( s === 'hide' ) {
                list.forEach(el => {
                    el.style.cssText = 'display:none;';
                });
            }
            
            try {
                for (var i = 0; i < length; i++) {
                    var len = list.length === 1 ? 0 : i;
                    list[len].style.cssText = 'display:block;';
                }
            } catch (e) {
                console.log(e);
            }
        }
        
        // bind event list 
        if ( list.length > parentValue ) {
            this._handlerEvent(button, parent, _showcase);
            button.style.cssText = 'display:block;';
        } else if ( list.length <= parentValue ) {
            if (parent.classList.contains('grow')) {
                parent.classList.remove('grow');
            }
        }
        
        _showcase('init');
    },

    _handlerEvent (button, parent, showcase) {
        button.addEventListener('click', () => {
            var more = button.querySelector('button');

            if ( more.classList.contains('on') ) {
                more.classList.remove('on'); 
                parent.classList.remove('on');
                showcase('hide');
                return;
            }
            more.classList.add('on');
            parent.classList.add('on');
            showcase('show');
        });
    }
}

/*********************************
 * 카테고리 
 * 
 * @method SUI.Category.navigation(); // 내비게이션
 * @method SUI.Category.filter();     // 필터
 * 
**********************************/
SUI.Category = {
    navigation () {
        var category = document.querySelector('[data-category]');

        if (!category) return;

        this.menu = category.querySelectorAll('[data-category-menu]');

        this.menu.forEach(el => {
            this._naviMenu(el);
        });
    },

    _naviMenu (el) {
        var submenu = el.nextElementSibling.querySelectorAll('.depth2 a');

        el.addEventListener('click' , (e) => {
            var target = el.closest('li');
            if (target.classList.contains('on')) {
                return target.classList.remove('on');
            }

            for (var i = 0; i <  this.menu.length; i++) {
                this.menu[i].parentElement.classList.remove('on');
            }
 
            target.classList.add('on');

            submenu.forEach((el) => {
                el.removeEventListener('click' , this._naviSubmenu);
                el.addEventListener('click' , this._naviSubmenu);
            });

        }, false);
    },

    _naviSubmenu (e) {
        try {
            var target = e.target.closest('li');

            if ( target.classList.contains('all') ) return;
    
            var categoryDepth = e.target.closest('[data-category-depth]');
            var depth2 = categoryDepth.querySelectorAll('.depth2 li');
            var depth3 = categoryDepth.querySelectorAll('.depth3');
    
            var _removeClass = (el) => {
                for (var i = 0; i <  el.length; i++) {
                    el[i].classList.remove('on');
                }
            }
    
            _removeClass(depth2);
            _removeClass(depth3);
    
            target.classList.add('on');
    
            for (var i = 0; i <  depth2.length; i++) {
                var item = depth2[i];
                if (item.getAttribute('class') === 'on') {
                    depth3[i-1].classList.add('on');
                }
            }
    
        } catch (e) {
            console.log(e);
        }
    },

    filter () {
        var filterCategory = document.querySelector('[data-category-filter]');

        if (!filterCategory) return;

        var menu = filterCategory.querySelectorAll('[data-filter-menu]');
        var submenu = filterCategory.querySelectorAll('[data-filter-depth] a');

        menu.forEach(el => {
            this._filterMenu(el);
        });
        submenu.forEach(el => {
            this._filterSubmenu(el);
        });
    },

    _filterMenu (el) {
        el.addEventListener('click' , (e) => {
            var target = el.closest('li');
            if (target.classList.contains('on')) {
                return target.classList.remove('on');
            }
            target.classList.add('on');
        }, false);
    },

    _filterSubmenu (el) {
        el.addEventListener('click' , (e) => {
            var target = el.closest('li');
            if (target.classList.contains('on')) {
                return target.classList.remove('on');
            }
            target.classList.add('on');
        }, false);
    },
}


/*********************************
 * video IntersectionObserver
 * 
 * @method SUI.Video.observer();
 * 
**********************************/
SUI.Video = {
    observer () {
        var videoPlayer = document.querySelectorAll('[data-video-observer]');

        if ( videoPlayer.length < 1 ) return;
        
        var header = document.querySelector('#header'),
            collapsed = document.querySelector('[data-footer-collapsed]');
        var headerHeight = header ? header.clientHeight : '0';
        var footerHeight = collapsed ? collapsed.clientHeight : '0';

        var observer = new IntersectionObserver((entries, observer) => {
            entries.forEach(function (entry) {
                var youtube = entry.target.dataset.videoPlayer === 'youtube'; // test 확인 X

                if (entry.intersectionRatio > 0.9) {
                    if ( youtube ) {
                        return entry.target.contentWindow.postMessage('{"event":"command","func":"pauseVideo","args":""}','*');
                    }
                    entry.target.play();
                } else {
                    if ( youtube ) {
                        return entry.target.contentWindow.postMessage('{"event":"command","func":"playVideo","args":""}','*');
                    }
                    entry.target.pause();
                }
            });
        },{
            root: null,
            rootMargin: `-${headerHeight}px 0px -${footerHeight}px 0px`,
            threshold: 0.9,
        });

        videoPlayer.forEach((el) => {
            observer.observe(el);
        })
    },
}

/*********************************
 * product detail view - 상품 상세 해당 이벤트
 * 
 * @method SUI.Product.init();
 * 
**********************************/
SUI.Product = {
    init () {
        this._detailBrandScroll ();
        this._detailViewMore ();
        this._photoReview ();
    },

    // 상품 상세 스크롤에 따른 sub header sticky 및 하단 상세 탭 show, hide
    _detailBrandScroll () {
        var brandHeader = document.querySelector('.brand_logo'),
            brandSubHeader = document.querySelector('#brand .sub_header'),
            productDetail = document.querySelector('.product_detail_content'),
            productDetailTab = document.querySelector('.product_detail_tab');
        var brandHeight = brandHeader ? brandHeader.offsetHeight : null;
        
        var _stickyEvent = () => {
            var scrollTop = SUI.Utils.ScrollTop();

            if ( SUI.Utils.LOCKSTATE ) return; // body crop scroll event return

            if (brandSubHeader && brandHeader) {
                if ( (scrollTop + brandHeight) >= brandSubHeader.offsetTop ) {
                    brandSubHeader.classList.add('fixed');
                } else {
                    brandSubHeader.classList.remove('fixed');
                }
            }  

            if (productDetailTab) {
                if ( (scrollTop + brandHeight) >= productDetail.offsetTop - 100 ) {
                    productDetailTab.classList.add('on');
                } else {
                    productDetailTab.classList.remove('on');
                }
            }
        }

        SUI.Utils.loadFn(_stickyEvent);

        // scroll event
        SUI.Utils.ScrollListener(document, _stickyEvent);
    },

    // 상품 상세 이미지 자세히보기 
    _detailViewMore () {
        var detail = document.querySelector('.product_detail_info');

        if (!!!detail) return;

        var box = detail.querySelector('.detail_info_box'), button = detail.querySelector('.btn_toggle');

        if (!!!button) return;

        button.addEventListener('click', (e) => {
            button.classList.toggle('on');
            box.classList.toggle('on');
        });
    },

    // 상품 상세 포토 리뷰 버튼 show, hide
    _photoReview () {
        var photoReviewPop = document.querySelector('.popup_review_detail');

        if (!!!photoReviewPop) return;

        var scrollArea = photoReviewPop.querySelector('.popup_content');
        var button = photoReviewPop.querySelector('.review_detail_list .btn_wrap');
        var scroll = 0;
        SUI.Utils.ScrollListener(scrollArea, () => {
            var st = SUI.Utils.ScrollTop();

            button.classList.add('hide');

            scroll = st <= 0 ? 0 : st;
        })

        var _scrollStopped = (callback, timeout = 1000) => {
            SUI.Utils.ScrollListener(scrollArea, () => {
                clearTimeout(callback.timeout);
                callback.timeout = setTimeout(callback, timeout);
            });
        }
        _scrollStopped(() => {
            button.classList.remove('hide');
        });
    }
}

/*********************************
 * Payment 결제수단 선택별 show , hide
 * 
 * @method SUI.Payment.init();
 * 
**********************************/
SUI.Payment = {
    dataSelect : '[data-payment-select]',
    dataList : '[data-paylist]',
    box : '.order_payment_box',
    paymeans : '.order_paymeans',

    init () {
        this._select();
        this._payList();
    },

    _select () {
        var paymentSelect = document.querySelectorAll(this.dataSelect);

        if (paymentSelect.length < 1) return;

        paymentSelect.forEach((el) => {
            var label = el.querySelector('label');
            var view = el.querySelector(this.box);
            var viewAll;

            label.addEventListener('click' , () => {
                for ( var i = 0; i < paymentSelect.length; i++ ) {
                    viewAll = paymentSelect[i].querySelector(this.box);
                    viewAll.classList.remove('on');
                }
                view.classList.add('on');
                
                // 일반 결제 리셋 
                if (view.querySelector(this.dataList)) {
                    var input = view.querySelector(this.dataList).closest('.order_paylist').querySelectorAll('input');
                    var paymeans = document.querySelectorAll(this.paymeans);

                    for ( var i = 0; i < input.length; i++ ) {
                        input[i].checked = false;
                    }

                    for ( var i = 0; i < paymeans.length; i++ ) {
                        paymeans[i].classList.remove('on');
                    }
                }
            });
        })
    },

    _payList () {
        var paymentList = document.querySelectorAll(this.dataList);

        if (paymentList.length < 1) return;

        paymentList.forEach((el) => {
            var label = el.querySelector('label');
            var viewAll = document.querySelectorAll(this.paymeans);

            label.addEventListener('click' , (e) => {
                var dataset = e.target.closest('li').dataset.paylist;

                viewAll.forEach((el) => {
                    el.classList.remove('on');
                })

                if (dataset !== '') {
                    var view = document.querySelector(this.paymeans + '.' + dataset);
                    if (!!!view) return;
                    view.classList.add('on');
                }
            });
        })
    }
}

/*********************************
 * AD Banner
 * 
 * @method SUI.AD.init();
 * 
**********************************/
SUI.AD = {
    init () {
        this._mainExpandCenter(); // main center banner
        //this._mainExpandBottom(); // main bottom left banner
        this._subExpandBanner();  // sub top banner
    },

    _mainExpandCenter () {
        var expandBanner = document.querySelector('.line_banner.type2');

        if (!!!expandBanner) return;

        var image = expandBanner.querySelector('.line_banner_img');
        var button = expandBanner.querySelector('.btn_banner');

        var timer;
        var event = {
            _transitionEnd () {
                image.classList.remove('isTransition');
                image.removeEventListener('transitionend' , this._transitionEnd);
            },

            _addListener () {
                image.classList.add('isTransition');
                image.addEventListener('transitionend' , this._transitionEnd);
            },

            _animated () {
                timer = setTimeout(() => {
                    expandBanner.classList.remove('on');
                    this._addListener();
                },3000);
            },

            transition (s) {
                clearTimeout(timer);

                this._addListener();

                if (s) {
                    expandBanner.classList.add('on');
                    this._animated ();
                    return;
                }

                expandBanner.classList.remove('on');
            },

            observer () {
                var header = document.querySelector('#header');
                var headerHeight = header ? header.clientHeight + 44 : '0';

                var observer = new IntersectionObserver((entries, observer) => {
                    entries.forEach((entry) => {
                        if (entry.intersectionRatio > 0.9) {
                            if (!expandBanner.classList.contains('on')) {
                                return this.transition(true);
                            }
                            this.transition(true);
                        } else {
                            clearTimeout(timer);
                        }
                    });
                },{
                    root: null,
                    rootMargin: `-${headerHeight}px 0px 0px 0px`,
                    threshold: 0.9,
                });
    
                observer.observe(expandBanner);
            },

            handler () {
                button.addEventListener('click', () => {
                    if (expandBanner.classList.contains('on')) {
                        return this.transition(false);
                    }
                    this.transition(true);
                });
            }
            
        }

        event.handler();
        event.observer();
    },

    _mainExpandBottom () {
        var linkAD = document.querySelector('.floating_popup .pro_link');

        if (!!!linkAD) return;

        SUI.Utils.Promise().then(() => {
            linkAD.classList.add('animated');

            SUI.Utils.Promise(1500).then(() => {
                linkAD.classList.remove('animated');
            })
        })
    },

    _subExpandBanner () {
        var topAD = document.querySelector('[data-top-ad]');

        if (!!!topAD) return;
        
        var container = document.querySelector('#container');
        var closeButton = topAD.querySelector('[data-ad-close]');
        container.classList.add('top_ad');

        closeButton.addEventListener('click', () => {
            container.classList.add('off');
        });
    }
}

/*********************************
 * Interaction Animate 
 * 
 * @method SUI.Interaction.init();
 * @method SUI.Interaction.cart(); // 장바구니
 * @method SUI.Interaction.quick(t); // 푸터 퀵링크
 * 
**********************************/
SUI.Interaction = {
    init () {
        this.textRoliing(); // 쇼핑히스토리 텍스트 롤링 
        this.numberCount(); // 마이신라 쿠폰, 적립금 숫자 카운팅 
    },
    cart () {
        var btnCart = document.querySelector('.btn_cart'), cart = btnCart.querySelector('.blind');

        if (!btnCart.classList.contains('in'))  btnCart.classList.add('in');
        
        btnCart.classList.add('animated');

        var endReset = function () {
            btnCart.classList.remove('animated');
            cart.removeEventListener('animationend', endReset);
        }
        cart.addEventListener('animationend', endReset);
    },

    quick (t) {
        var timer;
        clearTimeout(timer);
        t.classList.add('reverse');

        timer = setTimeout(()=> {
            t.classList.add('reverse_animated');
            t.classList.remove('reverse');
            var endReset = function () {
                t.classList.remove('reverse_animated');
                t.removeEventListener('animationend', endReset);
            }
            t.addEventListener('animationend', endReset);
        });
    },

    textRoliing () {
        var elem = document.querySelectorAll('[data-interaction="textRolling"]');

        if (elem.length < 1) return;

        elem.forEach(el => {
            var idx = 0;
            var prevIdx;
            var timer;

            var list = el.querySelectorAll('.p_list');
            var length = list.length;

            clearInterval(timer);

            timer = setInterval(() => {
                prevIdx = idx;
                idx++;

                if ( idx >= length ) {
                    idx = 0;
                }
                list[prevIdx].classList.remove('on');
                list[idx].classList.add('on');
            }, 5200);
        })
    },

    numberCount () {// ex) <em data-interaction-count="10000"></em>원
        var count = document.querySelectorAll('[data-interaction-count]');

        if (count.length < 1) return;

        var commaReplace = x => {
            return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        }
        count.forEach(el => {
            var value = el.dataset.interactionCount;
            $({ val : 0 }).animate({ val : value }, {
                duration: 1000,
                step: function() {
                    var num = commaReplace(Math.floor(this.val));
                    $(el).text(num);
                },
                complete: function() {
                    var num = commaReplace(Math.floor(this.val));
                    $(el).text(num);
                }
            });
        })
    }
}

/*********************************
 * scrollto navigation  - Dom 로드시 적용이며, 비동기 방식으로 html 을 불러들일 경우에는 마크업 complete 이후 재호출
 * 
 * @method SUI.NaviScroll.init(); 
 * 
 * data-navi-scroll > default loadEvent
 * data-navi-scroll="handler" > 클릭시 이벤트 바인딩
 * 
 * <ul data-navi-scroll> - data-navi-scroll 은 overflow-x:auto 가 지정된 엘레멘트에 적용.
 *  <li></li>
 *  <li class="on"></li> - class="on" 으로 체크
 * </ul>
 * 
**********************************/
SUI.NaviScroll = {
    init () {
        var dataNavi = document.querySelectorAll('[data-navi-scroll]');
        dataNavi.forEach(el => {
            SUI.Utils.navigator(el);

            var dataset = el.dataset.naviScroll;
            if (dataset === 'handler') {
                this.handlerEvent(el);
            };
        });
    },

    handlerEvent (data) {
        var label = data.querySelectorAll('li label'),
            a = data.querySelectorAll('li a'),
            elem = label.length > 0 ? label : a;

        elem.forEach(el => {
            if (el.previousElementSibling && el.previousElementSibling.hasAttribute('disabled')) return;

            el.addEventListener('click', () => {
                elem.forEach(el => {
                    el.closest('li').classList.remove('on');
                })
                el.closest('li').classList.add('on');
                SUI.Utils.navigator(data);
            });
        });

    },
}

$(document).ready(function () { 
    if ($("[data-original]").length > 0) {
        $("[data-original]").lazyload();
    }
    SUI.AD.init();
    SUI.NaviScroll.init();
    SUI.Category.navigation();
    SUI.Category.filter();
    SUI.NavCollapsed.init();
    SUI.Accordion.init();
    SUI.CountDown.init();
    SUI.Tab.init();
    SUI.LayerShow.init();
    SUI.BrandKeyword.init();
    SUI.Anchor.init();
    SUI.More.init();
    SUI.Video.observer(); 
    SUI.Sticky.init();
    SUI.Product.init();
    SUI.Payment.init();
    SUI.Interaction.init();
});

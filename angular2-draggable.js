import { Directive, ElementRef, EventEmitter, HostListener, Input, NgModule, Output, Renderer } from '@angular/core';

class Position {
    /**
     * @param {?} x
     * @param {?} y
     */
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
}
class AngularDraggableDirective {
    /**
     * @param {?} el
     * @param {?} renderer
     */
    constructor(el, renderer) {
        this.el = el;
        this.renderer = renderer;
        this.allowDrag = true;
        this.moving = false;
        this.orignal = null;
        this.oldTrans = new Position(0, 0);
        this.tempTrans = new Position(0, 0);
        this.oldZIndex = '';
        this.oldPosition = '';
        this._zIndex = '';
        this.started = new EventEmitter();
        this.stopped = new EventEmitter();
        this.edge = new EventEmitter();
        /**
         * Whether to limit the element stay in the bounds
         */
        this.inBounds = false;
        /**
         * Whether the element should use it's previous drag position on a new drag event.
         */
        this.trackPosition = true;
        /**
         * Input css scale transform of element so translations are correct
         */
        this.scale = 1.00;
    }
    /**
     * Set z-index when not dragging
     * @param {?} setting
     * @return {?}
     */
    set zIndex(setting) {
        this.renderer.setElementStyle(this.el.nativeElement, 'z-index', setting);
        this._zIndex = setting;
    }
    /**
     * @param {?} setting
     * @return {?}
     */
    set ngDraggable(setting) {
        if (setting !== undefined && setting !== null && setting !== '') {
            this.allowDrag = !!setting;
            let /** @type {?} */ element = this.handle ? this.handle : this.el.nativeElement;
            if (this.allowDrag) {
                this.renderer.setElementClass(element, 'ng-draggable', true);
            }
            else {
                this.renderer.setElementClass(element, 'ng-draggable', false);
            }
        }
    }
    /**
     * @return {?}
     */
    ngOnInit() {
        if (this.allowDrag) {
            let /** @type {?} */ element = this.handle ? this.handle : this.el.nativeElement;
            this.renderer.setElementClass(element, 'ng-draggable', true);
        }
    }
    /**
     * @param {?} x
     * @param {?} y
     * @return {?}
     */
    getPosition(x, y) {
        return new Position(x, y);
    }
    /**
     * @param {?} x
     * @param {?} y
     * @return {?}
     */
    moveTo(x, y) {
        if (this.orignal) {
            let /** @type {?} */ prevX = this.tempTrans.x;
            let /** @type {?} */ prevY = this.tempTrans.y;
            this.tempTrans.x = (x - this.orignal.x) / this.scale;
            this.tempTrans.y = (y - this.orignal.y) / this.scale;
            this.transform();
            if (this.bounds) {
                this.edge.emit(this.boundsCheck());
            }
        }
    }
    /**
     * @return {?}
     */
    transform() {
        let /** @type {?} */ value = `translate(${this.tempTrans.x + this.oldTrans.x}px, ${this.tempTrans.y + this.oldTrans.y}px)`;
        this.renderer.setElementStyle(this.el.nativeElement, 'transform', value);
        this.renderer.setElementStyle(this.el.nativeElement, '-webkit-transform', value);
        this.renderer.setElementStyle(this.el.nativeElement, '-ms-transform', value);
        this.renderer.setElementStyle(this.el.nativeElement, '-moz-transform', value);
        this.renderer.setElementStyle(this.el.nativeElement, '-o-transform', value);
    }
    /**
     * @return {?}
     */
    pickUp() {
        // get old z-index and position:
        this.oldZIndex = this.el.nativeElement.style.zIndex ? this.el.nativeElement.style.zIndex : '';
        this.oldPosition = this.el.nativeElement.style.position ? this.el.nativeElement.style.position : '';
        if (window) {
            this.oldZIndex = window.getComputedStyle(this.el.nativeElement, null).getPropertyValue('z-index');
            this.oldPosition = window.getComputedStyle(this.el.nativeElement, null).getPropertyValue('position');
        }
        // setup default position:
        let /** @type {?} */ position = 'relative';
        // check if old position is draggable:
        if (this.oldPosition && (this.oldPosition === 'absolute' ||
            this.oldPosition === 'fixed' ||
            this.oldPosition === 'relative')) {
            position = this.oldPosition;
        }
        this.renderer.setElementStyle(this.el.nativeElement, 'position', position);
        if (this.zIndexMoving) {
            this.renderer.setElementStyle(this.el.nativeElement, 'z-index', this.zIndexMoving);
        }
        if (!this.moving) {
            this.started.emit(this.el.nativeElement);
            this.moving = true;
        }
    }
    /**
     * @return {?}
     */
    boundsCheck() {
        if (this.bounds) {
            let /** @type {?} */ boundary = this.bounds.getBoundingClientRect();
            let /** @type {?} */ elem = this.el.nativeElement.getBoundingClientRect();
            let /** @type {?} */ result = {
                'top': boundary.top < elem.top,
                'right': boundary.right > elem.right,
                'bottom': boundary.bottom > elem.bottom,
                'left': boundary.left < elem.left
            };
            if (this.inBounds) {
                if (!result.top) {
                    this.tempTrans.y -= (elem.top - boundary.top) / this.scale;
                }
                if (!result.bottom) {
                    this.tempTrans.y -= (elem.bottom - boundary.bottom) / this.scale;
                }
                if (!result.right) {
                    this.tempTrans.x -= (elem.right - boundary.right) / this.scale;
                }
                if (!result.left) {
                    this.tempTrans.x -= (elem.left - boundary.left) / this.scale;
                }
                this.transform();
            }
            return result;
        }
    }
    /**
     * @return {?}
     */
    putBack() {
        if (this._zIndex) {
            this.renderer.setElementStyle(this.el.nativeElement, 'z-index', this._zIndex);
        }
        else if (this.zIndexMoving) {
            if (this.oldZIndex) {
                this.renderer.setElementStyle(this.el.nativeElement, 'z-index', this.oldZIndex);
            }
            else {
                this.el.nativeElement.style.removeProperty('z-index');
            }
        }
        if (this.moving) {
            this.stopped.emit(this.el.nativeElement);
            if (this.bounds) {
                this.edge.emit(this.boundsCheck());
            }
            this.moving = false;
            if (this.trackPosition) {
                this.oldTrans.x += this.tempTrans.x;
                this.oldTrans.y += this.tempTrans.y;
            }
            this.tempTrans.x = this.tempTrans.y = 0;
        }
    }
    /**
     * @param {?} event
     * @return {?}
     */
    onMouseDown(event) {
        // 1. skip right click;
        // 2. if handle is set, the element can only be moved by handle
        if (event.button === 2 || (this.handle !== undefined && event.target !== this.handle)) {
            return;
        }
        this.orignal = this.getPosition(event.clientX, event.clientY);
        this.pickUp();
    }
    /**
     * @return {?}
     */
    onMouseUp() {
        this.putBack();
    }
    /**
     * @return {?}
     */
    onMouseLeave() {
        this.putBack();
    }
    /**
     * @param {?} event
     * @return {?}
     */
    onMouseMove(event) {
        if (this.moving && this.allowDrag) {
            this.moveTo(event.clientX, event.clientY);
        }
    }
    /**
     * @return {?}
     */
    onTouchEnd() {
        this.putBack();
    }
    /**
     * @param {?} event
     * @return {?}
     */
    onTouchStart(event) {
        if (this.handle !== undefined && event.target !== this.handle) {
            return;
        }
        this.orignal = this.getPosition(event.changedTouches[0].clientX, event.changedTouches[0].clientY);
        this.pickUp();
    }
    /**
     * @param {?} event
     * @return {?}
     */
    onTouchMove(event) {
        if (this.moving && this.allowDrag) {
            this.moveTo(event.changedTouches[0].clientX, event.changedTouches[0].clientY);
        }
    }
}
AngularDraggableDirective.decorators = [
    { type: Directive, args: [{
                selector: '[ngDraggable]'
            },] },
];
/**
 * @nocollapse
 */
AngularDraggableDirective.ctorParameters = () => [
    { type: ElementRef, },
    { type: Renderer, },
];
AngularDraggableDirective.propDecorators = {
    'started': [{ type: Output },],
    'stopped': [{ type: Output },],
    'edge': [{ type: Output },],
    'handle': [{ type: Input },],
    'bounds': [{ type: Input },],
    'zIndexMoving': [{ type: Input },],
    'zIndex': [{ type: Input },],
    'inBounds': [{ type: Input },],
    'trackPosition': [{ type: Input },],
    'scale': [{ type: Input },],
    'ngDraggable': [{ type: Input },],
    'onMouseDown': [{ type: HostListener, args: ['mousedown', ['$event'],] },],
    'onMouseUp': [{ type: HostListener, args: ['document:mouseup',] },],
    'onMouseLeave': [{ type: HostListener, args: ['document:mouseleave',] },],
    'onMouseMove': [{ type: HostListener, args: ['document:mousemove', ['$event'],] },],
    'onTouchEnd': [{ type: HostListener, args: ['document:touchend',] },],
    'onTouchStart': [{ type: HostListener, args: ['touchstart', ['$event'],] },],
    'onTouchMove': [{ type: HostListener, args: ['document:touchmove', ['$event'],] },],
};

class AngularDraggableModule {
}
AngularDraggableModule.decorators = [
    { type: NgModule, args: [{
                declarations: [
                    AngularDraggableDirective
                ],
                exports: [
                    AngularDraggableDirective
                ]
            },] },
];
/**
 * @nocollapse
 */
AngularDraggableModule.ctorParameters = () => [];

/**
 * Generated bundle index. Do not edit.
 */

export { AngularDraggableModule, AngularDraggableDirective };
//# sourceMappingURL=angular2-draggable.js.map

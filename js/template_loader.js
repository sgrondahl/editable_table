
/*global $ jQuery _*/

function TemplateLoader(cb) {
    this.callback = cb;
    this.outstanding = [];
}

TemplateLoader.prototype.tryCallback = function() {
    if (this.outstanding.length ==  0) this.callback();
};

TemplateLoader.prototype.add = function(src, id) {
    this.outstanding.push({src : src, id : id});
};

TemplateLoader.prototype.resolveAll = function() {
    var self = this;
    _.each(this.outstanding, function(el) {
	(function(i) {
	    $.get(i.src, function(data) {
		$(document.createElement('script')).attr('type', 'text/template').attr('id', i.id).appendTo('body');
		self.tryCallback();
	    });
	})(el);
    });
};

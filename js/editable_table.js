/*global $ jQuery _ Model*/



function hasDuplicates(arr) {
    var seen = [];
    for (var i = 0; i < arr.length; i++) {
	if (seen.indexOf(arr[i]) < 0) {
	    seen.push(arr[i]);
	} else {
	    return true;
	}
    }
    return false;
};
 
var EditableTable = Model.extend(
{
    constructor : function(el, args) {
	var i;
	if (typeof args !== 'object') throw new Error('EditableTable constructor expects object args.');
	if (typeof args.fields !== 'object') throw new Error('EditableTable constructor expects args.fields to be field -> type array.');
	if (!args.field_order instanceof Array) throw new Error('EditableTable expects args.field_order to be ordered array of fields.');
	if (hasDuplicates(args.field_order)) throw new Error('args.field_order has duplicate entries');
	if (args.field_order.length != _.keys(args.fields).length) throw new Error('length mismatch between args.fields and args.field_order');
	for (i = 0; i < args.field_order.length; i++) {
	    if (!_.has(args.fields, args.field_order[i]))
		throw new Error('args.fields and args.field_order must contain the same fields!');
	}
	if (!args.editable instanceof Array) throw new Error('EditableTable expects args.editable to be array of editable fields.');
	if (args.editable.length < 1) throw new Error('args.editable should be >= 1, else this wouldn\'t be an editable table!');
	for (i = 0; i < args.editable.length; i++) {
	    if (args.field_order.indexOf(args.editable[i]) < 0)
		throw new Error('All editable fields must also show up in fields list. Found "'
				+ args.editable[i] + '" that violates this condition.');
	}
	this.fields = args.fields;
	this.field_order = args.field_order;
	this.editable = args.editable;
	this.entries = {};
	this.ordered_entries = [];
	this.onupdate = typeof args.onupdate === 'function' ? args.onupdate : function(d) { console.log(d); };
	this.$el = $(el);
	if (typeof args.entries === 'object') this.update(args.entries);
    },
    update : function(data) {
	var self = this;
	_.each(data, function(v, k) {
	    if (!_.has(self.entries, k)) {
		self.entries[k] = new EditableEntry({ fields : self.fields,
						      field_order : self.field_order,
						      editable : self.editable,
						      onupdate : self.onupdate});
		self.$tbody.append(self.entries[k].render());
	    }
	    self.entries[k].update(v);
	});
    },
    getSelected : function() {
	var od = {};
	_.each(this.entries, function(v, k) {
	    console.log(v);
	    if (v.selected()) od[k] = v.serialize();
	});
	return od;
    },
    sort : function(comparitor, order) {
	
    },
    bindSelectAll : function() {
	var self = this;
	this.$el.find('input[type="checkbox"][data-field="__selectall__"]:first').change(function() {
	    var ic = $(this).is(':checked');
	    _.each(self.entries, function(v, k) {
		if (ic) v.select();
		else v.deselect();
	    });
	});
    },
    render : function() {
	var template = $('#editable-table-template').html();
	this.$el.html(_.template(template, {field_order : this.field_order}));
	this.$tbody = this.$el.find('tbody:first');
	this.bindSelectAll();
    }
});

var EditableEntry = Model.extend(
{
    constructor : function(args) {
	this.fields = args.fields;
	this.field_order = args.field_order;
	this.editable = args.editable;
	this.onupdate = args.onupdate;
	this.$el = $(this.template());
	this.$checkbox = this.$el.find('input[type="checkbox"][data-field="__selected__"]');
	this.edits_timeout = undefined;
	this.bindEdits();
    },
    update : function(obj) {
	var self = this;
	_.each(obj, function(v, k) {
	    self.setField(k, v);
	});
    },
    template : function() {
	var tr = $(document.createElement('tr')),
	    self = this,
	    itd = $(document.createElement('td'));
	itd.append($(document.createElement('input')).attr('type', 'checkbox').attr('data-field', '__selected__'));
	tr.append(itd);
	_.each(this.field_order, function(f) {
	    var td = $(document.createElement('td'));
	    if (self.editable.indexOf(f) < 0) {
		td.append($(document.createElement('span')).attr('data-field', f));
	    } else {
		var tdi = $(document.createElement('input')).addClass('etr-input').attr('data-field', f);
		if (self.fields[f] === 'datetime') {
		    tdi.datetimepicker({
			timeFormat: 'hh:mmtt z'
		    });
		} else if (self.fields[f] === 'date') {
		    tdi.datepicker();
		} else if (self.fields[f] === 'time') {
		    tdi.timepicker();
		}
		td.append(tdi);
	    }
	    tr.append(td);
	});
	return tr;
    },
    render : function() {
	return this.$el;
    },
    getField : function(f) {
	var fel = this.$el.find('[data-field="'+f+'"]');
	if (!fel || fel.length === 0) return undefined;
	if (fel[0].tagName.toLowerCase() === 'input') return fel.val();
	else return fel.html();
    },
    setField : function(f, v) {
	var fel = this.$el.find('[data-field="'+f+'"]');
	if (!fel || fel.length === 0) return;
	if (fel[0].tagName.toLowerCase() === 'input') fel.val(v);
	else fel.html(v);
    },
    selected : function() {
	return this.$checkbox.is(':checked');
    },
    select : function() {
	this.$checkbox.prop('checked', true);
    },
    deselect : function() {
	this.$checkbox.prop('checked', false);
    },
    serialize : function() {
	var od = {},
	    self = this;
	_.each(this.field_order, function(f) {
	    od[f] = self.getField(f);
	});
	return od;
    },
    bindEdits : function() {
	var self = this;
	this.$el.find('input').change(function(){
	    window.clearTimeout(self.edits_timeout);
	    self.edits_timeout = window.setTimeout(function() {
		self.onupdate(self.serialize());
	    }, 1000);
	});
    }
});

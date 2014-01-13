/*global $ jQuery _ Model*/


/* 
 Require the following to be implemented :
 * notifyUpdate : simply a path to send post of updates
*/

function hasDuplicates(arr) {
    var seen = [];
    for (var i = 0; i < arr.length; i++) {
	if (seen.indexOf(i) < 0) {
	    seen.push(i);
	} else {
	    return false;
	}
    }
    return true;
};
 
var EditableTable = Model.extend(
{
    constructor : function(args) {
	var i;
	if (typeof args !== 'object') throw new Error('EditableTable constructor expects object args.');
	if (typeof args.fields !== 'object') throw new Error('EditableTable constructor expects args.fields to be field -> type array.');
	if (!args.field_order instanceof Array) throw new Error('EditableTable expects args.field_order to be ordered array of fields.');
	if (hasDuplicates(args.field_order)) throw new Error('args.field_order has duplicate entries');
	if (args.field_order.length != args.fields.length) throw new Error('length mismatch between args.fields and args.field_order');
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
	if (typeof args.entries === 'object') this.update(args.entries);
    },
    update : function(data) {
	
    },
    getSelected : function() {
	var od = {};
	_.each(this.entries, function(k,v) {
	    if (v.selected()) od[k] = v.serialize();
	});
	return od;
    },
    sort : function(comparitor, order) {
	
    }
},
{
    template : _.template($('#editable-table-template').html())
});

var EditableEntry = Model.extend(
{
    constructor : function(args) {
	this.selected = false;
	this.fields = args.fields;
	this.field_order = args.field_order;
	this.editable = args.editable;
	this.$el = $(this.template());
	this.update(args.values);
    },
    update : function(obj) {
	var self = this;
	_.each(obj, function(k, v) {
	    self.setField(k, v);
	});
    },
    template : function() {
	var tr = $(document.createElement('tr')),
	    self = this;
	tr.append($(document.createElement('input')).attr('type', 'checkbox').attr('data-field', '__selected__'));
	_.each(this.field_order, function(f) {
	    var td = $(document.createElement('td'));
	    if (self.editable.indexOf(f) < 0) {
		tr.append($(document.createElement('span')).attr('data-field', f));
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
		tr.append(tdi);
	    }
	    tr.append(td);
	});
	return tr;
    },
    getField : function(f) {
	var fel = this.$el.find('[data-field="'+f+'"]');
	if (f[0].tagName.toLowerCase() === 'input') return f.val();
	else return f.html();
    },
    setField : function(f, v) {
	var fel = this.$el.find('[data-field="'+f+'"]');
	if (f[0].tagName.toLowerCase() === 'input') fel.val(v);
	else fel.html(v);
    },
    selected : function() {
	return this.$el.find('input[type="checkbox"][data-field="__selected__"]').is(':checked');
    },
    serialize : function() {
	var od = {},
	    self = this;
	_.each(this.field_order, function(f) {
	    od[f] = self.getField(f);
	});
	return od;
    }
},
{
    template : _.template($('#editable-entry-template').html())
});

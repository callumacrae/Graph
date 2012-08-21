/**
 * Return a new graph object.
 *
 * @param {object} element The element to turn into a graph
 * @param {int} width The width of the graph to create
 * @param {int} height The height of the graph to create
 * @constructor
 */
function Graph(element, width, height) {
	this.element = element;
	this.width = width;
	this.height = height;

	this.paper = new Raphael(element, width, height);
}

Graph.prototype.draw = function (info) {

};

if (typeof jQuery !== 'undefined') {
	jQuery.fn.graph = function (width, height) {
		return new Graph(this[0], width, height);
	};
}
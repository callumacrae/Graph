/**
 * Return a new graph object.
 *
 * @param {object} element The element to turn into a graph
 * @param {int} width The width of the graph to create
 * @param {int} height The height of the graph to create
 * @constructor
 */
function Graph(element, width, height) {
	// Optionally allow no new constructor
	if (!(this instanceof Graph)) {
		return new Graph(element, width, height);
	}

	// Store for later use
	this.element = element;
	this.width = width;
	this.height = height;

	this.paper = new Raphael(element, width, height);

	// Attributes to be set by .attr
	this.attrs = {
		pointColor: 'red', // Colour of points
		pointOpacity: 1, // Opacity of point
		lineColor: 'black', // Colour of lines
		lineOpacity: 1, // Opacity of line
		lineWidth: 1 // Width of line in pixels
	};
}

/**
 * Custom error class for use by the Graph object.
 *
 * @param {string} message The error message.
 * @constructor
 */
function GraphError(message){
	this.name = 'GraphError';
	this.message = message;
}
GraphError.prototype = new Error();
GraphError.prototype.constructor = GraphError;

/**
 * Draw a graph from the specified information.
 *
 * @param {object} info Object containing information. Should include a "type"
 *  property, saying what type of graph should be created, and a "title"
 *  property containing the title of the graph. See the relevant function below
 *  (eg .drawLineGraph for line graphs) to see what other properties the object
 *  should contain.
 */
Graph.prototype.draw = function (info) {
	switch (info.type) {
		case 'line':
			this.drawLineGraph(info);
			break;

		case 'scatter':
			this.drawScatterGraph(info);
			break;

		// Throw error if graph type does not exist
		default:
			throw new GraphError('Graph type does not exist');
			break;
	}
};

/**
 * Draws a line graph. This is an internal function to get rid of some
 * indentation that would be required if it were in the above switch statement,
 * but is still useful for the documentation below.
 *
 * @private
 *
 * @param {object} info Object containing the following properties:
 *  line: straight, curved or best fit
 *  x: The name of the data on the x axis (will be used in the data objects).
 *      If not specified, will default to "x".
 *  y: The name of the data on the y axis (will be used in the data objects).
 *      If not specified, will default to "y".
 *  data: An array containing "data objects", saying where points should be.
 *      A data object could be like this (if the x and y properties mentioned
 *      above are set to "age" and "height"):
 *      {age: 12, height: 145}
 */
Graph.prototype.drawLineGraph = function (info) {
	var attrs = this.attrs,
		line, prevX, prevY;

	// Draw scatter graph
	this.drawScatterGraph(info);

	// Join dots
	switch (info.line) {
		case 'curved':
			this.each(info.data, function (point, i) {
				if (i === 0) {
					line = 'M' + point.xpos + ' ' + point.ypos + 'R';
				} else {
					line += ' ' + point.xpos + ' ' + point.ypos;
				}
			});
			break;

		case 'straight':
		default:
			this.each(info.data, function (point, i) {
				if (i === 0) {
					line = 'M' + point.xpos + ' ' + point.ypos;
				} else {
					line += 'l' + (point.xpos - prevX) + ' ' + (point.ypos - prevY);
				}
				prevX = point.xpos;
				prevY = point.ypos;
			});
			break;
	}

	// Cases that do not want this should return
	this.path = this.paper.path(line);
	this.path.attr({
		'stroke': attrs.lineColor,
		'stroke-opacity': attrs.lineOpacity,
		'stroke-width': attrs.lineWidth
	});
	this.path.toBack();
};

/**
 * Draws a scatter graph. This is an internal function to get rid of some
 * indentation that would be required if it were in the above switch statement,
 * but is still useful for the documentation below.
 *
 * @private
 *
 * @param {object} info Object containing the following properties:
 *  x: The name of the data on the x axis (will be used in the data objects).
 *      If not specified, will default to "x".
 *  y: The name of the data on the y axis (will be used in the data objects).
 *      If not specified, will default to "y".
 *  data: An array containing "data objects", saying where points should be.
 *      A data object could be like this (if the x and y properties mentioned
 *      above are set to "age" and "height"):
 *      {age: 12, height: 145}
 */
Graph.prototype.drawScatterGraph = function (info) {
	var paper = this.paper,
		attrs = this.attrs,
		height = this.height,
		width = this.width,
		perc5, maxX, maxY, minX, minY, x, y;

	x = info.x || 'x';
	y = info.y || 'y';

	if (x === 'xpos' || y === 'ypos') {
		throw new GraphError('Cannot use xpos or ypos as x and y keys');
	}

	maxX = minX = info.data[0][x];
	maxY = minY = info.data[0][y];

	// Sort the data - first by x, then by y. Also get minX, maxY, etc.
	info.data.sort(function (a, b) {
		if (a[x] > maxX) {
			maxX = a[x];
		} else if (a[x] < minX) {
			minX = a[x];
		}

		if (a[y] > maxY) {
			maxY = a[y];
		} else if (a[y] < minY) {
			minY = a[y];
		}

		if (a[x] === b[x]) {
			return a[y] - b[y];
		}
		return a[x] - b[x];
	});

	// Increase minX, maxY, etc. by 5%
	perc5 = (maxX - minX) / 20;
	maxX += perc5;
	minX -= perc5;
	perc5 = (maxY - minY) / 20;
	maxY += perc5;
	minY -= perc5;

	// Draw the points
	this.each(info.data, function (point) {
		point.xpos = width / (maxX - minX) * (point[x] - minX);
		point.ypos = height / (maxY - minY) * (maxY - point[y]);

		point.point = paper.circle(point.xpos, point.ypos, 5);
		point.point.attr({
			fill: attrs.pointColor,
			stroke: attrs.pointColor,
			opacity: attrs.pointOpacity
		});
	});
};

/**
 * Internal function for looping through arrays and objects.
 *
 * @private
 * 
 * @param {Array|object} ary Array or object to loop through.
 * @param {function} cb Function to call on each item.
 */
Graph.prototype.each = function (ary, cb) {
	if (this.isArray(ary)) {
		for (var i = 0; i < ary.length; i++) {
			cb(ary[i], i);
		}
	} else {
		for (var prop in ary) {
			if (ary.hasOwnProperty(prop)) {
				cb(prop, ary[prop]);
			}
		}
	}
	
	return this;
};

/**
 * Internal function for detecting whether objects are arrays.
 *
 * @private
 *
 * @param {*} value Object to test.
 * @return {boolean} Returns true if object is array.
 */
Graph.prototype.isArray = function (value) {
	return Object.prototype.toString.call(value) === '[object Array]';
};

/**
 * Set graph attributes. Accepts either two arguments (name and value, sets
 * name attribute to value), or an object of attributes to set.
 *
 * @param {object|string} name Either name of attribute to set, or object of
 *  attributes to cycle through.
 * @param value If name is string, name attribute will be set to this.
 */
Graph.prototype.attr = function (name, value) {
	var attrs = this.attrs;

	if (typeof name === 'object') {
		this.each(name, function (attr, value) {
			attrs[attr] = value;
		});
	} else {
		attrs[name] = value;
	}

	return this;
};


// If jQuery library is loaded, create a jQuery.fn.graph function.
if (typeof jQuery !== 'undefined') {
	/**
	 * Turn element into a graph.
	 *
	 * @param {int} width Width of graph to create.
	 * @param {int} height Height of graph to create.
	 *
	 * @return {Graph} The created graph.
	 */
	jQuery.fn.graph = function (width, height) {
		return new Graph(this[0], width, height);
	};
}
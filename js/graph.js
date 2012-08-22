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
		animate: 'none', // Animation. none / bounce / linear
		animateTime: 1000, // Animation time in ms
		barBorderColor: 'black',
		barColor: 'red', // Colour of bars (can be a function)
		barHoverColor: 'darkgray',
		barOpacity: 1, // Opacity of bars
		cursor: 'default', // Cursor (default "default")
		gridLineWidth: 1, // Width of grid line in pixels
		gridLineColor: 'gray', // Color of grid line
		gridLineOpacity: 0.8, // Opacity of grid line
		pointColor: 'red', // Colour of points
		pointHoverColor: 'darkred', // Colour of points on hover
		pointOpacity: 1, // Opacity of point
		pointRadius: 5, // Radius of point
		lineColor: 'black', // Colour of lines
		lineOpacity: 1, // Opacity of line
		lineWidth: 1, // Width of line in pixels
		segmentBorderColor: 'black', // Colour of border of pie chart segments
		segmentColor: 'red', // Colour of pie chart segment
		segmentHoverColor: 'darkgray', // Colour of pie chart segment on hover
		segmentOpacity: 1, // Opacity of pie chart segment
		segmentRadius: 100, // Radius of pie chart segments
		showGrid: false, // Whether to show the grid-thing or not
		textPosition: 'right' // Position of text (left, right, center)
	};

	this.attrs.hoverText = function (point, x, y) {
		return x + ': ' + point[x] + ', ' + y + ': ' + point[y];
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
	var cursor;

	switch (info.type) {
		case 'bar':
			this.drawBarChart(info);
			break;

		case 'line':
			this.drawLineGraph(info);
			break;

		case 'pie':
			this.drawPieChart(info);
			break;

		case 'scatter':
			this.drawScatterGraph(info);
			break;

		// Throw error if graph type does not exist
		default:
			throw new GraphError('Graph type does not exist');
			break;
	}

	this.setText(info.title);

	cursor = this.getAttr('cursor');
	if (cursor === 'default' && this.getAttr('showGrid')) {
		this.element.style.cursor = 'none';
	} else if (cursor !== 'default') {
		this.element.style.cursor = cursor;
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
	var line, prevX, prevY;

	// Draw scatter graph
	if (info.line !== 'best fit') {
		this.attr('animate', 'none');
	}
	this.drawScatterGraph(info);

	// Join dots
	switch (info.line) {
		case 'best fit':
			var b, gradient, xsum, ysum, xysum, xxsum, yysum, n;
			xsum = ysum = xysum = xxsum = yysum = 0;
			n = info.data.length;

			this.each(info.data, function (point) {
				xsum += point.xpos;
				ysum += point.ypos;
				xysum += point.xpos * point.ypos;
				xxsum += Math.pow(point.xpos, 2);
				yysum += Math.pow(point.ypos, 2);
			});

			gradient = (n * xysum - xsum * ysum) / (n * xxsum - xsum * xsum);
			b = (xxsum * ysum - xsum * xysum) / (n * xxsum - xsum * xsum);

			line = 'M0 ' + Math.round(b) + 'l' + (b / -gradient) + ' ' + Math.round(-b);
			break;

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
					line += 'l' + (point.xpos - prevX) +
						' ' + (point.ypos - prevY);
				}
				prevX = point.xpos;
				prevY = point.ypos;
			});
			break;
	}

	// Cases that do not want this should return
	this.path = this.paper.path(line);
	this.path.attr({
		'stroke': this.getAttr('lineColor'),
		'stroke-opacity': this.getAttr('lineOpacity'),
		'stroke-width': this.getAttr('lineWidth')
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
		height = this.height,
		width = this.width,
		attr, graphX, graphY, perc5, maxX, maxY, minX, minY, mousein,
		mousemoveHandler, mouseoutHandler, x, y;

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
	this.each(info.data, function (point, i) {
		point.xpos = width / (maxX - minX) * (point[x] - minX);
		point.ypos = height / (maxY - minY) * (maxY - point[y]);

		var attrArgs = [{
			x: point[x],
			minX: minX,
			maxX: maxX,
			y: point[y],
			minY: minY,
			maxY: maxY
		}],
			color = this.getAttr('pointColor', attrArgs),
			radius = this.getAttr('pointRadius', [point[y], maxY]),
			animate = this.getAttr('animate'),
			animateTime = this.getAttr('animateTime', [i]);

		if (animate !== 'none') {
			point.point = paper.circle(point.xpos, point.ypos, 0);
			setTimeout(function () {
				point.point.animate({
					r: radius
				}, animateTime, animate);
			}, i * animateTime / 10);
		} else {
			point.point = paper.circle(point.xpos, point.ypos, radius);
		}

		point.point.attr({
			fill: color,
			stroke: color,
			opacity: this.getAttr('pointOpacity', attrArgs)
		});

		point.point.hover(function () {
			var hoverColor = this.getAttr('pointHoverColor', attrArgs);
			if (hoverColor) {
				point.point.attr({
					fill: hoverColor,
					stroke: hoverColor
				});
			}
			this.setText(this.getAttr('hoverText', [point, x, y]));
		}, function () {
			point.point.attr({
				fill: color,
				stroke: color
			});
			this.setText(info.title);
		}, this);
	}, this);

	if (this.getAttr('showGrid')) {
		graphX = paper.path('M0 0l0 0').toBack().hide();
		graphY = paper.path('M0 0l0 0').toBack().hide();

		attr = {
			'opacity': this.getAttr('gridLineOpacity'),
			'stroke-width': this.getAttr('gridLineWidth'),
			'stroke': this.getAttr('gridLineColor')
		};
		graphX.attr(attr);
		graphY.attr(attr);

		mousein = false;

		mousemoveHandler = function (e) {
			var x = e.offsetX;
			var y = e.offsetY;

			graphX.attr('path', 'M0 ' + y + 'l' + width + ' 0');
			graphY.attr('path', 'M' + x + ' 0' + 'l0' + ' ' + height);

			if (!mousein) {
				graphX.show().toBack();
				graphY.show().toBack();

				mousein = true;
			}
		};

		mouseoutHandler = function (e) {
			// TODO: Fix this
			if (false) {
				mousein = false;

				graphX.hide();
				graphY.hide();
			}
		};

		if (this.element.addEventListener) {
			this.element.addEventListener('mousemove', mousemoveHandler);
			this.element.addEventListener('mouseout', mouseoutHandler);
		} else {
			this.element.attachEvent('onmousemove', mousemoveHandler);
			this.element.attachEvent('onmouseout', mouseoutHandler);
		}
	}
};

/**
 * Draws a bar chart. This is an internal function to get rid of some
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
 *  data: An array containing "data objects", saying where bars should be.
 *      A data object could be like this (if the x and y properties mentioned
 *      above are set to "age" and "height"):
 *      {person: 'Bob', cakes: 7}
 */
Graph.prototype.drawBarChart = function (info) {
	var paper = this.paper,
		height = this.height,
		width = this.width,
		barWidth, length, maxY, x, y;

	x = info.x || 'x';
	y = info.y || 'y';

	if (x === 'xpos' || y === 'ypos') {
		throw new GraphError('Cannot use xpos or ypos as x and y keys');
	}

	// Work out maxY and add 5%
	maxY = info.data[0][y];
	this.each(info.data, function (bar) {
		if (bar[y] > maxY) {
			maxY = bar[y];
		}
	});
	maxY *= 1.05;

	length = info.data.length;
	barWidth = width / length * 0.8;

	// Draw the bars
	this.each(info.data, function (point, index) {
		var animate = this.getAttr('animate'),
			animateTime = this.getAttr('animateTime'),
			bar, color;

		point.xpos = width / length * (index + 0.1);
		point.ypos = (height - height / maxY * point[y] - 2);
		point.barHeight = height - point.ypos - 1;

		if (animate === 'none') {
			bar = paper.rect(point.xpos, point.ypos, barWidth, point.barHeight);
		} else {
			bar = paper.rect(point.xpos, point.ypos + point.barHeight, barWidth, 0);
			setTimeout(function () {
				bar.animate({
					y: point.ypos,
					height: point.barHeight
				}, animateTime, animate);
			}, index * animateTime / 10)
		}
		color = this.getAttr('barColor', [point[y], maxY]);

		point.bar = bar;
		bar.attr({
			'stroke': this.getAttr('barBorderColor', [point[y], maxY]),
			'fill': color,
			'opacity': this.getAttr('barOpacity', [point[y], maxY])
		});

		bar.hover(function () {
			bar.attr('fill', this.getAttr('barHoverColor', [point[y], maxY]));
			this.setText(this.getAttr('hoverText', [point, x, y]));
		}, function () {
			bar.attr('fill', color);
			this.setText(info.title);
		}, this);
	}, this);
};

/**
 * Draws a pie chart. This is an internal function to get rid of some
 * indentation that would be required if it were in the above switch statement,
 * but is still useful for the documentation below.
 *
 * @private
 *
 * @param {object} info Object containing the following properties:
 *  dataName: The name of the data on the x axis (will be used in the data
 *      objects). If not specified, will default to "x".
 *  dataData: The name of the data on the y axis (will be used in the data
 *      objects). If not specified, will default to "y".
 *  data: An array containing "data objects", saying where bars should be.
 *      A data object could be like this (if the dataName and dataData
 *      properties mentioned above are set to "age" and "height"):
 *      {person: 'Bob', cakes: 7}
 */
Graph.prototype.drawPieChart = function (info) {
	var paper = this.paper,
		width = this.width,
		height = this.height,
		angle = 0,
		name, data, maxData, totalData;

	name = info.dataName || 'name';
	data = info.dataData || 'data';

	// Work out maxData and totalData
	maxData = info.data[0][data];
	totalData = 0;
	this.each(info.data, function (segment) {
		totalData += segment[data];
		if (segment[data] > maxData) {
			maxData = segment[data];
		}
	});
	maxData *= 1.05;

	function sectorPath(cx, cy, r, startAngle, degrees) {
		var rad = Math.PI / 180,
			x1 = cx + r * Math.cos(-startAngle * rad),
			x2 = cx + r * Math.cos(-(startAngle + degrees) * rad),
			y1 = cy + r * Math.sin(-startAngle * rad),
			y2 = cy + r * Math.sin(-(startAngle + degrees) * rad);
		return ['M', cx, cy, 'L', x1, y1,
			'A', r, r, 0, +(degrees > 180), 0, x2, y2, 'z'];
	}

	// Draw segments
	this.each(info.data, function (segment, i) {
		var degrees = 360 / totalData * segment[data],
			args = [segment[data], maxData],
			borderColor = this.getAttr('segmentBorderColor', args),
			color = this.getAttr('segmentColor', args),
			radius = this.getAttr('segmentRadius', args),
			opacity = this.getAttr('segmentOpacity', args),
			animate = this.getAttr('animate'),
			animateTime = this.getAttr('animateTime'),
			line;

		if (animate === 'none') {
			line = sectorPath(width / 2, height / 2, radius, angle, degrees);
			segment.segment = paper.path(line);
		} else {
			line = sectorPath(width / 2, height / 2, 1, angle, degrees);
			segment.segment = paper.path(line);

			line = sectorPath(width / 2, height / 2, radius, angle, degrees);
			setTimeout(function () {
				segment.segment.animate({
					path: line
				}, animateTime, animate);
			}, i * animateTime / 10)
		}

		angle += degrees;

		segment.segment.attr({
			stroke: borderColor,
			fill: color,
			opacity: opacity
		});

		segment.segment.hover(function () {
			segment.segment.attr({
				fill: this.getAttr('segmentHoverColor', args)
			});
			this.setText(this.getAttr('hoverText', [segment, name, data]));
		}, function () {
			segment.segment.attr('fill', color);
			this.setText(info.title);
		}, this);
	}, this);
};

/**
 * Set graph text. Isn't the most efficient of functions, but will do.
 *
 * @param {string} text The text to change to.
 */
Graph.prototype.setText = function (text) {
	var tmpTextNode = this.paper.text(this.width / 2, 15, text),
		textWidth = tmpTextNode[0].clientWidth,
		textPosition = this.getAttr('textPosition'),
		x;

	if (typeof this.textNode !== 'undefined') {
		this.textNode.remove();
	}

	if (textPosition === 'center') {
		this.textNode = tmpTextNode; // Not so tmp...
		return;
	}

	tmpTextNode.remove();

	if (textPosition === 'left') {
		x = textWidth / 2 + 10;
	} else {
		x = this.width - textWidth / 2 - 10;
	}

	this.textNode = this.paper.text(x, 15, text);
	this.textNode.toFront();
};

/**
 * Internal function for looping through arrays and objects.
 *
 * @private
 * 
 * @param {Array|object} ary Array or object to loop through.
 * @param {function} cb Function to call on each item.
 */
Graph.prototype.each = function (ary, cb, scope) {
	if (typeof scope === 'undefined') {
		scope = this;
	}

	if (this.isArray(ary)) {
		for (var i = 0; i < ary.length; i++) {
			cb.call(scope, ary[i], i);
		}
	} else {
		for (var prop in ary) {
			if (ary.hasOwnProperty(prop)) {
				cb.call(scope, prop, ary[prop]);
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

/**
 * Get attribute for internal usage. If it is a function, it will be evaluated
 * and the result returned, else the attribute will be returned.
 *
 * @private
 *
 * @param {string} name The name of the attribute.
 * @param {Array} data Data to be given to the attribute if it is a function.
 *
 * @return {*} Usually a string or a number.
 */
Graph.prototype.getAttr = function (name, data) {
	if (typeof this.attrs[name] === 'function') {
		return this.attrs[name].apply(null, data);
	} else {
		return this.attrs[name];
	}
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
/**
 * Return a new graph object.
 *
 * @param {object} element The element to turn into a graph
 * @param {int} width The width of the graph to create
 * @param {int} height The height of the graph to create
 * @constructor
 */
function Graph(element, width, height) {
	"use strict";

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
		ajaxLoading: true, // Display a loading sign when waiting for AJAX?
		animate: 'none', // Animation. none / bounce / linear
		animateTime: 1000, // Animation time in ms
		barBorderColor: 'black',
		barColor: 'red', // Colour of bars (can be a function)
		barHoverColor: 'darkgray',
		barOpacity: 1, // Opacity of bars
		barWidth: 0.8, // Width of bars (default 0.8)
		cursor: 'default', // Cursor (default "default")
		direction: 'vertical', // Direction of bars in bar chart
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
		loadingText: 'Loading...', // Text to display when loading
		segmentBorderColor: 'black', // Colour of border of pie chart segments
		segmentColor: 'red', // Colour of pie chart segment
		segmentHoverColor: 'darkgray', // Colour of pie chart segment on hover
		segmentOpacity: 1, // Opacity of pie chart segment
		segmentRadius: 100, // Radius of pie chart segments
		showGrid: false, // Whether to show the grid-thing or not
		textFont: 'Arial', // Font family of all text
		textSize: 10, // Font size of all text
		textOpacity: 1, // Opacity of all text
		textColor: 'black', // Colour of all text
		titlePosition: 'right' // Position of title (left, right, center)
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
function GraphError(message) {
	"use strict";

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
 *  @param {object} originalData Original data. Used internally, and only for
 *  redrawing in case of AJAX data.
 */
Graph.prototype.draw = function (info, originalData) {
	"use strict";

	var cursor, text, that;

	this.setText(info.title);

	if (typeof info.attrs === 'object') {
		this.attr(info.attrs);
	}

	if (typeof info.data === 'string') {
		info.data = {
			url: info.data
		};
	}

	if (!Graph.isArray(info.data)) {
		that = this;

		if (this.attr('ajaxLoading')) {
			text = this.attr('loadingText');
			text = this.paper.text(this.width / 2, this.height / 2, text);

			text.attr({
				'font-family': this.attr('textFont'),
				'font-size': this.attr('textSize'),
				'opacity': this.attr('textOpacity'),
				'fill': this.attr('textColor')
			});
		}

		Graph.ajax.get(info.data.url, info.data.data, function (body) {
			var originalData = info.data;
			info.data = (typeof body === 'object') ? body : JSON.parse(body);
			that.paper.clear();
			that.draw(info, originalData);
		});

		return;
	}

	this.info = info;
	this.originalData = originalData;

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
	}

	cursor = this.attr('cursor');
	if (cursor === 'default' && this.attr('showGrid')) {
		this.element.style.cursor = 'none';
	} else if (cursor !== 'default') {
		this.element.style.cursor = cursor;
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
 *      above are set to "person" and "cakes"):
 *      {person: 'Bob', cakes: 7}
 */
Graph.prototype.drawBarChart = function (info) {
	"use strict";

	var paper = this.paper,
		height = this.height,
		width = this.width,
		length, maxY, tmp, x, y;

	x = info.x || 'x';
	y = info.y || 'y';

	if (x === 'xpos' || y === 'ypos') {
		throw new GraphError('Cannot use xpos or ypos as x and y keys');
	}

	// Work out maxY and add 5%
	maxY = info.data[0][y];
	Graph.each(info.data, function (bar) {
		if (bar[y] > maxY) {
			maxY = bar[y];
		}
	});
	maxY *= 1.05;

	if (this.attr('direction') === 'horizontal') {
		tmp = width;
		width = height;
		height = tmp;
	}

	length = info.data.length;

	// Draw the bars
	Graph.each(info.data, function (point, index) {
		var animate = this.attr('animate'),
			animateTime = this.attr('animateTime'),
			bar, barWidth, color, lenWidth;

		lenWidth = width / length;

		barWidth = lenWidth * this.attr('barWidth', [point[y], maxY]);
		point.xpos = lenWidth * index + (lenWidth - barWidth) / 2;
		point.ypos = (height - height / maxY * point[y] - 2);
		point.barHeight = height - point.ypos - 1;

		if (animate === 'none') {
			if (this.attr('direction') === 'horizontal') {
				bar = paper.rect(5, point.xpos, point.barHeight, barWidth);
			} else {
				bar = paper.rect(point.xpos, point.ypos, barWidth, point.barHeight);
			}
		} else {
			if (this.attr('direction') === 'horizontal') {
				bar = paper.rect(5, point.xpos, 0, barWidth);
				setTimeout(function () {
					bar.animate({
						width: point.barHeight
					}, animateTime, animate);
				}, index * animateTime / 10);
			} else {
				bar = paper.rect(point.xpos, point.ypos + point.barHeight, barWidth, 0);
				setTimeout(function () {
					bar.animate({
						y: point.ypos,
						height: point.barHeight
					}, animateTime, animate);
				}, index * animateTime / 10);
			}
		}
		color = this.attr('barColor', [point[y], maxY]);

		point.bar = bar;
		bar.attr({
			'stroke': this.attr('barBorderColor', [point[y], maxY]),
			'fill': color,
			'opacity': this.attr('barOpacity', [point[y], maxY])
		});

		bar.hover(function () {
			bar.attr('fill', this.attr('barHoverColor', [point[y], maxY]));
			this.setText(this.attr('hoverText', [point, x, y]));
		}, function () {
			bar.attr('fill', color);
			this.setText(info.title);
		}, this);
	}, this);
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
	"use strict";

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

			Graph.each(info.data, function (point) {
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
			Graph.each(info.data, function (point, i) {
				if (i === 0) {
					line = 'M' + point.xpos + ' ' + point.ypos + 'R';
				} else {
					line += ' ' + point.xpos + ' ' + point.ypos;
				}
			});
			break;

		//case 'straight':
		default:
			Graph.each(info.data, function (point, i) {
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
		'stroke': this.attr('lineColor'),
		'stroke-opacity': this.attr('lineOpacity'),
		'stroke-width': this.attr('lineWidth')
	});
	this.path.toBack();
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
 *      properties mentioned above are set to "person" and "cakes"):
 *      {person: 'Bob', cakes: 7}
 */
Graph.prototype.drawPieChart = function (info) {
	"use strict";

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
	Graph.each(info.data, function (segment) {
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
	Graph.each(info.data, function (segment, i) {
		var degrees = 360 / totalData * segment[data],
			args = [segment[data], maxData],
			borderColor = this.attr('segmentBorderColor', args),
			color = this.attr('segmentColor', args),
			radius = this.attr('segmentRadius', args),
			opacity = this.attr('segmentOpacity', args),
			animate = this.attr('animate'),
			animateTime = this.attr('animateTime'),
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
			}, i * animateTime / 10);
		}

		angle += degrees;

		segment.segment.attr({
			stroke: borderColor,
			fill: color,
			opacity: opacity
		});

		segment.segment.hover(function () {
			segment.segment.attr({
				fill: this.attr('segmentHoverColor', args)
			});
			this.setText(this.attr('hoverText', [segment, name, data]));
		}, function () {
			segment.segment.attr('fill', color);
			this.setText(info.title);
		}, this);
	}, this);
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
	"use strict";

	var element = this.element,
		paper = this.paper,
		height = this.height,
		width = this.width,
		attr, graphX, graphY, perc5, maxX, maxY, minX, minY, mousein,
		mousemoveHandler, mouseoutHandler, that, x, y;

	x = info.x || 'x';
	y = info.y || 'y';

	if (x === 'xpos' || y === 'ypos') {
		throw new GraphError('Cannot use xpos or ypos as x and y keys');
	}

	maxX = minX = info.data[0][x];
	maxY = minY = info.data[0][y];

	// Sort the data - first by x, then by y
	info.data.sort(function (a, b) {
		if (a[x] === b[x]) {
			return a[y] - b[y];
		}
		return a[x] - b[x];
	});

	// Get minY, maxX, etc.
	Graph.each(info.data, function (point) {
		if (point[x] > maxX) {
			maxX = point[x];
		} else if (point[x] < minX) {
			minX = point[x];
		}

		if (point[y] > maxY) {
			maxY = point[y];
		} else if (point[y] < minY) {
			minY = point[y];
		}
	});

	// Increase minX, maxY, etc. by 5%
	perc5 = (maxX - minX) / 20;
	maxX += perc5;
	minX -= perc5;
	perc5 = (maxY - minY) / 20;
	maxY += perc5;
	minY -= perc5;

	// Draw the points
	Graph.each(info.data, function (point, i) {
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
			color = this.attr('pointColor', attrArgs),
			radius = this.attr('pointRadius', [point[y], maxY]),
			animate = this.attr('animate'),
			animateTime = this.attr('animateTime', [i]);

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
			opacity: this.attr('pointOpacity', attrArgs)
		});

		point.point.hover(function () {
			var hoverColor = this.attr('pointHoverColor', attrArgs);
			if (hoverColor) {
				point.point.attr({
					fill: hoverColor,
					stroke: hoverColor
				});
			}
			this.setText(this.attr('hoverText', [point, x, y]));
		}, function () {
			point.point.attr({
				fill: color,
				stroke: color
			});
			this.setText(info.title);
		}, this);
	}, this);

	if (this.attr('showGrid')) {
		graphX = paper.path('M0 0l0 0').toBack().hide();
		graphY = paper.path('M0 0l0 0').toBack().hide();

		attr = {
			'opacity': this.attr('gridLineOpacity'),
			'stroke-width': this.attr('gridLineWidth'),
			'stroke': this.attr('gridLineColor')
		};
		graphX.attr(attr);
		graphY.attr(attr);

		mousein = false;

		mousemoveHandler = function (e) {
			var x = e.offsetX,
				y = e.offsetY,
				target = e.target ? e.target : e.srcElement;

			if (target.tagName === 'tspan') {
				mousein = false;

				graphX.hide();
				graphY.hide();
			} else {
				graphX.attr('path', 'M0 ' + y + 'l' + width + ' 0');
				graphY.attr('path', 'M' + x + ' 0' + 'l0' + ' ' + height);

				if (!mousein) {
					graphX.show().toBack();
					graphY.show().toBack();

					mousein = true;
				}
			}
		};

		mouseoutHandler = function (e) {
			var x = e.pageX,
				y = e.pageY;

			if (mousein && (x < element.offsetLeft ||
				x > element.offsetLeft + element.clientWidth ||
				y < element.offsetTop ||
				y > element.offsetTop + element.clientHeight)) {
				mousein = false;

				graphX.hide();
				graphY.hide();
			}
		};

		this.mousemove(mousemoveHandler);
		Graph.events.add(document, 'mousemove', mouseoutHandler);

		this._removeListeners = function () {
			this.unmousemove(mousemoveHandler);
			Graph.events.remove(document, 'mousemove', mouseoutHandler);
		};
	}
};

/**
 * Set or get graph attributes. Accepts either two arguments (name and value,
 * sets name attribute to value), or an object of attributes to set. You can
 * also use it to retrieve an attribute (mostly for internal usage only). If
 * value is undefined or an array, then it will get the attribute.
 *
 * @param {object|string} name Either name of attribute to set, or object of
 *  attributes to cycle through.
 * @param {string|int|Array} value Value to set name attribute to, or array
 *  to be used as arguments when attribute function is called.
 */
Graph.prototype.attr = function (name, value) {
	"use strict";

	var attrs = this.attrs;

	if (typeof name === 'object') {
		Graph.each(name, function (attr, value) {
			this.attr(attr, value);
		}, this);
	} else if (typeof value === 'undefined' || Graph.isArray(value)) {
		if (typeof attrs[name] === 'function') {
			return attrs[name].apply(null, value);
		} else {
			return attrs[name];
		}
	} else {
		attrs[name] = value;

		if (name === 'title') {
			this.info.title = value;
			this.setText(value);
		}
	}

	return this;
};

/**
 * Internal function for looping through arrays and objects.
 *
 * @private
 *
 * @param {Array|object} ary Array or object to loop through.
 * @param {function} cb Function to call on each item.
 */
Graph.each = function (ary, cb, scope) {
	"use strict";

	if (typeof scope === 'undefined') {
		scope = this;
	}

	if (Graph.isArray(ary)) {
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
Graph.isArray = function (value) {
	"use strict";

	return Object.prototype.toString.call(value) === '[object Array]';
};

/**
 * Redraws graph. Deleted old information and starts again.
 *
 * @param {object} info New info (optional).
 */
Graph.prototype.redraw = function (info) {
	"use strict";

	this.paper.clear();
	if (this._removeListeners) {
		this._removeListeners();
		delete this._removeListeners;
	}

	if (typeof info !== 'object') {
		info = this.info;
		if (this.originalData) {
			info.data = this.originalData;
		}
	}
	this.draw(info);

	return this;
};

/**
 * Set graph text. Isn't the most efficient of functions, but will do.
 *
 * @param {string} text The text to change to.
 */
Graph.prototype.setText = function (text) {
	"use strict";

	var tmpTextNode = this.paper.text(this.width / 2, 15, text),
		textWidth = tmpTextNode[0].clientWidth,
		textPosition = this.attr('titlePosition'),
		x;

	if (typeof this.textNode !== 'undefined') {
		this.textNode.remove();
	}

	if (textPosition === 'center') {
		this.textNode = tmpTextNode; // Not so tmp...
		tmpTextNode.attr({
			'cursor': 'text',
			'font-family': this.attr('textFont'),
			'font-size': this.attr('textSize'),
			'opacity': this.attr('textOpacity'),
			'fill': this.attr('textColor')
		});
		return;
	}

	tmpTextNode.remove();

	if (textPosition === 'left') {
		x = textWidth / 2 + 10;
	} else {
		x = this.width - textWidth / 2 - 10;
	}

	this.textNode = this.paper.text(x, 15, text);
	this.textNode.toFront()
		.attr({
			'cursor': 'text',
			'font-family': this.attr('textFont'),
			'font-size': this.attr('textSize'),
			'opacity': this.attr('textOpacity'),
			'fill': this.attr('textColor')
		});
};


// AJAX object
Graph.ajax = {};

/**
 * Request a page (AJAX!). Mostly used internally, but publicly exposed.
 *
 * @param {string} method Method to request URL with.
 * @param {string} url URL to request.
 * @param {string} data Data to request with.
 * @param {function} callback Callback to call when request responds.
 */
Graph.ajax.request = function (method, url, data, callback) {
	"use strict";

	var req;

	if (window.XMLHttpRequest) {
		req = new XMLHttpRequest();
	} else {
		// Internet Explorer
		req = new ActiveXObject('Microsoft.XMLHTTP');
	}

	if (method === 'GET' && typeof data === 'string' && data) {
		url += '?' + data;
	}

	req.open(method, url, true);

	if (method === 'POST' && typeof data === 'string') {
		req.setRequestHeader('Content-type',
			'application/x-www-form-urlencoded');
	}

	req.onreadystatechange = function () {
		if (req.readyState === 4 && req.status === 200) {
			var contentType = req.getResponseHeader('Content-type');
			if (contentType === 'application/json') {
				callback(JSON.parse(req.responseText));
			} else {
				callback(req.responseText);
			}
		} else if (req.readyState === 4) {
			throw new Error('XHR Request failed: ' + req.status);
		}
	};
	req.send((typeof data === 'string' && method === 'POST') ? data : null);

	return req;
};

/**
 * Shortcut function to GET a URL using XHR. Mostly used internally, but
 * publicly exposed.
 *
 * @param {string} url URL to request.
 * @param {string} data GET data to request with.
 * @param {function} callback Callback to call when request responds.
 */
Graph.ajax.get = function (url, data, callback) {
	"use strict";

	return this.request('GET', url, data, callback);
};

/**
 * Shortcut function to POST a URL using XHR. Mostly used internally, but
 * publicly exposed.
 *
 * @param {string} url URL to request.
 * @param {string} data POST data to request with.
 * @param {function} callback Callback to call when request responds.
 */
Graph.ajax.post = function (url, data, callback) {
	"use strict";

	return this.request('POST', url, data, callback);
};


// Events object for adding and removing events
Graph.events = {};

/**
 * Add an event handler to an element.
 *
 * @param element Element to add event handler to.
 * @param event Event to listen for.
 * @param handler Function to call when event is fired.
 */
Graph.events.add = function (element, event, handler) {
	if (!Graph._listeners) {
		Graph._listeners = [];
	}

	if (element.addEventListener) {
		element.addEventListener(event, handler);
	} else if (element.attachEvent) {
		var newHandler = function (e) {
			e.preventDefault = function () {
				e.returnValue = false;
			};
			e.stopPropagation = function () {
				e.cancelBubble = true;
			};

			handler.call(element, e);
		};
		element.attachEvent('on' + event, newHandler);
		Graph._listeners.push([handler, newHandler]);
	}
};
/**
 * Remove an event handler from an object.
 *
 * @param element Element to remove event handler from.
 * @param event Event to remove.
 * @param handler Event handler to remove.
 */
Graph.events.remove = function (element, event, handler) {
	if (!Graph._listeners) {
		Graph._listeners = [];
	}

	var listeners = Graph._listeners;

	if (element.removeEventListener) {
		element.removeEventListener(event, handler);
	} else if (element.detachEvent) {
		for (var i = 0; i < listeners.length; i++) {
			if (listeners[i][0] === handler) {
				element.detachEvent('on' + event, listeners[i][1]);
				break;
			}
		}
	}
};

/**
 * Adds event handler to graph itself.
 *
 * @param {string} event Event name.
 * @param {function} fn Function to call.
 */
Graph.prototype.on = function (event, fn) {
	if (!this._ownListeners) {
		this._ownListeners = [];
	}

	var that = this,
		handler = function (e) {
			fn.call(that, e);
		};

	Graph.events.add(this.element, event, handler);
	this._ownListeners.push([fn, handler]);

	return this;
};

/**
 * Removes event handler from graph itself.
 *
 * @param {string} event Event name.
 * @param {function} fn Handler to remove.
 */
Graph.prototype.off = function (event, fn) {
	if (!this._ownListeners) {
		this._ownListeners = [];
		return; // If it doesn't exist, neither does event
	}

	Graph.each(this._ownListeners, function (listener, i) {
		if (listener[0] === fn) {
			Graph.events.remove(this.element, event, listener[1]);
			this._ownListeners.splice(i, 0);
		}
	}, this);

	return this;
};

// Add all event listener alias methods
Graph.each(('blur focus load unload click dblclick mousedown mouseup mouseover' +
	' mouseout mouseenter mouseleave mousemove').split(' '), function (event) {
	Graph.prototype[event] = function (fn) {
		return this.on(event, fn);
	};
	Graph.prototype['un' + event] = function (fn) {
		return this.off(event, fn);
	};
});


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
		"use strict";

		return new Graph(this[0], width, height);
	};
}
var el = document.getElementById('graph1'),
	graph = new Graph(el, 300, 200);

graph.attr({
	pointOpacity: 0.9,
	pointRadius: 3,
	showGrid: true,
	gridLineColor: 'red'
});
graph.draw({
	type: 'line',
	title: 'Straight line graph',
	line: 'straight',
	x: 'day',
	y: 'spoons',
	data: [
		{day: 1, spoons: 2},
		{day: 2, spoons: 1},
		{day: 3, spoons: 2},
		{day: 4, spoons: 5},
		{day: 5, spoons: 4},
		{day: 6, spoons: 7},
		{day: 7, spoons: 6},
		{day: 8, spoons: 4},
		{day: 9, spoons: 3}
	]
});


el = document.getElementById('graph2');
graph = new Graph(el, 300, 200);

graph.attr({
	pointColor: function () {
		var r = function(){return Math.round(Math.random() * 255)}
		return 'rgb(' + [r(), r(), r()] + ')';
	},
	pointOpacity: 0.9,
	pointRadius: 3,
	textPosition: 'left'
});
graph.draw({
	type: 'line',
	title: 'Curved line graph',
	line: 'curved',
	x: 'day',
	y: 'spoons',
	data: [
		{day: 1, spoons: 1},
		{day: 2, spoons: 2},
		{day: 3, spoons: 1},
		{day: 4, spoons: 3},
		{day: 5, spoons: 1},
		{day: 6, spoons: 5},
		{day: 7, spoons: 1},
		{day: 8, spoons: 6},
		{day: 9, spoons: 4},
		{day: 10, spoons: 4}
	]
});


el = document.getElementById('graph3');
graph = new Graph(el, 300, 200);

graph.attr({
	pointRadius: 4,
	textPosition: 'left',
	lineWidth: 2
});
graph.draw({
	type: 'line',
	title: 'Line graph with best fit',
	line: 'best fit',
	x: 'day',
	y: 'spoons',
	data: [
		{day: 1, spoons: 1},
		{day: 2, spoons: 2},
		{day: 3, spoons: 2},
		{day: 4, spoons: 3},
		{day: 5, spoons: 1},
		{day: 6, spoons: 5},
		{day: 7, spoons: 7},
		{day: 8, spoons: 6},
		{day: 9, spoons: 8},
		{day: 10, spoons: 7}
	]
});


el = document.getElementById('graph4');
graph = new Graph(el, 300, 200);

graph.attr({
	pointOpacity: 0.9,
	pointRadius: function (y, maxY) {
		return 15 / maxY * y + 2;
	},
	textPosition: 'center',
	showGrid: true,
	cursor: 'pointer',
	animate: 'linear',
	animateTime: 500
});
graph.draw({
	type: 'scatter',
	title: 'Scatter graph',
	x: 'day',
	y: 'spoons',
	data: [
		{day: 1, spoons: 10},
		{day: 2, spoons: 15},
		{day: 3, spoons: 3},
		{day: 4, spoons: 9},
		{day: 5, spoons: 5},
		{day: 6, spoons: 12},
		{day: 7, spoons: 1},
		{day: 8, spoons: 19},
		{day: 9, spoons: 3},
		{day: 10, spoons: 7}
	]
});


el = document.getElementById('graph5');
graph = new Graph(el, 300, 200);

graph.attr({
	barColor: function (height, maxHeight) {
		var red = Math.round(255 - 255 / maxHeight * height).toString(16);
		if (red.length === 1) {
			red = '0' + red;
		}
		return '#ff' + red + red;
	},
	hoverText: function (point) {
		return point.day + ': ' + point.spoons + ' spoons.';
	},
	animate: 'bounce'
});
graph.draw({
	type: 'bar',
	title: 'Bar chart',
	x: 'day',
	y: 'spoons',
	data: [
		{day: 'Monday', spoons: 6},
		{day: 'Tuesday', spoons: 0},
		{day: 'Wednesday', spoons: 3},
		{day: 'Thursday', spoons: 1},
		{day: 'Friday', spoons: 5}
	]
});


el = document.getElementById('graph6');
graph = new Graph(el, 300, 200);

graph.attr({
	barColor: function (height, maxHeight) {
		var red = Math.round(255 - 255 / maxHeight * height).toString(16);
		if (red.length === 1) {
			red = '0' + red;
		}
		return '#ff' + red + red;
	},
	direction: 'horizontal'
});
graph.draw({
	type: 'bar',
	title: 'Horizontal bar chart',
	x: 'person',
	y: 'spoons',
	data: [
		{person: 'Bob', spoons: 2},
		{person: 'Mary', spoons: 6},
		{person: 'Sam', spoons: 3}
	]
});


el = document.getElementById('graph7');
graph = new Graph(el, 300, 200);

graph.attr({
	segmentColor: function (data, maxData) {
		var red = Math.round(255 - 255 / maxData * data).toString(16);
		if (red.length === 1) {
			red = '0' + red;
		}
		return '#ff' + red + red;
	},
	segmentRadius: function (data, maxData) {
		return 40 / maxData * data + 50;
	},
	animate: 'elastic'
});
graph.draw({
	type: 'pie',
	title: 'Pie chart',
	dataName: 'day',
	dataData: 'spoons',
	data: [
		{day: 'Monday', spoons: 6},
		{day: 'Tuesday', spoons: 2},
		{day: 'Wednesday', spoons: 3},
		{day: 'Thursday', spoons: 1},
		{day: 'Friday', spoons: 5}
	]
});

var el = document.getElementById('graph1'),
	graph = new Graph(el, 300, 200);

graph.attr({
	pointOpacity: 0.9,
	pointRadius: 3
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
	pointOpacity: 0.9,
	pointRadius: function (y, maxY) {
		return 15 / maxY * y + 2;
	},
	textPosition: 'center'
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


el = document.getElementById('graph4');
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
	}
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
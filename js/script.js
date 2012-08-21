var el = document.getElementById('graph'),
	graph = new Graph(el, 500, 500);

graph.draw({
	type: 'line',
	title: 'Spoons per day over a month',
	x: 'day',
	y: 'spoons',
	data: [
		{day: 1, spoons: 4},
		{day: 2, spoons: 3},
		{day: 3, spoons: 5},
		{day: 4, spoons: 2},
		{day: 5, spoons: 0},
		{day: 6, spoons: 7},
		{day: 7, spoons: 6},
		{day: 8, spoons: 5},
		{day: 9, spoons: 4},
		{day: 10, spoons: 4},
		{day: 11, spoons: 3},
		{day: 12, spoons: 2},
		{day: 13, spoons: 1}
	]
});
<?php

header('Content-type: application/json');

$data = array();
$i = 0;

while (rand(0, 20) > 1 || $i++ < 2) {
	$data[] = array(
		'x'     => rand(0, 10000) / 100,
		'y'     => rand(0, 10000) / 100
	);
}

sleep(1);

echo json_encode($data);
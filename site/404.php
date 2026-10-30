<?php
// Serves the designed 404 page with a real 404 status
http_response_code(404);
header("Content-Type: text/html; charset=utf-8");
readfile(__DIR__ . "/404.html");

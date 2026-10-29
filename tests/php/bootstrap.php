<?php
require dirname( __DIR__, 2 ) . '/vendor/autoload.php';

if ( ! defined( 'ABSPATH' ) ) {
	define( 'ABSPATH', '/tmp/' );
}

const NUMBERSTUFF_TEST_ROOT = __DIR__ . '/../..';

require NUMBERSTUFF_TEST_ROOT . '/src/Config.php';
require NUMBERSTUFF_TEST_ROOT . '/src/Head.php';
require NUMBERSTUFF_TEST_ROOT . '/src/Banner.php';

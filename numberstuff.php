<?php
/**
 * Plugin Name:       numberstuff
 * Description:       Consent-first Google Tag Manager loading and growth events.
 * Version:           0.1.0
 * Requires at least: 7.1
 * Requires PHP:      8.4
 * Author:            Fernando Duro
 * License:           GPL-2.0-or-later
 * Text Domain:       numberstuff
 * Domain Path:       /languages
 * Update URI:        false
 */

namespace Numberstuff;

defined( 'ABSPATH' ) || exit;

const VERSION     = '0.1.0';
const PLUGIN_FILE = __FILE__;

require_once __DIR__ . '/src/Config.php';
require_once __DIR__ . '/src/Head.php';
require_once __DIR__ . '/src/Banner.php';
require_once __DIR__ . '/src/Counter.php';
require_once __DIR__ . '/src/Dashboard.php';
require_once __DIR__ . '/src/Plugin.php';

Plugin::boot();

<?php
namespace Numberstuff;

final class Plugin {
	public static function boot(): void {
		add_action( 'init', array( self::class, 'load_textdomain' ) );
		if ( ! Config::is_active() ) {
			add_action( 'admin_notices', array( self::class, 'inactive_notice' ) );
			return;
		}
		add_action( 'wp_head', array( Head::class, 'render' ), 1 );
		add_action( 'wp_footer', array( Banner::class, 'render' ) );
		add_action( 'wp_enqueue_scripts', array( self::class, 'enqueue' ) );
		add_action( 'rest_api_init', array( Counter::class, 'register_route' ) );
		add_action( 'wp_dashboard_setup', array( Dashboard::class, 'register' ) );
	}

	public static function enqueue(): void {
		$base = plugin_dir_url( PLUGIN_FILE ) . 'assets/';
		wp_enqueue_style( 'numberstuff-banner', $base . 'banner.css', array(), VERSION );
		wp_enqueue_script(
			'numberstuff-consent',
			$base . 'consent.js',
			array(),
			VERSION,
			array(
				'in_footer' => true,
				'strategy'  => 'defer',
			)
		);
		wp_localize_script( 'numberstuff-consent', 'numberstuffConfig', array( 'counterUrl' => rest_url( 'numberstuff/v1/consent' ) ) );
		wp_enqueue_script(
			'numberstuff-events',
			$base . 'events.js',
			array(),
			VERSION,
			array(
				'in_footer' => true,
				'strategy'  => 'defer',
			)
		);
	}

	public static function load_textdomain(): void {
		load_plugin_textdomain( 'numberstuff', false, dirname( plugin_basename( PLUGIN_FILE ) ) . '/languages' );
	}

	public static function inactive_notice(): void {
		if ( ! current_user_can( 'manage_options' ) ) {
			return;
		}
		printf(
			'<div class="notice notice-warning"><p>%s</p></div>',
			esc_html__( 'numberstuff is inactive: set NUMBERSTUFF_GTM_ID to a Google Tag Manager container ID (GTM-…).', 'numberstuff' )
		);
	}
}

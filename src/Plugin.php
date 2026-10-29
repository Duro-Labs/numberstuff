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
	}

	public static function enqueue(): void {
		$base = plugin_dir_url( PLUGIN_FILE ) . 'assets/';
		wp_enqueue_style( 'numberstuff-banner', $base . 'banner.css', array(), VERSION );
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

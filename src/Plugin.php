<?php
namespace Numberstuff;

final class Plugin {
	public static function boot(): void {
		add_action( 'init', array( self::class, 'load_textdomain' ) );
		if ( ! Config::is_active() ) {
			add_action( 'admin_notices', array( self::class, 'inactive_notice' ) );
			return;
		}
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

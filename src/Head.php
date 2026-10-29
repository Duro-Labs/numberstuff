<?php
namespace Numberstuff;

final class Head {
	public static function script( string $gtm_id ): string {
		$body = (string) file_get_contents( dirname( __DIR__ ) . '/assets/head.js' ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents
		return 'window.numberstuffGtmId=' . wp_json_encode( $gtm_id, JSON_HEX_TAG | JSON_UNESCAPED_SLASHES ) . ";\n" . $body;
	}

	public static function render(): void {
		$gtm_id = Config::gtm_id();
		if ( null === $gtm_id ) {
			return;
		}
		wp_print_inline_script_tag( self::script( $gtm_id ), array( 'id' => 'numberstuff-head' ) );
	}
}

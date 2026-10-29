<?php
namespace Numberstuff;

final class Counter {
	public const OPTION   = 'numberstuff_consent_counts';
	private const CHOICES = array( 'granted', 'denied' );

	public static function register_route(): void {
		register_rest_route(
			'numberstuff/v1',
			'/consent',
			array(
				'methods'             => 'POST',
				'callback'            => array( self::class, 'handle' ),
				'permission_callback' => '__return_true',
				'args'                => array(
					'choice' => array(
						'required' => true,
						'type'     => 'string',
						'enum'     => self::CHOICES,
					),
				),
			)
		);
	}

	public static function handle( \WP_REST_Request $request ): \WP_REST_Response {
		self::record( (string) $request->get_param( 'choice' ), gmdate( 'Y-m' ) );
		return new \WP_REST_Response( null, 204 );
	}

	public static function record( string $choice, string $month ): void {
		if ( ! in_array( $choice, self::CHOICES, true ) ) {
			return;
		}
		$totals = self::totals();
		if ( ! isset( $totals[ $month ] ) ) {
			$totals[ $month ] = array(
				'granted' => 0,
				'denied'  => 0,
			);
		}
		++$totals[ $month ][ $choice ];
		update_option( self::OPTION, $totals, false );
	}

	public static function totals(): array {
		$totals = get_option( self::OPTION, array() );
		if ( ! is_array( $totals ) ) {
			return array();
		}
		return $totals;
	}
}

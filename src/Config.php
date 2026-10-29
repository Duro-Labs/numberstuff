<?php
namespace Numberstuff;

final class Config {
	private const GTM_ID_PATTERN = '/^GTM-[A-Z0-9]+$/';

	public static function gtm_id(): ?string {
		$id = self::read( 'NUMBERSTUFF_GTM_ID' );
		if ( null === $id || 1 !== preg_match( self::GTM_ID_PATTERN, $id ) ) {
			return null;
		}
		return $id;
	}

	public static function privacy_url(): ?string {
		$url = self::read( 'NUMBERSTUFF_PRIVACY_URL' );
		if ( null === $url ) {
			return null;
		}
		if ( str_starts_with( $url, '/' ) && ! str_starts_with( $url, '//' ) ) {
			return $url;
		}
		$scheme = self::scheme( $url );
		if ( in_array( $scheme, array( 'http', 'https' ), true ) && false !== filter_var( $url, FILTER_VALIDATE_URL ) ) {
			return $url;
		}
		return null;
	}

	public static function is_active(): bool {
		return null !== self::gtm_id();
	}

	private static function read( string $name ): ?string {
		$value = getenv( $name );
		if ( false === $value || '' === $value ) {
			$value = defined( $name ) ? constant( $name ) : null;
		}
		if ( ! is_string( $value ) || '' === $value ) {
			return null;
		}
		return $value;
	}

	private static function scheme( string $url ): ?string {
		$scheme = parse_url( $url, PHP_URL_SCHEME ); // phpcs:ignore WordPress.WP.AlternativeFunctions.parse_url_parse_url
		if ( ! is_string( $scheme ) ) {
			return null;
		}
		return strtolower( $scheme );
	}
}

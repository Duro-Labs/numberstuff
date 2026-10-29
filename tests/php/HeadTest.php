<?php
namespace Numberstuff\Tests;

use Brain\Monkey;
use Brain\Monkey\Functions;
use Numberstuff\Head;
use PHPUnit\Framework\TestCase;

final class HeadTest extends TestCase {
	protected function setUp(): void {
		parent::setUp();
		Monkey\setUp();
		Functions\when( 'wp_json_encode' )->alias(
			static fn( $data, $flags = 0 ) => json_encode( $data, $flags )
		);
	}

	protected function tearDown(): void {
		Monkey\tearDown();
		parent::tearDown();
	}

	public function test_sets_all_four_consent_defaults_to_denied(): void {
		$script = Head::script( 'GTM-ABC123' );
		$this->assertStringContainsString( "gtag('consent','default'", $script );
		foreach ( array( 'ad_storage', 'analytics_storage', 'ad_user_data', 'ad_personalization' ) as $type ) {
			$this->assertMatchesRegularExpression( '/' . $type . ":'denied'/", $script );
		}
	}

	public function test_embeds_container_id_as_json(): void {
		$this->assertStringContainsString( 'window.numberstuffGtmId="GTM-ABC123";', Head::script( 'GTM-ABC123' ) );
	}

	public function test_does_not_request_gtm_unconditionally(): void {
		$script = Head::script( 'GTM-ABC123' );
		$this->assertStringNotContainsString( '<script', $script );
		$this->assertMatchesRegularExpression( '/numberstuff_consent=granted/', $script );
	}
}

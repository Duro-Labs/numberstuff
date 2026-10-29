<?php
namespace Numberstuff\Tests;

use Brain\Monkey;
use Brain\Monkey\Functions;
use PHPUnit\Framework\TestCase;

final class UninstallTest extends TestCase {
	protected function setUp(): void {
		parent::setUp();
		Monkey\setUp();
	}

	protected function tearDown(): void {
		Monkey\tearDown();
		parent::tearDown();
	}

	public function test_uninstall_deletes_the_consent_counts(): void {
		if ( ! defined( 'WP_UNINSTALL_PLUGIN' ) ) {
			define( 'WP_UNINSTALL_PLUGIN', 'numberstuff/numberstuff.php' );
		}
		$deleted = array();
		Functions\when( 'delete_option' )->alias(
			static function ( string $name ) use ( &$deleted ): bool {
				$deleted[] = $name;
				return true;
			}
		);
		require NUMBERSTUFF_TEST_ROOT . '/uninstall.php';
		$this->assertSame( array( 'numberstuff_consent_counts' ), $deleted );
	}

	public function test_plugin_header_opts_out_of_update_checks(): void {
		$header = (string) file_get_contents( NUMBERSTUFF_TEST_ROOT . '/numberstuff.php' );
		$this->assertMatchesRegularExpression( '/^ \* Update URI:\s+false$/m', $header );
	}
}

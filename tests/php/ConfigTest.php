<?php
namespace Numberstuff\Tests;

use Numberstuff\Config;
use PHPUnit\Framework\Attributes\RunInSeparateProcess;
use PHPUnit\Framework\TestCase;

final class ConfigTest extends TestCase {
	protected function tearDown(): void {
		putenv( 'NUMBERSTUFF_GTM_ID' );
		putenv( 'NUMBERSTUFF_PRIVACY_URL' );
	}

	public function test_inactive_without_id(): void {
		$this->assertNull( Config::gtm_id() );
		$this->assertFalse( Config::is_active() );
	}

	public function test_reads_valid_id_from_env(): void {
		putenv( 'NUMBERSTUFF_GTM_ID=GTM-ABC123' );
		$this->assertSame( 'GTM-ABC123', Config::gtm_id() );
		$this->assertTrue( Config::is_active() );
	}

	public function test_rejects_malformed_id(): void {
		putenv( 'NUMBERSTUFF_GTM_ID=GTM-abc"><script>' );
		$this->assertNull( Config::gtm_id() );
		putenv( 'NUMBERSTUFF_GTM_ID=G-ABC123' );
		$this->assertNull( Config::gtm_id() );
	}

	#[RunInSeparateProcess]
	public function test_falls_back_to_constant(): void {
		define( 'NUMBERSTUFF_GTM_ID', 'GTM-CONST1' );
		$this->assertSame( 'GTM-CONST1', Config::gtm_id() );
	}

	#[RunInSeparateProcess]
	public function test_env_wins_over_constant(): void {
		define( 'NUMBERSTUFF_GTM_ID', 'GTM-CONST1' );
		putenv( 'NUMBERSTUFF_GTM_ID=GTM-ENV1' );
		$this->assertSame( 'GTM-ENV1', Config::gtm_id() );
	}

	public function test_privacy_url_accepts_absolute_and_root_relative(): void {
		putenv( 'NUMBERSTUFF_PRIVACY_URL=https://example.com/privacy/' );
		$this->assertSame( 'https://example.com/privacy/', Config::privacy_url() );
		putenv( 'NUMBERSTUFF_PRIVACY_URL=/pt/privacidade/' );
		$this->assertSame( '/pt/privacidade/', Config::privacy_url() );
	}

	public function test_privacy_url_rejects_other_schemes(): void {
		putenv( 'NUMBERSTUFF_PRIVACY_URL=javascript:alert(1)' );
		$this->assertNull( Config::privacy_url() );
		putenv( 'NUMBERSTUFF_PRIVACY_URL=//evil.example/x' );
		$this->assertNull( Config::privacy_url() );
	}
}

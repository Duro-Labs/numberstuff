<?php
namespace Numberstuff\Tests;

use Brain\Monkey;
use Brain\Monkey\Functions;
use Numberstuff\Banner;
use PHPUnit\Framework\TestCase;

final class BannerTest extends TestCase {
	protected function setUp(): void {
		parent::setUp();
		Monkey\setUp();
		Functions\stubTranslationFunctions();
		Functions\stubEscapeFunctions();
		Functions\when( 'esc_url' )->returnArg();
	}

	protected function tearDown(): void {
		putenv( 'NUMBERSTUFF_PRIVACY_URL' );
		Monkey\tearDown();
		parent::tearDown();
	}

	public function test_is_hidden_until_script_decides(): void {
		$this->assertMatchesRegularExpression( '/<div id="numberstuff-banner"[^>]* hidden>/', Banner::markup( null ) );
	}

	public function test_offers_accept_and_reject_buttons(): void {
		$html = Banner::markup( null );
		$this->assertStringContainsString( 'data-numberstuff-choice="granted"', $html );
		$this->assertStringContainsString( 'data-numberstuff-choice="denied"', $html );
		$this->assertSame( 2, substr_count( $html, 'class="numberstuff-banner__button"' ) );
	}

	public function test_links_privacy_policy_only_when_configured(): void {
		$this->assertStringNotContainsString( '<a ', Banner::markup( null ) );
		$this->assertStringContainsString( 'href="/privacy/"', Banner::markup( '/privacy/' ) );
	}

	public function test_banner_text_is_filterable(): void {
		Monkey\Filters\expectApplied( 'numberstuff_banner_text' )->once()->andReturn( 'Custom <b>text</b>' );
		$this->assertStringContainsString( 'Custom &lt;b&gt;text&lt;/b&gt;', Banner::markup( null ) );
	}

	public function test_privacy_url_is_filterable(): void {
		putenv( 'NUMBERSTUFF_PRIVACY_URL=/privacy/' );
		Monkey\Filters\expectApplied( 'numberstuff_privacy_url' )->once()->with( '/privacy/' )->andReturn( '/pt/privacidade/' );
		$this->assertSame( '/pt/privacidade/', Banner::privacy_url() );
	}

	public function test_filtered_privacy_url_that_is_not_a_non_empty_string_means_no_link(): void {
		Monkey\Filters\expectApplied( 'numberstuff_privacy_url' )->twice()->andReturn( '', false );
		$this->assertNull( Banner::privacy_url() );
		$this->assertNull( Banner::privacy_url() );
	}
}

<?php
namespace Numberstuff\Tests;

use Brain\Monkey;
use Brain\Monkey\Functions;
use Numberstuff\Counter;
use PHPUnit\Framework\TestCase;

final class CounterTest extends TestCase {
	private array $store = array();

	protected function setUp(): void {
		parent::setUp();
		Monkey\setUp();
		$this->store = array();
		Functions\when( 'get_option' )->alias( fn( $name, $default = false ) => $this->store[ $name ] ?? $default );
		Functions\when( 'update_option' )->alias(
			function ( $name, $value, $autoload = null ) {
				$this->store[ $name ] = $value;
				return true;
			}
		);
	}

	protected function tearDown(): void {
		Monkey\tearDown();
		parent::tearDown();
	}

	public function test_counts_per_month_and_choice(): void {
		Counter::record( 'granted', '2026-10' );
		Counter::record( 'granted', '2026-10' );
		Counter::record( 'denied', '2026-10' );
		Counter::record( 'denied', '2026-11' );
		$this->assertSame(
			array(
				'2026-10' => array( 'granted' => 2, 'denied' => 1 ),
				'2026-11' => array( 'granted' => 0, 'denied' => 1 ),
			),
			Counter::totals()
		);
	}

	public function test_ignores_unknown_choice(): void {
		Counter::record( 'maybe', '2026-10' );
		$this->assertSame( array(), Counter::totals() );
	}

	public function test_stores_nothing_but_counts(): void {
		Counter::record( 'granted', '2026-10' );
		$this->assertSame( array( Counter::OPTION ), array_keys( $this->store ) );
		$this->assertSame( array( 'granted', 'denied' ), array_keys( $this->store[ Counter::OPTION ]['2026-10'] ) );
	}

	public function test_corrupt_option_reads_as_empty(): void {
		$this->store[ Counter::OPTION ] = 'garbage';
		$this->assertSame( array(), Counter::totals() );
	}
}

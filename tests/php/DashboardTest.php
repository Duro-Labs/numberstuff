<?php
namespace Numberstuff\Tests;

use Numberstuff\Dashboard;
use PHPUnit\Framework\TestCase;

final class DashboardTest extends TestCase {
	public function test_rate_is_share_of_accepts(): void {
		$this->assertSame( 0.75, Dashboard::rate( 3, 1 ) );
	}

	public function test_rate_is_null_without_choices(): void {
		$this->assertNull( Dashboard::rate( 0, 0 ) );
	}
}

<?php
namespace Numberstuff;

final class Dashboard {
	private const MONTHS = 6;

	public static function rate( int $granted, int $denied ): ?float {
		$total = $granted + $denied;
		if ( 0 === $total ) {
			return null;
		}
		return $granted / $total;
	}

	public static function register(): void {
		if ( ! current_user_can( 'manage_options' ) ) {
			return;
		}
		wp_add_dashboard_widget( 'numberstuff_consent', esc_html__( 'Consent choices', 'numberstuff' ), array( self::class, 'render' ) );
	}

	public static function render(): void {
		$totals = Counter::totals();
		krsort( $totals );
		$totals = array_slice( $totals, 0, self::MONTHS, true );
		if ( array() === $totals ) {
			echo '<p>' . esc_html__( 'No consent choices recorded yet.', 'numberstuff' ) . '</p>';
			return;
		}
		echo '<table class="widefat striped"><thead><tr>';
		foreach ( array( __( 'Month', 'numberstuff' ), __( 'Accepted', 'numberstuff' ), __( 'Rejected', 'numberstuff' ), __( 'Accept rate', 'numberstuff' ) ) as $heading ) {
			echo '<th>' . esc_html( $heading ) . '</th>';
		}
		echo '</tr></thead><tbody>';
		foreach ( $totals as $month => $counts ) {
			$rate  = self::rate( (int) $counts['granted'], (int) $counts['denied'] );
			$shown = '—';
			if ( null !== $rate ) {
				$shown = number_format_i18n( $rate * 100, 0 ) . '%';
			}
			printf(
				'<tr><td>%s</td><td>%d</td><td>%d</td><td>%s</td></tr>',
				esc_html( $month ),
				(int) $counts['granted'],
				(int) $counts['denied'],
				esc_html( $shown )
			);
		}
		echo '</tbody></table>';
	}
}

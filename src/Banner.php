<?php
namespace Numberstuff;

final class Banner {
	public static function markup( ?string $privacy_url ): string {
		$text = (string) apply_filters(
			'numberstuff_banner_text',
			__( 'This site uses Google Analytics to understand how it is used, only if you accept.', 'numberstuff' )
		);
		$link = '';
		if ( null !== $privacy_url ) {
			$link = sprintf( ' <a href="%s">%s</a>', esc_url( $privacy_url ), esc_html__( 'Privacy policy', 'numberstuff' ) );
		}
		return sprintf(
			'<div id="numberstuff-banner" class="numberstuff-banner" role="region" aria-label="%1$s" hidden><p class="numberstuff-banner__text">%2$s%3$s</p><div class="numberstuff-banner__actions"><button type="button" class="numberstuff-banner__button" data-numberstuff-choice="denied">%4$s</button><button type="button" class="numberstuff-banner__button" data-numberstuff-choice="granted">%5$s</button></div></div>',
			esc_attr__( 'Privacy choices', 'numberstuff' ),
			esc_html( $text ),
			$link,
			esc_html__( 'Reject', 'numberstuff' ),
			esc_html__( 'Accept', 'numberstuff' )
		);
	}

	public static function render(): void {
		echo self::markup( Config::privacy_url() ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	}
}

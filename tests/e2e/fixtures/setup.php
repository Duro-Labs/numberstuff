<?php
( static function () {
	$languages = PLL()->model->languages;
	$existing  = wp_list_pluck( $languages->get_list(), 'locale' );
	$wanted    = array(
		array(
			'name'       => 'English',
			'slug'       => 'en',
			'locale'     => 'en_US',
			'rtl'        => false,
			'term_group' => 0,
		),
		array(
			'name'       => 'Português',
			'slug'       => 'pt',
			'locale'     => 'pt_BR',
			'rtl'        => false,
			'term_group' => 1,
		),
	);
	foreach ( $wanted as $language ) {
		if ( ! in_array( $language['locale'], $existing, true ) ) {
			$result = $languages->add( $language );
			if ( is_wp_error( $result ) ) {
				WP_CLI::error( $result->get_error_message() );
			}
		}
	}
	$options = PLL()->options;
	foreach (
		array(
			'default_lang'  => 'en',
			'force_lang'    => 1,
			'hide_default'  => true,
			'rewrite'       => true,
			'redirect_lang' => true,
			'browser'       => false,
		) as $key => $value
	) {
		$options->set( $key, $value );
	}
	$options->save();
	$languages->clean_cache();

	$form_id = 0;
	$forms   = get_posts(
		array(
			'post_type'   => 'wpforms',
			'title'       => 'numberstuff test form',
			'numberposts' => 1,
			'fields'      => 'ids',
		)
	);
	if ( array() !== $forms ) {
		$form_id = (int) $forms[0];
	} else {
		$form_id = (int) wpforms()->obj( 'form' )->add( 'numberstuff test form', array(), array( 'builder' => false ) );
		$data    = wpforms()->obj( 'form' )->get( $form_id, array( 'content_only' => true ) );

		$data['fields']                  = array(
			'0' => array(
				'id'       => '0',
				'type'     => 'text',
				'label'    => 'Name',
				'required' => '1',
			),
		);
		$data['field_id']                = '1';
		$data['settings']['ajax_submit'] = '1';
		wpforms()->obj( 'form' )->update( $form_id, $data );
	}

	$links = '<!-- wp:html --><p><a href="/cv.pdf">CV</a> <a href="https://www.linkedin.com/in/example">LinkedIn</a> <a href="mailto:hello@example.com">Email</a> <a href="#" data-numberstuff-consent>Privacy choices</a></p><!-- /wp:html --><!-- wp:polylang/language-switcher /-->';
	$pages = array(
		'en' => array( 'sample', 'Sample', $links . sprintf( '<!-- wp:shortcode -->[wpforms id="%d"]<!-- /wp:shortcode -->', $form_id ) ),
		'pt' => array( 'amostra', 'Amostra', $links ),
	);
	$ids   = array();
	foreach ( $pages as $lang => $page ) {
		$found = get_posts(
			array(
				'post_type'   => 'page',
				'name'        => $page[0],
				'post_status' => 'any',
				'lang'        => '',
				'numberposts' => 1,
				'fields'      => 'ids',
			)
		);
		if ( array() !== $found ) {
			$ids[ $lang ] = (int) $found[0];
			continue;
		}
		$ids[ $lang ] = (int) wp_insert_post(
			array(
				'post_type'    => 'page',
				'post_status'  => 'publish',
				'post_name'    => $page[0],
				'post_title'   => $page[1],
				'post_content' => $page[2],
			),
			true
		);
		pll_set_post_language( $ids[ $lang ], $lang );
	}
	pll_save_post_translations( $ids );
	delete_option( 'rewrite_rules' );
	WP_CLI::success( 'numberstuff fixtures ready' );
} )();

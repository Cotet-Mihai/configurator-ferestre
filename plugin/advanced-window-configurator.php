<?php
/**
 * Plugin Name:       Advanced Window Configurator
 * Description:       Let your customers design their own windows right on the product page. They pick the size, glass, colour and hardware, see a live preview with the price updating as they choose, and add the finished window straight to their cart.
 * Version:           1.6.12
 * Author:            Coteț Mihăiță - Cornel
 * Text Domain:       tc
 * Requires at least: 5.8
 * Requires PHP:      7.4
 * WC requires at least: 6.0
 */

defined( 'ABSPATH' ) || exit;

define( 'TC_VERSION', '1.6.12' );

/* ==========================================================================
   Admin – Tab produs + câmpuri editabile
   ========================================================================== */
class TC_Admin {

	public function __construct() {
		add_filter( 'woocommerce_product_data_tabs',   [ $this, 'add_tab' ] );
		add_action( 'woocommerce_product_data_panels', [ $this, 'render_panel' ] );
		add_action( 'woocommerce_process_product_meta', [ $this, 'save_meta' ] );
		add_action( 'admin_enqueue_scripts',           [ $this, 'enqueue' ] );
	}

	public function add_tab( $tabs ) {
		$tabs['tc_configurator'] = [
			'label'    => 'Configurator Ferestre',
			'target'   => 'tc_configurator_panel',
			'class'    => [],
			'priority' => 80,
		];
		return $tabs;
	}

	public function render_panel() {
		global $post;
		$pid      = $post->ID;
		$enabled  = get_post_meta( $pid, '_tc_enabled',   true );
		$price    = get_post_meta( $pid, '_tc_price_sqm', true ) ?: 1300;
		$glass    = json_decode( get_post_meta( $pid, '_tc_glass',    true ) ?: '[]', true ) ?: [];
		$colors   = json_decode( get_post_meta( $pid, '_tc_colors',   true ) ?: '[]', true ) ?: [];
		$hardware = json_decode( get_post_meta( $pid, '_tc_hardware', true ) ?: '[]', true ) ?: [];
		?>
		<div id="tc_configurator_panel" class="panel woocommerce_options_panel">

			<div class="options_group">
				<?php woocommerce_wp_checkbox( [
					'id'    => '_tc_enabled',
					'label' => __( 'Activează configuratorul pentru acest produs', 'tc' ),
					'value' => $enabled,
				] ); ?>

				<?php woocommerce_wp_text_input( [
					'id'          => '_tc_price_sqm',
					'label'       => __( 'Preț per m² (RON)', 'tc' ),
					'type'        => 'number',
					'value'       => esc_attr( $price ),
					'description' => __( 'Prețul de bază al ferestrei per metru pătrat.', 'tc' ),
					'desc_tip'    => true,
					'custom_attributes' => [ 'step' => '1', 'min' => '0' ],
				] ); ?>
			</div>

			<?php
			$this->render_options_section(
				__( 'Opțiuni sticlă', 'tc' ),
				'glass',
				$glass,
				false,
				'RON/m²'
			);
			$this->render_options_section(
				__( 'Opțiuni culori', 'tc' ),
				'color',
				$colors,
				true,
				'RON/m²'
			);
			$this->render_options_section(
				__( 'Opțiuni feronerie', 'tc' ),
				'hardware',
				$hardware,
				false,
				'RON/buc'
			);
			?>
		</div>
		<?php
	}

	/** Randează o secțiune de opțiuni repetabile. */
	private function render_options_section( $title, $type, $items, $has_color, $price_label = 'RON/m²' ) {
		$field_name = $type === 'color' ? 'tc_colors' : 'tc_' . $type;
		?>
		<div class="options_group">
			<h4 class="tc-section-title"><?php echo esc_html( $title ); ?></h4>
			<div class="tc-rows" id="tc-rows-<?php echo esc_attr( $type ); ?>">
				<?php foreach ( $items as $idx => $item ) : ?>
				<div class="tc-option-row">
					<input type="text"
						name="<?php echo esc_attr( $field_name ); ?>[<?php echo $idx; ?>][label]"
						value="<?php echo esc_attr( $item['label'] ?? '' ); ?>"
						placeholder="<?php esc_attr_e( 'Etichetă opțiune', 'tc' ); ?>"
						class="tc-input-label">
					<label class="tc-field-group">
						<span>+ <?php echo esc_html( $price_label ); ?></span>
						<input type="number"
							name="<?php echo esc_attr( $field_name ); ?>[<?php echo $idx; ?>][price_modifier]"
							value="<?php echo (int) ( $item['price_modifier'] ?? 0 ); ?>"
							step="1" min="0"
							class="tc-input-price">
					</label>
					<?php if ( $has_color ) : ?>
					<label class="tc-field-group">
						<span><?php esc_html_e( 'Culoare', 'tc' ); ?></span>
						<input type="color"
							name="<?php echo esc_attr( $field_name ); ?>[<?php echo $idx; ?>][color_value]"
							value="<?php echo esc_attr( $item['color_value'] ?? '#8B6914' ); ?>"
							class="tc-input-color">
					</label>
					<?php endif; ?>
					<button type="button" class="tc-remove-row" title="<?php esc_attr_e( 'Șterge', 'tc' ); ?>">&#10005;</button>
				</div>
				<?php endforeach; ?>
			</div>
			<button type="button"
				class="button tc-add-row"
				data-type="<?php echo esc_attr( $type ); ?>"
				data-target="tc-rows-<?php echo esc_attr( $type ); ?>"
				data-field="<?php echo esc_attr( $field_name ); ?>"
				data-color="<?php echo $has_color ? '1' : '0'; ?>">
				&#43; <?php echo esc_html( sprintf( __( 'Adaugă %s', 'tc' ), strtolower( $title ) ) ); ?>
			</button>
		</div>
		<?php
	}

	public function save_meta( $post_id ) {
		update_post_meta( $post_id, '_tc_enabled', ! empty( $_POST['_tc_enabled'] ) ? 'yes' : 'no' );
		update_post_meta( $post_id, '_tc_price_sqm', absint( $_POST['_tc_price_sqm'] ?? 1300 ) );

		foreach ( [
			'_tc_glass'    => [ 'tc_glass',    false ],
			'_tc_colors'   => [ 'tc_colors',   true  ],
			'_tc_hardware' => [ 'tc_hardware', false ],
		] as $meta_key => [ $post_key, $has_color ] ) {
			$items = [];
			if ( ! empty( $_POST[ $post_key ] ) && is_array( $_POST[ $post_key ] ) ) {
				foreach ( $_POST[ $post_key ] as $item ) {
					$label = sanitize_text_field( $item['label'] ?? '' );
					if ( ! $label ) continue;
					$entry = [
						'id'            => $post_key . '-' . $post_id . '-' . count( $items ),
						'label'         => $label,
						'price_modifier' => intval( $item['price_modifier'] ?? 0 ),
					];
					if ( $has_color ) {
						$entry['color_value'] = sanitize_hex_color( $item['color_value'] ?? '' ) ?: '#8B6914';
					}
					$items[] = $entry;
				}
			}
			update_post_meta( $post_id, $meta_key, wp_json_encode( $items ) );
		}
	}

	public function enqueue( $hook ) {
		if ( ! in_array( $hook, [ 'post.php', 'post-new.php' ], true ) ) return;
		global $post;
		if ( ! $post || $post->post_type !== 'product' ) return;

		wp_register_style( 'tc-admin', false );
		wp_enqueue_style( 'tc-admin' );
		wp_add_inline_style( 'tc-admin', $this->admin_css() );

		wp_register_script( 'tc-admin', false, [ 'jquery' ], TC_VERSION, true );
		wp_enqueue_script( 'tc-admin' );
		wp_add_inline_script( 'tc-admin', $this->admin_js() );
	}

	private function admin_css() {
		return '
#tc_configurator_panel .tc-section-title {
	padding: 10px 12px 8px;
	margin: 0;
	font-size: 13px;
	font-weight: 700;
	color: #1a1a1a;
	border-bottom: 1px solid #e8e8e8;
}
#tc_configurator_panel .tc-rows {
	padding: 6px 12px;
	min-height: 10px;
}
#tc_configurator_panel .tc-option-row {
	display: flex !important;
	align-items: center !important;
	flex-wrap: wrap !important;
	gap: 10px !important;
	padding: 7px 0 !important;
	border-bottom: 1px solid #f5f5f5 !important;
	float: none !important;
	clear: none !important;
}
#tc_configurator_panel .tc-option-row:last-child { border-bottom: none !important; }
#tc_configurator_panel .tc-input-label {
	flex: 1 !important;
	min-width: 160px !important;
	height: 30px !important;
	margin: 0 !important;
	float: none !important;
}
#tc_configurator_panel label.tc-field-group {
	display: flex !important;
	align-items: center !important;
	gap: 5px !important;
	font-size: 12px !important;
	color: #666 !important;
	white-space: nowrap !important;
	float: none !important;
	width: auto !important;
	margin: 0 !important;
	padding: 0 !important;
	line-height: normal !important;
}
#tc_configurator_panel label.tc-field-group span {
	display: inline !important;
	float: none !important;
	line-height: normal !important;
}
#tc_configurator_panel .tc-input-price {
	width: 72px !important;
	height: 30px !important;
	margin: 0 !important;
	float: none !important;
}
#tc_configurator_panel .tc-input-color {
	width: 38px !important;
	height: 30px !important;
	padding: 2px !important;
	border-radius: 4px !important;
	border: 1px solid #c3c4c7 !important;
	cursor: pointer !important;
	margin: 0 !important;
	float: none !important;
	vertical-align: middle !important;
}
#tc_configurator_panel .tc-remove-row {
	background: none !important;
	border: 1px solid #d63638 !important;
	color: #d63638 !important;
	border-radius: 4px !important;
	width: 28px !important;
	height: 28px !important;
	cursor: pointer !important;
	font-size: 13px !important;
	display: flex !important;
	align-items: center !important;
	justify-content: center !important;
	flex-shrink: 0 !important;
	padding: 0 !important;
	transition: background .1s, color .1s !important;
	line-height: 1 !important;
	float: none !important;
	margin: 0 !important;
}
#tc_configurator_panel .tc-remove-row:hover { background: #d63638 !important; color: #fff !important; }
.tc-add-row {
	margin: 8px 12px 12px !important;
	font-size: 12px !important;
}
		';
	}

	private function admin_js() {
		return '
jQuery(function($) {
	"use strict";

	/* Template HTML pentru fiecare tip de rând */
	var templates = {
		glass: function(field, idx) {
			return \'<div class="tc-option-row">\' +
				\'<input type="text" name="\' + field + \'[\' + idx + \'][label]" placeholder="Etichetă opțiune" class="tc-input-label">\' +
				\'<label class="tc-field-group"><span>+ RON/m²</span><input type="number" name="\' + field + \'[\' + idx + \'][price_modifier]" value="0" step="1" min="0" class="tc-input-price"></label>\' +
				\'<button type="button" class="tc-remove-row">✕</button>\' +
			\'</div>\';
		},
		color: function(field, idx) {
			return \'<div class="tc-option-row">\' +
				\'<input type="text" name="\' + field + \'[\' + idx + \'][label]" placeholder="Etichetă opțiune" class="tc-input-label">\' +
				\'<label class="tc-field-group"><span>+ RON/m²</span><input type="number" name="\' + field + \'[\' + idx + \'][price_modifier]" value="0" step="1" min="0" class="tc-input-price"></label>\' +
				\'<label class="tc-field-group"><span>Culoare</span><input type="color" name="\' + field + \'[\' + idx + \'][color_value]" value="#8B6914" class="tc-input-color"></label>\' +
				\'<button type="button" class="tc-remove-row">✕</button>\' +
			\'</div>\';
		},
		hardware: function(field, idx) {
			return \'<div class="tc-option-row">\' +
				\'<input type="text" name="\' + field + \'[\' + idx + \'][label]" placeholder="Etichetă opțiune" class="tc-input-label">\' +
				\'<label class="tc-field-group"><span>+ RON/buc</span><input type="number" name="\' + field + \'[\' + idx + \'][price_modifier]" value="0" step="1" min="0" class="tc-input-price"></label>\' +
				\'<button type="button" class="tc-remove-row">✕</button>\' +
			\'</div>\';
		},
	};

	$(document).on("click", ".tc-add-row", function() {
		var type   = $(this).data("type");
		var target = $(this).data("target");
		var field  = $(this).data("field");
		var idx    = Date.now();
		var fn     = templates[type];
		if (!fn) return;
		$("#" + target).append(fn(field, idx));
	});

	$(document).on("click", ".tc-remove-row", function() {
		$(this).closest(".tc-option-row").remove();
	});
});
		';
	}
}

/* ==========================================================================
   Frontend – Buton navigare, pagină fullscreen, AJAX add-to-cart
   ========================================================================== */
class TC_Frontend {

	const CONFIGURATOR_PATH = '/configurator-ferestre';
	const PAGE_SLUG         = 'configureaza-fereastra';

	public function __construct() {
		add_action( 'woocommerce_after_add_to_cart_form', [ $this, 'render_button' ], 5 );
		add_action( 'wp_enqueue_scripts',                 [ $this, 'enqueue' ] );
		add_action( 'wp_ajax_tc_add_to_cart',             [ $this, 'ajax_add_to_cart' ] );
		add_action( 'wp_ajax_nopriv_tc_add_to_cart',      [ $this, 'ajax_add_to_cart' ] );
		add_action( 'init',                               [ $this, 'add_rewrite_rules' ] );
		add_filter( 'query_vars',                         [ $this, 'add_query_vars' ] );
		add_action( 'template_redirect',                  [ $this, 'maybe_render_configurator_page' ] );
	}

	public function add_rewrite_rules() {
		add_rewrite_rule( '^' . self::PAGE_SLUG . '/?$', 'index.php?tc_configurator_page=1', 'top' );
	}

	public function add_query_vars( $vars ) {
		$vars[] = 'tc_configurator_page';
		return $vars;
	}

	public function maybe_render_configurator_page() {
		if ( ! get_query_var( 'tc_configurator_page' ) ) return;

		$b64        = sanitize_text_field( wp_unslash( $_GET['product'] ?? '' ) );
		$return_url = esc_url_raw( urldecode( wp_unslash( $_GET['return'] ?? '' ) ) ) ?: home_url();

		$product_id = 0;
		if ( $b64 ) {
			$json       = base64_decode( $b64 );
			$decoded    = $json ? json_decode( $json, true ) : null;
			$product_id = (int) ( $decoded['productId'] ?? 0 );
		}

		if ( ! $product_id ) {
			wp_redirect( $return_url );
			exit;
		}

		$this->render_configurator_page( $b64, $product_id, $return_url );
		exit;
	}

	private function render_configurator_page( $b64, $product_id, $return_url ) {
		$iframe_url = home_url( self::CONFIGURATOR_PATH . '?product=' . rawurlencode( $b64 ) );
		$ajax_url   = admin_url( 'admin-ajax.php' );
		$nonce      = wp_create_nonce( 'tc_add_to_cart' );
		$cart_url   = function_exists( 'wc_get_cart_url' ) ? wc_get_cart_url() : home_url( '/cos/' );
		$site_name  = esc_html( get_bloginfo( 'name' ) );
		?>
<!DOCTYPE html>
<html lang="ro">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title><?php echo $site_name; ?> – Configurator fereastră</title>
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html,body{height:100%;overflow:hidden;background:#f5f0eb;font-family:system-ui,sans-serif}
#tc-loading{
	position:fixed;inset:0;display:flex;flex-direction:column;
	align-items:center;justify-content:center;gap:16px;
	background:#f5f0eb;z-index:10;transition:opacity .3s;
}
#tc-loading.hidden{opacity:0;pointer-events:none}
.tc-spinner{
	width:44px;height:44px;border-radius:50%;
	border:3px solid #e5ddd5;border-top-color:#5a3e2b;
	animation:spin .8s linear infinite;
}
@keyframes spin{to{transform:rotate(360deg)}}
#tc-loading p{font-size:14px;color:#666;font-weight:500}
#tc-iframe{position:fixed;inset:0;width:100%;height:100%;border:none;display:block;z-index:1}
#tc-error{
	display:none;position:fixed;inset:0;z-index:20;
	align-items:center;justify-content:center;flex-direction:column;gap:16px;
	background:#f5f0eb;
}
#tc-error.visible{display:flex}
#tc-error p{font-size:15px;color:#555;text-align:center;max-width:360px;line-height:1.6}
#tc-error a{
	display:inline-block;padding:11px 24px;
	background:#5a3e2b;color:#fff;text-decoration:none;
	border-radius:4px;font-size:14px;font-weight:600;transition:background .15s;
}
#tc-error a:hover{background:#7a5e3b}
</style>
</head>
<body>
<div id="tc-loading">
	<div class="tc-spinner"></div>
	<p>Se încarcă configuratorul…</p>
</div>
<div id="tc-error">
	<p>Eroare la adăugarea în coș. Te rugăm să încerci din nou.</p>
	<a href="<?php echo esc_url( $return_url ); ?>">← Înapoi la produs</a>
</div>
<iframe id="tc-iframe"
	src="<?php echo esc_url( $iframe_url ); ?>"
	title="Configurator fereastră">
</iframe>
<script>
(function(){
"use strict";
var TC={
	ajaxUrl:<?php echo wp_json_encode( $ajax_url ); ?>,
	nonce:<?php echo wp_json_encode( $nonce ); ?>,
	productId:<?php echo (int) $product_id; ?>,
	cartUrl:<?php echo wp_json_encode( $cart_url ); ?>
};
var iframe  = document.getElementById('tc-iframe');
var loading = document.getElementById('tc-loading');
var errBox  = document.getElementById('tc-error');
var busy    = false;

iframe.addEventListener('load', function(){
	if(iframe.src) loading.classList.add('hidden');
});

window.addEventListener('message', function(ev){
	if(!ev.data || ev.data.type !== 'TC_CONFIGURATOR_OUTPUT') return;
	if(busy) return;
	busy = true;

	var output = ev.data.payload;
	loading.classList.remove('hidden');
	loading.querySelector('p').textContent = 'Se procesează…';

	var fd = new FormData();
	fd.append('action',     'tc_add_to_cart');
	fd.append('nonce',      TC.nonce);
	fd.append('product_id', TC.productId);
	fd.append('quantity',   (output.configuration && output.configuration.quantity) || 1);
	fd.append('config',     JSON.stringify(output));

	fetch(TC.ajaxUrl, {method:'POST', body:fd})
	.then(function(r){ return r.json(); })
	.then(function(res){
		if(res.success){
			window.location.href = TC.cartUrl;
		} else {
			loading.classList.add('hidden');
			errBox.classList.add('visible');
		}
	})
	.catch(function(){
		loading.classList.add('hidden');
		errBox.classList.add('visible');
		busy = false;
	});
});
})();
</script>
</body>
</html>
<?php
	}


	/** Construiește obiectul ProductConfig pentru a fi trimis configuratorului. */
	public static function get_product_config( $product_id ) {
		if ( get_post_meta( $product_id, '_tc_enabled', true ) !== 'yes' ) return null;

		$product = wc_get_product( $product_id );
		if ( ! $product ) return null;

		$price    = (int) ( get_post_meta( $product_id, '_tc_price_sqm', true ) ?: 1300 );
		$glass    = json_decode( get_post_meta( $product_id, '_tc_glass',    true ) ?: '[]', true ) ?: [];
		$colors   = json_decode( get_post_meta( $product_id, '_tc_colors',   true ) ?: '[]', true ) ?: [];
		$hardware = json_decode( get_post_meta( $product_id, '_tc_hardware', true ) ?: '[]', true ) ?: [];

		// Fallback: dacă admin-ul nu a setat opțiuni, pune cel puțin una default
		if ( empty( $glass ) ) {
			$glass = [ [ 'id' => 'glass-default', 'label' => 'Geam standard', 'price_modifier' => 0 ] ];
		}
		if ( empty( $colors ) ) {
			$colors = [ [ 'id' => 'color-default', 'label' => 'Natural', 'price_modifier' => 0, 'color_value' => '#8B6914' ] ];
		}
		if ( empty( $hardware ) ) {
			$hardware = [ [ 'id' => 'hw-default', 'label' => 'Standard', 'price_modifier' => 0 ] ];
		}

		// Convertim la formatul TypeScript din configurator
		return [
			'productId'           => $product_id,
			'productName'         => wp_strip_all_tags( $product->get_name() ),
			'pricePerSquareMeter' => $price,
			'glassOptions'        => array_map( fn( $i ) => [
				'id'            => $i['id'],
				'label'         => $i['label'],
				'priceModifier' => (int) ( $i['price_modifier'] ?? 0 ),
			], $glass ),
			'colorOptions'        => array_map( fn( $i ) => [
				'id'            => $i['id'],
				'label'         => $i['label'],
				'priceModifier' => (int) ( $i['price_modifier'] ?? 0 ),
				'colorValue'    => $i['color_value'] ?? '#8B6914',
			], $colors ),
			'hardwareOptions'     => array_map( fn( $i ) => [
				'id'            => $i['id'],
				'label'         => $i['label'],
				'priceModifier' => (int) ( $i['price_modifier'] ?? 0 ),
			], $hardware ),
		];
	}

	public function render_button() {
		if ( ! is_product() ) return;
		$product_id = get_queried_object_id();
		$config     = self::get_product_config( $product_id );
		if ( ! $config ) return;

		$b64      = base64_encode( wp_json_encode( $config ) );
		$page_url = home_url( '/' . self::PAGE_SLUG . '/?product=' . rawurlencode( $b64 ) . '&return=' . rawurlencode( get_permalink( $product_id ) ) );
		?>
		<div class="tc-configurator-wrap">
			<a href="<?php echo esc_url( $page_url ); ?>"
			   class="tc-configurator-btn">
				<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
					<path d="M19.43 12.98c.04-.32.07-.64.07-.98s-.03-.66-.07-.98l2.11-1.65c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.3-.61-.22l-2.49 1c-.52-.4-1.08-.73-1.69-.98l-.38-2.65C14.46 2.18 14.25 2 14 2h-4c-.25 0-.46.18-.49.42l-.38 2.65c-.61.25-1.17.59-1.69.98l-2.49-1c-.23-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64l2.11 1.65c-.04.32-.07.65-.07.98s.03.66.07.98l-2.11 1.65c-.19.15-.24.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1c.52.4 1.08.73 1.69.98l.38 2.65c.03.24.24.42.49.42h4c.25 0 .46-.18.49-.42l.38-2.65c.61-.25 1.17-.59 1.69-.98l2.49 1c.23.09.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.65zM12 15.5c-1.93 0-3.5-1.57-3.5-3.5s1.57-3.5 3.5-3.5 3.5 1.57 3.5 3.5-1.57 3.5-3.5 3.5z"/>
				</svg>
				<?php esc_html_e( 'Configurează fereastra', 'tc' ); ?>
			</a>
		</div>
		<?php
	}

	public function enqueue() {
		if ( ! is_product() ) return;
		$product_id = get_queried_object_id();
		if ( get_post_meta( $product_id, '_tc_enabled', true ) !== 'yes' ) return;

		wp_register_style( 'tc-frontend', false );
		wp_enqueue_style( 'tc-frontend' );
		wp_add_inline_style( 'tc-frontend', $this->button_css() );
	}

	private function button_css() {
		return '
.tc-configurator-wrap { margin-top: 14px; }
.tc-configurator-btn {
	display: inline-flex !important;
	align-items: center !important;
	justify-content: center !important;
	gap: 8px !important;
	width: 100% !important;
	max-width: 400px !important;
	padding: 14px 24px !important;
	font-size: 15px !important;
	font-weight: 600 !important;
	background: #5a3e2b !important;
	color: #fff !important;
	border: none !important;
	border-radius: 4px !important;
	cursor: pointer !important;
	transition: background .15s !important;
	text-decoration: none !important;
}
.tc-configurator-btn:hover { background: #7a5e3b !important; color: #fff !important; }
.tc-configurator-btn svg { flex-shrink: 0; }
		';
	}

	public function ajax_add_to_cart() {
		check_ajax_referer( 'tc_add_to_cart', 'nonce' );

		$product_id = absint( $_POST['product_id'] ?? 0 );
		$quantity   = max( 1, absint( $_POST['quantity'] ?? 1 ) );
		$config_raw = wp_unslash( $_POST['config'] ?? '' );

		if ( ! $product_id || ! $config_raw ) {
			wp_send_json_error( [ 'message' => 'Date invalide.' ] );
		}

		$product = wc_get_product( $product_id );
		if ( ! $product || ! $product->is_purchasable() ) {
			wp_send_json_error( [ 'message' => 'Produsul nu este disponibil.' ] );
		}

		if ( get_post_meta( $product_id, '_tc_enabled', true ) !== 'yes' ) {
			wp_send_json_error( [ 'message' => 'Configuratorul nu este activ pentru acest produs.' ] );
		}

		$config = json_decode( $config_raw, true );
		if ( ! $config || ! isset( $config['configuration'] ) ) {
			wp_send_json_error( [ 'message' => 'Configurație invalidă.' ] );
		}

		$cart_item_key = WC()->cart->add_to_cart( $product_id, $quantity, 0, [], [
			'tc_config' => $config,
		] );

		if ( ! $cart_item_key ) {
			wp_send_json_error( [ 'message' => 'Nu s-a putut adăuga în coș.' ] );
		}

		wp_send_json_success( [
			'cart_item_key' => $cart_item_key,
			'cart_url'      => wc_get_cart_url(),
		] );
	}
}

/* ==========================================================================
   Cart & Order – Afișare configurație în coș, checkout, email
   ========================================================================== */
class TC_Cart {

	public function __construct() {
		add_filter( 'woocommerce_get_cart_item_from_session',        [ $this, 'restore_from_session' ], 10, 2 );
		add_filter( 'woocommerce_get_item_data',                     [ $this, 'display_in_cart' ], 10, 2 );
		add_action( 'woocommerce_before_calculate_totals',           [ $this, 'set_configured_price' ], 10, 1 );
		add_action( 'woocommerce_checkout_create_order_line_item',   [ $this, 'save_to_order' ], 10, 3 );
	}

	/** Suprascrie prețul unitar din coș cu prețul calculat de configurator. */
	public function set_configured_price( $cart ) {
		if ( is_admin() && ! defined( 'DOING_AJAX' ) ) return;
		foreach ( $cart->get_cart() as $cart_item ) {
			if ( empty( $cart_item['tc_config']['pricing']['unitPrice'] ) ) continue;
			$unit_price = (float) $cart_item['tc_config']['pricing']['unitPrice'];
			$cart_item['data']->set_price( $unit_price );
		}
	}

	/** Asigură că meta custom e restaurat din sesiune. */
	public function restore_from_session( $cart_item, $values ) {
		if ( isset( $values['tc_config'] ) ) {
			$cart_item['tc_config'] = $values['tc_config'];
		}
		return $cart_item;
	}

	/** Afișează detaliile configurației în coș și checkout. */
	public function display_in_cart( $item_data, $cart_item ) {
		if ( empty( $cart_item['tc_config'] ) ) return $item_data;

		$conf    = $cart_item['tc_config']['configuration'] ?? [];
		$pricing = $cart_item['tc_config']['pricing']       ?? [];

		$dims = ( isset( $conf['dimensions']['width'], $conf['dimensions']['height'] ) )
			? $conf['dimensions']['width'] . ' × ' . $conf['dimensions']['height'] . ' cm'
			: '';

		$open = '';
		if ( isset( $conf['opens'] ) ) {
			if ( ! $conf['opens'] ) {
				$open = 'Fixă';
			} elseif ( ! empty( $conf['isOscilo'] ) ) {
				$open = 'Oscilobatant';
			} else {
				$open = 'Cu deschidere';
			}
		}

		$rows = [
			'Geamuri'    => isset( $conf['glassCount'] ) ? (string) $conf['glassCount'] : '',
			'Deschidere' => $open,
			'Dimensiuni' => $dims,
			'Sticlă'     => $conf['glass']['label']    ?? '',
			'Culoare'    => $conf['color']['label']     ?? '',
			'Feronerie'  => $conf['hardware']['label']  ?? '',
		];

		foreach ( $rows as $key => $val ) {
			if ( '' === $val ) continue;
			$item_data[] = [
				'key'   => $key,
				'value' => esc_html( $val ),
			];
		}

		return $item_data;
	}

	/** Salvează configurația în linia de comandă (vizibilă în admin și emailuri). */
	public function save_to_order( $item, $cart_item_key, $cart_item ) {
		if ( empty( $cart_item['tc_config'] ) ) return;

		$conf = $cart_item['tc_config']['configuration'] ?? [];

		$item->add_meta_data( 'Configurație',  'Da', true );

		if ( isset( $conf['dimensions']['width'], $conf['dimensions']['height'] ) ) {
			$item->add_meta_data(
				'Dimensiuni',
				$conf['dimensions']['width'] . ' × ' . $conf['dimensions']['height'] . ' cm',
				true
			);
		}

		if ( ! empty( $conf['opens'] ) !== null ) {
			$open = ! $conf['opens'] ? 'Fixă' : ( ! empty( $conf['isOscilo'] ) ? 'Oscilobatant' : 'Cu deschidere' );
			$item->add_meta_data( 'Deschidere', $open, true );
		}

		if ( ! empty( $conf['color']['label'] ) ) {
			$item->add_meta_data( 'Culoare', $conf['color']['label'], true );
		}
		if ( ! empty( $conf['hardware']['label'] ) ) {
			$item->add_meta_data( 'Feronerie', $conf['hardware']['label'], true );
		}
		if ( ! empty( $conf['glass']['label'] ) ) {
			$item->add_meta_data( 'Sticlă', $conf['glass']['label'], true );
		}

		// Salvează tot JSON-ul pentru uz intern
		$item->add_meta_data( '_tc_config_raw', wp_json_encode( $cart_item['tc_config'] ), true );
	}
}

/* ==========================================================================
   Bootstrap
   ========================================================================== */
add_action( 'plugins_loaded', function () {
	if ( ! class_exists( 'WooCommerce' ) ) return;
	new TC_Admin();
	new TC_Frontend();
	new TC_Cart();
} );

register_activation_hook( __FILE__, function () {
	add_rewrite_rule( '^' . TC_Frontend::PAGE_SLUG . '/?$', 'index.php?tc_configurator_page=1', 'top' );
	flush_rewrite_rules();
} );

register_deactivation_hook( __FILE__, 'flush_rewrite_rules' );

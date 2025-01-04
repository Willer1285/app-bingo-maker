( function() {

	if( $('body').attr('id') == 'customURL' ) {
		$('#alias').focus(function() {
			$(this).next('.result-msg')
				.removeClass('error')
				.removeClass('success')
				.delay( 350 )
				.text('');

			$(this).removeClass('error').removeClass('success');
		});

		$('#alias').blur(function() {
			if( $(this).val() != '' ) {
				let formData = new FormData(),
					thisInput = $(this);

				formData.append( 'slug', thisInput.val() );
				formData.append( 'csrf_tk_bingomaker', csrf_token );

				fetch( rootURL + 'custom-url/check-page-slug-availability/', {
					method: "POST",
					body: formData,
				} )
				.then( function( response ){
					if( response.ok ) {
						return response.json();
					} else {
						console.log("erreur");
					}
				} )
				.then(function( data ) {
					if( data.result == true ) {
						thisInput.next('.result-msg')
							.removeClass('error')
							.addClass('success')
							.text( $('#textContainer').data('alias-available') );

						thisInput.val( data.alias ).removeClass('error').addClass('success');

						if( thisInput.closest( '#modifyCustomUrl' ).length > 0 ) {
							$('#updateCustomUrl').prop('disabled', false);
						}
					} else {
						thisInput.next('.result-msg')
							.removeClass('success')
							.addClass('error')
							.text( $('#textContainer').data('alias-unavailable') );

						thisInput.val( data.alias ).removeClass('success').addClass('error');

						if( thisInput.closest( '#modifyCustomUrl' ).length > 0 ) {
							$('#updateCustomUrl').prop('disabled', true);
						}
					}
				} );
			}
		});
	}

	$('.slim-custom-url-image').each( function() {
		var thisEl = $(this),
			cropSize = false,
			cropSizeW = false,
			cropSizeH = false;

		if( thisEl.data('forced-size') != '' ) {
			if( String( thisEl.data('forced-size') ).indexOf( ',' ) > -1 ) {
				cropSizes = thisEl.data('forced-size').split(',');

				cropSizeW = cropSizes[0];
				cropSizeH = cropSizes[1];
			} else {
				cropSizeW = thisEl.data('forced-size');
				cropSizeH = thisEl.data('forced-size');
			}
		}

		thisEl.slim({
			forceSize: cropSizeW && cropSizeH ? {
				width: cropSizeW,
				height: cropSizeH
			} : false,

			didRemove: function() {
				thisEl.next('.image-remove-hidden').val( 1 );
			},

			// Button Label
			buttonEditLabel: $('#slimText').attr('data-button-edit-label'),
			buttonRemoveLabel: $('#slimText').attr('data-button-remove-label'),
			buttonDownloadLabel: $('#slimText').attr('data-button-download-label'),
			buttonUploadLabel: $('#slimText').attr('data-button-upload-label'),
			buttonCancelLabel: $('#slimText').attr('data-button-cancel-label'),
			buttonConfirmLabel: $('#slimText').attr('data-button-confirm-label'),
			// Status translation
			statusFileType: $('#slimText').attr('data-status-file-type'),
			statusFileSize: $('#slimText').attr('data-status-file-size'),
			statusNoSupport: $('#slimText').attr('data-status-no-support'),
			statusImageTooSmall: $('#slimText').attr('data-status-image-too-small'),
			statusContentLength: $('#slimText').attr('data-status-content-length'),
			statusUnknownResponse: $('#slimText').attr('data-status-unknown-response'),
			statusUploadSuccess: $('#slimText').attr('data-status-upload-success'),
		});
	} );

	$('input[name$=_display]').change(function(){
		if( parseInt( $(this).val() ) === 1 ) {
			$(this).closest('.uk-form-row').next('.opacity-will-change').removeClass('fake-disabled');
		} else {
			$(this).closest('.uk-form-row').next('.opacity-will-change').addClass('fake-disabled');
		}
	});

} ) ();
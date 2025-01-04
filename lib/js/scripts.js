// import 'jquery/dist/jquery';
// import moment from 'moment/src/moment';
// import "select2";
import 'smallipop';
import "slim.jquery.min.js";
import * as validation from "validation.js";
import * as loading from "loading.js";
import 'uikit';
import 'uikit/src/js/components/datepicker.js';
import "caller.js";
import "custom-url.js";
// import "deposit.js";
import loadGoogleMapsAPI from 'load-google-maps-api';

import 'whatwg-fetch';
var openedPreview,
needToConfirm = true,
secondWindow = null;

function is_touch_device() {
	return window.matchMedia("(pointer: coarse)").matches;
}

//**************************************************************************************************************************
// Vérifier que la valeur est un integer
//**************************************************************************************************************************
function isInteger(str) {
	let n = ~~Number(str);
	return String(n) === str && n >= 1;
}

//**************************************************************************************************************************
// Aller à la page de login
//**************************************************************************************************************************
function login() {
	document.location.href = rootURL + "user/login/";
}

$('#fbconnect').on('click touch', function(e){
	e.preventDefault();

	FB.Event.subscribe('auth.login', function(response) {
		FB.api('/me', function(response) {
			window.location.href = rootURL + "user/login/";
		});
	});
});

$('#loginform').on( 'submit', function( e ) {

	e.preventDefault();

	let theButtons = $( '#fblogin, #loginBtn' ),
		loginMessage = $('#loginMessage');

	loading.showHide( $(this), true );

	theButtons.prop( 'disabled', true );
	loginMessage.hide('150').text('');

	$.post( $( this ).attr('action'), $( this ).serialize() )
	.done( function( data ){

		if( data.result === 'success' ) {
			$('.uk-modal').hide();
			window.location = data.redirect;
		} else {

			loading.showHide( $(this), false );
			loginMessage.text( data.message ).show( 150 );
			theButtons.prop( 'disabled', false );

		}

	})
	.fail( function() {

		loading.showHide( $(this), false );

		UIkit.modal.alert( $('#textContainer').data('error-five-hundred'), { center: true } );

		// loginMessage.text( $('#textContainer').data('error-five-hundred') ).show( 150 );
		theButtons.prop( 'disabled', false );


	} );

} );

//**************************************************************************************************************************
// Get URL parameters
//**************************************************************************************************************************
let getUrlParameter = function getUrlParameter( sParam ) {
	let sPageURL = decodeURIComponent( window.location.search.substring(1) ),
	sURLVariables = sPageURL.split('&'),
	sParameterName,
	i;

	for ( let i = 0; i < sURLVariables.length; i++) {
		sParameterName = sURLVariables[i].split('=');

		if (sParameterName[0] === sParam) {
			return sParameterName[1] === undefined ? true : sParameterName[1];
		}
	}
};

//**************************************************************************************************************************
// Confirmer qu'on veut quitter la page et tout perdre
//**************************************************************************************************************************
function confirmExit(e) {
	let clickedElement = document.activeElement;

	if( clickedElement == 'undefined' || ( clickedElement.id !== 'saveAndMakeDesign' && clickedElement.id !== 'savePlaylist' ) ) {
		if( needToConfirm ) {
			return $('#jsQuitPlaylist').text();
		}
	}
}

//**************************************************************************************************************************
// Façon plus fiable d'ouvrir un lien spécifié dans un nouvel onglet
//**************************************************************************************************************************
function openInNewTab(url) {
	let win = window.open(url, '_blank');
	win.focus();
}


//**************************************************************************************************************************
// Façon plus fiable d'ouvrir un lien spécifié dans un nouvel onglet
//**************************************************************************************************************************
function strip_tags( contentHtml, whitelist ) {
	return $(contentHtml).not(whitelist).each(function() {
		let content = $(this).contents();
		$(this).replaceWith(content);
	});
}

//**************************************************************************************************************************
// Remplacer les message de confirmation
//**************************************************************************************************************************

if($('.confirm').length > 0){
	$('.confirm').each(function(){
		//$(this).on('click touch', function(){
			$(this).unbind("click touch");
		//});
		//
		$(this).click(function(e){
			e.preventDefault();
			let url = null;
			if( $(this).prop("tagName") === 'A' ) {
				url = $(this).attr( "href" );
			}
			UIkit.modal.confirm(
				$(this).attr( 'data-confirm' ) ? $(this).attr( 'data-confirm' ) : $('#actionDefault').text(), function() {
					if( url != null ){
						window.location = url;
					}

					return true;
				}, function() {
					return false;
				}, {
					center: true
				});
		});
	});
}


/*$('.confirmCredit').each(function(){
	$(this).unbind();

	$(this).confirmOn({
		questionText: $(this).attr( 'data-confirm' ) ? $(this).attr( 'data-confirm' ) : $('#notEnoughCredit').text(),
		textYes: !$('body').hasClass('en') ? 'Ajouter des crédits' : 'Add credits',
		textNo: !$('body').hasClass('en') ? 'Annuler' : 'Cancel'
	},'click touch', function(e, confirmed) {
		if(confirmed) {
			window.location = rootURL + "credit/deposit/";
		}
	});
});*/

$(document).on('click', '.confirmCredit', function(e){
	e.preventDefault();

	notEnoughCreditPopup( $(this) );
});

function notEnoughCreditPopup( thisEl, postForm ) {
	UIkit.modal.confirm(
		( thisEl.attr( 'data-question' ) ? thisEl.attr( 'data-question' ) : $('#notEnoughCredit').text() ),

		function() {
			if( postForm === 'undefined' ) {
				window.location = rootURL + "credit/deposit/";
			} else {
				postForm.submit();
			}
		},
		function() {
			loading.showHide( false, false );
		},
		{
			center: true,
			labels: {
				Ok: ( thisEl.attr( 'data-confirm' ) ? thisEl.attr( 'data-confirm' ) : $('#messageContainer').data('label-add-credit') ),
				Cancel: ( thisEl.attr( 'data-cancel' ) ? thisEl.attr( 'data-cancel' ) : $('#messageContainer').data('label-cancel') ),
			}
		}
	);
}

//**************************************************************************************************************************
// Appeller la fonction de validation
//**************************************************************************************************************************
$('.validation').each(function(){
	$(this).on('click touch', function( event ) {
		event.preventDefault();
		let noError = false;
		let $form = $(this).closest('form');
		noError = validation.validForm( $form.attr('id'), $(this),false );

		if( $form.attr('id') == 'deposit' ){
			$('.uk-form-danger').prop('readonly',false);
			$('.uk-form-danger').first().prop('autofocus',true);
		}
		if( noError && $form.attr('id') !== 'editProject' ){
			loading.showHide( $(this) );
			if( ! $(this).hasClass('notenoughcredit') && ! $(this).hasClass('confirm-action') ) {
				$form.submit();
			} else {
				notEnoughCreditPopup( $(this), $form );
			}
		}
	});
});

//**************************************************************************************************************************
// Code sur la page de la liste des produits
if( $('#list').length > 0) {
	$('.showGeneratedStuff').on('click touch', function(){
		let attr = $(this).attr('data-version');
		if( typeof attr !== typeof undefined && attr !== false ) {
			if( $(this).hasClass('closed') ) {
				// $('#'+attr).slideDown(250);
				$(this).closest('.action-button-container').find('.versionList').slideDown(250);
				$(this).find('i').removeClass('uk-icon-folder').addClass('uk-icon-folder-open');
			} else {
				// $('#'+attr).slideUp(250);
				$(this).closest('.action-button-container').find('.versionList').slideUp(250);
				$(this).find('i').removeClass('uk-icon-folder-open').addClass('uk-icon-folder');
			}
		} else {
			if( $(this).hasClass('closed') ) {
				$(this).closest('.action-button-container').find('.versionList').slideDown(250);
				$(this).find('i').removeClass('uk-icon-folder').addClass('uk-icon-folder-open');
			} else {
				$(this).closest('.action-button-container').find('.versionList').slideUp(250);
				$(this).find('i').removeClass('uk-icon-folder-open').addClass('uk-icon-folder');
			}
		}


		$(this).toggleClass('closed');
	});
}

$(document).on('click', '.mustDisable', function(e) {
	e.preventDefault();

	let link = $(this).attr('href');

	UIkit.modal.confirm( $('#messageContainer').attr('data-already-active-game'), function() {
		window.location = link;
	}, function() {},
	{
		center:true,
		labels:{
			Cancel:$("#messageContainer").attr("data-label-cancel")
		}
	});

});

/*$('.openCaller').each(function(){
	$(this).click(function(e){
		if( $(this).hasClass('mustDisable') ) {
			e.preventDefault();

			let link = $(this).attr('href');
			UIkit.modal.confirm( $('#messageContainer').attr('data-already-active-game'), function() {
				window.location = link;
			}, function() {},
			{
				center:true,
				labels:{
					Cancel:$("#messageContainer").attr("data-label-cancel")
				}
			});
		}
	});
});*/

//**************************************************************************************************************************
// Avertir le user que s'il quitte l'édition de la playlist sont projet sera supprimé
//**************************************************************************************************************************
if( $('#pPlaylist').length > 0 ) {
	window.onbeforeunload = confirmExit;
}

//**************************************************************************************************************************
// Permettre de copier/coller une liste dans les champs de la playlist
//**************************************************************************************************************************
if( $('#editPlaylist').length > 0 ) {
	let nbFields = $('#editPlaylist input[type="text"]').length;

	//$('#editPlaylist input[type="text"]').bind('paste', null, function(e){
	document.addEventListener("paste", function (e) {
		let target = e.target.id;

		if( target.indexOf("song") >= 0 ) {
				let pastedText,
				startField = parseInt( target.replace( 'song', '' ) );

			if( window.clipboardData && window.clipboardData.getData ) { // IE
				pastedText = window.clipboardData.getData('text');
			} else if( e.clipboardData && e.clipboardData.getData ) {
				pastedText = e.clipboardData.getData('text/plain');
			}

			//let lignes = pastedText.split(String.fromCharCode(13, 10)),
			if( pastedText.search(/\r\n|\r|\n/g) != -1 ) {
				e.preventDefault();

				let lignes = pastedText.split(/\r\n|\r|\n/g),
				nbRow = lignes.length,
				endFor = startField + nbRow,
				curRow = 0;

				for( let i = startField; i <= endFor; i++ ) {
					if( $('#song' + i).length == 0 ) { break; }
					$('#song' + i).val( lignes[curRow] );
					curRow++;
				}
			}
		}
	});

	$('input[name="input_method"]').on('change', function(){
		let action = getUrlParameter('action');
		window.location = window.location.pathname + '?method=' + $(this).val() + ( action ? '&action=' + action : '' );
	});

	// Si on a assez de credit on valide le formulaire et on passe à la prochaine étape
	let actionBtn = $("#actionBtn");
	$('#savePlaylist').on('click touch', function(e){
		actionBtn.val(1);
		if( !$(this).hasClass('notenoughcredit') ) {
			if(inputsHaveNoGoodValue()){
				validation.validForm( $(this).closest('form').attr('id'), $(this) );
			}
		} else if( validation.validForm( $(this).closest('form').attr('id'), $(this), false ) ) {
			e.preventDefault();
			UIkit.modal("#modalCreditEdit").show();
		}
	});

	$('#saveAndMakeDesign').on('click touch', function(e){
		actionBtn.val(0);
		if( !$(this).hasClass('notenoughcreditPop') ) {
			e.preventDefault();
			if(inputsHaveNoGoodValue()){
				validation.validForm( $(this).closest('form').attr('id'), $(this) );
			}
		} else if( validation.validForm( $(this).closest('form').attr('id'), $(this), false ) ) {
			e.preventDefault();
			UIkit.modal("#modalCreditEdit").show();
		}else{
			e.preventDefault();
		}

	});

}

//**************************************************************************************************************************
// Vérifier qu'il y a assez de crédit pour faire cette action
//**************************************************************************************************************************
//

var changeTypeBingo = function(){
	if( $(this).val() == 1 || $(this).val() == 2 ) {
		changeTypeBingoValue();
		$('#model5').attr('disabled', false);
		$('#model5').next('label').css('opacity', 1);

		if( $(this).val() == 2 ) {
			$('#emojiName').removeClass('hide');
		} else {
			$('#emojiName').addClass('hide');
		}
	} else if( $(this).val() == 0 ) {
		$('#model5').attr('disabled', true);
		$('#model5').next('label').css('opacity', .5);

		if( $('input[name=model]').val() == 5 ) {
			$('input[name=model]').val(1);
		}

		changeTypeBingoText();
	} /*else {
		$('#emojiName').addClass('hide');
		changeTypeBingoText();

		console.log( 'yo' );
	}*/
};

var changeTypeBingoValue = function() {

	let optionCredits = $("#nCards").find(':selected').data('credits');
	let newButtonString;
	let contentEditPage = $("#contentEditPage");
	let designbutton = contentEditPage.attr("data-title-btn-design");
	let projectbutton = contentEditPage.attr("data-title-btn-project");
	let small = "";
	let nextstepToProject = $('#nextstepToProject');
	let nextstep = $('#nextstep');

	$('#endnumber').text( parseInt( $('#start').val() ) + parseInt( $('#nCards').val() ) - 1 );

	if( optionCredits > 0 ) {
		small = "<small>" + optionCredits + " " + contentEditPage.attr("data-string-credits") + "</small>";
	} else {

		small = "<small>" + contentEditPage.attr("data-string-free") + "</small>";

	}

	nextstep.html( designbutton+small ).removeClass('nextstep').show();
	nextstepToProject.html( projectbutton+small );
};

var changeTypeBingoText = function(){

	let contentEditPage = $("#contentEditPage");
	$('#nextstep').hide();

	if( contentEditPage.data('notenoughcredit') ){

		$('#nextstepToProject').removeClass('notenoughcredit');

	}

	$('#nextstepToProject').text( contentEditPage.data("nextstep") ).addClass('nextstep');
	$('#nValues option').prop( 'disabled', false );
};

$(".start-caller").click(function(){
	localStorage.removeItem("showInterval");
});

if( $('#editProject').length > 0 ) {
	let buttonContent = $('#nextstep').html(),
		contentEditPage = $("#contentEditPage"),
		nextstep = $('#nextstep'),
		submitButton = $('#nextstepToProject'),
		costModifier = 0;

	$('input[name="type"]').on('change', changeTypeBingo);

	function update_value_on_button( cost ) {
		let newButtonString, newCost,
			formData = new FormData();

		if( cost > 0 ) {
			newCost = cost + costModifier;
			newButtonString = newCost + " " + contentEditPage.attr("data-string-credits");
		} else {
			newCost = parseInt( $(this).find(":selected").attr('data-credits') );
			newButtonString = contentEditPage.attr("data-string-free");
		}

		submitButton.children('small').html( newButtonString );
		nextstep.children('small').html( newButtonString );

		$('#nCards ~ .creditMsg').text('');

		formData.append('datatype', 'json');
		formData.append('csrf_tk_bingomaker', csrf_token);

		fetch( rootURL + "credit/enough/" + newCost + "/1/", {
			method:"POST",
			body:formData
		})
		.then(function(response){
			if ( response.ok )
				return response.json();
			else
				console.log("erreur");
		})
		.then(function( json ) {
			if( json.response !== 'ok' ) {
				$('#nCards ~ .creditMsg').html( json.html );
				$('.action').addClass('notenoughcredit');
				if( $('#missingCredits').length > 0 ) {
					$('#missingCredits').val( json.lack );
					$('#modalCreditEdit p.content').html( json.html );
				}
			} else {
				$('.action').removeClass('notenoughcredit');
			}
		});
	}

	$('#start').on('change', function(){
		let endNumberEl = $('#endnumber'),
			startNumberEl = $('#start'),
			numberOfValues = parseInt( $('#nCards').val() ),
			startNumber;

		if( !isInteger( startNumberEl.val() ) ) { startNumberEl.val( 1 ); }

		startNumber = parseInt( startNumberEl.val() );

		endNumberEl.text( startNumber + numberOfValues - 1 );
	});

	$('#nCards').on('change', function(){

		let optionCredits = parseInt( $(this).find(':selected').data('credits') );/*,
			print_only = $("#print_only")*/

		// On va faire comme si l'utilisateur avait changer la valeur du masquage des pubs pour mettre à jour le costModifier
		if( $('#hidePubYes').is(':checked') ) {
			$('#hidePubYes').trigger('change');
		}

		/*print_only.hide();

		if( parseInt( $(this).val() ) > parseInt( print_only.data('virtual-treshold') ) ) {
			print_only.show( 150 );
		}*/

		$('#endnumber').text( parseInt( $('#start').val() ) + parseInt( $('#nCards').val() ) - 1 );

		update_value_on_button( optionCredits, costModifier );

	});

	$('input[name="hidePub"]').on('change', function( ) {
		if( $(this).val() == 1 ) {
			let cost_by_card = parseInt( $(this).data('cost') ),
				card_divider = parseInt( $(this).data('cost-card') ),
				current_cards_count = parseInt( $('#nCards').val() ),
				multiplier;

			multiplier = Math.ceil( current_cards_count / card_divider );

			costModifier = cost_by_card * multiplier;

			$('#customUrlText').show( 250, function( ){
				$(this).removeClass('hide');
			} );

			update_value_on_button( parseInt( $('#nCards').find(':selected').data('credits') ) );
		} else {
			costModifier = 0;

			$('#customUrlText').hide( 250, function( ){
				$(this).addClass('hide');
			} );

			update_value_on_button( parseInt( $('#nCards').find(':selected').data('credits') ) );
		}
	});

	$('.action').on('click touch', function(e){
		e.preventDefault();
		$("#actionHidden").val( $(this).val() );

		if( !$(this).hasClass('notenoughcredit') || $(this).hasClass('nextstep') ) {

			let error = validation.validForm( $(this).closest('form').attr('id'), $(this), false );

			if( error ) {
				loading.showHide( $(this) );
				$(this).closest('form').submit();
			}

		} else {
			UIkit.modal("#modalCreditEdit").show();
		}
	});
} else {// On valide le nombre de crédit, si pas assez on désactive le lien et pop le modal
	$('a.notenoughcredit').on('click touch', function(e){
		UIkit.modal("#modalCredit").show();
	});
}

//**************************************************************************************************************************
// Charger le script de cropping
//**************************************************************************************************************************
function createSlimUploader( sName, sWidth, sHeight, idProject ) {
	$('#' + sName + ' > input[type="file"]').slim({
		ratio: sWidth + ':' + sHeight,
		size: {
			width: ( sWidth * 2 ) - 1,
			height: ( sHeight * 2 ) - 1,
		},
		minSize: {
			width: sWidth,
			height: sHeight,
		},
		crop: {
			x: 0,
			y: 0,
			width: ( sWidth * 2 ) - 1,
			height: ( sHeight * 2 ) - 1
		},
		defaultInputName: sName,
		download: false,
		instantEdit: true,
		meta: {
			idProject: idProject
		},
		// Drop zone label
		label: $('#slimText').attr('data-slim-label') + '<br>min. ' + sWidth + 'px X ' + sHeight + 'px',
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
}

if( $('body#createDesign').length > 0 ) {
	// Activer la pub de gauche
	if( $('#leftPubSm').length > 0 ) {
		createSlimUploader( 'leftPubSm', 226, 687, $('#idProject').val() );
	}

	// Activer la pub de droite
	if( $('#rightPubSm').length > 0 ) {
		createSlimUploader( 'rightPubSm', 226, 687, $('#idProject').val() );
	}

	// Activer la pub de droite
	if( $('#rightPubLg').length > 0 ) {
		createSlimUploader( 'rightPubLg', 466, 687, $('#idProject').val() );
	}

	// Activer la pub de droite
	if( $('#leftPubLg').length > 0 ) {
		createSlimUploader( 'leftPubLg', 466, 687, $('#idProject').val() );
	}

	// Activer la pub du bas
	if( $('#bottomPub').length > 0 ) {
		createSlimUploader( 'bottomPub', 432, 90, $('#idProject').val() );
	}

	// Activer la pub du bas
	if( $('#bottomPubLeft').length > 0 ) {
		createSlimUploader( 'bottomPubLeft', 432, 90, $('#idProject').val() );
	}

	// Activer la pub du bas
	if( $('#bottomPubRight').length > 0 ) {
		createSlimUploader( 'bottomPubRight', 432, 90, $('#idProject').val() );
	}

	// Activer la pub du haut
	if( $('#topPub').length > 0 ) {
		createSlimUploader( 'topPub', 432, 90, $('#idProject').val() );
	}

	// Activer la pub du haut
	if( $('#topPubLeft').length > 0 ) {
		createSlimUploader( 'topPubLeft', 432, 90, $('#idProject').val() );
	}

	// Activer la pub du haut
	if( $('#topPubRight').length > 0 ) {
		createSlimUploader( 'topPubRight', 432, 90, $('#idProject').val() );
	}

	// Activer la pub du bas
	if( $('#bottomPubVertical').length > 0 ) {
		createSlimUploader( 'bottomPubVertical', 323, 67, $('#idProject').val() );
	}

	// Activer la pub du bas
	if( $('#bottomPubLeftVertical').length > 0 ) {
		createSlimUploader( 'bottomPubLeftVertical',323, 67, $('#idProject').val() );
	}

	// Activer la pub du bas
	if( $('#bottomPubRightVertical').length > 0 ) {
		createSlimUploader( 'bottomPubRightVertical', 323, 67, $('#idProject').val() );
	}

	// Activer la pub du haut
	if( $('#topPubVertical').length > 0 ) {
		createSlimUploader( 'topPubVertical', 323, 67, $('#idProject').val() );
	}

	// Activer la pub du haut
	if( $('#topPubLeftVertical').length > 0 ) {
		createSlimUploader( 'topPubLeftVertical', 323, 67, $('#idProject').val() );
	}

	// Activer la pub du haut
	if( $('#topPubRightVertical').length > 0 ) {
		createSlimUploader( 'topPubRightVertical', 323, 67, $('#idProject').val() );
	}

	$('#saveDesign').on('click touch', function( e ){
		let emptyFile = 0,
		theform = $('#submitImages'),
		spaceToFill = theform.find(".pub:not(.disabled)"),
		nbSpaceToFill = spaceToFill.length,
		haveLetter	= true,
		block;

		spaceToFill.each(function(){
			if( $.trim( $(this).find('input[type="hidden"]').val() ).length == 0 ) { emptyFile = emptyFile + 1; }
		});


		$(".contentHeader").each(function(){
			if($(this).text().length == 0){
				haveLetter = false;
				return false;
			}
		});

		if( nbSpaceToFill == emptyFile ) {
			loading.showHide( $(this), false );
			UIkit.modal.alert( $('#noImage').text() );
			e.preventDefault();
		} else if ( haveLetter == false ) {
			loading.showHide( $(this), false );
			UIkit.modal.alert( $('#slimText').attr('data-text-no-header') );
			e.preventDefault();
		}else if( emptyFile != 0 ) {
			e.preventDefault();
			UIkit.modal.confirm( $('#noAllImage').text(), function(){
				if( !theform.hasClass('notenoughcredit') ) {
					loading.showHide( $(this), true );
					theform.submit();
				} else {
					e.preventDefault();
					UIkit.modal("#modalCreditEdit").show();
				}
			});
		} else {
			if( !theform.hasClass('notenoughcredit') ) {
				loading.showHide( $(this), true );
				theform.submit();
			} else {
				e.preventDefault();
				UIkit.modal("#modalCreditEdit").show();
			}
		}
	});

	// Changer l'affichage
	$('input[name="num4Coin"]').on('change', function(){
		if( $(this).val() == 1 ) {
			$('.cornerNumber').fadeIn(150);
		} else {
			$('.cornerNumber').fadeOut(150);
		}
	});

	$('input[name="showDate"]').on('change', function(){
		if( $(this).val() == 1 ) {
			$('span.showDate').fadeIn(150);
			$('span.showDateOpt').fadeIn(150);
		} else {
			$('span.showDate').fadeOut(150);
			$('span.showDateOpt').fadeOut(150);
		}
	});

	$('#date_evenement').on('change', function(){
		let date = $(this).val();
		$('span.showDate').text( date );
		$(".dateDesign").text( date );

	});

	$('input[name="cardsTitle"]').keyup(function(){
		let title = $(this).val();
		$('h2.cardtitle').html( ( title ? title : "&nbsp;" ) );
	});

	$('input[name="optimizeSpace"]').on('change', function(){
		let model = $('#slimText').attr('data-card-modele'),
			pubHidden = parseInt( $(this).closest( '.uk-form-row' ).data('hidePub') );

		if( $(this).val() == 1 ) {

			if( $(this).hasClass('notenoughcredit') ) {
				$(this).closest('form').addClass('notenoughcredit');
			}

			if( pubHidden === 0 ) { $('.infos').hide(150); }
			$('.topPub').show(150);
			$('h2').hide(150);
			$('.hsPub').removeClass('disabled');
			$('#saveDesign small').text( $('#costWithOptimize').text() );
			$('#modalCreditEdit .content strong').text( parseInt( $('#costWithOptimize').text() ) );

			$('.infos').hide(150);
			$('.infos-small').show(150);

			if( model == 5 ) {
				if( pubHidden === 0 ) { $('.infos-small-top').fadeIn(150); }

				$('.infoCardHide').show(150);
				$(".topCard").css('height','');
				$(".bottomCard").css('height','');
				$(".topLeft").css({'background-color':'white'});
				$(".topRight").css({'background-color':'white'});
			} else if( pubHidden === 0 ) {
				$('.infos-small').fadeIn(150);
			}

		} else {
			if( pubHidden === 0 ) {
				$('.infos').show(150);
				$('.infos-small:not(.infoCard)').fadeOut(150);
			}

			$('.topPub').hide(150);
			$('h2').show(150);
			$('.hsPub').addClass('disabled');
			$('#saveDesign small').text( $('#costStandard').text() );
			$('#modalCreditEdit .content strong').text( parseInt( $('#costStandard').text() ) );

			$('.infos').show(150);
			$('.infos-small').hide(150);

			if( model == 5 ) {
				if( pubHidden === 0 ) { $('.infoCardHide').hide(150); }
				$(".topCard").css('height','52.5%');
				$(".bottomCard").css('height','47.5%');
				$(".topLeft").css({'background-color':''});
				$(".topRight").css({'background-color':''});
			}
		}
	});
}

//**************************************************************************************************************************
// Permet de mettre certaines zone du site en surbrillance
//**************************************************************************************************************************

if( $('#pList').length > 0 && $('.expose').length > 0 ) {
	let $expose = $(".expose");
	$expose.css('z-index','99999');
	$('html, body').animate({
		scrollTop: ($expose.offset().top-75) + 'px'
	}, 'fast');


	$('.expose .expose-tooltip').fadeIn('350');
	$('#overlay').fadeIn(350, function(){
		setTimeout(function(){
			$('.expose .expose-tooltip').fadeOut('250');
			$('#overlay').fadeOut(250, function(){
				$('.expose').css('z-index','1');
			});
			let $children = $expose.children(":not(.expose-tooltip)");
			$children.first().insertAfter('.expose');
			$expose.remove();
		}, 5000);
	});

	$('#overlay').click(function(){
		$('.expose .expose-tooltip').fadeOut('250');

		$('#overlay').fadeOut(250, function(){
			$expose.css('z-index','1');
		});
		let$children = $expose.children(":not(.expose-tooltip)");
		$children.first().insertAfter('.expose');
		$expose.remove();
	});
}


//**************************************************************************************************************************
// Scripts pour les tooltip de tutoriel
//**************************************************************************************************************************
$('.tutorialTip .close').on('click touch', function(e){
	e.preventDefault();

	$(this).closest('.tutorialTip').fadeOut(250);
});


//Montrer tous les tutoriels de la page
$('.showTutorials').on('click touch', function(e) {
	let theButton = $(this);
	if( !theButton.hasClass('tutorialsOpen') ) {
		$('.tutorialTip').fadeIn(250, function() {
			theButton.addClass('tutorialsOpen');
		});
	} else {
		$('.tutorialTip').fadeOut(250, function() {
			theButton.removeClass('tutorialsOpen');
		});
	}
});


//**************************************************************************************************************************
// [TODO] : Placer le contenu d'un lien dans le presse-papier
//**************************************************************************************************************************
/*$('.content-to-clipboard').on('click', function(){

});*/

//**************************************************************************************************************************
// Scripts pour l'admin
//**************************************************************************************************************************
if( $('#admin').length > 0 ) {
	// Formulaire d'ajout / retrait de crédit
	$('.btnadd').on('click touch', function(e){
		e.preventDefault();

		$('.formContainer').hide(150);

		$(this).next('.formAdd').show(150);
	});

	$('.btnwithdraw').on('click touch', function(e){
		e.preventDefault();

		$('.formContainer').hide(150);

		$(this).next('.formWithdraw').show(150);
	});

	$('.cancel').on('click touch', function(e){
		e.preventDefault();

		$(this).closest('.formContainer').hide(150);
	});

	$('select[name=updateRaydiantPackage').change(function(){
		let theSelect = $(this);

		UIkit.modal.confirm( "Voulez-vous vraiment changer le forfait Raydiant de cet utilisateur ? Un projet lié à ce forfait sera automatiquement créé dans le compte de cet utilisateur.", function() {
			$.ajax({
				url: rootURL + "admin/change-raydiant-package/",
				async: false,
				type: "POST",
				dataType: "json",
				cache: false,
				data: {
					idUser: theSelect.data('user-id'),
					package: theSelect.val(),
					'csrf_tk_bingomaker' : csrf_token,
				},
			}).done(function( json ) {
				if( json.state == 'success' ) {
					UIkit.modal.alert( json.message );
				} else {
					console.error( json.message );
				}
			});
		}, function() {},
		{
			center:true,
		});

		/*$.ajax({
			url: rootURL + "card/simulateResult/" + $("#idProject").attr('value') + "/1/",
			async: false,
			type: "POST",
			dataType: "json",
			cache: false,
			data: $("#listeLecture").serialize(),
		}).done(function( json ) {
			if(json.error == false){
				$("#wlg").text( json.data.wlg );
				$("#wdg").text( json.data.wdg );
				$("#wcg big").text( json.data.wcg );
				$("#winningcards").val( json.data.wcg );
				$("#wcp").text( json.data.wcp );
				$("#w4c").text( json.data.w4c );
				$("#wx").text( json.data.wx );
			} else {
				console.warn('error in ajax stats');
			}

			if( $('#redoRandom').length > 0 ) {
				setTimeout(function() {
					$('#redoRandom').prop('disabled', false).fadeIn('250');
				}, 1000);
			}
		});*/
	});
}


//**************************************************************************************************************************
// Tooltips Smallipop
//**************************************************************************************************************************

$('.smallipopTooltip').smallipop({
	theme: 'black bingomaker',
	hideOnTriggerClick: false,
	hideOnPopupClick: false,
	hideDelay: !is_touch_device() ? 500 : 8000,
});

$('.smallipopClickTooltip').smallipop({
	theme: 'black bingomaker',
	triggerOnClick: true,
	preferredPosition: 'bottom',
	hideDelay: 8000,
});

$('.smallipopClickTooltipLight').smallipop({
	theme: 'white bingomaker',
	triggerOnClick: true,
	preferredPosition: 'top',
	hideDelay: 8000,
});

//**************************************************************************************************************************
// Select2
//**************************************************************************************************************************
if( $('.select2').length > 0 ) {
	$('.select2').select2({});
}

//**************************************************************************************************************************
// Liens et boutons ouvrant une popup (onglet) supplémentaire
//**************************************************************************************************************************

$(document).on('click touch', 'button[data-extra-tab], a[data-extra-tab], input[data-extra-tab]', function() {
	let tabUrl = $(this).attr('data-extra-tab');
	openInNewTab(tabUrl);
});

//**************************************************************************************************************************
// Auto complet pour les adresses
//**************************************************************************************************************************
window.autocomplete = null;
var placeSearch,
	componentForm = {
		street_number: 'long_name',
		route: 'long_name',
		locality: 'long_name',
		administrative_area_level_1: 'long_name',
		country: 'long_name',
		postal_code: 'short_name'
	},
	arrayForm = ['street_number','route','locality','postal_code'];

// Bias the autocomplete object to the user's geographical location,
// as supplied by the browser's 'navigator.geolocation' object.
$(document).on( 'focus', '.autocomplete-field', function() {

	var autocompletenode = $(this).get(0);

	loadGoogleMapsAPI({
		apiUrl:"https://maps.googleapis.com/maps/api/js",
		key:"AIzaSyCSViwukSnfeotwwcka4JJFL3l7gp_4F80",
		libraries:["places"],
		language: 'en',
	}).then( function( googleMaps ) {

		if( autocompletenode != null ) {
			// Create the autocomplete object, restricting the search to geographical
			// location types.
			window.autocomplete = new googleMaps.places.Autocomplete( autocompletenode, {
				types: ['geocode']
			});

			// When the user selects an address from the dropdown, populate the address
			// fields in the form.
			window.autocomplete.addListener('place_changed', function() {
				let place = window.autocomplete.getPlace();

				if( typeof place != " undefined" ) {
					/*for( let component in componentForm ) {
						if( component != 'street_number' ) {
							let $component = $('#' + component);
							$component.val('');
						}
					}*/

					let street_number = null, route = null, administrative_area_level_1 = null, locality = null, country = null, country_long = null, postal_code = null,
						province_wrapper = $('#province-wrapper'),
						province_sel = $('#province');

					// On va faire le tour des data pour récupérer seulement celle qui nous intéresse
					place.address_components.forEach( function( component ) {
						switch( component.types[0] ) {
							case 'street_number':
								street_number = component.short_name;
							break;

							case 'route':
								route = component.long_name;
							break;

							case 'administrative_area_level_1':
								administrative_area = component.short_name;
							break;

							case 'locality':
								locality = component.long_name;
							break;

							case 'country':
								country = component.long_name;
							break;

							case 'postal_code':
								postal_code = component.long_name;
							break;
						}
					});

					if( street_number || route ) {
						if( street_number && route ) {
							$('#route').val( street_number + ' ' + route );
						} else if( street_number ) {
							$('#route').val( street_number );
						} else {
							$('#route').val( route );
						}
					}

					if( locality ) {
						$('#locality').val( locality );
					}

					if( postal_code ) {
						$('#postal_code').val( postal_code );
					}

					if( country ) {
						$('#country').off( 'change', updateProvinceFromCountry );
						$('#country').val( country ).trigger('change')

						updateProvinceFromCountry( administrative_area, country );

						$('#country').change( updateProvinceFromCountry );

					}
				}
			});

			window.autocomplete = autocomplete;

		}
	});

	if( navigator.geolocation ) {
		let options = {
			enableHighAccuracy: true,
			timeout: 5000,
			maximumAge: 0
		};

		navigator.geolocation.getCurrentPosition( function( position ) {

			let geolocation = {
				lat: position.coords.latitude,
				lng: position.coords.longitude
			};

			let circle = new google.maps.Circle({
				center: geolocation,
				radius: position.coords.accuracy
			});

			window.autocomplete.setBounds( circle.getBounds() );

		}, function( e ){
			console.warn( e );
		}, options );
	}
});

function updateProvinceFromCountry( selected_province, selected_country ) {
	let province_wrapper = $('#province-wrapper'),
		province_sel = $('#province');

	if( selected_country === undefined ) {
		selected_country = $(this).val();
	}

	// province_wrapper.css( 'opacity', '.5' );
	province_sel.attr( 'disabled', true );

	$.ajax({
		type: 'post',
		url: rootURL + 'json/get-province-list/',
		dataType: 'json',
		data: {
			'country': selected_country,
			'csrf_tk_bingomaker': csrf_token
		},
		success: function( json ) {
			if( json.status == 'success' ) {

				if( json.result !== false ) {

					province_wrapper.show(150);

					province_sel.html('');

					$.each( json.result, function( cpt, province ) {
						province_sel.append( '<option value="' + province.iso2 + '"' + ( selected_province !== undefined && selected_province == province.iso2 ? ' selected' : '' ) + '>' + province.name + '</option>' );
					});

					// province_wrapper.css( 'opacity', 1 );
					province_sel.attr( 'disabled', false );

				} else {

					// province_wrapper.css( 'opacity', 1 );
					province_wrapper.hide(150);

				}

			} else {
				console.log( json.message );
			}
		},
		error: function( jqXHR, textStatus, error ) {
			console.log( jqXHR + ':' + textStatus + ':' + error );
		}
	});
}

$("#country").change( updateProvinceFromCountry );


//**************************************************************************************************************************
// cancel submit on enter
//**************************************************************************************************************************
var $action = $('#deposit, #userActionBilling, #userActionAll, #userActionProfile');
$action.on('keyup keypress', function(e) {
	let keyCode = e.keyCode || e.which;
	if (keyCode === 13) {
		e.preventDefault();
		return false;
	}
});
$('#editProfile').on('keyup keypress', function(e) {
	let keyCode = e.keyCode || e.which;
	if (keyCode === 13) {
		e.preventDefault();
		return false;
	}
});

//**************************************************************************************************************************
// popup message pour archive
//**************************************************************************************************************************
/*$(document).on('click', '.archiveLinkPop', function(e){
	e.preventDefault();

	var theLink = $(this);

	UIkit.modal.confirm( ( theLink.attr( 'data-archive' ) ? theLink.attr( 'data-archive' ) : '' ), function() {
		let $idCaller = theLink.attr( 'data-id-caller' ),
			$url = theLink.attr('href'),
			requestUrl = '/caller/close-game/' + parseInt( $idCaller ) + '/';

			fetch(requestUrl)
			.then(function(response){
				if ( response.ok )
					return response.json();
				else
					console.log("erreur");
			})
			.then(function(data) {
				window.location = $url;
			})
			.fail(function(error){
				console.warn("la partie n'a pas pue être fermé. erreur:" + error);
			});
	}, function() {

	}, {
		center:true,
		labels:{
			Ok: ( !$('body').hasClass('en') ? 'Move to trash' : 'Mettre à la corbeille' ),
			Cancel: ( !$('body').hasClass('en') ? 'Annuler' : 'Cancel' )
		}
	});
});*/

/*
Section pour la validation du formulaire utilisation
*/

$('#userAction').on('click touch', function(e){
	validation.validForm( $(this).closest('form').attr('id'), $(this) );
});

/**
 * Cette function met 0 quand le input est vide et remplace les virguls par des points
 * @param jDomElement
 */
 function setDefaultValue( jDomElement ){
	if($.trim($(jDomElement).val()).length == 0){
		jDomElement.val(0);
	}else{
		let value = $.trim($(jDomElement).val());
		value.toString().replace(/\./g, ',');
		$(jDomElement).val(value);
	}
 }
 $("#taxe_fed,#taxe_pro").change(function(){
	setDefaultValue($(this));
 });
 $("#taxe_fed,#taxe_pro").focusout(function(){
	setDefaultValue($(this));
 });
 $('#taxe_fed,#taxe_pro').each(function(){
	setDefaultValue($(this));
 });



//https://gist.github.com/yogster/8956917
//Cette fonction va chechker s'il y a un doublon dans le formulation ou une valeur vide
function inputsHaveNoGoodValue() {
	let harError = false,
	lang = $('body').hasClass('en') ? 'en' : 'fr',
	first = true;
	$('input[type^="text"]').each(function () {
		if($(this).val()){

			let $current = $(this);
			$('input[type^="text"]').each(function() {
				if ($(this).val() == $current.val() && $(this).attr('id') != $current.attr('id') && $(this).val() != 2)
				{
					let txtError = lang === 'en' ? "This value is already exist in the form." : "Cette valeure existe déjà.";
					validation.removeError($(this));
					harError = validation.addError( $(this), ( $(this).attr('title') ? $(this).attr('title') : txtError ) );
					if(first == true){
						$(this).focus();
						first = false;
					}
				}
			});
		}else{
			let txtError = lang === 'en' ? "Enter text here." : "Entrez le texte ici";
			validation.removeError($(this));
			harError = validation.addError( $(this), txtError );
			if(first == true){
				$(this).focus();
				first = false;
			}
		}

	});
	return !harError;
}

/*$("#country").change(function(){

	changeTaxandCalc();
});
$("#administrative_area_level_1").change(function(){
	changeTaxandCalc();
});

$("#administrative_area_level_1").change(function(){
	if($("#country").val() == 'Canada'){
		changeTaxandCalc();
	}
});*/

$("#bubble").change(function(){
	let $optionReset = $('#optionReset');
	if(document.getElementById('bubble').checked){
		$optionReset.removeAttr('disabled');
	}else{
		$optionReset.prop('disabled',true);
		$optionReset.removeAttr("checked");
	}
});

$("#clearFilter").click(function(){
	$(".filterInvoice").val("");
	$("#filterForm").submit();
});

$('#endYear, #endMonth, #startYear, #startMonth').change(function(){

	let $endYear 		= $('#endYear'),
		$endMonth 		= $('#endMonth'),
		$startYear 		= $('#startYear'),
		$startMonth 	= $('#startMonth'),
		$searchbtn 		= $('#searchbtn'),
		$export 		= $('#export'),
		endYear 		= $endYear.val()   == '' ? -1 : parseInt($endYear.val()),
		startYear 		= $startYear.val() == '' ? -1 : parseInt($startYear.val()),
		endMonth 		= $endMonth.val()  == '' ? -1 : parseInt($endMonth.val()),
		startMonth 		= $endMonth.val()  == '' ? -1 : parseInt($startMonth.val());

	if( ( $endYear.val() != '' ) || ( $endMonth.val() != '' ) || ( $startYear.val() != '' ) || ( $startMonth.val() != '' ) ){

		$endYear.attr('required',true);
		$endMonth.attr('required',true);
		$startYear.attr('required',true);
		$startMonth.attr('required',true);

		function enabledSubmitTransac( enabled ) {
			$export.attr( 'disabled', enabled );
			$searchbtn.attr( 'disabled', enabled );
		}

		if ( startYear > endYear ) {
			enabledSubmitTransac(true);
		} else {

			if ( startYear == endYear ) {
				if ( startMonth > endMonth ) {
					enabledSubmitTransac(true);
				} else {
					enabledSubmitTransac(false);
				}
			} else {
				enabledSubmitTransac(false);
			}

		}

	} else {

		$endYear.removeAttr('required');
		$endMonth.removeAttr('required');
		$startYear.removeAttr('required');
		$startMonth.removeAttr('required');

	}
});



$("#model5").change(function(){
	let $type0 = $('#type0');

	changeTypeBingoValue();

	if( $(this).is( ":checked" ) ) {
		$('#customTextCard').hide();

		if( $type0.is( ":checked" ) == true ){
			$('#type1').prop("checked", true);
		}

		$('#cardsTitle').attr('maxlength','24');

		$( '#num4Coin1' ).prop( 'checked', false );
		$( '#num4Coin2' ).prop( 'checked', true );
		$('#cornersNumber').hide(150);
	}

});

$("#model1,#model2,#model3,#model4").change(function(){
	let isCheck = $(this).is( ":checked" ),
	$customTextCard = $('#customTextCard'),
	$type1 = $('#type1'),
	$cardsTitle = $('#cardsTitle');

	if( isCheck ) {
		$customTextCard.show();
		$cardsTitle.attr('maxlength','45');

		$('#cornersNumber').show(150);

		if( $type1.is(":checked") || $('#type2').is(":checked") ){
			changeTypeBingoValue();
		} else {
			changeTypeBingoText();
		}
	}
});


/**
 * Permettre seulement 6 façon de gagner dans le caller
 */
if( $('body#caller').length > 0 || $('body#callerPlay').length > 0) {
	$(document).on('change', '.waytowin', function(){
		var count_checked = $('.waytowin:checked').length;

		if( count_checked < 6 ) {
			$('.waytowin').attr('disabled', false);
		} else {
			$('.waytowin:not(:checked)').attr('disabled', true);
		}

		if( count_checked == 0 ) {
			$('#nextstep').attr( 'disabled', true );
		} else {
			$('#nextstep').attr( 'disabled', false );
		}
	});

	$(document).on('click', '.unselect-all-winning-ways', function(){
		$('.winning-ways .waytowin').prop('checked', false);
		$('#nextstep').attr( 'disabled', true );
	});

	$(document).on('click', '.pick-random-winning-ways', function(){
		let number_of_random_values = parseInt( $(this).prev( '.random-pick-count' ).val() ),
			waytowin = $('.winning-ways .waytowin'),
			random_ways, random_ways_els, first_random_way;

		waytowin.prop('checked', false);

		random_ways = waytowin.get().sort(function() {
			return Math.round( Math.random() ) - 0.5;
		}).slice( 0, number_of_random_values );

		$( random_ways ).prop( 'checked', true );
		/*random_ways_els = $( random_ways );
		random_ways_els.prop( 'checked', true );

		first_random_way = $('.winning-ways .waytowin:checked').first();
		first_random_way.closest('.winning-ways').animate({
			scrollTop: first_random_way.position().top
		}, 150);*/
	});
}

//**************************************************************************************************************************
// Script de l'écran de création du Caller
//**************************************************************************************************************************
if( $('#createCaller').length > 0 ) {

	$('#virtualCards').change(function(){

		let start_number = $('#var-create-caller').data('start-number'),
			end_number = $('#var-create-caller').data('end-number'),
			startVirtual = parseInt( $(this).val() ),
			max = parseInt( $(this).attr('max') ),

			$pwd = $('#pwd'),
			$name = $("#name"),
			$gameNameContainer = $("#gameNameContainer"),
			$pwdContainer = $("#pwdContainer"),
			$privateGameAnswer = parseInt( $('input[name="private"]:checked').val() );

		if( $(this).val().length <= 0 ) {
			$(this).val( 0 );
		} else if( startVirtual > max ) {
			$(this).val( max );
			startVirtual = max;
		}

		if( startVirtual > 0 ){
			if( $('input[name="access_option"]:checked').val() != 2 ) {

				$pwdContainer.show(100);
				$pwd.addClass('required');
				$pwd.prop('required', true);

			}

			$gameNameContainer.show(100);
			$name.addClass('required');

			$('#msgVirtual').hide();
			$('#prevNextDraw').show(100);
			$('#accessType').show(100);
			$('.message-box').show(100);
			$('#vrLabelCards').show();
			$('#printEndNumber').text( start_number + max - 1 - startVirtual ) ;

			if( startVirtual >= max ) {
				$('#msgPrint').show();
				$('#printCards').hide();
			} else {
				$('#msgPrint').hide();
				$('#printCards').show();
			}

		} else {
			$('#msgVirtual').show();
			$('#vrLabelCards').hide();
			$('#prevNextDraw').hide(100);
			$('#accessType').hide(100);
			$('.message-box').hide(100);
			$('#msgPrint').hide();
			$('#printCards').show();

			$('#printEndNumber').text( start_number + max - 1 - startVirtual );

			// $('#accessType').hide(100);

			if( $('input[name="access_option"]:checked').val() != 2 ) {
				$pwdContainer.hide( 100 );
				$pwd.removeClass('required');
				$pwd.prop('required', false);
			}

			$gameNameContainer.hide( 100 );
			$name.removeClass('required');

			if( $('#private_game_yes').length > 0 ) {
				$('#private_game_yes').prop('checked', true);
				$pwd.removeClass('required');
				$pwd.prop('required', false);
			}

		}

		if( startVirtual === max ) {
			$('#print_reminder').hide(100);
		} else if( ! $('#print_reminder').is(':visible') ) {
			$('#print_reminder').show(100);
		}

		let printEnd = parseInt($('#printEndNumber').text()),
			printStart = $("#printStart"),
			vrEnd = $("#vrEnd");

		$('#vrStart').text( ( printEnd + 1 ) );

		if( printStart.text() == "0" ) {
			printStart.text(1);
		}

		if( vrEnd.text() == "0" ) {
			vrEnd.text(max);
		}
	});

	/*$('input[name=private]').change(function(){
		let $pwdContainer = $("#pwdContainer"),
			$pwd = $("#pwd"),
			$privateGameAnswer = parseInt( $('input[name="private"]:checked').val() );

		if( $privateGameAnswer !== 1 ) {
			$pwdContainer.show();
			// $('#accessType').show();
			$pwd.addClass('required');
			$pwd.prop('required',true);
		} else {
			$pwdContainer.hide();
			// $('#accessType').hide();
			$pwd.val('');
			$pwd.removeClass('required');
			$pwd.prop('required',false);
		}
	});*/

	$('#caller_duration').on('change', function() {
		var caller_duration_min = parseInt( $('#var-create-caller').data('duration-min') );

		var current_cost = parseInt( $(this).find('option:selected').data('duration-cost') );
		var base_cost = parseInt( $('#var-create-caller').data('base-cost') );

		var credit_cost = base_cost + current_cost;
		var createCallerButton = $('button.start-caller');

		if( currentBalance < credit_cost ) {
			createCallerButton.addClass('notenoughcredit');

			var missing_credit = credit_cost - currentBalance;
			$('#modalCreditEdit .content strong').text( missing_credit );
			$('#missingCredits').val( missing_credit );
		}

		if( currentBalance >= credit_cost ) {
			createCallerButton.removeClass('notenoughcredit');
		}

		if( credit_cost > 0 ) {
			createCallerButton.find('small').text( credit_cost + ' ' + $('#var-create-caller').data('string-credits') );
		} else {
			createCallerButton.find('small').text( $('#var-create-caller').data('free-text') );
		}
	});

	$(document).on('click', "#setToMaxValue", function(){
		let $virtualCards = $("#virtualCards"),
			$maxValue = $virtualCards.attr("max");

		$('#print_reminder').hide(100);

		$virtualCards.val( $maxValue ).trigger('change');
		$(this).attr('id', 'setToMaxValuePrint').text( $(this).data('text-print') );
	});

	$(document).on('click', "#setToMaxValuePrint", function(){
		let $virtualCards = $("#virtualCards"),
			$minValue = 0;

		$('#print_reminder').show(100);

		$virtualCards.val( $minValue ).trigger('change');
		$(this).attr('id', 'setToMaxValue').text( $(this).data('text-virtual') );
	});

	$('.action').on('click touch', function(e){
		e.preventDefault();
		$("#actionHidden").val( $(this).val() );
		
		if( validation.validForm( $(this).closest('form').attr('id'), $(this), false ) ) {
			if( !$(this).hasClass('notenoughcredit') || $(this).hasClass('nextstep') ) {
				loading.showHide( $(this) );
				$(this).closest('form').submit();
			} else {
				UIkit.modal("#modalCreditEdit").show();
			}
		}
	});

	$( 'input[type=radio][name=kind]' ).change(function(e){
		e.preventDefault();

		if( this.value == 2 ) {
			$("#statsContainer").hide();
			$("#simulationList").removeClass('hide');
			$("input[type=radio][name=idPlaylist]").prop( 'disabled', false );
		} else {
			$("#statsContainer").show();
			$("#simulationList").addClass('hide');
			$("input[type=radio][name=idPlaylist]").prop( 'disabled', true );
		}
	});

	$( 'input[type=radio][name=access_option]' ).change(function(e){
		e.preventDefault();

		if( this.value == 2 ) {
			$("#codesList").show( 150 );
			$("#pwdContainer").hide( 150 );
			// $('#accessType').hide( 150 );
			$("#pwd").removeClass('required').prop( 'required', false );
			$("input[type=radio][name=codes_list]").prop( 'disabled', false );

			$('#virtualCards').val( $('#virtualCards').attr('max') ).prop('readonly', true).trigger('change');
			$('#cardsInGamePassword').hide(150);
			$('#cardsInGameCodeList').show(150);
			// $('#infoSetAllToPrint').hide(150);

		} else {
			$("#codesList").hide( 150 );
			$("#pwdContainer").show( 150 );
			// $('#accessType').show( 150 );
			$("#pwd").addClass('required').prop( 'required', true );
			$("input[type=radio][name=codes_list]").prop( 'disabled', true );

			$('#virtualCards').prop('readonly', false);
			$('#cardsInGamePassword').show(150);
			$('#cardsInGameCodeList').hide(150);
			// $('#infoSetAllToPrint').show(150);
		}
	});
}


//https://stackoverflow.com/questions/5629805/disabling-enter-key-for-form/37241980
$('.cancelenter').on('keyup keypress', function(e) {
  let keyCode = e.keyCode || e.which;
  if (keyCode === 13) {
	e.preventDefault();
	return false;
  }
});

$(".hideTransaction").change(function(e){

	let hide 			= 0,
		$chechBox		= $(this);
		idTransaction 	= parseInt( $(this).attr("data-id-transaction"));

	if( $(this).is(":checked") ) {
		hide = 0;
	} else {
		hide = 1;
	}

	$.ajax({
		type: 'POST',
		url: rootURL + 'admin/hideTransaction/',
		data: {
			'idTransaction'	: idTransaction,
			'hide'			: hide,
			'csrf_tk_bingomaker' : csrf_token
		},
		dataType: 'text',
		success: function( json ) {
			if(json.status == 'error'){
				console.log('error request');
			}
		},
		error:function(jqXHR, textStatus, error){
			console.log(jqXHR+':'+textStatus+':'+error);
		}
	});
});

// On va calculer le temps avant la prochaine partie gratuite
let countDownNextGame;

if( $(".nextFreeGameCountdown").length > 0 ) {

	countDownNextGame = setInterval( function () {

		if( ( window.updatetimerPaused == undefined || window.updatetimerPaused == false ) && ( window.pauseInterval == undefined || window.pauseInterval == false ) ) {

			fetch( rootURL + 'callerapi/getTimeToNextFreeGame/', {
				method: 'GET',
				headers: {
					'Content-Type': 'application/json'
				},
				redirect: 'follow', // manual, *follow, error
				referrer: 'no-referrer', // no-referrer, *client
			}).then( function ( response ) {

				if( response.ok ) {

					response.json().then( function( data ) {

						$(".nextFreeGameCountdown").each( function() {

							if( data.nextGame.hour > 0 || data.nextGame.minute > 0 ) {
								$(this).find('.minutes').text( data.nextGame.minute );
								$(this).find('.hours').text( data.nextGame.hour );

								if( data.nextGame.hour == 0 ) {
									$(this).find('#hoursWrapper').hide();
								}

							} else {
								clearInterval( countDownNextGame );

								let freeGameBtn = $(this).closest('a');

								freeGameBtn.addClass("openCaller");
								freeGameBtn.attr( "href", $("#nextFreeGameCountdown").closest('a').attr("data-href") );

								if( $("#activeGameBtn").length > 0 ) {
									freeGameBtn.addClass("mustDisable");
								}

								$(this).html( $("#nextFreeGameCountdown").attr("data-message") );
								freeGameBtn.removeClass("disabled-href");
								freeGameBtn.parent().removeClass("smallipopTooltip");
							}

						});

					} );
				}

			});

		}

	}, 60000 );
}

// var nextFreeGameCountdown = $("#nextFreeGameCountdown"),
$(".nextFreeGameCountdown").each( function() {

	/*let nextFreeGameCountdown = $(this),
		dataCountDown = nextFreeGameCountdown.attr("data-countdown");

	if( dataCountDown != null ) {

		let freeGameBtn = nextFreeGameCountdown.closest('a'),
			minutesEl = nextFreeGameCountdown.find(".minutes"),
			hoursEl = nextFreeGameCountdown.find(".hours"),
			resultHours = 1000 * 60 * 60,
			tomorrow = moment( dataCountDown, 'YYYY-MM-DD HH:mm' ).add( 23, 'hours' ).toDate(),

			url = freeGameBtn.attr("data-href"),
			countDownNextGame;

		countDownNextGame = setInterval( function () {

			if( ( window.updatetimerPaused == undefined || window.updatetimerPaused == false ) && ( window.pauseInterval == undefined || window.pauseInterval == false ) ) {

				fetch( rootURL + 'callerapi/getmicrotime/', {
					method: 'GET',
					headers: {
						'Content-Type': 'application/json'
					},
					redirect: 'follow', // manual, *follow, error
					referrer: 'no-referrer', // no-referrer, *client
				}).then( function ( response ) {

					if( response.ok ) {

						response.json().then(function( data ){
							let lastGame = moment( data.message, 'YYYY-MM-DD HH:mm' ).toDate(),
								interval = tomorrow - lastGame;
								hours = Math.floor( interval / resultHours ),
								minutes = Math.floor( ( interval / ( resultHours * 60 ) ) );

							interval = interval - ( hours * resultHours );

							if ( ( ( hours <= 0 ) && ( minutes <= 0 ) ) || ( ( isNaN( hours ) ) || ( isNaN( minutes ) ) ) ) {

								clearInterval(countDownNextGame);

								freeGameBtn.addClass("openCaller");
								freeGameBtn.attr("href",url);

								if( $("#activeGameBtn").length > 0 ) {
									freeGameBtn.addClass("mustDisable");
								}

								nextFreeGameCountdown.html( nextFreeGameCountdown.attr("data-message") );
								freeGameBtn.removeClass("disabled-href");
								freeGameBtn.parent().removeClass("smallipopTooltip");

							} else {
								freeGameBtn.attr("href","javascript:void(0)");
								freeGameBtn.addClass("disabled-href");
							}
						});

					} else {
						console.log("Network Error : Bad connection.");
					}

				}).catch( function( error ){
					console.log( error );
				});
			}

		}, 60000 );
	}*/

} );

/* Start : Add version 2.0 */
$('.label-effect').each(function() {
	let parent = $(this);

	parent.find('select, input, textarea').each(function() {
		if( $(this).val() !== '' ) {
			parent.addClass('has-value');
		} else {
			parent.removeClass('has-value');
		}

		$(this).on('focusin', function() {
			if( ! parent.hasClass('has-value') ) {
				parent.addClass('has-value');
			}
		});

		$(this).on('focusout', function() {
			if( $(this).val() !== '' ) {
				parent.addClass('has-value');
			} else {
				parent.removeClass('has-value');
			}
		});

	});
});
let cpt = 0,
detectautofill = setInterval( function () {
	$('.label-effect').each(function() {
		let parent = $(this);

		parent.find('select, input, textarea').each(function() {
			if ( $(this).is(":-webkit-autofill") ) {
				if( ! parent.hasClass('has-value') ) {
					parent.addClass('has-value');
				}
			}
		});
	});

	if ( cpt == 5 ) {
		clearInterval(detectautofill);
	} else {
		cpt++;
	}

}, 100 );

$(".nextLetter").on("keypress", function(e){

	let inp = String.fromCharCode(event.keyCode);

	if (/[a-zA-Z0-9-_ ]/.test(inp)) {

		$(this).val(inp);
		$(this).next().trigger("focus");

	}

});
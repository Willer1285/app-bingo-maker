import * as validation from "validation.js";
import * as callerFunction from "caller_functions.js";

// Écran de création de caller
if( $('body').attr('id') === 'caller' ) {
	$('input[name="kind"]').change(function(){
		if( $(this).val() === '2' ) {
			$('#statsContainer input[type="checkbox"]').prop('disabled', true);
			$('#statsContainer label').css('cursor', 'auto');
			$('#statsContainer').animate({
				opacity: 0.4
			}, 150);
			$('#simulationList').show(250);
			$('#simulationList input[type="radio"]').prop('disabled', false);
		} else {
			$('#statsContainer input[type="checkbox"]').prop('disabled', false);
			$('#statsContainer label').css('cursor', 'pointer');
			$('#statsContainer').animate({
				opacity: 1
			}, 150);
			$('#simulationList').hide(250);
			$('#simulationList input[type="radio"]').prop('disabled', true);
		}
	});

	$('#playBtn').on('click touch', function(e){
		if( !$(this).hasClass('notenoughcredit') ) {
			validation.validForm( $(this).closest('form').attr('id'), $(this) );
		} else {
			e.preventDefault();
			UIkit.modal("#modalCreditEdit").show();
		}
	});
}

// Mettre l'état actif du caller dans le menu
/*if( $( window ).has("#callerTopBar") ) {
	$( window ).resize( function() {
		callerFunction.adaptTopBarPosition();
	});
}*/

// Écran d'utilisation du caller
if( $('body').attr('id') === 'callerPlay' ) {
	localStorage.setItem('interval', 10000);

	window.drawTimer = false;
	window.updatetimerPaused = false;
	window.blockMakeADraw = false;
	window.callerVoice = new Audio();

	window.secondWindow = null;
	window.name = 'parent';

	if( localStorage.getItem( 'drawInterval' ) !== null ) {
		$('#drawInterval').val( localStorage.getItem( 'drawInterval' ) ).change();
	}

	window.drawInterval = parseInt( $('#drawInterval').val() );

	let	showInterval = localStorage.getItem("showInterval"),
		textContainer = $('#textContainer');
	
	// Activer / Désactiver la voix d'après l'état des dernières parties
	if(
		( localStorage.getItem('audio-enabled') === null || parseInt( localStorage.getItem('audio-enabled') ) === 1 ) &&
		(
			( textContainer.data('project-type') === 1 && parseInt( textContainer.data('project-nvalues' ) ) === 75 ) ||
			textContainer.data('project-type') === 2
		) && parseInt( textContainer.data('project-custom-header') ) === 0
	) {
		callerFunction.enableVoice();
	} else {
		callerFunction.disableVoice();
	}

	// Si le message n'a pas été supprimer par le user, on réactive le blocage de l'interface
	if( window.blockedByMessage ) {
		callerFunction.ui_blocked_by_a_message( window.blockedByMessage, window.blockedByMessageCards );
	}

	// Ouvrir le caller externe
	$('#openWindowGame').click(function() {
		let $idCaller = textContainer.attr( 'data-caller-id' ),
			url = $(this).data('window-url');
			// url = rootURL + 'caller/play-in-window/' + parseInt( $idCaller ) + '/';

		if( url === '' || url === false || url === null ) {
			url = rootURL + 'caller/play-in-window/' + parseInt( $idCaller ) + '/';
		}

		if( ! ( window.secondWindow && ! window.secondWindow.document.hidden ) ){
			window.secondWindow = window.open( url, 'BINGO MAKER', 'directories=no,titlebar=no,toolbar=no,location=no,status=no,menubar=no,scrollbars=no,resizable=no');
		} else {
			window.secondWindow.focus();
		}

		window.addEventListener('beforeunload',function(e){
			window.secondWindow.close();
		}, false);

	});


	// S'arranger pour que le top bar reste toujour dock-é dans le haut
	$('#showInterval option[value="' + showInterval + '"]').attr( "selected", true );
	callerFunction.adaptTopBarPosition();
	$( window ).scroll(function() {
		callerFunction.adaptTopBarPosition();
	});

	// Ouvrir la draw list
	$('.opendrawlist').click(function(e){
		e.preventDefault();

		$("#drawList").fadeToggle(250);
	});

	// Ouvrir la liste des valeurs jouées
	$('.openNextPanel').click(function (e) {
		e.preventDefault();

		$(this).next().fadeToggle(250);
	});

	// Dès l'affichage de la page lancer le premier refresh du timer afin de lancer la boucle d'actualisation
	if( $('.windowMode').length === 0 ) {
		let timer = 3000;
		callerFunction.updateGameState();

		window.updatetimerlet = setInterval( function(){
			if( window.updatetimerPaused === false ) {
				callerFunction.updateGameState();
				// callerFunction.getWinningList();
			}
		}, timer );

	}

	// Faire un tirage manuelle après le click sur le bouton
	$('#makeAdraw').on('click', function(e){
		e.preventDefault();

		window.updatetimerPaused = true;

		// $(this).prop("disabled", true);
		callerFunction.manualPick( 0 );
		$('#makeAdraw, #activateTimer, #disableTimer, #manualPick').prop('disabled', true);

		// $(this).addClass( 'draw-in-progress' );

		callerFunction.makeADraw();

		// setTimeout(function(){
		// }, 3000);

	});

	// Envoyer un message aux joueurs
	window.blockUIModal = null;
	$('#sendMsg').on('click', function(e){
		e.preventDefault();

		let formContainer = $('#sendMsgForm'),
			formHTML;

		formHTML = formContainer.html();
		window.blockUIModal = UIkit.modal.blockUI( formHTML, { center: true } );

	});

	$(document).on( 'submit', '.send-msg-form', function( e ) {

		e.preventDefault();

		$(this).find( '.error-msg' ).remove();
		$(this).find( '.uk-form-danger' ).removeClass('uk-form-danger');

		let error = false,
			error_classes = 'error error-msg uk-form-width-large';

		let regex_msg = /^[A-zÀ-ú0-9\?\!\,\.\'\-\s\*\@\#\$\%\:\(\)]*$/gm,
			regex_card_nos = /^[0-9]+(?:(?:\s*,\s*|-)[0-9]+)*$/gm;

		let field_msg = $(this).find('textarea[name=msg]'),
			field_msg_val = field_msg.val(),
			field_card_nos = $(this).find('input[name=card_nos]')
			field_card_nos_val = field_card_nos.val() ?? '';

		// Valider le format du champ de message
		if( ! regex_msg.test( field_msg_val ) ) {
			field_msg.addClass('uk-form-danger');
			field_msg.after( '<div class="' + error_classes + '">' + textContainer.data('popup-blocked-error-format') + '</div>' );

			error = true;
		}

		if( field_msg_val.length > 1000 ) {
			field_msg.addClass('uk-form-danger');
			field_msg.after( '<div class="' + error_classes + '">' + textContainer.data('popup-blocked-error-length-msg') + '</div>' );

			error = true;
		}

		// Valider le format du champ de card_nos
		if( field_card_nos_val !== '' ) {

			if( ! regex_card_nos.test( field_card_nos_val ) ) {
				field_card_nos.addClass('uk-form-danger');
				field_card_nos.after( '<div class="' + error_classes + '">' + textContainer.data('popup-blocked-error-format') + '</div>' );

				error = true;
			}

			if( field_card_nos_val.length > 50 ) {
				field_card_nos.addClass('uk-form-danger');
				field_card_nos.after( '<div class="' + error_classes + '">' + textContainer.data('popup-blocked-error-length-cards') + '</div>' );

				error = true;
			}

		}

		if( ! error ) {
			field_msg.val('');
			field_card_nos.val('');

			window.blockUIModal.hide();
			callerFunction.disableTimer();
			callerFunction.send_message_to_players( field_msg_val, field_card_nos_val );
		}

	} );

	// Kick out players from the game
	window.blockUIModal = null;
	$('#kickOutPlayer').on('click', function(e){
		e.preventDefault();

		let formContainer = $('#kickOutPlayerForm'),
			formHTML;

		formHTML = formContainer.html();
		window.blockUIModal = UIkit.modal.blockUI( formHTML, { center: true } );

	 	let modalInput = window.blockUIModal.find( 'input[name="card_nos"]' )

	 	if( modalInput !== undefined && modalInput !== null ) {
	 		modalInput.val( formContainer.find( 'input[name="card_nos"]' ).val() );

			modalInput.focus();
		    const length = modalInput.val().length;
		    modalInput[0].setSelectionRange( length, length );
		}

	});

	$(document).on( 'submit', '.kick-out-player-form', function( e ) {

		e.preventDefault();

		$(this).find( '.error-msg' ).remove();
		$(this).find( '.uk-form-danger' ).removeClass('uk-form-danger');

		let error = false,
			error_classes = 'error error-msg uk-form-width-large';

		let regex_card_nos = /^[0-9]+(?:(?:\s*,\s*|-)[0-9]+)*$/gm;

		let field_card_nos = $(this).find('input[name=card_nos]')
			field_card_nos_val = field_card_nos.val();

		// Valider le format du champ de card_nos
		if( field_card_nos_val !== '' ) {

			if( ! regex_card_nos.test( field_card_nos_val ) ) {
				field_card_nos.addClass('uk-form-danger');
				field_card_nos.after( '<div class="' + error_classes + '">' + textContainer.data('popup-blocked-error-format') + '</div>' );

				error = true;
			}

			if( field_card_nos_val.length > 50 ) {
				field_card_nos.addClass('uk-form-danger');
				field_card_nos.after( '<div class="' + error_classes + '">' + textContainer.data('popup-blocked-error-length-cards') + '</div>' );

				error = true;
			}

		}

		if( ! error ) {
			field_card_nos.val('');

			window.blockUIModal.hide();
			callerFunction.disableTimer();
			callerFunction.kick_out_cards( field_card_nos_val );
		}

	} );

	// Lorsqu'activer effectuer un tirage à tout les X secondes
	$('#activateTimer').click(function(e) {
		e.preventDefault();

		if( !window.drawTimer ) {
			callerFunction.activateTimer();
		}
	});

	// Désactiver les tirages automatiques
	$('#disableTimer').click(function(e) {
		e.preventDefault();

		if( window.drawTimer ) { callerFunction.disableTimer(); }
	});

	// Modification du délai des tirages automatiques
	$('#drawInterval').on('change',function(e){
		window.drawInterval = parseInt( $(this).val() );
		localStorage.setItem( 'drawInterval', window.drawInterval );

		callerFunction.checkIntervalValidity();

		if( window.drawTimer ) {
			clearInterval( window.drawTimer );
			window.drawTimer = setInterval( callerFunction.makeADraw, window.drawInterval * 1000 );
		}

	});


	$("#showInterval").change(function(){
		let val = $(this).val();

		localStorage.setItem( "showInterval", parseInt(val) );
	});

	// Redémarrer la partie
	$('#restartGame').click(function(e) {
		e.preventDefault();
		let questionText = $(this).attr('data-question');
		callerFunction.askRestartPopup(questionText);
	});

	// Tirage manuel
	$('#manualPick').click(function(e) {
		e.preventDefault();

		if( $(this).hasClass('turnedOff') ) {
			callerFunction.manualPick(1);
		} else {
			callerFunction.manualPick(0);
		}
	});

	// Case cochée dans le tirage manuel
	$('.drawTable').on('change', '.manualDrawCheck', function(){
		let theCheckbox = $(this),
			question = theCheckbox.attr("data-question");

		UIkit.modal.confirm( question, function() {
			$('.manualDrawCheck').prop('disabled', true);
			callerFunction.makeADraw( theCheckbox.val() );
		}, function() {
			theCheckbox.prop("checked", false);
		}, {
			center: true,
			labels: {
				Ok: textContainer.data("common-yes"),
				Cancel: textContainer.data("common-no"),
			}
		});
	});

	// Fermer la partie
	$(document).on('click', '#closeGame', function(e) {
		e.preventDefault();

		var closeGamePop = UIkit.modal.confirm( $(this).attr('data-question'), function() {
			// localStorage.removeItem('audio-enabled');
			window.location = rootURL + 'caller/close-game/' + parseInt( textContainer.attr('data-caller-id') ) + '/';
		}, function() {}, {
			center: true,
			labels: {
				Cancel: textContainer.data("common-no"),
				Ok: textContainer.data("common-yes"),
			}
		});
	});

	// Pigé le gagnant de la partie
	$('#pickAWinner').click(function(e){
		e.preventDefault();

		let isHasTimer = false,
		minValue = 1,
		nbWinnerMax = parseInt( $("#drawWinner").find(".uk-text-strike").length );
			// mettre un comme valeur par défaut de gagnant lors de la pige.

		if( window.drawTimer ) {
			callerFunction.disableTimer();
			isHasTimer = true;
		}

		if ( nbWinnerMax > 0 ) {

			let haveSecondWindow = false;
			let secondWindow = null;
			let $windowOpen = textContainer.attr('data-window-open');
			let explicationWinningList = textContainer.attr('data-explication-winning');
			window.name = 'parent';
			let modalBlock = null;


			if($windowOpen == 1){
				secondWindow = window.open('','BINGO MAKER');
				haveSecondWindow = true;
				modalBlock = secondWindow.UIkit.modal.blockUI(explicationWinningList, {center: true});
			}
			let msgprompt = textContainer.data("draw-a-winner");
			UIkit.modal.prompt($(this).attr('data-question'), minValue, function( newValue ) {
				number = parseInt( newValue );

				//compte le nombre de gagnant maximum

				if ( number > nbWinnerMax ) {
					number = nbWinnerMax;
				}

				if ( number <= 0 ) {
					number = minValue;
				}

				callerFunction.pickAWinner( number );

			}, {
					center: true,
					labels: {
						Ok: msgprompt,
					},
				}
			);


		} else {
			UIkit.modal.alert( textContainer.attr('data-error-valid-a-card'))
			.on({
				'hide.uk.modal': function() {
					if( isHasTimer ) { callerFunction.activateTimer(); }
				}
			});
		}
	});

	// Valider un gagnant
	$('#drawWinner ul').on('click', 'a:not(.validateLink)', function(e){
		e.preventDefault();

		// valide si le bouton n'est pas déjà append
		if( $(this).next().is("span") == false ) {
			let container = $('#drawWinner'),
				elem 		= $(this),
				virtual 	= elem.attr("data-virtual"),
				message 	= container.attr('data-text-confirm-validated') + elem.attr('data-card-num'),
				validationBlock;

			// Créer le div de validation
			if( virtual == 1 ) {
				let msgVirtual = textContainer.attr("data-virtual-message");
				validationBlock = $('<span class="validationBlock">' + msgVirtual + '</span>');
			} else {
				validationBlock = $(
					'<span class="validationBlock">' +
						'<a data-action="validate" class="validateLink uk-button uk-button-default uk-button-small">' +
							textContainer.attr('data-validate') +
						'</a> ' +
						'<a data-action="cancel" class="validateLink cancel uk-button uk-button-default uk-button-link">' +
							textContainer.attr('data-cancel') +
						'</a>' +
					'</span>'
				);
			}


			$(this).closest('li').append(validationBlock);
			validationBlock.hide().fadeIn(250);
		} else {
			$(this).closest('li').find(".validationBlock").remove();
		}
	});

	$('#drawWinner ul').on('click', 'li .validationBlock a', function(e){
		e.preventDefault();

		let elem = $(this).parent().prev('a');

		if( $(this).attr('data-action') == 'validate' ) {
			$('#pickAWinner').prop('disabled', false);
			$('#spanInfoSmallipop').remove();
			callerFunction.validateCard( elem, elem.attr('data-card-id'), elem.attr("data-type") );
		}

		$(this).parent().fadeOut(150, function() {
			$(this).remove();
		});
	});

	// Afficher / masquer la winners list
	$('#winnersList').click(function(e){
		e.preventDefault();
		callerFunction.showWinnersList( parseInt( textContainer.data('caller-iteration') ), false );
	});

	$('#previousWinnersList').click(function(e){
		e.preventDefault();

		let currentGameIteration = parseInt( textContainer.data('caller-iteration') ),
			previousGameIteration;

		if( currentGameIteration > 1 ) {
			previousGameIteration = currentGameIteration - 1;
		} else {
			previousGameIteration = 1;
		}

		callerFunction.showWinnersList( previousGameIteration, true );
	});

	// Activer / Désactiver la voix
	$('#toggleVoice').click(function() {
		callerFunction.toggleVoice( parseInt( $(this).data( 'state' ) ) );
	});

	// Vérouiller / Déverrouiller la partie (empêche des joueurs de joindre la partie)
	$('#lockCaller').click(function() {
		callerFunction.toggleCallerLock( parseInt( $(this).data( 'state' ) ) );
	});

}
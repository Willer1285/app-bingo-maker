import * as validation from "validation.js";
import * as loading from "loading.js";
import * as ajaxFunctions from "ajax-functions.js";

import 'whatwg-fetch';

// var draw_blocking_time = isDev === undefined || ! isDev ? 5000 : 50;
let draw_blocking_time = 5000,
	restartformHTML,
	expired_auth_popup_opened = false,
	textContainer = $('#textContainer');

let idCaller = parseInt( textContainer.data('caller-id') ),
	idProject = parseInt( textContainer.data('project-id') ),
	callerApiURL = rootURL + 'caller-api/';

/*export function getCardsInUse() {
	let url = callerApiURL + 'get-cards-in-use/' + idProject + '/';

	fetch( url )
	.then(function(response){
		if ( response.ok ){
			return response.json();
		} else {
			console.log("erreur");
		}
	})
	.then( function( json ) {
		var currentNumber = parseInt( $('#cardInUse').text() ),
			newNumber;

		if( json !== undefined ) {
			$('#cardInUse').text( json.value );
			newNumber = parseInt( json.value );
		}

		if( currentNumber !== newNumber ) {
			search_for_winning_cards();
		} else {
			getWinningList(0);
		}

	});
}*/

function search_for_winning_cards() {
	var url = callerApiURL + 'refresh-winning-cards/';

	$.ajax({
		type: 'post',
		url: url,
		dataType: 'text',
		data: {
			'idCaller': idCaller,
			'idProject': idProject,
			'csrf_tk_bingomaker': csrf_token
		},
		success: function( json ) {
			json = ajaxFunctions.sanitizeJsonResponse( json ); 
			json = JSON.parse(json);
		},
		complete: function( json ) {
			var jsonContent = JSON.parse( json.responseText );

			if( jsonContent.result == true ) {
				getWinningList(0);
			}

		}
	});
}


export function updateGameState() {
	window.updatetimerPaused = true;

	let formData = new FormData();

	formData.append( 'idCaller', idCaller );
	formData.append( 'csrf_tk_bingomaker', csrf_token );

	fetch( callerApiURL + "update-game-state", {
		method: 'POST',
		body: formData
	} )
	.then( function( response ) {
		if( response.ok ) {
			return response.json();
		} else {
			console.log("erreur");
		}
	})
	.then( function( jsonContent ) {
		if( jsonContent.state == 'success' ) {

			let stillActive,
				moreCardInUse = false;

			// On va mettre à jour le Token CSRF pour qu'il n'expire jamais pendant que l'utilisateur est sur cet écran
			if( jsonContent.csrf_token !== undefined && jsonContent.csrf_token !== null && jsonContent.csrf_token !== '' ) {
				csrf_token = jsonContent.csrf_token;
			}

			// On mets à jour le timer du caller
			stillActive = updateTimer( jsonContent.remainingTime );

			if( stillActive ) {

				// On va actualisé le nombre de carte actives
				moreCardInUse = getCardsInUse( jsonContent.cardsInUse );

				// S'il y a de nouvelles cartes actives, on va regarder si elles sont gagnantes, sinon on ne fait que mettre à jour la liste
				if( moreCardInUse ) {
					search_for_winning_cards();
				} else if( jsonContent.winningCardsList.winningCard !== [] ) {
					// Si le vrai nombre de cartes gagnantes n'égale pas celui de la drawList, des cartes ont été bannies, on flush la liste et on la laisse de refaire au complet
					if( $('#drawWinner ul li').length != jsonContent.winningCardsList.winningCard.length ) {
						$('#drawWinner ul').empty();
					}

					drawWinningList( jsonContent.winningCardsList.winningCard, window.drawTimer );
				}

			}

			window.updatetimerPaused = false;

		} else {
			expired_auth_popup( jsonContent.message );
		}
	} );
}

function updateTimer( timerResponse ) {

	switch( timerResponse.state ) {
		case 'active':
			$('#remainingTime').text( timerResponse.remaining );

			if( timerResponse.critic === true ) {
				$('#remainingTime').addClass('critic');
			}

			return true;
		break;

		case 'expired':
			$('#remainingTime').addClass('critic');
			localStorage.removeItem("showInterval");
			clearInterval(window.updatetimerlet);

			UIkit.modal.alert( textContainer.data('expired-text'), {
				center: true,
				labels:{
					Ok: textContainer.data("return-home"),
				}
			}).on('hide.uk.modal', function() {
				window.location = rootURL;
			});

			return false;

		break;

		case 'error':
			localStorage.removeItem("showInterval");
			clearInterval(window.updatetimerlet);

			UIkit.modal.alert( timerResponse.message, function() {
				window.location = rootURL;
			});

			return false;
		break;

		case 'expired_auth':
			expired_auth_popup( timerResponse.message );

			return false;
		break;
	}
}

function getCardsInUse( cardInUse ) {
	if( window.cardInUse !== cardInUse ) {
		$('#cardInUse').text( cardInUse );
		window.cardInUse = cardInUse;

		return true;
	} else {
		return false;
	}
}

/*export function updateTimer() {

	window.updatetimerPaused = true;

	let url = callerApiURL + 'remaining-time/' + idCaller + '/';

	$.ajax({
		type: 'GET',
		url: url,
		dataType: 'text',
		success: function( json ) {
			json = ajaxFunctions.sanitizeJsonResponse( json ); 
			json = JSON.parse(json);

			$('#remainingTime').text( json.remaining );

			if( json.critic === true ) {
				$('#remainingTime').addClass('critic');
			}
		},
		complete: function( json ) {
			let jsonContent = JSON.parse( json.responseText );

			window.updatetimerPaused = false;

			if( jsonContent.csrf_token !== undefined && jsonContent.csrf_token !== null && jsonContent.csrf_token !== '' ) {
				csrf_token = jsonContent.csrf_token;
			}

			switch( jsonContent.state ) {
				case 'active':
					if( allPrintedCards === false ){
						getCardsInUse();
					} else {
						getWinningList(1);
					}
				break;

				case 'expired':
					$('#remainingTime').addClass('critic');
					localStorage.removeItem("showInterval");
					clearInterval(window.updatetimerlet);

					UIkit.modal.alert( textContainer.data('expired-text'), {
						center: true,
						labels:{
							Ok: textContainer.data("return-home"),
						}
					}).on('hide.uk.modal', function() {
						window.location = rootURL;
					});

				break;

				case 'error':
					localStorage.removeItem("showInterval");
					clearInterval(window.updatetimerlet);
					UIkit.modal.alert( jsonContent.message, function() {
						window.location = rootURL;
					});
				break;

				case 'expired_auth':
					expired_auth_popup( jsonContent.message );
				break;
			}
		}
	});
}*/

export function makeADraw( valueToPlay ) {
	let haveSecondWindow = false,

		$windowOpen = textContainer.data('window-open'),
		showInterval = localStorage.getItem("showInterval") * 1000,
		audioEnabled = parseInt( localStorage.getItem('audio-enabled') ),
		projectType = parseInt( textContainer.data('project-type') ),

		gameEnded = false;

	window.name = 'parent';

	if( window.secondWindow && ! window.secondWindow.document.hidden ){
		// secondWindow = window.open('','BINGO MAKER');
		haveSecondWindow = true;
	}

	$('#manualPick').prop('disabled', true);
	$('#makeAdraw').addClass( 'draw-in-progress' );
	$('.button-winners-list').toggleClass('new-winners', false)

	$.ajax({
		type: 'POST',
		url: callerApiURL + 'make-a-draw/',
		data: {
			'idCaller' : idCaller,
			'idProject': parseInt( textContainer.data('project-id')),
			'valueToPlay': ( valueToPlay != undefined ? valueToPlay : ''),
			'csrf_tk_bingomaker' : csrf_token
		},
		dataType: 'text',
		success: function( json ) {

			json = ajaxFunctions.sanitizeJsonResponse( json );

			json = json.replace(/[\u0000-\u0019]+/g,"");
			json = JSON.parse(json);


			let $result = json.result,
				$pick = json.pick,
				$currentWinningNumber = parseInt( $('.nbWinner').text() ),
				$newWinningNumber;

			if( $result === 'success' ) {
				let isEmojiDraw = $pick.html !== false;

				if( ! isEmojiDraw ) {
					$('#drawList ul').prepend('<li>' + $pick.letter + ' - ' + $pick.text + '</li>');
				} else {
					$('#drawList ul').prepend('<li>' + $pick.letter + ' - ' + $pick.html.full + '</li>');
				}

				if( $('#currentPick .letter').text() !== '' ) {

					$('#previousPick .letter').fadeOut(500,function(){
						$('#previousPick .letter').text( $('#currentPick .letter').text() );
						$('#previousPick .letter').fadeIn();

					});

					$('#previousPick .value').fadeOut(500,function(){
						if( ! isEmojiDraw ) {
							$('#previousPick .value').text( $('#currentPick .value').text() );
						} else {
							$('#previousPick .value').html( $('#currentPick .value').html() );
						}
						$('#previousPick .value').fadeIn();
					});

					if( haveSecondWindow ){
						$('#previousPick .letter', window.secondWindow.document).fadeOut( 500, function(){
							$('#previousPick .letter', window.secondWindow.document).text( $('#currentPick .letter').text() );
							$('#previousPick .letter', window.secondWindow.document).fadeIn();

						});

						$('#previousPick .value', window.secondWindow.document).fadeOut( 500, function(){
							if( ! isEmojiDraw ) {
								$('#previousPick .value', window.secondWindow.document).text( $('#currentPick .value').text() );
							} else {
								$('#previousPick .value', window.secondWindow.document).html( $('#currentPick .value').html() );
							}
							$('#previousPick .value', window.secondWindow.document).fadeIn();
						});
					}
				}

				// Jouer l'audio du tirage
				if( audioEnabled === 1 ) {
					let lowerLetter = $pick.letter.toLowerCase();

					if( projectType == 1 ) {
						let audioBaseUrl = rootURL + 'audio/draw/' + site_lang.substr( 0, 2 ) + '/';

						let audio_file = audioBaseUrl + lowerLetter + '/' + lowerLetter + $pick.text + '.mp3';
						window.callerVoice.src = audio_file;
						window.callerVoice.play();
					} else {
						let audioLetterUrl = rootURL + 'audio/letter/' + site_lang.substr( 0, 2 ) + '/',
							audioEmojiUrl = rootURL + 'audio/emoji/' + site_lang.substr( 0, 2 ) + '/',
							emojiHasPlayed = false;

						// On est dans un projet emoji, on va lire la lettre et ensuite le nom de l'emoji
						window.callerVoice.src = audioLetterUrl + lowerLetter + '.mp3';
						window.callerVoice.play();

						window.callerVoice.onended = function() {
							if( ! emojiHasPlayed ) {
								window.callerVoice.src = audioEmojiUrl + $pick.text + '.mp3';
								window.callerVoice.play();

								emojiHasPlayed = true;
							}
						};
					}
				}

				if( haveSecondWindow ){
					$('#currentPick .letter', window.secondWindow.document).fadeOut(500,function(){
						$('#currentPick .letter', window.secondWindow.document).text( $pick.letter );
						$('#currentPick .letter', window.secondWindow.document).fadeIn();

					});

					$('#currentPick .value', window.secondWindow.document).fadeOut(500,function(){
						if( ! isEmojiDraw ) {
							$('#currentPick .value', window.secondWindow.document).text( $pick.text );
						} else {
							$('#currentPick .value', window.secondWindow.document).html( $pick.html.icon );
						}

						setTimeout( function(){ $('#currentPick .value', window.secondWindow.document).fadeIn() }, showInterval);
					});
				}
				$('#currentPick .letter').fadeOut(500,function(){
					$('#currentPick .letter').text( $pick.letter );
					$('#currentPick .letter').fadeIn();

				});

				$('#currentPick .value').fadeOut(500,function(){
					if( ! isEmojiDraw ) {
						$('#currentPick .value').text( $pick.text );
					} else {
						$('#currentPick .value').html( $pick.html.icon );
					}

					setTimeout( function(){ $('#currentPick .value').fadeIn() }, showInterval);
				});

				$('.nbDraw').text( $('#drawList ul li').length );

				if( haveSecondWindow ){
					$('#drawTable', window.secondWindow.document).find('.lastPick').removeClass('lastPick');
					$('.current-active', window.secondWindow.document).removeClass('current-active');
					$('.spanOneLetter', window.secondWindow.document).removeClass('spanOneLetter');
					$('#drawTable', window.secondWindow.document).find('#drawVal_' + $pick.id).addClass('active lastPick');
					$('#drawTable', window.secondWindow.document).find('#drawVal_' + $pick.id + ' span').addClass('current-active');

					if( $('.current-active').text().length == 1 ) {
						$('.current-active').addClass('spanOneLetter');
					}

					$('#drawTable', window.secondWindow.document).parent().animate({
						scrollLeft: $('#drawVal_' + $pick.id, window.secondWindow.document).position().left - 45
					}, 150);// -45 is the approximative width of the th
				}

				$('#drawTable').find('.lastPick').removeClass('lastPick');
				$('.current-active').removeClass('current-active');
				$('#drawVal_' + $pick.id).addClass('active lastPick');
				$('#drawVal_' + $pick.id + ' .manualDrawCheck').addClass('hide played');
				$('#drawVal_' + $pick.id + ' span').addClass('current-active');

				if( $('#drawVal_' + $pick.id).position() !== undefined ) {
					$('#drawTable').parent().animate({ scrollLeft: $('#drawVal_' + $pick.id).position().left - 45 }, 150);// -45 is the approximative width of the th
				}

				// drawWinningList(json.winningCard, window.drawTimer );

				var winningList = getWinningList(0);

				// console.log(winningList);

				// drawWinningList(winningList.winningCard, window.drawTimer );
			} else if( $result == 'ended' ) {
				if( window.drawTimer ) { disableTimer(); }
				$('#makeAdraw, #activateTimer, #disableTimer, #manualPick').prop('disabled', true);

				gameEnded = true;

				UIkit.modal.alert( json.message, function() {

				});
			} else if( $result == 'expired_auth' ) {
				expired_auth_popup( json.message );
			} else {
				UIkit.modal.alert( json.message, function() {
					window.location = rootURL;
				});
			}
		},
		complete:function( xhr, status ){
			if( $('#activateTimer').hasClass('uk-active') == true ){
				$('#activateTimer, #disableTimer').prop('disabled', false);
			} else {
				setTimeout( function () {
					$('#makeAdraw').removeClass( 'draw-in-progress' );
					
					if( ! $('#manualPick').hasClass('turnedOn') ) {
						if( ! gameEnded ) {
							$('#makeAdraw, #activateTimer, #disableTimer, #manualPick').prop('disabled', false);
						}
					} else {
						$('.manualDrawCheck, #manualPick').prop('disabled', false);
					}
					window.updatetimerPaused = false;
				}, draw_blocking_time )
			}

		},
		error:function(jqXHR, textStatus, error){
			console.log(jqXHR+':'+textStatus+':'+error);
		}
	});

	if( haveSecondWindow ){
		let parent;
		parent = window.open('', window.secondWindow.opener.name);
		// parent.focus();
	}
}

export function disableFunctions( showWinnersList ) {
	manualPick( 0 );
	$('#makeAdraw, #activateTimer, #disableTimer, #drawInterval, input[name="stop_when_winner, #manualPick"]').prop('disabled', true);
	$('#drawWinner ul').off('click', 'a');

	if( !showWinnersList || showWinnersList === 'undefined' ) {
		$('#pickAWinner').prop('disabled', true);
	} else {
		$('#pickAWinner').prop('disabled', true).hide();
		$('#manualPick').prop('disabled', true).hide();
		$('#winnersList').prop('disabled', false).show();
	}
}

export function checkIntervalValidity() {
	if( isNaN( window.drawInterval ) || window.drawInterval < 3 || window.drawInterval === '' || typeof window.drawInterval === undefined ) {
		window.drawInterval = 5;
		$('#drawInterval').val( window.drawInterval );
	} else if( window.drawInterval > 300 ) {
		window.drawInterval = 300;
		$('#drawInterval').val( window.drawInterval );
	}

	return true
}

export function activateTimer() {
	if( checkIntervalValidity() ) {

		// Si on a jamais joué de son dans la page, on joue un son vide pour montrer à iOS que c'est le user qui l'a demandé
		if( parseInt( localStorage.getItem('audio-enabled') ) === 1 && window.callerVoice.src == '' ) {
			window.callerVoice.play();
		}

		$('#activateTimer').parent().find('.uk-active').removeClass('uk-active');
		$('#activateTimer').addClass('uk-active');

		manualPick( 0 );
		$('#manualPick').prop('disabled', true);

		$('#makeAdraw').prop('disabled', true);

		window.drawTimer = setInterval(makeADraw, window.drawInterval * 1000 );
	}
}

export function disableTimer() {
	$('#disableTimer').parent().find('.uk-active').removeClass('uk-active');
	$('#disableTimer').addClass('uk-active');

	if( ! $('#manualPick').hasClass('turnedOn') ) {
		$('#makeAdraw').prop('disabled', false);
		$('#makeAdraw').removeClass( 'draw-in-progress' );
	}

	$('#manualPick').prop('disabled', false);
	$('#makeAdraw').removeClass( 'draw-in-progress' );

	clearInterval( window.drawTimer );
	window.drawTimer = false;
}

export function manualPick( state ) {
	let theButton = $('#manualPick');

	if( state === 1 ) {
		theButton.removeClass('turnedOff uk-button-default');
		theButton.addClass('turnedOn uk-button-primary');

		$('.drawTable').find('.manualDrawCheck').removeClass('hide').prop('disabled', false);
		$('#makeAdraw').removeClass( 'draw-in-progress' );

		$('#makeAdraw, #activateTimer, #disableTimer').prop('disabled', true);
	} else {
		theButton.removeClass('turnedOn uk-button-primary');
		theButton.addClass('turnedOff uk-button-default');

		$('.drawTable').find('.manualDrawCheck').addClass('hide').prop('disabled', true);

		$('#makeAdraw, #activateTimer, #disableTimer').prop('disabled', false);
		$('#makeAdraw').removeClass( 'draw-in-progress' );
	}
}

export function restartGame( new_winning_ways, restartform ) {
	loading.showHide( $(this) );

	let haveSecondWindow = false;
	let formData;

	if( window.secondWindow && ! window.secondWindow.document.hidden ) {
		// secondWindow = window.open('','BINGO MAKER');
		haveSecondWindow = true;
	}

	$.ajax({
		type: 'POST',
		url: callerApiURL + 'restart-game/',
		data: {
			'idCaller': idCaller,
			'new_winning_ways': ( new_winning_ways != 'undefined' ? new_winning_ways : false ),
			'show_draw': restartform.find( 'input[name="show_draw"]:checked' ).val(),
			'show_clickAll': restartform.find( 'input[name="show_clickAllBtn"]:checked' ).val(),
			'csrf_tk_bingomaker' : csrf_token
		},
		 dataType: 'text',
		success: function( json ) {

			clearInterval(window.updatetimerlet);
			json = JSON.parse(json);

			let $result = json.result;

			if( $result === 'success' ) {
				$('#makeAdraw, #activateTimer, #disableTimer, #drawInterval, input[name="stop_when_winner"]').prop('disabled', false);
				$('#makeAdraw').removeClass( 'draw-in-progress' );

				$('#pickAWinner').prop('disabled', false).show();
				$('#winnersList').prop('disabled', true).hide();

				$('#drawList ul, #drawWinner ul').empty();
				$('.nbDraw, .nbWinner').text('0');
				$('#currentPick, #previousPick').text('');
				$('#drawTable td.uk-text-bold').removeClass('uk-text-bold');
				if(haveSecondWindow){
					$('#drawTable td.uk-text-bold', window.secondWindow.document).removeClass('uk-text-bold');
					$('#currentPick, #previousPick', window.secondWindow.document).text('');
					window.secondWindow.location.reload();
				}
				localStorage.removeItem("showInterval");
				location.reload();
			} else {
				UIkit.modal.alert( json.message, function() {});
			}
		},
		error:function(jqXHR, textStatus, error){
			console.log(jqXHR+':'+textStatus+':'+error);
		}

	});
}

export function askRestartPopup(){
	restartformHTML = $('#restart_form').html();

	// Je vide le contenu du div pour pas que les infos se duplique
	$('#restart_form').empty();

	var formModal = UIkit.modal.blockUI( restartformHTML, { center: true } );

	$(document).on('click', '.restart-form .button-restart', function(e) {
		e.preventDefault();

		let theModalForm = $(this).closest('form');

		let winning_ways = theModalForm.find('.waytowin:checked').map(function() {
			return $(this).val();
		});

		if( winning_ways.length >= 1 ) {

			$(document).off('click', '.restart-form .button-restart');
			$(document).off('click', '.restart-form .button-cancel');

			restartGame( winning_ways.get(), theModalForm );

			$('#restart_form').append( restartformHTML );

			restartformHTML = null;
			formModal.hide();
		} else {
			UIkit.modal.alert( textContainer.data('error-at-least-one'), { center: true } );
		}
	});

	$(document).on('click', '.restart-form .button-cancel', function(e) {
		e.preventDefault();

		$(document).off('click', '.restart-form .button-restart');
		$(document).off('click', '.restart-form .button-cancel');

		$('#restart_form').append( restartformHTML );

		restartformHTML = null;
		formModal.hide();
	});
}



export function validateCard( elem, idCard, type ) {

	$.ajax({
		type: 'POST',
		url: callerApiURL + 'validate-card/',
		data: {
			'idCard': parseInt( idCard ),
			'idCaller': idCaller,
			'type': type,
			'csrf_tk_bingomaker' : csrf_token
		},
		 dataType: 'text',
		success: function( json ) {
			json = ajaxFunctions.sanitizeJsonResponse( json );
			json = JSON.parse(json);

			let $result = json.result;

			if( $result === 'success' ) {
				elem.replaceTag('<span class="uk-text-strike">', false);
			} else {
				UIkit.modal.alert( json.message, function() {});
			}
		},
	});
}

export function pickAWinner( number ) {

	 let isFreeGame = textContainer.data("free-game");

	$.ajax({
		type: 'POST',
		url: callerApiURL + 'pick-a-winner/',
		data: {
			'idCaller'  : idCaller,
			'number'    : number,
			'idProject' : idProject,
			"isFreeGame": isFreeGame,
			'csrf_tk_bingomaker' : csrf_token
		},
		dataType: 'text',
		success: function( json ) {
			json = ajaxFunctions.sanitizeJsonResponse( json );
			json = JSON.parse(json);

			let $result = json.result;
			passwordText = textContainer.data('password-text');
			password = textContainer.data("interactive-mode");

			if( $result === 'success' ) {
				disableFunctions( true );

				drawWinningList(json.winningCard, window.drawTimer );

				showWinnersList( textContainer.data('caller-iteration'), false );

				$('#WinnersList').removeClass( 'hide' );
				$('#previousWinnersList').addClass( 'hide' );

			} else {
				UIkit.modal.alert( json.message, function() {});
			}
		},
	});
}

export function getWinningList( getOnly ) {
	window.updatetimerPaused = true;

	// console.log("getOnly : " + getOnly);

	let ajaxwinningList = false,
		formData = new FormData(),
		url = callerApiURL + 'ajax-get-winning-card/';

	formData.append( 'idCaller', idCaller );
	formData.append( 'idProject', idProject );
	formData.append( 'getOnly', getOnly );
	formData.append( 'csrf_tk_bingomaker', csrf_token );

	fetch( url, {
		method: "POST",
		body: formData,
	})
	.then(function(response){
		if( response.ok ) {
			return response.json();
		} else {
			console.log("erreur");
		}
	})
	.then(function( data ) {
		window.updatetimerPaused = false;

		if( data.result === 'success' && Array.isArray( data.winningCard ) ) {
			drawWinningList( data.winningCard, window.drawTimer );
		}
	});

	return ajaxwinningList;
}

export function drawWinningList ( winningList, drawTimer ) {


	if( winningList ) {

		let $drawWinner = $('#drawWinner ul');
		let newCheckedWinner = false;
		let theHTML = '';

		winningList.forEach( function( value, key ) {
			var $row = $drawWinner.find( '#' + value.idWin );

			var player_name = value.player_name ?? textContainer.data('player-txt') + ' #' + value.numCard;

			if( $row.length > 0 ) {
				textContainer.data("new-winner", 0);

				if( value.validated == 1 && $row.find(':first-child').is('a') ) {

					$('#pickAWinner').prop('disabled', false);
					$("#spanInfoSmallipop").remove();

					theHTML = '';

					if( value.hideTooltip != true ) {
						theHTML += '<span class="uk-icon uk-icon-info-circle uk-margin-small-right smallipopTooltip" title="' +
							( player_name !== undefined ? 'Name' + ': <strong>' + player_name + '</strong><br>' : '' ) +
							// ( value.player_city !== null ? 'City' + ': <strong>' + value.player_city + '</strong><br>' : '' ) +
							// ( value.player_email !== null ? 'Email' + ': <strong>' + value.player_email + '</strong>' : '' ) +
						'"></span>';
					}

					theHTML += '<span class="uk-text-strike">' + value.text + '</span>';

					if( value.hideTooltip == true ) {
						theHTML += ' - <span class="uk-text-small uk-text-bold">' + player_name + '</span>';
					}

					$row.html(theHTML);

					newCheckedWinner = true;
				}

				$row.css( 'order', value.order );

			} else {
				textContainer.data("new-winner",1);

				if( value.validated == 0 ) {

					$drawWinner.append('<li id="' + value.idWin + '" style="order: ' + value.order + '" data-card-num="' + value.numCard + '">' +
						'<a href="#"' +
							' data-card-id="' + value.idCard + '"' +
							' data-card-num="' + value.numCard + '"' +
							' data-virtual="' + value.virtual + '"'+
							// ' data-virtual="1"'+
							' data-type="' + value.type + '"' +
							' data-type="' + value.type + '"' +
						'>' +
							value.text +

							( value.hideTooltip == true ? ' - <span class="uk-text-small uk-text-bold">' + player_name + '</span>' : '' ) +
						'</a>' +
					'</li>');

					newCheckedWinner = true;
				} else {

					$('#pickAWinner').prop('disabled', false);
					$("#spanInfoSmallipop").remove();

					theHTML = '<li id="' + value.idWin + '" style="order: ' + value.order + '">';

					if( value.hideTooltip != true ) {
						theHTML += '<span class="uk-icon uk-icon-info-circle uk-margin-small-right smallipopTooltip" title="' +
							'Name' + ': <strong>' + player_name + '</strong><br>' +
							// 'City' + ': <strong>' + value.player_city + '</strong><br>' +
							// 'Email' + ': <strong>' + value.player_email + '</strong>' +
						'"></span>';
					}

					theHTML += '<span class="uk-text-strike">' + value.text + '</span>';

					if( value.hideTooltip == true ) {
						theHTML += ' - <span class="uk-text-small uk-text-bold">' + player_name + '</span>';
					}

					theHTML += '</li>';

					$drawWinner.append( theHTML );

					// newCheckedWinner = true;
				}

			}
		});

		if( newCheckedWinner === true ) {
			$drawWinner.find('.smallipopTooltip').smallipop({
				theme: 'black bingomaker',
				hideOnTriggerClick: false,
				hideOnPopupClick: false,
			});

			$('.button-winners-list').toggleClass('new-winners', true);

			// setTimeout(function(){
			// 	$('.button-winners-list').toggleClass('new-winners', false);
			// }, 1000);
		}

		let newWinner = textContainer.data("new-winner");

		$('.nbWinner').text( $('#drawWinner ul li').length );

		// Si on est dans un tirage par interval et que l'utilisateur veut arrêter à chaque nouveau gagnant
		if( window.drawTimer && textContainer.data("new-winner") == 1 && $('input[name="stop_when_winner"]:checked').val() === '1' ) {
			disableTimer();
		}
	}

}

export function expired_auth_popup( message ) {
	if( expired_auth_popup_opened === false ) {
		expired_auth_popup_opened = true;

		localStorage.removeItem("showInterval");
		disableTimer();

		clearInterval(window.updatetimerlet);
		UIkit.modal.alert( message, { center: true } ).on('hide.uk.modal', function() {
			window.location = rootURL;
		});
	}
}

export function showWinnersList( gameIteration, previousList ) {

	if( gameIteration === undefined ) { gameIteration = 1; }
	if( previousList === undefined ) { previousList = false; }

	let isFreeGame = textContainer.data("free-game");

	$.ajax({
		type: 'POST',
		url: callerApiURL + 'get-winners/',
		data: {
			'idCaller': idCaller,
			'gameIteration': gameIteration,
			'previousList': previousList ? 1 : 0,
			"isFreeGame": isFreeGame,
			'csrf_tk_bingomaker': csrf_token
		},
		dataType: 'text',
		success: function( json ) {
			json = ajaxFunctions.sanitizeJsonResponse( json );
			json = JSON.parse(json);

			let haveSecondWindow = false,
			// secondWindow = null,
			$windowOpen = textContainer.data('window-open');
			window.name = 'parent';

			if( window.secondWindow && ! window.secondWindow.document.hidden ) {
				haveSecondWindow = true;
			}

			let $result = json.result;

			if( $result === 'success' ) {
				if( previousList === false ) { disableFunctions( true ); }

				if( haveSecondWindow ) {
					secondWindowDialog = window.secondWindow.liteWinningPopup( json.secondWindowMsg );
				}

				winningPopup( json.message, previousList );
			} else {

				UIkit.modal.alert( json.message, function() {})

			}
		},
	});
}

export function liteWinningPopup( message ) {
	secondWindowDialog = UIkit.modal.blockUI( message, { center: true } );
	return secondWindowDialog;
}

export function winningPopup( message, previousList ) {

	if( previousList === undefined ) { previousList = false; }

	let isFreeGame = textContainer.data("free-game");
	if( isFreeGame == 0 ) {
		if( previousList === false ) {
			var winnerPopup = UIkit.modal.confirm( message, function() {

				if( secondWindowDialog != undefined && secondWindowDialog != null ) {
					secondWindowDialog.hide();
				}
				askRestartPopup();

			}, function () {
				if( secondWindowDialog != undefined && secondWindowDialog != null ) {
					secondWindowDialog.hide();
				}
			}, {
				center: true,
				labels: {
					Cancel: textContainer.data("cancel"),
					Ok: textContainer.data("restart-button"),
				},
			});

		} else {
			var winnerPopup = UIkit.modal.alert( message, { center: true } );
		}

	} else {

		let exitGame = textContainer.data("btn-exit");

		UIkit.modal.alert(message, {center: true,labels:{Ok:exitGame}}).on('hide.uk.modal', function() {
			if( secondWindowDialog != undefined && secondWindowDialog != null ) {
				secondWindowDialog.hide();
			}

			$.post(
				rootURL + "caller-api/close-game/", {
					idCaller: idCaller,
					csrf_tk_bingomaker: csrf_token
				}
			).then(function (info){
				if( info.result == "success" ) {
					isSubmit = true;
					let confirmationMsg = textContainer.data("confirmation-quitter"),
						cancel = textContainer.data("cancel ");

					localStorage.removeItem('audio-enabled');

					window.location.href = rootURL;
				}
			});

		});

	}

}

export function send_message_to_players( message, send_to_cards ) {
	$.ajax({
		type: 'post',
		url: callerApiURL + 'send-message-to-players/',
		dataType: 'text',
		data: {
			'idCaller': idCaller,
			'message': message,
			'send_to_cards': send_to_cards,
			'csrf_tk_bingomaker': csrf_token
		},
		success: function( json ) {
			json = ajaxFunctions.sanitizeJsonResponse( json ); 
			pJson = JSON.parse( json );

			if( pJson.result == 'success' ) {
				ui_blocked_by_a_message( pJson.data.message, pJson.data.send_to_cards );
			} else {
				window.blockedByMessage = '';
				UIkit.modal.alert( textContainer.data( 'error-common' ) );
			}
		}
	});
}

export function kick_out_cards( cards_to_kick_out ) {
	$.ajax({
		type: 'post',
		url: callerApiURL + 'kick-out-cards/',
		dataType: 'text',
		data: {
			'idCaller': idCaller,
			'cards_to_kick_out': cards_to_kick_out,
			'csrf_tk_bingomaker': csrf_token
		},
		success: function( json ) {
			json = ajaxFunctions.sanitizeJsonResponse( json );
			pJson = JSON.parse( json );

			$('#kickOutPlayerForm').find('input[name="card_nos"]').val( cards_to_kick_out );

			if( pJson.result == 'success' ) {
				UIkit.modal.alert( pJson.data.message, { center: true, labels: { Ok: textContainer.data( 'popup-blocked-button' ) } } );
			} else {
				UIkit.modal.alert( textContainer.data( 'error-common' ), { center: true } );
			}
		}
	});
}

export function ui_blocked_by_a_message( message, send_to_cards ) {
	UIkit.modal.alert(
		"<p>" + textContainer.data( 'popup-blocked-intro' ) + "</p>" +
		"<p>\"" + message + "\"</p>" +
		( send_to_cards !== null && send_to_cards !== '' ? '<p>' + textContainer.data( 'popup-blocked-some-cards' ) + send_to_cards + '</p>' : '<p>' + textContainer.data( 'popup-blocked-all-cards' ) + '</p>' ),
	{
		center: true,
		labels:{
			Ok: textContainer.data( 'popup-blocked-button' ),
		}
	}).on('hide.uk.modal', function() {
		$.ajax({
			type: 'post',
			url: callerApiURL + 'remove-message-to-players/',
			dataType: 'text',
			data: {
				'idCaller': idCaller,
				'csrf_tk_bingomaker': csrf_token
			},
			success: function( json ) {
				json = ajaxFunctions.sanitizeJsonResponse( json ); 
				json = JSON.parse(json);

				if( json.result != 'success' ) {
					UIkit.modal.alert( textContainer.data( 'error-common' ), function() {
						ui_blocked_by_a_message( message, send_to_cards );
					} );
				} else {
					window.blockedByMessage = false;
				}
			}
		});
	});
}

export function disableVoice() {
	$('#toggleVoice').data( 'state', 0 )
		.removeClass('uk-button-primary')
		.find('i')
		.removeClass('uk-icon-volume-up')
		.addClass('uk-icon-volume-off');

	textContainer.data('audio-enabled', 0);
	localStorage.setItem('audio-enabled', 0);
}

export function enableVoice() {
	$('#toggleVoice').data( 'state', 1 )
		.addClass('uk-button-primary')
		.find('i')
		.removeClass('uk-icon-volume-off')
		.addClass('uk-icon-volume-up');

	textContainer.data('audio-enabled', 1);
	localStorage.setItem('audio-enabled', 1);
}

export function toggleVoice( state ) {
	if( state === 1 ) {
		disableVoice();
	} else {
		enableVoice();
	}
}

export function visuallyLockCaller( button ) {
	if( button === undefined ) { button = $('#lockCaller') }

	button.data( 'state', 1 )
		.attr( 'title', button.data('unlock-text') )

		.find('i')

		.removeClass( button.data('unlock-icon') )
		.removeClass( button.data('unlock-color') )

		.addClass( button.data('lock-icon') )
		.addClass( button.data('lock-color') );

	$('#cardInUse').prev()
		.removeClass( 'uk-icon-user-plus' )
		.removeClass( 'icon-green' )
		.addClass( 'uk-icon-user-times' )
		.addClass( 'icon-red' );
}

export function visuallyUnlockCaller( button ) {
	if( button === undefined ) { button = $('#lockCaller') }

	button.data( 'state', 0 )
		.attr( 'title', button.data('lock-text') )

		.find('i')

		.removeClass( button.data('lock-icon') )
		.removeClass( button.data('lock-color') )

		.addClass( button.data('unlock-icon') )
		.addClass( button.data('unlock-color') );

	$('#cardInUse').prev()
		.removeClass( 'uk-icon-user-times' )
		.removeClass( 'icon-red' )
		.addClass( 'uk-icon-user-plus' )
		.addClass( 'icon-green' );
}

export function toggleCallerLock( state ) {
	let url = callerApiURL + 'lock-caller/',
		button = $('#lockCaller');

	$.ajax({
		type: 'post',
		url: url,
		dataType: 'text',
		data: {
			'idCaller': idCaller,
			'state': state === 1 ? 0 : 1,// On inverse l'état actuel
			'csrf_tk_bingomaker': csrf_token
		},
		success: function( json ) {
			json = ajaxFunctions.sanitizeJsonResponse( json );
			json = JSON.parse( json );

			if( json.result === 'success' ) {
				if( json.value === true ) {
					visuallyLockCaller( button );
				} else {
					visuallyUnlockCaller( button );
				}
			}
		}
	});
}

$.extend({
	replaceTag: function( currentElem, newTagObj, keepProps ) {
		let $currentElem = $( currentElem );
		let i, $newTag = $( newTagObj ).clone();

		if( keepProps ) {
			newTag = $newTag[0];
			newTag.className = currentElem.className;
			$.extend( newTag.classList, currentElem.classList );
			$.extend( newTag.attributes, currentElem.attributes );
		}

		$currentElem.wrapAll( $newTag );
		$currentElem.contents().unwrap();
		return this;
	}
});

$.fn.extend({
	replaceTag: function( newTagObj, keepProps ) {
		return this.each(function() {
			jQuery.replaceTag( this, newTagObj, keepProps );
		});
	}
});

export function adaptTopBarPosition() {
	let $callerTopBar = $('#callerTopBar'),
		currentScroll = $(window).scrollTop(),
		headerHeight = $('#mainmenu').outerHeight(),
		toolBarHeight = $callerTopBar.height();
	if( currentScroll <= headerHeight ) {
		$('#caller').css('margin-top',(toolBarHeight+15));
		$callerTopBar.css('top', headerHeight - currentScroll);
	} else {
		$callerTopBar.css('top', 0);
	}
}



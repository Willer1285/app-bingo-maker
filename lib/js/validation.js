import * as loading from "loading.js";

/********************************************************************************/
/***** Fonctions permettant l'ajout et la supression d'un tooltip			*****/
/********************************************************************************/
export function removeError( element ) {
	var container, tooltip;

	if( element.closest('.uk-form-row').hasClass('formRowError') ) {
		container = element.closest('.uk-form-row');
		element.removeClass('uk-form-danger');
		container.removeClass('formRowError');
		element.unbind('change');

		if( $('#tooltip') !== undefined ) {
			tooltip = container.children('.uk-tooltip');
			if( tooltip !== undefined ) {
				tooltip.hide(150, function() {
					tooltip.remove();
				});

			}
		}
	}
}

export function addError( element, message ) {
	var container, leClone;

	container = element.closest('.uk-form-row');

	if( !container.hasClass('formRowError') ) {
		container.addClass('formRowError');
		container.find('input,select,textarea').addClass('uk-form-danger');

		if( $('#tooltip') !== undefined ) {
			if( container.children('.uk-tooltip') !== undefined ) {
				container.children('.uk-tooltip').remove();
			}

			leClone = $('#tooltip').clone().removeAttr('id').appendTo( container );
			leClone.children('div.uk-tooltip-inner').text( message );
			leClone.css('left', element.position().left + element.width() + 20 ).show(150);
		}
	}

	element.unbind('change');
	element.bind('change', function() {
		removeError( element );
	});

	return true;
}
/********************************************************************************/

/********************************************************************************/
/***** Fonction qui fait la vérification de champs de formulaire de base *****/
/********************************************************************************/
export function regexCheck(chaine, reg, regexPerso) {
	var regex		= [];

	regex.cpostal	= /^[0-9]{5}-[0-9]{4}$|^[0-9]{5}$|^[A-Z][0-9][A-Z]\s?[0-9][A-Z][0-9]$/;
	regex.notempty	= /.+/;
	regex.tel		= /^(\([0-9]{3}\)|\d{3}-??)[0-9]{3}\-??[0-9]{4}$/;
	regex.name		= /^([\p{L}a-zA-Z0-9]*)$/i;
	regex.email		= /[a-z0-9!#$%&'*+\/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+\/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/i;
	regex.UPC		= /^[0-9]{5}$/i;
	regex.URL		= /^([a-z]([a-z]|\d|\+|-|\.)*):(\/\/(((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:)*@)?((\[(|(v[\da-f]{1,}\.(([a-z]|\d|-|\.|_|~)|[!\$&'\(\)\*\+,;=]|:)+))\])|((\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5]))|(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=])*)(:\d*)?)(\/(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)*)*|(\/((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)+(\/(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)*)*)?)|((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)+(\/(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)*)*)|((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)){0})(\?((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|[\uE000-\uF8FF]|\/|\?)*)?(\#((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|\/|\?)*)?$/i;

	if(regexPerso !== undefined) {
		regex.perso = regexPerso;
	}

	if(regex[reg].test(chaine)) {
		return true;
	} else {
		return false;
	}
}
/********************************************************************************/

/********************************************************************************/
export function validForm( formID, button, doSubmit ) {


	var error = false,
		cpt = 0,
		doSubmit = typeof doSubmit === "undefined" || doSubmit === true ? true : false,
		lang = $('body').hasClass('en') ? 'en' : 'fr',
		txtError;


	$('#' + formID).children('.formRowError').each( function () {
		if( $('.uk-tooltip') !== undefined ) { $(this).children('.uk-tooltip').remove(); }
		$(this).removeClass('formRowError');
	});

	/*** Test required fields *****/
	$('#' + formID + ' .required').each( function () {
		if ( !$(this).val().trim() ) {
			txtError = lang === 'en' ? "This field is required." : "Ce champs est requis.";
			error = addError( $(this), ( $(this).attr('title') ? $(this).attr('title') : txtError ) );
		}
	});

	/*** Test required fields *****/
	$('#' + formID + ' .min1').each( function () {
		if( parseInt( $(this).val().trim() ) <= 0 ) {
			txtError = lang === 'en' ? "This field is required." : "Ce champs est requis.";
			error = addError( $(this), ( $(this).attr('title') ? $(this).attr('title') : txtError ) );
		}
	});

	/*** Test required wysiwyg *****/
	$('#' + formID + ' .wysiwygRequired').each( function() {
		if ( $(this).ckeditor().val() === '' ) {
			txtError = lang === 'en' ? "This field is required." : "Ce champs est requis.";
			error = addError( $(this), ( $(this).attr('title') ? $(this).attr('title') : txtError ) );
		} else {
			removeError( $(this) );
		}
	});

	/*** Test required select *****/
	$('#' + formID + ' .selRequired').each( function () {
		if ( !$(this).val() ) {
			txtError = lang === 'en' ? "Please choose an option." : "Veuillez sélectionner une option.";
			error = addError( $(this), ( $(this).attr('title') ? $(this).attr('title') : txtError ) );
		}
	});

	/*** Test required multiple select *****/
	$('#' + formID + ' .mselRequired').each( function () {
		if ( $(this).selectedIndex < 0 ) {
			txtError = lang === 'en' ? "Please choose at least one option." : "Veuillez sélectionner au moins une option.";
			error = addError( $(this), ( $(this).attr('title') ? $(this).attr('title') : txtError ) );
		}
	});

	/*** Test valid name *****/
	$('#' + formID + ' .validName').each( function () {
		if ( $(this).val().trim() && regexCheck( $(this).val(), 'name' ) ) {
			txtError = lang === 'en' ? "Please enter a valid name." : "Veuillez entrer un nom valide (ex. : Prénom Nom).";
			error = addError( $(this), ( $(this).attr('title') ? $(this).attr('title') : txtError ) );
		}
	});

	/*** Test valid email *****/
	$('#' + formID + ' .validMail').each( function () {
		if ( $(this).val().trim() && !regexCheck( $(this).val(), 'email' ) ) {
			txtError = lang === 'en' ? "Please enter a valid email address (ex.: email@domain.com)" : "Veuillez entrer une adresse courriel valide (ex. : courriel@domaine.com).";
			error = addError( $(this), ( $(this).attr('title') ? $(this).attr('title') : txtError ) );
		}
	});

	/*** Test valid phone number  *****/
	$('#' + formID + ' .validTel').each( function () {
		if ( $(this).val().trim() && !regexCheck( $(this).val(), 'tel' ) ) {
			txtError = lang === 'en' ? "Please enter a valid phone number." : "Veuillez entrer un numéro valide (ex. : 418-999-9999).";
			error = addError( $(this), ( $(this).attr('title') ? $(this).attr('title') : txtError ) );
		}
	});

	/*** Test valid post code *****/
	$('#' + formID + ' .validCPostal').each( function () {
		if ( $(this).val().trim() && !regexCheck( $(this).val().toUpperCase(), 'notempty' ) ) {
			txtError = lang === 'en' ? "Please enter a valid postal code." : "Veuillez entrer un code postal valide (ex. : G7X 9X9).";
			error = addError( $(this), ( $(this).attr('title') ? $(this).attr('title') : txtError ) );
		}
	});

	/*** Test valid file *****/
	$('#' + formID + ' .validFile').each( function () {
		var elValue = $(this).val().toLowerCase();
		if ( $(this).val().trim() && !elValue.contains('pdf') && !elValue.contains('doc') && !elValue.contains('zip') && !elValue.contains('rar') ) {
			txtError = lang === 'en' ? "Accepted formats are : pdf, doc, zip and rar." : "Les formats de fichiers acceptés sont : pdf, doc, zip et rar.";
			error = addError( $(this), txtError );
		}
	});

	/*** Test valid URL *****/
	$('#' + formID + ' .validURL').each( function () {
		var url = encodeURI( $(this).val().trim() );
		if ( url && !regexCheck( url.toUpperCase(), 'URL' ) ) {
			txtError = lang === 'en' ? "Please enter a valid URL." : "Veuillez entrer une URL valide.";
			error = addError( $(this), ( $(this).attr('title') ? $(this).attr('title') : txtError ) );
		}
	});

	/*** Test less than 1 checkbox *****/
	$('#' + formID + ' .validCheckbox').each( function () {
		var valid = false;
		$(this).children('input').each(function(element){
			if ( element.checked === true ) {
				valid = true;
			}
		});

		if ( valid === false ) {
			txtError = lang === 'en' ? "Please select at least on option." : "Veuillez sélectionner au moins une option.";
			error = addError( $(this), txtError );
		}
	});

	/*** Test if one checkbox is checked *****/
	$('#' + formID + ' .ifCheckRequired').each( function () {
		if ( $(this).parent().children('input.checkbox').checked && !$(this).val().trim() ) {
			txtError = lang === 'en' ? "Please check this box." : "Veuillez cocher cette case.";
			error = addError( $(this), ( $(this).attr('title') ? $(this).attr('title') : txtError ) );
		}
	});

	/*** Test password validity and check if the the confirm field are equal (Note : The confirm fields may have id like this confirmID_OF_PASS_FIELD ex: confirmPass) ***/
	$('#' + formID + ' .validPassword').each( function () {
		var fldValue = $(this).val().trim(),
			fldID	 = $(this).attr('id'),
			confirmField = fldID.charAt(0).toUpperCase() + fldID.slice(1);


		if( $(this).hasClass('notrequired') ) {
			if( fldValue.length > 0 && fldValue.length < 6 ) {
				txtError = lang === 'en' ? "The password must have at least six (6) characters." : "Le mot de passe doit comporter au moins six (6) caractères";
				error = addError( $(this), txtError );
			}
		} else {
			if( !fldValue || fldValue.length < 6  ) {
				txtError = lang === 'en' ? "The password must have at least six (6) characters." : "Le mot de passe doit comporter au moins six (6) caractères.";
				error = addError( $(this), txtError );
			}
		}

		if( $( '#confirm' + confirmField ) !== undefined ) {
			if( $( '#confirm' + confirmField ).val().trim() !== fldValue ) {
				txtError = lang === 'en' ? "The password does not match." : "Le mot de passe ne correspond pas.";
				error = addError( $( '#confirm' + confirmField ), txtError );
			}
		}
	});

	$('#' + formID + ' .validLink').each( function () {
		var toValid = $('#sourceId option:selected').text().toLowerCase();

		if( $(this).val().indexOf( toValid ) < 0 ) {
			txtError = lang === 'en' ? "This URL does not seem to correspond with the selected source." : "Cette url ne semble pas correspondre avec la source sélectionnée.";
			error = addError( $(this), txtError );
		}
	});
	/**************************************************************************************************************/

	if( doSubmit ) {
		if( error ) {
			loading.showHide( button, false );
			$('#' + formID).find('.formRowError').eq(0).find('input,select,textarea').eq(0).focus();
		} else {
			loading.showHide( button, true );
			document.getElementById(formID).submit();
		}
	} else {

		if( error ) {
			$('#' + formID).find('.formRowError').eq(0).find('input,select,textarea').eq(0).focus();
			return false;
		} else {
			return true;
		}
	}
}
/********************************************************************************/
//**************************************************************************************************************************
// Activer le loading après une click sur les boutons qui n'ont pas de js associées
//**************************************************************************************************************************
export function showHide( el, disable ) {
	if( disable == undefined || disable == true ) {
		//if( el ) { el.prop('disabled', true); }
		$('#loading').show().css('z-index', 100);
	} else {
		if( el ) { el.prop('disabled', false); }
		$('#loading').hide().css('z-index', -1);
	}
}
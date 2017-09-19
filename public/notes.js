/**
 * Created by ryanhoyda on 9/17/17.
 */

//sending document id as url parameter
var getUrlParameter = function getUrlParameter(sParam) {
    var sPageURL = decodeURIComponent(window.location.search.substring(1)),
        sURLVariables = sPageURL.split('&'),
        sParameterName,
        i;
    //takes url parameter from browser

    for (i = 0; i < sURLVariables.length; i++) {
        sParameterName = sURLVariables[i].split('=');

        if (sParameterName[0] === sParam) {
            return sParameterName[1] === undefined ? true : sParameterName[1];
        }
        //searching for key value pair in url string
    }
};
$(document).ready(function(){
    var id = getUrlParameter('id');
    $.getJSON('/articles/find/' + id, function( data ){

        $('#update_comment_button').attr('id', id);


        $('#title').text(data.title);
        if(data.note && data.note.body){
            $('#comment_body').val(data.note.body);
        }

    });

    $('#update_comment_button').click(function(){
        var id = $(this).attr('id');
        var t = $('#title').text();
        var b = $('#comment_body').val();
        var url = '/articles/comment/update/' + id;

        $.post(url, {title: t, body: b}, function(data){
            //$('#comment_title').val('');
            //$('#comment_body').val('');
            alert('Saved');
        }, 'json');
    });
});
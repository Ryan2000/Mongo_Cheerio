/**
 * Created by ryanhoyda on 9/17/17.
 */

//sending document id as url parameter
var getUrlParameter = function getUrlParameter(sParam) {
    var sPageURL = decodeURIComponent(window.location.search.substring(1)),
        sURLVariables = sPageURL.split('&'),
        sParameterName,
        i;

    for (i = 0; i < sURLVariables.length; i++) {
        sParameterName = sURLVariables[i].split('=');

        if (sParameterName[0] === sParam) {
            return sParameterName[1] === undefined ? true : sParameterName[1];
        }
    }
};
$(document).ready(function(){
    var id = getUrlParameter('id');
    $.getJSON('/articles/find/' + id, function( data ){
        $('.delete').unbind();
        $('#add_comment_button').attr('id', id);
        $('#comments').empty();

        var title = data.note.title;
        var body = data.note.body;

        var html = ` <h4>${title}</h4><p>${body}</p><button class="delete">Delete</button>`;
        $('#comments').append(html);
        $('.delete').click(function(){
            alert('clicked');
        });
    });

    $('#add_comment_button').click(function(){
        var id = $(this).attr('id');
        var t = $('#comment_title').val();
        var b = $('#comment_body').val();
        var url = '/articles/comment/add/' + id;

        $.post(url, {title: t, body: b}, function(data){
            $('#comment_title').val('');
            $('#comment_body').val('');
        }, 'json');
    });
});
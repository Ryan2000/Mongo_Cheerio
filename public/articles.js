/**
 * Created by ryanhoyda on 9/17/17.
 */

$(document).ready(function(){


    const articleHtml = '<div class="row"><div class="col 12"><div class="card">' +
        '<div class="card-body"' +
        'id="card=content"><div class="d-flex justify-content-between">' +
        '<h4 class="card-title">${title}</h4><a data-id="${data-id}" href="#" class="btn btn-danger delete_button">Delete Article</a>' +
        '</div><p class="card-text">${summary}</p><a href="${link}"' +
        'class="btn btn-primary">View Article</a></div></div></div></div>';


    //
    $.getJSON('/articles', function(data){
        for(var i = 0; i < data.length; i++){
            var id = data[i]._id;
            var title = data[i].title;
            var link = data[i].link;
            var summary = data[i].summary;

            $("#articles").append(articleHtml.replace("${title}", title)
                .replace("${summary}", summary)
                .replace("${link}", link)
                .replace("${data-id}", id));
        }

        $('.delete_button').click(function(){
            var id = (this).attr('data-id');
            alert(id);
        });
    });
});
$(document).ready(function(){

    const articleHtml = '<div class="row"><div class="col 12"><div class="card">' +
        '<div class="card-body"' +
        'id="card=content"><div class="d-flex justify-content-end">' +
        '<h4 class="mr-auto card-title">${title}</h4><a data-id="${data-id}" href="#" class="btn btn-success comment_button">Comment</a> <a data-id="${data-id}" href="#" class="btn btn-danger delete_button">Delete Article</a>' +
        '</div><p class="card-text">${summary}</p><a href="${link}"' +
        'class="btn btn-primary">View Article</a></div></div></div></div>';

    function loadArticles(){
        //Remove all click listeners
        $('.delete_button').unbind(); //unbind removes click listener
        $('.comment_button').unbind(); //detaches click listener

        //Empty the article div
        $('#articles').empty();

        //Load articles via ajax that returns data which is all articles stored in db
        //corresponds with 212 server.js
        $.getJSON('/articles', function(data){
            for(var i = 0; i < data.length; i++){
                var id = data[i]._id;
                var title = data[i].title;
                var link = data[i].link;
                var summary = data[i].summary;

                $("#articles").append(articleHtml.replace("${title}", title)
                    .replace("${summary}", summary)
                    .replace("${link}", link)
                    .replace("${data-id}", id)
                    .replace("${data-id}", id));
                //ran for loop grabbed the info and appended to the page
            }

            $('.delete_button').click(function(){
                //reattach the click listener
                var id = $(this).attr('data-id');
                $.post('/articles/delete/' + id, function(data){
                    alert(data);
                    //click the delete and make ajax call to server
                    //hits server.js 229


                    loadArticles();
                    //recursive call //Refresh the articles on screen

                });
            });

            $('.comment_button').click(function(){
                var id = $(this).attr('data-id');
                $(this).attr('href', 'notes.html?id='+id).click();
                //updating html line 6 href # to notes.html?id='+id
                //id is document id
                //.click redirects us to notes page
            });
        });
    }

    loadArticles()

});
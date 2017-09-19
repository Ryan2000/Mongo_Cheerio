/**
 * Created by ryanhoyda on 9/15/17.
 */


//string variable that holds html
var articleHtml = '<div class="row"><div class="col 12"><div class="card">' +
    '<h4 class="card-body"' +
    'id="card=content"><div class="d-flex justify-content-between">' +
    '<h4 class="card-title">${title}</h4>' +
    '</div></br><p class="card-text">${summary}</p><a href="${link}"'+
    'class="btn btn-primary">View Article</a></div></div></div></div>';

$(document).ready(function(){

    $( "#startScrape" ).click(function() {
        //alert("scrape has begun");

        $.getJSON("/scrape", function(data) {
            //get json makes ajax call and receives a data parameter back from server in json format
            $('#articles').empty();
            // empties out div on articles.html line 42
            var count = data.count;
            //variable from server.js line 98 that has count prop
            var articles = data.articles;


            for (var i = 0; i < articles.length; i++) {
                //looping through length of articles
                var title = articles[i].title;
                var link = articles[i].link;
                var summary = articles[i].summary;
                $("#articles").append(articleHtml.replace("${title}", title)
                    .replace("${summary}", summary).replace("${link}", link));
                //write out html to article div
            }
            alert('Articles Found ' + count);
        });



    });




});



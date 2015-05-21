// // Application Controller

var config = require('clientconfig')
    ,domReady = require('domready');

// exports
module.exports = {

    // this is the the whole app init
    init: function () {

        console.log("init: " + init);

        var self = window.app = this;

        // wait for document ready to render our main view
        domReady(function () {

            console.log("domReady");

            var $table = $(".linksholder").dataTable();

            console.log("$table.size: " + $table.size());

            $.get( "/files", function( data ) {
                console.log("data: " + data);
                for (var i=0; i<data.length; i++) {
                    console.log(data[i].name);
                    console.log(data[i].path);
                    console.log(data[i].ext);
                    console.log(data[i].isDir);
                }
                $table.fnClearTable();
                $table.fnAddData(data);
            });

            // // init our main view
            // var mainView = self.view = new MainView({
            //     model: self.login,
            //     el: document.body
            // });

            // // ...and render it
            // mainView.render();

            // we have what we need, we can now start our router and show the appropriate page
            //self.router.history.start({pushState: true, root: '/'});
        });
    },

    // methods

};

// run it
module.exports.init();
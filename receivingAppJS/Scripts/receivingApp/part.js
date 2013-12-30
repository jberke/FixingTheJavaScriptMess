window.receivingApp.part = function () {
    // initializes all of the delete links in the current parts list and wires up their AJAX post
    var initializeDeleteLink = function () {
        $('#currentParts').on('click', '.deletePartLink', function (event) {
            event.preventDefault();

            var partId = $(this).parents('tr').data('partid');

            var deleteFunction = function () {
                $.ajax({
                    type: "POST",
                    url: "/Part/Delete",
                    data: { Id: partId },
                    context: this
                }).done(function () {
                        amplify.publish("partDeleted");
                });
            };
            window.receivingApp.utility.deletePopup.open("Delete this vendor?", deleteFunction);
        });
    };

    // wires up the Hide/Show Discontinued Parts link
    var initializeToggleDiscontinuedLink = function () {
        $('#toggleDiscontinuedParts').on('click', function (event) {
            event.preventDefault();

            var isShowing = $(this).hasClass('expanded');

            if (!isShowing) {
                // show the parts
                $('#toggleDiscontinuedParts').text('Hide Discontinued Parts').addClass('expanded');
                discontinuedParts.show();
            } else {
                // hide the parts
                $('#toggleDiscontinuedParts').text('Show Discontinued Parts').removeClass('expanded');
                discontinuedParts.hide();
            }
        });
    };

    // define the different grids
    var currentParts = new window.receivingApp.currentPartList();
    var discontinuedParts = new window.receivingApp.discontinuedPartList();

    // initializes the create new link to use the vendor popup object
    var popup = new window.receivingApp.createPartPopup(currentParts);
    var initializeCreateNewLink = function () {
        $('#createNewPart').on('click', function (event) {
            event.preventDefault();

            popup.openDialog();
        });
    };


    // initializes everything. called once at page load
    var initialize = function () {
        this.initializeDeleteLink();
        this.initializeCreateNewLink();
        this.initializeToggleDiscontinuedLink();
        currentParts.loadGrid();
    };

    return {
        initialize: initialize,
        initializeDeleteLink: initializeDeleteLink,
        initializeCreateNewLink: initializeCreateNewLink,
        initializeToggleDiscontinuedLink: initializeToggleDiscontinuedLink
    };
};

window.receivingApp.createPartPopup = function(currentPartGrid) {
    this.title = "New Part";
    this.formId = "createNewPartForm";

    // we want to force the context to be the grid that was passed in when we call update
    // otherwise we'll be referring to the dialog window
    var updateGrid = function() {
        currentPartGrid.loadGrid()
    };
    updateGrid = _.bind(updateGrid, this);

    this.createFunction = function() {
        var data = $(this).serialize();
        $.ajax({
            type: 'POST',
            url: '/Part/Create',
            data: data,
            context: this,
            dataType: "json"
        }).done(function () {
                amplify.publish("newPartCreated");

                $(this).dialog("close");
                $(this).find('input').val('');
            });
    }
};
window.receivingApp.createPartPopup.prototype = new window.receivingApp.createObjectPopup();

window.receivingApp.currentPartList = function () {
    var loadGrid = function() {
        // load the current parts at page load
        $.ajax({
            url: '/Part/CurrentParts',
            type: 'GET',
            context: this,
            dataType: "json"
        }).done(function (result) {
                var markup = '<table class="table" id="partsList"><tr><th>Name</th><th>Weight</th><th></th></tr>';

                _.each(result, function (item) {
                    markup += "<tr data-partid=\"" + item.Id + "\">" +
                        "<input type=\"hidden\" class=\"partId\" value=\"" + item.Id + "\"/>" +
                        "<td>" + item.Name + "</td>" +
                        "<td>" + item.Weight + "</td>" +
                        "<td><a class=\"deletePartLink\" href=\"#\">Delete</a></td></tr>";
                });

                markup += "</table>";

                $('#currentParts').html(markup);
                $('#currentParts').html(markup);
            });
    };

    // listen for events that make us want to load the grid
    amplify.subscribe("newPartCreated", function() {
        loadGrid();
    });
    amplify.subscribe("partDeleted", function() {
        loadGrid();
    });

    return {
        loadGrid: loadGrid
    }
};

window.receivingApp.discontinuedPartList = function () {
    var isVisible = false;

    var loadGrid = function() {
        if (isVisible) {
            $.ajax({
                url: '/Part/DiscontinuedParts',
                type: 'GET',
                context: this,
                dataType: "json"
            }).done(function (result) {
                var markup = '<table class="table"><tr><th>Name</th><th>Weight</th><th></th></tr>';

                _.each(result, function (item) {
                    markup += "<tr><td>" + item.Name + "</td><td>" + item.Weight + "</td><td></td></tr>";
                });

                markup += "</table>";

                $('#discontinuedParts').html(markup);
            });
        } else {
            $('#discontinuedParts').html('');
        }
    };

    var show = function() {
        isVisible = true;
        loadGrid();
    }

    var hide = function() {
        isVisible = false;
        loadGrid();
    }

    amplify.subscribe("partDeleted", function() {
        loadGrid();
    });

    return {
        loadGrid: loadGrid,
        show: show,
        hide: hide
    }
};
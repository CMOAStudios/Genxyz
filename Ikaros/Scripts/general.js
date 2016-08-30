var token;
var subFolder = "";

$(document).ready(function () {
    $(".dialog-modal").dialog({
        autoOpen: false,
        modal: true
    });

    $("body").on("click", ".openDialog", function(){
        $("#" + $(this).attr("data-dialog")).dialog("open");
    });

    $("body").on("click", ".button-cancel", function(){
        $(this).closest(".dialog").dialog("close");
    });

    $("body").on("click", ".button-submit-form", function () {
        $(this).prop("disabled", true);
        var button = $(this);
        var form = $(this.form).serialize();
        var target = $(this).attr("data-target");
        $.post(subFolder+target, form, function (data) {
            //stuff
            if (!checkForErrors(data)) {
                if ($(this).hasClass("button-dialog-close")) {
                    button.closest(".dialog").dialog("close");
                } else if (button.hasClass("close-success")) {
                    $("#" + button.attr("data-close")).slideUp(100);
                }
                if (data.refresh) {
                    location.reload();
                }
            }
        });
        $(this).prop("disabled", false);
    });

    $("body").on("click", ".button-invite-user", function (e) {
        $("#InviteDialog").html("Loading...");
        var instance = $(e.target).attr("data-instance");
        $.post("/Instances/CreateInvite", { InstanceID: instance }, function (data) {
            $("#InviteDialog").html(data);
        });
    });

    $("body").on("click", ".hide-on-click", function (e) {
        $("#" + $(this).attr("data-target")).slideUp(100);
    });

    token = $("input[Name='__RequestVerificationToken']").val();
    $.ajaxSetup({
        data: {
            __RequestVerificationToken:token
        }
    });

    $("form").submit(function (e) {
        e.preventDefault();
        return false;
    });
});

function checkForErrors(data, target) {
    target = typeof target !== 'undefined' ? target : $("#errorList");
    target.html("");
    if (data.error) {
        var errorsTarget = target.first($(".alert"));
        var errors = "<ul>";
        for (i = 0; i < data.error.length; i++) {
            for (x = 0; x < data.error[i].value.length; x++) {
                errors += "<li>" + data.error[i].value[x] + "</li>";
            }
        }
        errors += "</ul>";
        target.append('<div class="alert alert-danger"><a href="#" class="close" data-dismiss="alert" aria-label="close">&times;</a>' + errors + '</div>')
        return true;
    }
    if (data.refresh === true) {
        location.reload();
    }
    if (data.redirect !== undefined) {
        $(".body-content").fadeOut("slow", function (e) {;
            document.location.href = data.redirect;
        });
    }
    return false;
}

Array.prototype.pushArray = function (arr) {
    this.push.apply(this, arr);
}

//submit button, similar to above.
$(".submit-form-button").click(function (e) {
    if ($(this).hasClass("disabled") === false) {
        submitForm(e);
    }
});

$(".submit-on-enter").keyup(function (e) {
    //same as above, really.
    if (e.keyCode == 13) {
        var target = $(this).closest("form").find(".submit-form-button");
        target.trigger("click");
    }
});

function submitForm(e) {
    var form = e.currentTarget.form;
    var target = $(e.target).attr("data-target");
    if (target === undefined) {
        target = $(form).attr('action');
    }
    if (target.indexOf("Genxyz/") == 1) {
        target = target.replace("Genxyz/", "");
    }
    //alert(target);
    var text = setLoadingButton(e);
    $.post(subFolder+target, $(form).serialize() + "&__RequestVerificationToken=" + token, function (data) {
        clearLoadingButton(e, text);
        if (typeof checkForErrorsGenxyz == 'function') {
            return checkForErrorsGenxyz(data);
        } else {
            return checkForErrors(data);
        }
    }).fail(function (data) {
        $(e.target).html('<i class="fa fa-exclamation-triangle"></i> Server Error <i class="fa fa-exclamation-triangle"></i>');
        $(e.target).removeClass("btn-success");
        $(e.target).removeClass("btn-default");
        $(e.target).addClass("btn-danger");
        $(e.target).removeClass("disabled");
        $(e.target).width("auto");
    });
}

function setLoadingButton(e) {
    var text = $(e.target).html();
    $(e.target).addClass("disabled");
    $(e.target).width($(e.target).width());
    $(e.target).html('<i class="fa fa-spinner fa-spin"></i>');
    return text;
}

function clearLoadingButton(e, text) {
    $(e.target).html(text);
    $(e.target).removeClass("disabled");
    $(e.target).width("auto");
}

//find nearest multiplier.
function NearestMultiple(val, multiplier) {
    var upper = Math.ceil(val / multiplier) * multiplier;
    var lower = Math.floor(val / multiplier) * multiplier;
    if (Math.abs(upper - val) < Math.abs(lower - val)) {
        return upper;
    } else {
        return lower;
    }
}

//generic "click button on enter" option

$("body").on("keypress", ".click-on-enter", function (data) {
    if (data.keyCode == 13) {
        $('#' + $(data.target).attr("data-click")).trigger("click");
    }
});